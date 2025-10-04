require('dotenv').config();
const express = require('express');
const OpenAI = require('openai').default;
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// Initialize OpenAI client for Groq
const client = new OpenAI({
    apiKey: process.env.apiKey,
    baseURL: "https://api.groq.com/openai/v1",
});

// Initialize Redis client
const redisClient = redis.createClient({
    host: 'localhost',
    port: 6379
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Connected to Redis');
});

// Connect to Redis (using IIFE to handle async)
(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Failed to connect to Redis:', error);
    }
})();

// Emergency analysis endpoint
app.post('/analyze-emergency', async (req, res) => {
    try {
        const { transcription, call_sid, recording_sid, duration, caller_phone } = req.body;

        if (!transcription || !transcription.trim()) {
            return res.status(400).json({ 
                error: 'Transcription is required',
                success: false 
            });
        }

        console.log('🚨 Analyzing emergency call...');
        console.log('Call SID:', call_sid);
        console.log('Transcription:', transcription);

        // Create detailed prompt for emergency analysis
        const emergencyPrompt = `
You are an advanced 911 emergency dispatcher AI. Analyze this emergency call transcription and extract critical information.

CALL TRANSCRIPTION: "${transcription}"

Extract the following information and respond with ONLY a valid JSON object (no other text):

{
    "emergency_type": "medical|fire|police|rescue|natural_disaster|traffic_accident|domestic_violence|robbery|assault|other",
    "severity_level": 1-5 (1=non-emergency, 2=low, 3=moderate, 4=high, 5=critical/life-threatening),
    "urgency": "immediate|high|medium|low|non-urgent",
    "location": {
        "address": "specific address or landmark mentioned",
        "area": "neighborhood/district/city",
        "coordinates": "if GPS mentioned",
        "accessibility": "easy|difficult|unknown"
    },
    "people_involved": {
        "victims": number,
        "suspects": number,
        "witnesses": number,
        "caller_relationship": "victim|witness|bystander|family|unknown"
    },
    "medical_info": {
        "injuries": ["list of injuries mentioned"],
        "consciousness": "conscious|unconscious|unknown",
        "breathing": "normal|difficulty|not_breathing|unknown",
        "age_group": "infant|child|adult|elderly|unknown"
    },
    "threat_level": {
        "ongoing_danger": true/false,
        "weapon_involved": true/false,
        "suspect_present": true/false,
        "safe_to_approach": true/false
    },
    "resources_needed": {
        "ambulance": true/false,
        "fire_truck": true/false,
        "police": true/false,
        "hazmat": true/false,
        "helicopter": true/false,
        "special_units": ["swat", "bomb_squad", "water_rescue", etc.]
    },
    "response_time": "immediate|5min|10min|15min|30min|non_urgent",
    "caller_state": "calm|panicked|injured|confused|angry|hysterical",
    "call_quality": "clear|muffled|noisy|breaking_up|good",
    "key_details": ["most important facts from the call"],
    "summary": "2-3 sentence summary of the emergency",
    "dispatch_notes": "critical information for first responders",
    "follow_up_needed": true/false,
    "callback_required": true/false
}

Be precise and only extract information clearly present in the transcription. Use "unknown" for unclear information.
`;

        // Get analysis from Groq
        const completion = await client.chat.completions.create({
            model: "openai/gpt-oss-20b", // Changed to a more reliable model
            messages: [
                {
                    role: "system",
                    content: "You are a professional 911 emergency dispatcher with 20 years of experience. Analyze emergency calls accurately and extract critical information for first responders."
                },
                {
                    role: "user",
                    content: emergencyPrompt
                }
            ],
            temperature: 0.1,
            max_tokens: 2000
        });

        let emergencyAnalysis;
        try {
            const llmResponse = completion.choices[0].message.content.trim();
            console.log('🤖 Raw LLM Response:', llmResponse);
            
            // Clean the response
            const cleanResponse = llmResponse
                .replace(/```json\n?|\n?```/g, '')
                .replace(/```\n?|\n?```/g, '')
                .trim();
            
            emergencyAnalysis = JSON.parse(cleanResponse);
            
        } catch (parseError) {
            console.error('❌ Error parsing LLM response:', parseError);
            
            // Fallback analysis
            emergencyAnalysis = {
                emergency_type: "other",
                severity_level: 3,
                urgency: "medium",
                location: {
                    address: "unknown",
                    area: "unknown",
                    coordinates: "unknown",
                    accessibility: "unknown"
                },
                people_involved: {
                    victims: 1,
                    suspects: 0,
                    witnesses: 0,
                    caller_relationship: "unknown"
                },
                medical_info: {
                    injuries: [],
                    consciousness: "unknown",
                    breathing: "unknown",
                    age_group: "unknown"
                },
                threat_level: {
                    ongoing_danger: false,
                    weapon_involved: false,
                    suspect_present: false,
                    safe_to_approach: true
                },
                resources_needed: {
                    ambulance: false,
                    fire_truck: false,
                    police: true,
                    hazmat: false,
                    helicopter: false,
                    special_units: []
                },
                response_time: "15min",
                caller_state: "unknown",
                call_quality: "good",
                key_details: [transcription.substring(0, 100)],
                summary: "Emergency call requiring analysis",
                dispatch_notes: "Manual review required",
                follow_up_needed: true,
                callback_required: true
            };
        }

        // Calculate priority score
        const priorityScore = calculatePriorityScore(emergencyAnalysis);

        // Create emergency record
        const emergencyId = uuidv4();
        const timestamp = new Date().toISOString();
        
        const emergencyRecord = {
            id: emergencyId,
            timestamp: timestamp,
            call_metadata: {
                call_sid: call_sid || 'unknown',
                recording_sid: recording_sid || 'unknown',
                duration: duration || 0,
                caller_phone: caller_phone || 'unknown'
            },
            raw_transcription: transcription,
            analysis: emergencyAnalysis,
            priority_score: priorityScore,
            status: 'pending',
            assigned_units: [],
            created_at: timestamp,
            updated_at: timestamp
        };

        // Store in Redis
        await storeInRedis(emergencyRecord);

        console.log('✅ Emergency analysis completed');
        console.log('🎯 Priority Score:', priorityScore);
        console.log('🚨 Emergency Type:', emergencyAnalysis.emergency_type);
        console.log('📍 Location:', emergencyAnalysis.location.address);

        res.json({
            success: true,
            emergency_id: emergencyId,
            priority_score: priorityScore,
            analysis: emergencyAnalysis,
            call_metadata: emergencyRecord.call_metadata,
            timestamp: timestamp
        });

    } catch (error) {
        console.error('❌ Error analyzing emergency:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze emergency call',
            message: error.message
        });
    }
});

// Function to calculate priority score
function calculatePriorityScore(analysis) {
    let score = 0;

    // Severity level (0-50 points)
    score += analysis.severity_level * 10;

    // Urgency (0-25 points)
    const urgencyScores = {
        'immediate': 25,
        'high': 20,
        'medium': 10,
        'low': 5,
        'non-urgent': 0
    };
    score += urgencyScores[analysis.urgency] || 0;

    // Emergency type (0-20 points)
    const typeScores = {
        'medical': 15,
        'fire': 18,
        'police': 10,
        'rescue': 20,
        'natural_disaster': 20,
        'traffic_accident': 12,
        'domestic_violence': 15,
        'robbery': 12,
        'assault': 15
    };
    score += typeScores[analysis.emergency_type] || 5;

    // Threat level modifiers
    if (analysis.threat_level.ongoing_danger) score += 10;
    if (analysis.threat_level.weapon_involved) score += 10;
    if (analysis.medical_info.consciousness === 'unconscious') score += 15;
    if (analysis.medical_info.breathing === 'not_breathing') score += 20;

    return Math.min(score, 100); // Cap at 100
}

// Function to store emergency record in Redis
async function storeInRedis(emergencyRecord) {
    try {
        const { id, priority_score, analysis } = emergencyRecord;

        // Store the complete emergency record
        await redisClient.hSet(`emergency:${id}`, {
            data: JSON.stringify(emergencyRecord)
        });

        // Add to priority-sorted set
        await redisClient.zAdd('emergencies_by_priority', {
            score: priority_score,
            value: id
        });

        // Add to severity-sorted set
        await redisClient.zAdd('emergencies_by_severity', {
            score: analysis.severity_level,
            value: id
        });

        // Add to location index
        if (analysis.location.area !== 'unknown') {
            await redisClient.sAdd(`location:${analysis.location.area.toLowerCase()}`, id);
        }

        // Add to type index
        await redisClient.sAdd(`type:${analysis.emergency_type}`, id);

        // Add to timestamp index (for recent calls)
        await redisClient.zAdd('emergencies_by_time', {
            score: Date.now(),
            value: id
        });

        console.log('✅ Emergency record stored in Redis');

    } catch (error) {
        console.error('❌ Error storing in Redis:', error);
        throw error;
    }
}

// Get high priority emergencies - FIXED METHOD NAMES
// Get high priority emergencies - FIXED METHOD NAMES
app.get('/emergencies/high-priority', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Get highest priority emergencies (FIXED: Use zRange with REV)
        const emergencyIds = await redisClient.zRange('emergencies_by_priority', 0, limit - 1, {
            REV: true
        });
        
        const emergencies = [];
        for (const id of emergencyIds) {
            const data = await redisClient.hGet(`emergency:${id}`, 'data');
            if (data) {
                emergencies.push(JSON.parse(data));
            }
        }

        res.json({
            success: true,
            count: emergencies.length,
            emergencies: emergencies
        });

    } catch (error) {
        console.error('❌ Error getting high priority emergencies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve emergencies',
            message: error.message
        });
    }
});

// Get emergencies by location - FIXED METHOD NAMES
app.get('/emergencies/location/:area', async (req, res) => {
    try {
        const area = req.params.area.toLowerCase();
        const emergencyIds = await redisClient.sMembers(`location:${area}`);
        
        const emergencies = [];
        for (const id of emergencyIds) {
            const data = await redisClient.hGet(`emergency:${id}`, 'data');
            if (data) {
                emergencies.push(JSON.parse(data));
            }
        }

        res.json({
            success: true,
            area: area,
            count: emergencies.length,
            emergencies: emergencies
        });

    } catch (error) {
        console.error('❌ Error getting emergencies by location:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve emergencies by location',
            message: error.message
        });
    }
});

// Get all emergencies (for testing)
app.get('/emergencies/all', async (req, res) => {
    try {
        const keys = await redisClient.keys('emergency:*');
        const emergencies = [];
        
        for (const key of keys) {
            const data = await redisClient.hGet(key, 'data');
            if (data) {
                emergencies.push(JSON.parse(data));
            }
        }

        // Sort by priority score (highest first)
        emergencies.sort((a, b) => b.priority_score - a.priority_score);

        res.json({
            success: true,
            count: emergencies.length,
            emergencies: emergencies
        });

    } catch (error) {
        console.error('❌ Error getting all emergencies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve all emergencies',
            message: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Emergency Analysis API',
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚨 Emergency Analysis API running on http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('  POST /analyze-emergency - Analyze emergency call');
    console.log('  GET  /emergencies/high-priority - Get high priority calls');
    console.log('  GET  /emergencies/location/:area - Get calls by location');
    console.log('  GET  /emergencies/all - Get all emergencies');
    console.log('  GET  /health - Health check');
});