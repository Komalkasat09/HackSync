from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from .schema import (
    CompanySearchRequest, CompanySearchResponse, CompanyInfo,
    EmailTemplateRequest, EmailTemplateResponse,
    SendEmailRequest, SendEmailResponse,
    BulkSendRequest, BulkSendResponse
)
from auth.routes import get_current_user
from config import get_database
from shared.gemini_service import gemini_service
import re
import asyncio
import aiohttp
from bs4 import BeautifulSoup
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import base64
import io
from typing import Optional, List, Dict
from datetime import datetime
from urllib.parse import urlparse

router = APIRouter(prefix="/cold-mail", tags=["Cold Mail"])

# Two-scraper system: Company Finder + Email Finder
async def find_companies_with_emails(company_type: str) -> List[dict]:
    """
    Two-step process:
    1. Company Finder: Scrapes from multiple sources to get 100+ company URLs
    2. Email Finder: Takes those URLs and finds emails from multiple pages
    """
    try:
        from cold_mail.company_finder import company_finder
        from cold_mail.email_finder import email_finder
        
        print(f"🔍 Step 1: Finding companies for '{company_type}'...")
        # Step 1: Find companies (target: 100 companies)
        companies = await company_finder.find_companies(company_type, target_count=100)
        
        if not companies:
            print("   ⚠ No companies found")
            return []
        
        print(f"   ✓ Found {len(companies)} companies")
        print(f"📧 Step 2: Finding emails for {len(companies)} companies...")
        
        # Step 2: Find emails for each company (in batches to avoid overwhelming)
        batch_size = 10
        companies_with_emails = []
        
        for i in range(0, len(companies), batch_size):
            batch = companies[i:i + batch_size]
            print(f"   Processing batch {i//batch_size + 1}/{(len(companies) + batch_size - 1)//batch_size}...")
            
            # Find emails in parallel for this batch
            tasks = [email_finder.find_emails(company["website"]) for company in batch]
            email_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Only include companies that have emails
            for j, company in enumerate(batch):
                emails = []
                if isinstance(email_results[j], list):
                    emails = email_results[j]
                
                # Only add companies with emails found
                if emails:
                    companies_with_emails.append({
                        "company_name": company["company_name"],
                        "website": company["website"],
                        "description": company.get("description"),
                        "emails": emails,
                        "status": "email_found"
                    })
            
            # Small delay between batches
            if i + batch_size < len(companies):
                await asyncio.sleep(1)
        
        print(f"   ✓ Found emails for {len(companies_with_emails)} companies")
        return companies_with_emails
        
    except Exception as e:
        print(f"Error in company/email finding: {e}")
        import traceback
        traceback.print_exc()
        return []

@router.post("/search-companies", response_model=CompanySearchResponse)
async def search_companies(
    request: CompanySearchRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Search for companies and extract their emails using two-scraper system:
    1. Company Finder: Scrapes from multiple sources (Tavily + directories) to get 100+ companies
    2. Email Finder: Finds emails from multiple pages (homepage, contact, about, careers)
    
    Only returns companies that have emails found and user hasn't applied to yet.
    Companies are saved to MongoDB for future use.
    """
    try:
        db = await get_database()
        user_id = str(current_user["_id"])
        company_type = request.company_type.lower().strip()
        
        # Check if companies already exist in DB for this company type
        existing_companies_cursor = db.companies.find({
            "company_type": company_type
        })
        existing_companies = await existing_companies_cursor.to_list(length=200)
        
        companies_data = []
        
        if existing_companies and len(existing_companies) > 0:
            print(f"📦 Found {len(existing_companies)} existing companies in DB for '{company_type}'")
            # Add minimum 5 second delay to make it look like we're searching
            print("⏳ Simulating search delay (5 seconds)...")
            await asyncio.sleep(5)
            
            # Use existing companies from DB
            for company_doc in existing_companies:
                # Extract domain from website
                parsed = urlparse(company_doc.get("website", ""))
                domain = parsed.netloc.replace("www.", "").lower()
                
                companies_data.append({
                    "company_name": company_doc.get("company_name"),
                    "website": company_doc.get("website"),
                    "description": company_doc.get("description"),
                    "emails": company_doc.get("emails", []),
                    "status": "email_found" if company_doc.get("emails") else "no_email",
                    "domain": domain
                })
        else:
            print(f"🔍 No existing companies found, fetching new ones for '{company_type}'...")
            # Fetch new companies using scrapers
            companies_data = await find_companies_with_emails(request.company_type)
            
            # Save companies to MongoDB
            if companies_data:
                print(f"💾 Saving {len(companies_data)} companies to database...")
                company_docs = []
                for company in companies_data:
                    parsed = urlparse(company["website"])
                    domain = parsed.netloc.replace("www.", "").lower()
                    
                    company_doc = {
                        "company_name": company["company_name"],
                        "website": company["website"],
                        "domain": domain,
                        "description": company.get("description"),
                        "emails": company.get("emails", []),
                        "company_type": company_type,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    company_docs.append(company_doc)
                
                # Insert companies (use upsert to avoid duplicates)
                for company_doc in company_docs:
                    await db.companies.update_one(
                        {"domain": company_doc["domain"], "company_type": company_type},
                        {"$set": company_doc},
                        upsert=True
                    )
                print(f"   ✓ Saved {len(company_docs)} companies")
        
        if not companies_data:
            return CompanySearchResponse(
                success=False,
                companies=[],
                total=0,
                message="No companies with emails found. Try a different search term."
            )
        
        # Get companies user has already applied to
        applied_companies_cursor = db.company_applications.find({
            "user_id": user_id
        })
        applied_companies = await applied_companies_cursor.to_list(length=None)
        
        applied_domains = set()
        for app in applied_companies:
            domain = app.get("company_domain", "").lower()
            if domain:
                applied_domains.add(domain)
        
        # Filter out companies user has already applied to
        filtered_companies = []
        for company in companies_data:
            # Extract domain from website
            parsed = urlparse(company["website"])
            domain = parsed.netloc.replace("www.", "").lower()
            
            # Also check if any email domain matches
            email_domains = [email.split("@")[1].lower() for email in company.get("emails", []) if "@" in email]
            
            # Check if company domain or any email domain is in applied list
            is_applied = domain in applied_domains or any(email_domain in applied_domains for email_domain in email_domains)
            
            if not is_applied:
                filtered_companies.append(company)
        
        # Convert to CompanyInfo objects
        company_infos = []
        for company in filtered_companies:
            company_infos.append(CompanyInfo(
                company_name=company["company_name"],
                website=company["website"],
                description=company.get("description"),
                emails=company["emails"],
                status=company["status"]
            ))
        
        return CompanySearchResponse(
            success=True,
            companies=company_infos,
            total=len(company_infos),
            message=f"Found {len(company_infos)} companies with emails (excluding {len(companies_data) - len(company_infos)} already applied)"
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to search companies: {str(e)}")

@router.post("/generate-template", response_model=EmailTemplateResponse)
async def generate_email_template(
    request: EmailTemplateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate email template using Gemini"""
    try:
        skills_text = ", ".join(request.user_skills) if request.user_skills else "various technical skills"
        bio_text = request.user_bio if request.user_bio else "a motivated professional"
        
        prompt = f"""Generate a professional cold email template for a job application. The email should be:
- Professional but friendly
- Concise (2-3 short paragraphs)
- Highlight relevant skills and experience
- Show genuine interest in the company
- Include a clear call to action

**Company Name:** {request.company_name}
**Applicant Name:** {request.user_name}
**Applicant Email:** {request.user_email}
**Applicant Bio:** {bio_text}
**Applicant Skills:** {skills_text}

Generate:
1. A compelling subject line (max 60 characters)
2. Email body (2-3 paragraphs, professional tone)

Return ONLY valid JSON in this format:
{{
  "subject": "Subject line here",
  "body": "Email body here with line breaks using \\n"
}}

Do NOT include markdown formatting, code blocks, or any other text. Only return the JSON object.
"""
        
        response = await gemini_service.generate_content(prompt)
        result_text = response.strip()
        
        # Clean up response
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        result_text = result_text.strip()
        
        # Parse JSON
        import json
        template_data = json.loads(result_text)
        
        return EmailTemplateResponse(
            success=True,
            subject=template_data.get("subject", "Application for Opportunities"),
            body=template_data.get("body", ""),
            message="Email template generated successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate template: {str(e)}")

def send_email_via_smtp(
    to_email: str,
    subject: str,
    body: str,
    from_email: str,
    smtp_password: str,
    resume_file_base64: Optional[str] = None
) -> dict:
    """Send email via SMTP"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add body
        msg.attach(MIMEText(body, 'plain'))
        
        # Add resume attachment if provided
        if resume_file_base64:
            try:
                resume_data = base64.b64decode(resume_file_base64)
                attachment = MIMEBase('application', 'octet-stream')
                attachment.set_payload(resume_data)
                encoders.encode_base64(attachment)
                attachment.add_header(
                    'Content-Disposition',
                    f'attachment; filename=resume.pdf'
                )
                msg.attach(attachment)
            except Exception as e:
                print(f"Error attaching resume: {e}")
        
        # Determine SMTP server based on email domain
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        
        if "outlook" in from_email.lower() or "hotmail" in from_email.lower():
            smtp_server = "smtp-mail.outlook.com"
        elif "yahoo" in from_email.lower():
            smtp_server = "smtp.mail.yahoo.com"
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(from_email, smtp_password)
        text = msg.as_string()
        server.sendmail(from_email, to_email, text)
        server.quit()
        
        return {"success": True, "message": "Email sent successfully"}
        
    except smtplib.SMTPAuthenticationError:
        return {"success": False, "message": "SMTP authentication failed. Check your email and password."}
    except Exception as e:
        return {"success": False, "message": f"Failed to send email: {str(e)}"}

@router.post("/send-email", response_model=SendEmailResponse)
async def send_email(
    request: SendEmailRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a single email"""
    try:
        result = send_email_via_smtp(
            to_email=request.company_email,
            subject=request.subject,
            body=request.body,
            from_email=request.smtp_email,
            smtp_password=request.smtp_password,
            resume_file_base64=request.resume_file
        )
        
        if result["success"]:
            return SendEmailResponse(
                success=True,
                message=result["message"]
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/bulk-send", response_model=BulkSendResponse)
async def bulk_send_emails(
    request: BulkSendRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send emails to multiple companies with rate limiting and track applications"""
    try:
        db = await get_database()
        user_id = str(current_user["_id"])
        
        results = []
        sent = 0
        failed = 0
        
        for company in request.companies:
            company_email = company.get("company_email")
            company_name = company.get("company_name", "Company")
            company_website = company.get("company_website", "")
            
            if not company_email or company_email == "N/A":
                results.append({
                    "company_name": company_name,
                    "status": "skipped",
                    "message": "No email address found"
                })
                failed += 1
                continue
            
            # Extract domain from company website or email
            company_domain = ""
            if company_website:
                parsed = urlparse(company_website)
                company_domain = parsed.netloc.replace("www.", "").lower()
            elif "@" in company_email:
                company_domain = company_email.split("@")[1].lower()
            
            # Replace placeholders in subject and body
            personalized_subject = request.subject.replace("{company_name}", company_name)
            personalized_body = request.body.replace("{company_name}", company_name)
            
            # Send email with rate limiting
            result = send_email_via_smtp(
                to_email=company_email,
                subject=personalized_subject,
                body=personalized_body,
                from_email=request.smtp_email,
                smtp_password=request.smtp_password,
                resume_file_base64=request.resume_file
            )
            
            if result["success"]:
                # Save application to database
                application_doc = {
                    "user_id": user_id,
                    "company_name": company_name,
                    "company_email": company_email,
                    "company_domain": company_domain,
                    "subject": personalized_subject,
                    "sent_at": datetime.utcnow(),
                    "status": "sent"
                }
                await db.company_applications.insert_one(application_doc)
                
                results.append({
                    "company_name": company_name,
                    "status": "sent",
                    "message": "Email sent successfully"
                })
                sent += 1
            else:
                # Still track failed attempts
                application_doc = {
                    "user_id": user_id,
                    "company_name": company_name,
                    "company_email": company_email,
                    "company_domain": company_domain,
                    "subject": personalized_subject,
                    "sent_at": datetime.utcnow(),
                    "status": "failed",
                    "error_message": result["message"]
                }
                await db.company_applications.insert_one(application_doc)
                
                results.append({
                    "company_name": company_name,
                    "status": "failed",
                    "message": result["message"]
                })
                failed += 1
            
            # Rate limiting: wait 2 seconds between emails
            await asyncio.sleep(2)
        
        return BulkSendResponse(
            success=True,
            sent=sent,
            failed=failed,
            results=results
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send bulk emails: {str(e)}")

