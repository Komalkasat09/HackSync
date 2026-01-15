"""
Background Job Scheduler
Automatically scrapes jobs every 24 hours and updates MongoDB
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import logging
import os
from config import get_database
from .tavily_scraper import tavily_scraper
from .linkedin_scraper import job_scraper

# Configure logging to file
log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'job_scraper.log')

# Create file handler
file_handler = logging.FileHandler(log_file)
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
file_handler.setFormatter(file_formatter)

# Create console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter('%(levelname)s - %(message)s')
console_handler.setFormatter(console_formatter)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Default job search keywords (can be customized)
DEFAULT_JOB_KEYWORDS = [
    "software engineer",
    "data scientist",
    "web developer",
    "full stack developer",
    "frontend developer",
    "backend developer",
    "DevOps engineer",
    "data analyst",
    "machine learning engineer",
    "product manager",
    "UI UX designer",
    "cybersecurity analyst",
    "cloud engineer",
    "mobile developer",
    "QA engineer",
    "AI Engineer",
    "Software Developer",
    "Python Developer",
    "React Developer"
]

# Locations to search
DEFAULT_LOCATIONS = ["India", "United States", "Remote"]

class JobScheduler:
    """Manages periodic job scraping"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
        self.is_scraping = False  # Flag to prevent concurrent scraping
        logger.info("🤖 Job Scheduler initialized")
        logger.info(f"📄 Logs will be saved to: {log_file}")
    
    async def scrape_and_save_jobs(self):
        """
        Main job scraping task
        Fetches jobs from Tavily and saves to MongoDB
        """
        # Prevent concurrent scraping
        if self.is_scraping:
            logger.info("⏭️  SKIPPING: Scraping already in progress")
            return
        
        self.is_scraping = True
        
        try:
            logger.info("="*80)
            logger.info("🔄 STARTING SCHEDULED JOB SCRAPING")
            logger.info(f"📅 Scrape Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
            logger.info(f"🔍 Keywords: {len(DEFAULT_JOB_KEYWORDS)} job search terms")
            logger.info("="*80)
            start_time = datetime.utcnow()
            
            # Get database
            db = await get_database()
            
            # Check if jobs were scraped recently (within last 24 hours)
            recent_scrape = await db.job_scraper_stats.find_one(
                {"last_scrape_time": {"$exists": True}},
                sort=[("last_scrape_time", -1)]
            )
            
            if recent_scrape:
                from datetime import timedelta
                last_scrape = recent_scrape.get("last_scrape_time")
                if isinstance(last_scrape, str):
                    from dateutil import parser
                    last_scrape = parser.parse(last_scrape)
                
                time_since_scrape = datetime.utcnow() - last_scrape
                if time_since_scrape < timedelta(hours=24):
                    logger.info(f"⏭️  SKIPPING: Jobs were scraped {time_since_scrape.seconds // 3600} hours ago")
                    logger.info(f"📊 Existing jobs in database: {await db.jobs.count_documents({})}")
                    logger.info("="*80)
                    return
            
            # Fetch jobs using LinkedIn Scraper (Apify) and Tavily as backup
            logger.info(f"🔗 Fetching jobs from LinkedIn (Apify)...")
            linkedin_jobs = []
            
            try:
                # Use LinkedIn scraper for better quality jobs
                linkedin_jobs = await job_scraper.scrape_jobs_by_keywords(
                    keywords_list=DEFAULT_JOB_KEYWORDS[:5],  # Limit to first 5 keywords
                    locations=DEFAULT_LOCATIONS,
                    max_jobs_per_search=20  # 20 jobs per keyword-location combo
                )
                logger.info(f"✅ LinkedIn: Retrieved {len(linkedin_jobs)} job postings")
            except Exception as e:
                logger.error(f"❌ LinkedIn scraper failed: {str(e)}")
            
            # Also fetch from Tavily as backup/supplement
            logger.info(f"🌐 Fetching additional jobs from Tavily...")
            tavily_jobs = []
            try:
                tavily_jobs = await tavily_scraper.fetch_and_parse_jobs(DEFAULT_JOB_KEYWORDS[:10])
                logger.info(f"✅ Tavily: Retrieved {len(tavily_jobs)} job postings")
            except Exception as e:
                logger.error(f"❌ Tavily scraper failed: {str(e)}")
            
            # Combine jobs from both sources
            jobs = linkedin_jobs + tavily_jobs
            
            if not jobs:
                logger.warning("⚠️  WARNING: No jobs fetched from Tavily")
                logger.info("="*80)
                return
            
            logger.info(f"📦 Retrieved {len(jobs)} job postings from web scraping")
            
            # Count by source (filter out None keys)
            source_counts = {}
            for job in jobs:
                source = job.get("source") or "unknown"
                source_counts[source] = source_counts.get(source, 0) + 1
            
            logger.info("📊 Jobs by source:")
            for source, count in source_counts.items():
                logger.info(f"   • {source.capitalize()}: {count} jobs")
            
            # Count job types (filter out None keys)
            job_type_counts = {}
            for job in jobs:
                jtype = job.get("job_type") or "unspecified"
                job_type_counts[jtype] = job_type_counts.get(jtype, 0) + 1
            
            logger.info("💼 Jobs by type:")
            for jtype, count in job_type_counts.items():
                logger.info(f"   • {jtype or 'Unspecified'}: {count} jobs")
            
            # Save jobs to MongoDB (upsert to avoid duplicates)
            logger.info("💾 Saving jobs to MongoDB...")
            saved_count = 0
            updated_count = 0
            skipped_count = 0
            
            for job in jobs:
                result = await db.jobs.update_one(
                    {"job_id": job["job_id"]},
                    {"$set": job},
                    upsert=True
                )
                
                if result.upserted_id:
                    saved_count += 1
                    logger.debug(f"   ✓ NEW: {job['title']} at {job['company']}")
                elif result.modified_count > 0:
                    updated_count += 1
                    logger.debug(f"   ↻ UPDATED: {job['title']} at {job['company']}")
                else:
                    skipped_count += 1
            
            logger.info(f"✅ Database operations complete:")
            logger.info(f"   • {saved_count} new jobs added")
            logger.info(f"   • {updated_count} existing jobs updated")
            logger.info(f"   • {skipped_count} jobs unchanged (duplicates)")
            
            # Get total jobs in database
            total_db_jobs = await db.jobs.count_documents({})
            logger.info(f"📚 Total jobs in database: {total_db_jobs}")
            
            # Update scraper stats
            stats = {
                "total_scraped": len(jobs),
                "saved_new": saved_count,
                "updated_existing": updated_count,
                "skipped_duplicates": skipped_count,
                "source_breakdown": source_counts,
                "job_type_breakdown": job_type_counts,
                "last_scrape": datetime.utcnow().isoformat(),
                "last_scrape_time": datetime.utcnow(),  # For time-based checks
                "keywords_used": DEFAULT_JOB_KEYWORDS,
                "total_in_database": total_db_jobs
            }
            
            await db.job_scraper_stats.insert_one(stats)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            logger.info(f"⏱️  Scraping completed in {elapsed:.2f} seconds")
            logger.info("="*80)
            logger.info("")
            
        except Exception as e:
            logger.error("="*80)
            logger.error(f"❌ JOB SCRAPING FAILED")
            logger.error(f"Error: {str(e)}")
            logger.error(f"Type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback:\n{traceback.format_exc()}")
            logger.error("="*80)
            logger.error("")
        finally:
            self.is_scraping = False  # Reset flag after scraping
    
    async def force_scrape_and_save_jobs(self):
        """
        Force job scraping (bypasses 24-hour check)
        Used for manual refresh
        """
        # Prevent concurrent scraping
        if self.is_scraping:
            logger.info("⏭️  SKIPPING: Scraping already in progress")
            return {"success": False, "message": "Scraping already in progress"}
        
        self.is_scraping = True
        
        try:
            logger.info("="*80)
            logger.info("🔄 STARTING FORCED JOB SCRAPING (MANUAL REFRESH)")
            logger.info(f"📅 Scrape Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
            logger.info(f"🔍 Keywords: {len(DEFAULT_JOB_KEYWORDS)} job search terms")
            logger.info("="*80)
            start_time = datetime.utcnow()
            
            # Get database
            db = await get_database()
            
            # Fetch jobs using LinkedIn Scraper (Apify) and Tavily as backup
            logger.info(f"🔗 Fetching jobs from LinkedIn (Apify)...")
            linkedin_jobs = []
            
            try:
                # Use LinkedIn scraper for better quality jobs
                linkedin_jobs = await job_scraper.scrape_jobs_by_keywords(
                    keywords_list=DEFAULT_JOB_KEYWORDS[:5],  # Limit to first 5 keywords
                    locations=DEFAULT_LOCATIONS,
                    max_jobs_per_search=20  # 20 jobs per keyword-location combo
                )
                logger.info(f"✅ LinkedIn: Retrieved {len(linkedin_jobs)} job postings")
            except Exception as e:
                logger.error(f"❌ LinkedIn scraper failed: {str(e)}")
            
            # Also fetch from Tavily as backup/supplement
            logger.info(f"🌐 Fetching additional jobs from Tavily...")
            tavily_jobs = []
            try:
                tavily_jobs = await tavily_scraper.fetch_and_parse_jobs(DEFAULT_JOB_KEYWORDS[:10])
                logger.info(f"✅ Tavily: Retrieved {len(tavily_jobs)} job postings")
            except Exception as e:
                logger.error(f"❌ Tavily scraper failed: {str(e)}")
            
            # Combine jobs from both sources
            jobs = linkedin_jobs + tavily_jobs
            
            if not jobs:
                logger.warning("⚠️  WARNING: No jobs fetched from any source")
                logger.info("="*80)
                return {"success": False, "message": "No jobs fetched"}
            
            logger.info(f"📦 Retrieved {len(jobs)} job postings total")
            
            # Count by source
            source_counts = {}
            for job in jobs:
                source = job.get("source") or "unknown"
                source_counts[source] = source_counts.get(source, 0) + 1
            
            logger.info("📊 Jobs by source:")
            for source, count in source_counts.items():
                logger.info(f"   • {source.capitalize()}: {count} jobs")
            
            # Save jobs to MongoDB
            logger.info("💾 Saving jobs to MongoDB...")
            saved_count = 0
            updated_count = 0
            skipped_count = 0
            
            for job in jobs:
                result = await db.jobs.update_one(
                    {"job_id": job["job_id"]},
                    {"$set": job},
                    upsert=True
                )
                
                if result.upserted_id:
                    saved_count += 1
                elif result.modified_count > 0:
                    updated_count += 1
                else:
                    skipped_count += 1
            
            logger.info(f"✅ Database operations complete:")
            logger.info(f"   • {saved_count} new jobs added")
            logger.info(f"   • {updated_count} existing jobs updated")
            logger.info(f"   • {skipped_count} jobs unchanged (duplicates)")
            
            # Get total jobs in database
            total_db_jobs = await db.jobs.count_documents({})
            logger.info(f"📚 Total jobs in database: {total_db_jobs}")
            
            # Update scraper stats
            stats = {
                "total_scraped": len(jobs),
                "saved_new": saved_count,
                "updated_existing": updated_count,
                "skipped_duplicates": skipped_count,
                "source_breakdown": source_counts,
                "last_scrape": datetime.utcnow().isoformat(),
                "last_scrape_time": datetime.utcnow(),
                "keywords_used": DEFAULT_JOB_KEYWORDS,
                "total_in_database": total_db_jobs,
                "scrape_type": "manual_refresh"
            }
            
            await db.job_scraper_stats.insert_one(stats)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            logger.info(f"⏱️  Scraping completed in {elapsed:.2f} seconds")
            logger.info("="*80)
            
            return {
                "success": True,
                "message": f"Successfully scraped {len(jobs)} jobs",
                "stats": {
                    "total_scraped": len(jobs),
                    "saved_new": saved_count,
                    "updated_existing": updated_count,
                    "sources": source_counts
                }
            }
            
        except Exception as e:
            logger.error("="*80)
            logger.error(f"❌ FORCED JOB SCRAPING FAILED")
            logger.error(f"Error: {str(e)}")
            logger.error(f"Type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback:\n{traceback.format_exc()}")
            logger.error("="*80)
            return {"success": False, "message": f"Scraping failed: {str(e)}"}
        finally:
            self.is_scraping = False
    
    def start(self):
        """Start the scheduler"""
        if self.is_running:
            logger.warning("Scheduler already running")
            return
        
        # Schedule job scraping every 24 hours
        self.scheduler.add_job(
            self.scrape_and_save_jobs,
            trigger=IntervalTrigger(hours=24),
            id="job_scraper",
            name="Daily Job Scraper",
            replace_existing=True
        )
        
        # Run immediately on startup (optional)
        self.scheduler.add_job(
            self.scrape_and_save_jobs,
            id="job_scraper_initial",
            name="Initial Job Scrape"
        )
        
        self.scheduler.start()
        self.is_running = True
        logger.info("✅ Job Scheduler started - will run every 24 hours")
        logger.info(f"⏰ Next scheduled run: {datetime.utcnow() + __import__('datetime').timedelta(hours=24)}")
        logger.info("🚀 Running initial job scrape now...")
    
    def shutdown(self):
        """Gracefully shutdown scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            self.is_running = False
            logger.info("Job Scheduler shut down")

# Singleton instance
job_scheduler = JobScheduler()
