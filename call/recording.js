require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
    console.error('Missing Twilio credentials in environment variables');
    process.exit(1);
}

const client = twilio(accountSid, authToken);

async function getDownloadLink(callSid) {
    try {
        console.log(`Getting download link for call: ${callSid}`);
        
        const recordings = await client.recordings.list({
            callSid: callSid
        });

        if (recordings.length === 0) {
            console.log('No recordings found for this call SID');
            return null;
        }

        const recording = recordings[0];
        
        // Create direct download URL by adding ?download=true parameter
        const baseUrl = `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`;
        const downloadUrl = `${baseUrl}?Download=true`;
        
        // Create authenticated download URL
        const authString = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const authenticatedDownloadUrl = `https://${accountSid}:${authToken}@api.twilio.com${recording.uri.replace('.json', '.mp3')}?Download=true`;
        
        console.log('✅ Recording found!');
        console.log('Recording SID:', recording.sid);
        console.log('Duration:', recording.duration, 'seconds');
        console.log('Date Created:', recording.dateCreated);
        console.log('\n📥 Direct Download Links:');
        console.log('MP3 Download:', authenticatedDownloadUrl);
        console.log('WAV Download:', authenticatedDownloadUrl.replace('.mp3', '.wav'));
        
        return {
            recordingSid: recording.sid,
            callSid: recording.callSid,
            duration: recording.duration,
            dateCreated: recording.dateCreated,
            downloadUrls: {
                mp3: authenticatedDownloadUrl,
                wav: authenticatedDownloadUrl.replace('.mp3', '.wav')
            }
        };

    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

// Get call SID from command line argument or replace with your SID
const callSid = process.argv[2] || 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

if (callSid === 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
    console.error('Please provide a call SID as an argument');
    console.log('Usage: node get-download-link.js CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    process.exit(1);
}

getDownloadLink(callSid);