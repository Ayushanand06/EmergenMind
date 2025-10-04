require('dotenv').config();
const twilio = require("twilio");
const axios = require('axios'); // You'll need to install this: npm install axios

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('Error: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in your .env file');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function createCall() {
  try {
    const call = await client.calls.create({
  from: "+12188456415", 
  record: true,
  to: "+919123721048",
  twiml: `<Response>
    <Gather timeout="3600" numDigits="1">
      
    </Gather>
  </Response>`,
});

    console.log('✅ Call initiated with SID:', call.sid);
     
    // Start monitoring the call for completion
    await monitorCallAndTranscribe(call.sid);
    
  } catch (error) {
    console.error('❌ Error creating call:', error.message);
  }
}

async function monitorCallAndTranscribe(callSid) {
  console.log('🔄 Monitoring call status...');
  
  // Poll call status until completed
  while (true) {
    try {
      const call = await client.calls(callSid).fetch();
      console.log(`Call status: ${call.status}`);
      
      if (call.status === 'completed') {
        console.log('✅ Call completed! Waiting for recording to be processed...');
        
        // Wait for recording to be processed (30-60 seconds)
        await waitForRecording(callSid);
        break;
      } else if (call.status === 'failed' || call.status === 'canceled') {
        console.log('❌ Call failed or was canceled');
        return;
      }
      
      // Wait 10 seconds before checking again
      await sleep(10000);
      
    } catch (error) {
      console.error('Error checking call status:', error.message);
      break;
    }
  }
}

async function waitForRecording(callSid) {
  // Wait and retry for recording to be available
  const maxRetries = 12; // 12 retries = 2 minutes
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const recordings = await client.recordings.list({
        callSid: callSid
      });
      
      if (recordings.length > 0) {
        console.log('✅ Recording found! Generating download link...');
        const downloadData = await generateDownloadLink(callSid);
        
        if (downloadData) {
          await sendToTranscriptionAPI(downloadData);
        }
        return;
      }
      
      console.log(`⏳ Recording not ready yet. Retry ${retries + 1}/${maxRetries} in 10 seconds...`);
      await sleep(10000);
      retries++;
      
    } catch (error) {
      console.error('Error checking for recording:', error.message);
      retries++;
      await sleep(10000);
    }
  }
  
  console.log('❌ Recording not found after maximum retries');
}

async function generateDownloadLink(callSid) {
  try {
    console.log(`🔗 Getting download link for call: ${callSid}`);
    
    const recordings = await client.recordings.list({
      callSid: callSid
    });

    if (recordings.length === 0) {
      console.log('No recordings found for this call SID');
      return null;
    }

    const recording = recordings[0];
    const authenticatedDownloadUrl = `https://${accountSid}:${authToken}@api.twilio.com${recording.uri.replace('.json', '.wav')}?Download=true`;
    
    const downloadData = {
      recordingSid: recording.sid,
      callSid: recording.callSid,
      duration: recording.duration,
      dateCreated: recording.dateCreated,
      downloadUrl: authenticatedDownloadUrl
    };
    
    console.log('✅ Download link generated successfully!');
    console.log('📥 MP3 Download URL:', authenticatedDownloadUrl);
    
    return downloadData;

  } catch (error) {
    console.error('❌ Error generating download link:', error.message);
    return null;
  }
}

async function sendToTranscriptionAPI(downloadData) {
  try {
    console.log('📤 Sending to transcription API...');
    
    const payload = {
      audio_url: downloadData.downloadUrl,
      call_sid: downloadData.callSid,
      recording_sid: downloadData.recordingSid,
      duration: downloadData.duration,
      date_created: downloadData.dateCreated
    };
    
    const response = await axios.post('http://localhost:8000/transcribe', payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('✅ Successfully sent to transcription API!');
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to transcription API at localhost:8000');
      console.error('Make sure your transcription service is running');
    } else {
      console.error('❌ Error sending to transcription API:', error.message);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the process
console.log('🚀 Starting call and transcription flow...');
createCall();