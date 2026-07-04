# Sterling Voice 🟢

Real-time voice chat with Sterling — your AI copilot. Built with Next.js, Pipecat, and WebRTC.

**Live at:** [sterling-voice.vercel.app](https://sterling-voice.vercel.app)

## Stack

- **Frontend:** Next.js 14 + TypeScript (Vercel-hosted PWA)
- **Voice Transport:** Pipecat + SmallWebRTC
- **STT:** Deepgram Nova-2
- **TTS:** ElevenLabs (Daniel voice)
- **LLM:** DeepSeek V4 Flash via Atlas Cloud
- **Backend:** Python Pipecat bot on DigitalOcean droplet, bridged via ngrok

## Architecture

```
Phone → vercel.app (Next.js PWA) → ngrok HTTPS → DO droplet:8765 (Pipecat bot)
```

The PWA handles the WebRTC connection. Audio never hits a server — it's peer-to-peer once signaling completes.

## Development

```bash
npm install
npm run dev     # local dev server
npm run build   # production build
```

Set `NEXT_PUBLIC_BOT_START_URL` to your Pipecat backend endpoint.

## Deployment

Connected to Vercel via GitHub — pushes to `main` auto-deploy.