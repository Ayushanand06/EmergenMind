from fastapi import FastAPI, HTTPException
from faster_whisper import WhisperModel
from pydantic import BaseModel
import uvicorn
import tempfile
import requests
import os
import subprocess

app = FastAPI()

model = WhisperModel("base", device="cpu", compute_type="int8")

class TranscribeRequest(BaseModel):
    audio_url: str
    call_sid: str = None
    recording_sid: str = None
    duration: int = None
    date_created: str = None
    skip_seconds: int = 8

@app.post("/transcribe")
async def transcribe_audio(request: TranscribeRequest):
    original_path = None
    trimmed_path = None
    
    try:
        print(f"Downloading audio from: {request.audio_url}")
        
        response = requests.get(request.audio_url, stream=True, timeout=60)
        response.raise_for_status()
        
        # Save original audio as .wav
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            for chunk in response.iter_content(chunk_size=8192):
                tmp.write(chunk)
            original_path = tmp.name

        print(f"Audio downloaded to: {original_path}")
        
        # Create trimmed audio path
        trimmed_path = original_path.replace('.wav', '_trimmed.wav')
        
        # Trim first 8 seconds using ffmpeg
        print(f"Trimming first {request.skip_seconds} seconds...")
        cmd = [
            'ffmpeg', 
            '-i', original_path,
            '-ss', str(request.skip_seconds),  # Skip first X seconds
            '-c', 'copy',  # Copy without re-encoding
            '-y',  # Overwrite if exists
            trimmed_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"FFmpeg failed: {result.stderr}")
        
        print("Audio trimmed successfully, starting transcription...")
        
        # Transcribe the trimmed audio
        segments, info = model.transcribe(trimmed_path, task="translate")
        
        # Extract text
        text = " ".join([segment.text for segment in segments])
        
        print(f"Transcription: {text}")
        
        # Save transcription to file
        txt_filename = None
        if request.call_sid and text.strip():
            txt_filename = f"{request.call_sid}_transcription.txt"
            with open(txt_filename, 'w', encoding='utf-8') as f:
                f.write(text)
            print(f"Transcription saved to: {txt_filename}")
        
        return {
            "success": True,
            "call_sid": request.call_sid,
            "recording_sid": request.recording_sid,
            "original_language": info.language,
            "duration": info.duration,
            "skipped_seconds": request.skip_seconds,
            "transcription": text,
            "saved_file": txt_filename
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="FFmpeg not found. Please install FFmpeg first.")
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
        
    finally:
        # Clean up files
        for path in [original_path, trimmed_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                    print(f"Cleaned up: {path}")
                except:
                    pass

@app.get("/")
async def root():
    return {"message": "Whisper Transcription API", "endpoint": "/transcribe"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)