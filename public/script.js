document.addEventListener('DOMContentLoaded', () => {
    const voiceSelect = document.getElementById('voiceSelect');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    const textInput = document.getElementById('textInput');
    const speakBtn = document.getElementById('speakBtn');
    const stopBtn = document.getElementById('stopBtn');
    const fileInput = document.getElementById('fileInput');
    const audioPlayer = document.getElementById('audioPlayer');
    const playerContainer = document.getElementById('playerContainer');
    const loader = document.getElementById('loader');
    const uploadZone = document.getElementById('uploadZone');
    const fileNameDisplay = document.getElementById('fileName');

    let currentAudioUrl = null;

    // Load voices
    async function loadVoices() {
        try {
            const res = await fetch('/api/voices');
            const voices = await res.json();
            voiceSelect.innerHTML = voices.map(v =>
                `<option value="${v.name}">${v.description} (${v.language})</option>`
            ).join('');
        } catch (err) {
            console.error('Failed to load voices', err);
            voiceSelect.innerHTML = '<option value="">Error loading voices</option>';
        }
    }
    loadVoices();

    // Speed update display
    speedInput.addEventListener('input', () => {
        speedValue.textContent = `${speedInput.value}x`;
    });

    // Speak action
    speakBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (!text) return alert('Please enter some text or upload a document.');

        const voiceName = voiceSelect.value;
        const speed = parseFloat(speedInput.value);

        // Show loader
        loader.classList.remove('hidden');

        try {
            const res = await fetch('/api/synthesize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voiceName, speed })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'TTS Synthesis failed');
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);

            // Clean up previous URL
            if (currentAudioUrl) {
                URL.revokeObjectURL(currentAudioUrl);
            }
            currentAudioUrl = url;

            audioPlayer.src = url;
            playerContainer.classList.remove('hidden');
            audioPlayer.play();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            loader.classList.add('hidden');
        }
    });

    // Stop action
    stopBtn.addEventListener('click', () => {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    });

    // File selection action
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        await handleFileUpload(file);
    });

    // Drag and Drop support
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragging');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragging');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragging');
        const file = e.dataTransfer.files[0];
        if (file && (file.type === 'application/pdf' || file.name.endsWith('.docx'))) {
            handleFileUpload(file);
        } else {
            alert('Unsupported file type. Please upload a PDF or DOCX.');
        }
    });

    async function handleFileUpload(file) {
        fileNameDisplay.textContent = `Processing: ${file.name}`;
        loader.classList.remove('hidden');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('File upload/processing failed');

            const data = await res.json();
            if (data.text) {
                textInput.value = data.text;
                fileNameDisplay.textContent = `Successfully loaded: ${file.name}`;
            } else {
                alert('No text could be extracted from this file.');
                fileNameDisplay.textContent = '';
            }
        } catch (err) {
            alert('Upload failed: ' + err.message);
            fileNameDisplay.textContent = '';
        } finally {
            loader.classList.add('hidden');
        }
    }
});
