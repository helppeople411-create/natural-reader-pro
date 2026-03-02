# Natural Reader Pro | AI-Powered TTS

A premium AI-powered Text-to-Speech (TTS) application built with Node.js, Express, and Google Cloud's advanced TTS models. Upload PDFs or Word documents and experience natural-sounding voices with customizable playback speeds.

## Features
- **Modern UI**: Full-screen dark mode interface with glassmorphism and smooth animations.
- **Document Processing**: Direct PDF and DOCX file extraction support.
- **Natural Voices**: Support for Google Wavenet's most advanced TTS models.
- **Adjustable Playback**: Speed range from 0.5x to 3.0x.
- **Responsive Design**: Flawless experience on both desktop and mobile devices.

## Local Development

### Prerequisites
1.  **Node.js**: Ensure you have Node.js (v16.x or newer) installed.
2.  **Google Cloud Platform Project**:
    - Enable the **Text-to-Speech API**.
    - Create a **Service Account** and download its JSON key file.

### Setup
1.  Clone this repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    - Rename `.env.example` to `.env`.
    - Provide the path to your Google Service Account JSON file in `GOOGLE_APPLICATION_CREDENTIALS`.
4.  Run the application:
    ```bash
    npm start
    ```
5.  Access the app at `http://localhost:3000`.

## Deployment (DigitalOcean App Platform)

1.  **Push to GitHub**: Create a new repository and push this code.
2.  **DigitalOcean App Platform**:
    - Select your GitHub repository.
    - Choose the **Node.js** component.
    - Set the **HTTP Port** to `3000`.
3.  **Environment Variables**:
    - Add an environment variable named `GOOGLE_RESOURCES_CONFIG`.
    - Set its value to the **entire content of your service account JSON file** as a single-line string.
    - The `server.js` code is designed to automatically detect and parse this JSON string.

## Technical Stack
- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JS, Modern CSS (Inter/Outfit fonts, Glassmorphism)
- **AI Models**: Google Cloud Text-to-Speech (Wavenet)
- **File Parsing**: `pdf-parse`, `mammoth` (for DOCX)
