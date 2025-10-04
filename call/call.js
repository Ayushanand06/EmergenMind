// Download the helper library from https://www.twilio.com/docs/node/install
require('dotenv').config(); // Load environment variables from .env file
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Check if credentials are loaded
if (!accountSid || !authToken) {
  console.error('Error: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in your .env file');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function createCall() {
  const call = await client.calls.create({
    from: "+12188456415",
    record: true,
    to: "+919123721048",
    
  });

  console.log(call.sid);
}

createCall();