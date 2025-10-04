# Whisper Transcription API

A FastAPI-based service that transcribes audio files using OpenAI's Whisper model via the faster-whisper library.

## Features

- 🎵 Downloads audio from URLs (supports authentication)
- ✂️ Trims first 8 seconds to skip Twilio trial messages
- 🗣️ Transcribes and translates audio to English
- 💾 Saves transcriptions as text files
- 🚀 Fast API with automatic documentation

## Setup

### 1. Create Virtual Environment
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
# or
source .venv/bin/activate  # Linux/Mac
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Install FFmpeg
- **Windows**: Download from [FFmpeg.org](https://ffmpeg.org/download.html) or use `choco install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`
- **Mac**: `brew install ffmpeg`

## Usage

### Start the API Server
```bash
python api.py
```

The API will be available at `http://localhost:8000`

### API Documentation
Visit `http://localhost:8000/docs` for interactive API documentation.

### Example Request
```bash
curl -X POST "http://localhost:8000/transcribe" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/audio.wav",
    "call_sid": "CAxxxxx",
    "skip_seconds": 8
  }'
```

### Example Response
```json
{
  "success": true,
  "call_sid": "CAxxxxx",
  "original_language": "es",
  "duration": 45.2,
  "transcription": "Hello, this is the transcribed text.",
  "saved_file": "CAxxxxx_transcription.txt"
}
```

## API Endpoints

- `POST /transcribe` - Transcribe audio from URL
- `GET /` - API information
- `GET /health` - Health check

## Dependencies

- FastAPI - Web framework
- faster-whisper - Whisper transcription
- requests - HTTP client
- ffmpeg - Audio processing
- uvicorn - ASGI server

## File Structure
```
whisper/
├── api.py              # Main API application
├── requirements.txt    # Python dependencies
├── README.md          # This file
└── .venv/             # Virtual environment (not tracked)
```

## Notes

- Transcription files are saved in the current directory
- Temporary audio files are automatically cleaned up
- The API skips the first 8 seconds by default to avoid Twilio trial messages
- Supports both MP3 and WAV audio formats