const express = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public')); // Serve frontend static files

// Initialize Google TTS client (uses credentials from env)
// We'll also support passing credentials directly from an env var string
// for easier deployment on DigitalOcean App Platform.
const clientOptions = {};
if (process.env.GOOGLE_RESOURCES_CONFIG) {
    // Option for passing JSON config as string
    try {
        const config = JSON.parse(process.env.GOOGLE_RESOURCES_CONFIG);
        clientOptions.credentials = config;
        clientOptions.projectId = config.project_id;
    } catch (err) {
        console.warn('Warning: GOOGLE_RESOURCES_CONFIG is not a valid JSON string.');
    }
}
// Default falls back to standard GOOGLE_APPLICATION_CREDENTIALS path logic

const client = new textToSpeech.TextToSpeechClient(clientOptions);

// Voice list (add more as needed)
const VOICES = [
    { name: 'en-US-Wavenet-D', language: 'en-US', description: 'English (US) - Male' },
    { name: 'en-US-Wavenet-F', language: 'en-US', description: 'English (US) - Female' },
    { name: 'en-GB-Wavenet-A', language: 'en-GB', description: 'English (UK) - Female' },
    { name: 'es-ES-Wavenet-C', language: 'es-ES', description: 'Spanish (Spain) - Female' },
    { name: 'fr-FR-Wavenet-C', language: 'fr-FR', description: 'French - Female' },
    { name: 'de-DE-Wavenet-B', language: 'de-DE', description: 'German - Male' },
];

app.get('/api/voices', (req, res) => res.json(VOICES));

app.post('/api/synthesize', async (req, res) => {
    const { text, voiceName = 'en-US-Wavenet-D', speed = 1.0 } = req.body;
    console.log(`TTS Request: voice=${voiceName}, speed=${speed}, textLength=${text?.length}`);

    if (!text) return res.status(400).json({ error: 'Text required' });

    // Function to chunk text into parts under 5000 bytes (roughly 4500 chars to be safe)
    const MAX_CHUNK_LENGTH = 4500;
    const chunks = [];
    for (let i = 0; i < text.length; i += MAX_CHUNK_LENGTH) {
        chunks.push(text.substring(i, i + MAX_CHUNK_LENGTH));
    }

    console.log(`Processing text in ${chunks.length} chunk(s)...`);

    try {
        const audioBuffers = [];
        for (let i = 0; i < chunks.length; i++) {
            console.log(`Synthesizing chunk ${i + 1}/${chunks.length}...`);
            const request = {
                input: { text: chunks[i] },
                voice: { languageCode: voiceName.split('-').slice(0, 2).join('-'), name: voiceName },
                audioConfig: { audioEncoding: 'MP3', speakingRate: speed },
            };
            const [response] = await client.synthesizeSpeech(request);
            audioBuffers.push(response.audioContent);
        }

        console.log('All chunks synthesized. Combining audio...');
        const combinedBuffer = Buffer.concat(audioBuffers);

        console.log('TTS Response ready.');
        res.set('Content-Type', 'audio/mpeg');
        res.send(combinedBuffer);
    } catch (err) {
        console.error('TTS Error:', err);
        res.status(500).json({ error: 'TTS failed: ' + (err.message || 'unknown error') });
    }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file' });

        let text = '';
        if (file.mimetype === 'application/pdf') {
            const data = await pdfParse(file.buffer);
            text = data.text;
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            text = result.value;
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }
        res.json({ text });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Root path redirects to public/index.html (handled by static middleware)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
