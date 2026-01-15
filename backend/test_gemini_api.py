"""
Test script to verify Gemini API keys are working
"""
import os
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_gemini_key(api_key: str, key_name: str):
    """Test a single Gemini API key"""
    if not api_key or api_key.strip() == "":
        print(f"❌ {key_name}: EMPTY or NOT SET")
        return False
    
    try:
        print(f"\n🔍 Testing {key_name}...")
        print(f"   Key (first 10 chars): {api_key[:10]}...")
        
        # Configure with this key
        genai.configure(api_key=api_key)
        
        # Try to initialize model
        try:
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            print(f"   ✓ Model 'gemini-2.0-flash-exp' initialized")
        except Exception as e:
            print(f"   ⚠ Model 'gemini-2.0-flash-exp' failed: {str(e)}")
            # Try fallback
            try:
                model = genai.GenerativeModel('gemini-1.5-flash')
                print(f"   ✓ Using fallback model 'gemini-1.5-flash'")
            except Exception as e2:
                print(f"   ❌ Fallback model also failed: {str(e2)}")
                return False
        
        # Test with a simple prompt
        test_prompt = "Say 'Hello, API is working!' in one sentence."
        print(f"   📤 Sending test prompt...")
        
        response = await model.generate_content_async(test_prompt)
        
        if response and response.text:
            print(f"   ✅ SUCCESS! Response: {response.text[:100]}")
            return True
        else:
            print(f"   ❌ No response text received")
            return False
            
    except Exception as e:
        error_str = str(e)
        print(f"   ❌ ERROR: {error_str[:200]}")
        
        # Check error type
        if "429" in error_str:
            print(f"   ⚠ Rate limit error (429)")
        elif "403" in error_str:
            print(f"   ⚠ Permission denied (403) - Check API key permissions")
        elif "401" in error_str:
            print(f"   ⚠ Unauthorized (401) - Invalid API key")
        elif "quota" in error_str.lower():
            print(f"   ⚠ Quota exceeded")
        elif "api key" in error_str.lower() or "invalid" in error_str.lower():
            print(f"   ⚠ Invalid API key")
        else:
            print(f"   ⚠ Unknown error type")
        
        return False

async def main():
    """Test all Gemini API keys"""
    print("=" * 60)
    print("🧪 GEMINI API KEY TESTER")
    print("=" * 60)
    
    # Get all API keys
    keys = {
        "GEMINI_API_KEY_1": os.getenv("GEMINI_API_KEY_1"),
        "GEMINI_API_KEY_2": os.getenv("GEMINI_API_KEY_2"),
        "GEMINI_API_KEY_3": os.getenv("GEMINI_API_KEY_3"),
        "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY"),
        "GEMINI_API_KEY_4": os.getenv("GEMINI_API_KEY_4"),
        "GEMINI_API_KEY_5": os.getenv("GEMINI_API_KEY_5"),
    }
    
    print(f"\n📋 Found {sum(1 for v in keys.values() if v)} non-empty API keys")
    
    results = {}
    for key_name, api_key in keys.items():
        if api_key:
            results[key_name] = await test_gemini_key(api_key, key_name)
            await asyncio.sleep(1)  # Small delay between tests
        else:
            print(f"\n⏭ Skipping {key_name} (not set)")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    
    working_keys = [name for name, result in results.items() if result]
    failed_keys = [name for name, result in results.items() if not result]
    
    if working_keys:
        print(f"✅ Working keys ({len(working_keys)}):")
        for key in working_keys:
            print(f"   - {key}")
    else:
        print("❌ NO WORKING KEYS FOUND!")
    
    if failed_keys:
        print(f"\n❌ Failed keys ({len(failed_keys)}):")
        for key in failed_keys:
            print(f"   - {key}")
    
    print("\n" + "=" * 60)
    
    if working_keys:
        print("✅ At least one API key is working!")
        return 0
    else:
        print("❌ All API keys failed. Please check your API keys.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)

