"""
Voice Router - Speech-to-Text and Text-to-Speech endpoints using ElevenLabs
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
import io
from typing import Optional

from config import settings


router = APIRouter()


class TextToSpeechRequest(BaseModel):
    """Request model for text-to-speech conversion"""
    text: str
    voice_id: Optional[str] = None  # Override default voice if needed


class SpeechToTextResponse(BaseModel):
    """Response model for speech-to-text conversion"""
    text: str


@router.post("/speech-to-text", response_model=SpeechToTextResponse)
async def speech_to_text(audio: UploadFile = File(...)):
    """
    Convert audio to text using ElevenLabs Speech-to-Text API

    Args:
        audio: Audio file (webm, mp3, wav, etc.)

    Returns:
        JSON with recognized text
    """
    if not settings.ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="ElevenLabs API key not configured"
        )

    try:
        # Read audio file content
        audio_content = await audio.read()

        print(f"[STT] Received audio: {audio.filename}, {len(audio_content)} bytes, {audio.content_type}")

        # Check if audio is too small (likely empty or corrupted)
        if len(audio_content) < 1000:  # Less than 1KB is suspicious
            print(f"[STT] Warning: Audio file is very small ({len(audio_content)} bytes)")
            raise HTTPException(
                status_code=400,
                detail="Audio file is too small or empty. Please try recording again."
            )

        # ElevenLabs STT endpoint
        url = "https://api.elevenlabs.io/v1/speech-to-text"

        headers = {
            "xi-api-key": settings.ELEVENLABS_API_KEY,
        }

        # Prepare multipart form data with both file and model_id
        files = {
            "file": (audio.filename or "audio.webm", audio_content, audio.content_type or "audio/webm")
        }

        data = {
            "model_id": "scribe_v2"  # Use scribe_v2 for speech-to-text
        }

        print(f"[STT] Calling ElevenLabs: {url}")
        print(f"[STT] File size: {len(audio_content)} bytes")
        print(f"[STT] Content type: {audio.content_type}")

        # Call ElevenLabs STT API
        async with httpx.AsyncClient(timeout=60.0) as client:  # Increased timeout
            response = await client.post(url, headers=headers, files=files, data=data)

            print(f"[STT] Response status: {response.status_code}")

            if response.status_code != 200:
                error_detail = response.text
                print(f"[STT] Error: {error_detail}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"ElevenLabs STT API error: {error_detail}"
                )

            result = response.json()
            recognized_text = result.get("text", "")

            print(f"[STT] Full response: {result}")
            print(f"[STT] Recognized: '{recognized_text}'")

            if not recognized_text or not recognized_text.strip():
                # More helpful error message
                print(f"[STT] No speech detected. Audio might be silent, too quiet, or corrupted.")
                raise HTTPException(
                    status_code=400,
                    detail="No speech detected. Please speak louder and closer to the microphone, then try again."
                )

            return SpeechToTextResponse(text=recognized_text.strip())

    except HTTPException:
        raise
    except httpx.HTTPError as e:
        print(f"[STT] Network error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Network error calling ElevenLabs: {str(e)}"
        )
    except Exception as e:
        print(f"[STT] Exception: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing speech-to-text: {str(e)}"
        )


@router.post("/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest):
    """
    Convert text to speech using ElevenLabs Text-to-Speech API

    Args:
        request: TextToSpeechRequest with text to convert

    Returns:
        Audio stream (MP3)
    """
    if not settings.ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="ElevenLabs API key not configured"
        )

    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )

    try:
        # Use provided voice_id or default from settings
        voice_id = request.voice_id or settings.ELEVENLABS_VOICE_ID

        if not voice_id:
            raise HTTPException(
                status_code=500,
                detail="No voice ID configured"
            )

        # ElevenLabs TTS endpoint
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

        headers = {
            "xi-api-key": settings.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        }

        payload = {
            "text": request.text,
            "model_id": "eleven_turbo_v2_5",  # Fast, high-quality model
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }

        # Call ElevenLabs TTS API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)

            if response.status_code != 200:
                error_detail = response.text
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"ElevenLabs TTS API error: {error_detail}"
                )

            # Return audio stream
            audio_content = response.content

            return StreamingResponse(
                io.BytesIO(audio_content),
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": "inline; filename=speech.mp3"
                }
            )

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Network error calling ElevenLabs: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing text-to-speech: {str(e)}"
        )
