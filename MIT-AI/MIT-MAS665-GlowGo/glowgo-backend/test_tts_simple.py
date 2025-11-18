"""
Simple test to verify TTS endpoint returns audio
"""
import asyncio
import httpx
from config import settings


async def test_tts_endpoint():
    """Test the backend TTS endpoint directly"""
    print("Testing backend TTS endpoint...")

    url = "http://localhost:8000/api/voice/text-to-speech"

    payload = {
        "text": "Hello! This is a test of the text to speech system."
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)

            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('content-type')}")
            print(f"Content-Length: {len(response.content)} bytes")

            if response.status_code == 200:
                print("✅ TTS endpoint is working!")
                print(f"Audio size: {len(response.content)} bytes")

                # Save audio to file for testing
                with open("/tmp/test_tts.mp3", "wb") as f:
                    f.write(response.content)
                print("✅ Audio saved to /tmp/test_tts.mp3")
                print("You can play it with: afplay /tmp/test_tts.mp3")

                return True
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                return False

    except Exception as e:
        print(f"❌ Exception: {type(e).__name__}: {str(e)}")
        return False


if __name__ == "__main__":
    result = asyncio.run(test_tts_endpoint())
    if result:
        print("\n✅ Backend TTS is working correctly!")
        print("Now test from the frontend to see if audio plays in browser.")
    else:
        print("\n❌ Backend TTS is not working. Check if server is running.")
