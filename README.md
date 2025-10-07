# Emergency Response Dashboard & Call Analysis System

This repository contains a multi-component system for emergency call handling, real-time incident analysis, and dashboard visualization. It includes:

- **Emergency Dashboard**: A Next.js-based dashboard for incident handlers to view, assign, and resolve emergency cases.
- **Call Handling & Analysis**: Node.js services for Twilio call recording, transcription, and AI-powered emergency analysis.
- **Whisper Transcription API**: FastAPI service for audio transcription using Whisper.

---

## Project Structure

```
README.md
call/
  .env
  call.js
  combined.js
  groq.js
  package.json
  recording.js
  CA66bcfc0ec75e5fd4ee6b7c59e719b26a.mp3
emergency-dashboard/
  app/
  components/
  hooks/
  public/
  styles/
  package.json
  next.config.mjs
  tsconfig.json
  ...
whisper/
  api.py
  groq.py
  requirements.txt
  TEST_CALL_123_transcription.txt
```

---

## 1. Emergency Dashboard

A Next.js app for incident handlers.

### Features

- **Live Incident Feed**: View, assign, and resolve incidents.
- **Unit Assignment**: Assign ambulance, firefighter, and police units.
- **Status Tracking**: Track incident status (Pending, Processing, Resolved).
- **Analytics**: Visualize incident data and unit utilization.
- **Authentication**: Register and login for incident handlers.

### Getting Started

```sh
cd emergency-dashboard
pnpm install
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 2. Call Handling & Analysis

Node.js scripts for Twilio call management and emergency analysis.

### Features

- **Twilio Integration**: Initiate and record emergency calls.
- **Recording Download**: Fetch call recordings via Twilio API.
- **Transcription**: Send recordings to Whisper API for transcription.
- **AI Analysis**: Analyze transcriptions using Groq/OpenAI for severity, urgency, and resource needs.
- **Redis Storage**: Store analyzed emergencies for dashboard consumption.

### Usage

1. **Configure `.env`** in `call/` with your Twilio credentials.
2. **Initiate a call**:

   ```sh
   node call.js
   ```

3. **Run the combined flow** (call, record, transcribe, analyze):

   ```sh
   node combined.js
   ```

4. **Start the analysis API**:

   ```sh
   node groq.js
   ```

   Endpoints:
   - `POST /analyze-emergency`
   - `GET /emergencies/high-priority`
   - `GET /emergencies/location/:area`
   - `GET /emergencies/all`
   - `GET /health`

---

## 3. Whisper Transcription API

FastAPI service for audio transcription.

### Features

- **Transcribe Audio**: Accepts audio URLs and returns transcriptions.
- **Trimming**: Skips initial seconds for cleaner transcription.
- **Integration**: Used by call scripts for automated transcription.

### Setup

```sh
cd whisper
pip install -r requirements.txt
uvicorn api:app --host 0.0.0.0 --port 8000
```

#### Endpoints

- `POST /transcribe` — Transcribe audio from URL.
- `GET /` — API info.

---

## 4. Emergency Message Analysis (Python)

Flask service for message severity analysis and Redis storage.

### Features

- **Severity Analysis**: Uses Groq API to summarize and rate severity.
- **Redis Storage**: Stores messages and sorts by severity.
- **Sample Testing**: Preloads sample messages for demo/testing.

### Usage

```sh
cd whisper
python groq.py
```

#### Endpoints

- `POST /incoming_message`
- `GET /get_sorted_messages`
- `GET /get_messages_by_location?loc=...`
- `GET /get_top_critical?n=5`
- `GET /test_sample_messages`

---

## Environment Variables

- **Twilio**: `TWILIO_SID`, `TWILIO_AUTH_TOKEN`
- **Groq/OpenAI**: `apiKey`
- **Redis**: Defaults to `localhost:6379`

---

## License

This project is for educational and demonstration purposes.

---

## Authors

- Emergency Dashboard: Next.js, React, Radix UI
- Call Handling: Node.js, Twilio, Redis, OpenAI/Groq
- Transcription: Python, FastAPI, Whisper
