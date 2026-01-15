"""
Test script for AI Resume Analysis module
Run this to verify the module is working correctly
"""
import asyncio
import sys
sys.path.append('..')

from ai_resume_analysis.ats_checker import ats_checker
from ai_resume_analysis.gap_analyzer import gap_analyzer

# Sample resume text
SAMPLE_RESUME = """
John Doe
Software Engineer
Email: john.doe@email.com | Phone: (555) 123-4567

PROFESSIONAL EXPERIENCE

Software Engineer | Tech Company Inc. | 2021 - Present
- Developed web applications using JavaScript and React
- Collaborated with cross-functional teams to deliver features
- Participated in code reviews and testing

Junior Developer | StartUp Co. | 2019 - 2021
- Built REST APIs using Node.js
- Worked on database optimization
- Assisted in frontend development

EDUCATION
Bachelor of Science in Computer Science | University of Technology | 2019

SKILLS
- Programming: JavaScript, Python, HTML, CSS
- Frameworks: React, Node.js, Express
- Tools: Git, VS Code
- Soft Skills: Team collaboration, Problem solving
"""

# Sample job description
SAMPLE_JOB_DESCRIPTION = """
Senior Software Engineer

We are looking for a Senior Software Engineer to join our team.

Requirements:
- 3+ years of experience in software development
- Strong proficiency in Python, JavaScript, and TypeScript
- Experience with React and Node.js
- Knowledge of AWS cloud services
- Experience with Docker and Kubernetes
- Understanding of CI/CD pipelines
- Strong problem-solving skills
- Excellent communication and team collaboration

Nice to have:
- Experience with microservices architecture
- PostgreSQL or MongoDB database experience
- AWS certifications
"""

async def test_ats_checker():
    """Test ATS compatibility checker"""
    print("\n" + "="*60)
    print("Testing ATS Checker")
    print("="*60)
    
    try:
        result = await ats_checker.analyze_ats_compatibility(
            resume_text=SAMPLE_RESUME,
            job_description=SAMPLE_JOB_DESCRIPTION
        )
        
        print(f"\n✅ ATS Score: {result.score}/100")
        print(f"\n📊 Overall Assessment:")
        print(f"   {result.overall_assessment}")
        
        print(f"\n💪 Strengths ({len(result.strengths)}):")
        for strength in result.strengths[:3]:
            print(f"   • {strength}")
        
        print(f"\n⚠️  Weaknesses ({len(result.weaknesses)}):")
        for weakness in result.weaknesses[:3]:
            print(f"   • {weakness}")
        
        print(f"\n💡 Top Suggestions ({len(result.suggestions)}):")
        for suggestion in result.suggestions[:3]:
            print(f"   [{suggestion.priority}] {suggestion.category}: {suggestion.suggestion}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ATS Checker test failed: {e}")
        return False

async def test_gap_analyzer():
    """Test gap analysis"""
    print("\n" + "="*60)
    print("Testing Gap Analyzer")
    print("="*60)
    
    try:
        result = await gap_analyzer.analyze_gaps(
            resume_text=SAMPLE_RESUME,
            job_description=SAMPLE_JOB_DESCRIPTION
        )
        
        print(f"\n✅ Gap Analysis Score: {result.score}/100")
        print(f"   Match Percentage: {result.matched_percentage:.1f}%")
        
        print(f"\n✅ Matching Keywords ({len(result.matching_keywords)}):")
        print(f"   {', '.join(result.matching_keywords[:8])}")
        
        print(f"\n❌ Missing Keywords ({len(result.missing_keywords)}):")
        print(f"   {', '.join(result.missing_keywords[:8])}")
        
        print(f"\n🎯 Skill Gaps ({len(result.skill_gaps)}):")
        for gap in result.skill_gaps[:5]:
            print(f"   • {gap.skill} ({gap.category}) - {gap.importance}")
        
        print(f"\n📚 Resources Provided for {len(result.gaps_with_resources)} skills:")
        for gap_res in result.gaps_with_resources[:2]:
            print(f"   • {gap_res.skill}: {len(gap_res.resources)} resources")
            if gap_res.resources:
                print(f"     - {gap_res.resources[0].title}")
        
        print(f"\n💡 Recommendations:")
        for rec in result.recommendations[:3]:
            print(f"   • {rec}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Gap Analyzer test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("AI Resume Analysis Module - Test Suite")
    print("="*60)
    
    ats_success = await test_ats_checker()
    gap_success = await test_gap_analyzer()
    
    print("\n" + "="*60)
    print("Test Results")
    print("="*60)
    print(f"ATS Checker: {'✅ PASSED' if ats_success else '❌ FAILED'}")
    print(f"Gap Analyzer: {'✅ PASSED' if gap_success else '❌ FAILED'}")
    print("="*60)
    
    if ats_success and gap_success:
        print("\n🎉 All tests passed! Module is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the error messages above.")

if __name__ == "__main__":
    asyncio.run(main())
