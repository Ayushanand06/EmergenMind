require('dotenv').config(); require('dotenv').config(); 

import OpenAI from "openai";import OpenAI from "openai";

const client = new OpenAI({const client = new OpenAI({

    apiKey: process.env.apiKey,    apiKey: process.env.apiKey,

    baseURL: "https://api.groq.com/openai/v1",    baseURL: "https://api.groq.com/openai/v1",

});});



const response = await client.responses.create({const response = await client.responses.create({

    model: "openai/gpt-oss-20b",    model: "openai/gpt-oss-20b",

    input: "Explain the importance of fast language models",    input: "Explain the importance of fast language models",

});});

console.log(response.output_text);console.log(response.output_text);
