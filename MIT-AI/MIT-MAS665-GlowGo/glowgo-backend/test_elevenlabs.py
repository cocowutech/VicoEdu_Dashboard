"""
Test script to verify ElevenLabs API credentials and endpoints
"""
import httpx
from config import settings

async def test_elevenlabs_tts():
    """Test ElevenLabs Text-to-Speech API"""
    print("Testing ElevenLabs TTS API...")
    print(f"API Key: {settings.ELEVENLABS_API_KEY[:20]}..." if settings.ELEVENLABS_API_KEY else "Not set")
    print(f"Voice ID: {settings.ELEVENLABS_VOICE_ID}")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}"

    headers = {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }

    payload = {
        "text": "Hello, this is a test.",
        "model_id": "eleven_turbo_v2_5",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            print(f"TTS Status Code: {response.status_code}")

            if response.status_code == 200:
                print("✅ TTS API working! Audio received.")
                print(f"Audio size: {len(response.content)} bytes")
            else:
                print(f"❌ TTS API error: {response.text}")
    except Exception as e:
        print(f"❌ TTS Error: {str(e)}")


async def test_elevenlabs_stt():
    """Test ElevenLabs Speech-to-Text API"""
    print("\nTesting ElevenLabs STT API...")

    # Note: This is just testing the endpoint accessibility
    # We don't have a test audio file here
    url = "https://api.elevenlabs.io/v1/speech-to-text"

    headers = {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
    }

    print(f"STT Endpoint: {url}")
    print(f"Using API Key: {settings.ELEVENLABS_API_KEY[:20]}...")

    # We can't test without audio, but we can check if the endpoint exists
    print("⚠️  Cannot test STT without audio file, but endpoint is configured.")


if __name__ == "__main__":
    import asyncio

    print("=" * 60)
    print("ElevenLabs API Test")
    print("=" * 60)

    asyncio.run(test_elevenlabs_tts())
    asyncio.run(test_elevenlabs_stt())

    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)
