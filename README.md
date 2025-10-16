# Voice Story App

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)]()
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-TBD-lightgrey.svg)]()

## Description

Voice Story App is a web application that allows parents and loved ones to create personalized bedtime stories for children, narrated in their own cloned voice. Using AI-powered voice cloning, users record a short voice sample and generate audio narrations of classic fairy tales, providing a magical and comforting experience — even when they can’t be there in person.

## Table of Contents

1. [Tech Stack](#tech-stack)  
2. [Getting Started Locally](#getting-started-locally)  
3. [Available Scripts](#available-scripts)  
4. [Project Scope](#project-scope)  
   - [In Scope](#in-scope)  
   - [Out of Scope](#out-of-scope)  
5. [Project Status](#project-status)  
6. [License](#license)  

## Tech Stack

- **Frontend**: Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/UI  
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Row-Level Security)  
- **AI Services**:  
  - Openrouter.ai (multi-model orchestration & spending caps)  
  - ElevenLabs API (voice cloning)  
- **CI/CD & Hosting**: GitHub Actions, Docker, DigitalOcean  

## Getting Started Locally

### Prerequisites

- [Node.js](https://nodejs.org/) **v22.14.0**  
- [nvm](https://github.com/nvm-sh/nvm) (optional, for managing Node versions)

### Installation

```bash
# Clone the repository
git clone https://github.com/ewazgorzelska/voice-story.git
cd voice-story

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the project root and add the following variables:

```bash
# Supabase
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# ElevenLabs
ELEVENLABS_API_KEY=<your-elevenlabs-api-key>

# Openrouter
OPENROUTER_API_KEY=<your-openrouter-api-key>
```

### Start the Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:3000` to view the app.

## Available Scripts

In the project directory, you can run:

- `npm run dev`  
  Starts the Astro development server with hot reloading.

- `npm run build`  
  Builds the production-ready static site.

- `npm run preview`  
  Serves the built site locally for testing.

- `npm run astro`  
  Runs the Astro CLI.

- `npm run lint`  
  Runs ESLint across the codebase.

- `npm run lint:fix`  
  Runs ESLint with `--fix`.

- `npm run format`  
  Formats code with Prettier.

## Project Scope

### In Scope

- User authentication (email/password registration and login)  
- Voice sample recording (30–60 s with random phrase verification)  
- Voice cloning via ElevenLabs (one clone per user)  
- Predefined library of 5–10 classic fairy tales (hardcoded backend)  
- Audio story generation with progress indicator  
- Personal “My Library” section for saved audio stories (play, pause, volume, background playback)  
- End-to-end encryption of user data  

### Out of Scope

- Social login (Google, Apple)  
- Multiple voice clones per account  
- User-provided text for story generation  
- Assigning different voices to characters  
- Native mobile applications  
- In-app user feedback mechanism  
- Advanced library features (search, filtering, categories)  
- Monetization (subscriptions, purchases)  

## Project Status

This project is in active development as an MVP. Core features are being built and tested.

## License

This project is licensed under the MIT License.