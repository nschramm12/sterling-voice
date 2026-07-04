import { PipecatClient, RTVIEvent } from '@pipecat-ai/client-js';
import { SmallWebRTCTransport } from '@pipecat-ai/small-webrtc-transport';

export type Message = {
  id: string;
  role: 'user' | 'sterling';
  text: string;
};

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export type Callbacks = {
  onStateChange: (state: ConnectionState) => void;
  onMessage: (msg: Message) => void;
  onError: (error: string) => void;
};

const BOT_START_URL = process.env.NEXT_PUBLIC_BOT_START_URL ||
  'https://frivolous-skyline-unbiased.ngrok-free.dev/start';

let msgCounter = 0;

export class VoiceClient {
  private client: PipecatClient | null = null;
  private callbacks: Callbacks;
  private state: ConnectionState = 'idle';

  constructor(callbacks: Callbacks) {
    this.callbacks = callbacks;
  }

  private setState(s: ConnectionState) {
    this.state = s;
    this.callbacks.onStateChange(s);
  }

  private addMessage(role: 'user' | 'sterling', text: string) {
    this.callbacks.onMessage({
      id: `m-${++msgCounter}`,
      role,
      text,
    });
  }

  async connect() {
    if (this.state === 'connecting' || this.state === 'connected') return;

    try {
      this.setState('connecting');
      const transport = new SmallWebRTCTransport();
      this.client = new PipecatClient({
        transport,
        enableMic: true,
        enableCam: false,
        callbacks: {
          onConnected: () => this.setState('connected'),
          onDisconnected: () => {
            this.setState('disconnected');
            this.client = null;
          },
          onBotReady: () => this.addMessage('sterling', "Hey Nate, I'm here. What's up?"),
          onUserTranscript: (data: any) => {
            if (data?.final && data?.text?.trim()) {
              this.addMessage('user', data.text);
            }
          },
          onBotTranscript: (data: any) => {
            if (data?.text?.trim()) {
              this.addMessage('sterling', data.text);
            }
          },
          onError: (msg: any) => {
            this.callbacks.onError(typeof msg === 'string' ? msg : msg?.message || 'Connection error');
            this.setState('error');
          },
        },
      });

      this.client.on(RTVIEvent.TrackStarted, (track: MediaStreamTrack, participant: any) => {
        if (!participant?.local && track.kind === 'audio') {
          const el = document.createElement('audio');
          el.autoplay = true;
          el.srcObject = new MediaStream([track]);
          document.body.appendChild(el);
        }
      });

      await this.client.startBotAndConnect({
        endpoint: BOT_START_URL,
        requestData: {
          createDailyRoom: false,
          enableDefaultIceServers: true,
          transport: 'webrtc',
        },
      });
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || 'Connection failed';
      this.callbacks.onError(msg);
      this.setState('error');
    }
  }

  async disconnect() {
    if (this.client) {
      try { await this.client.disconnect(); } catch { /* ignore */ }
      this.client = null;
    }
    this.setState('idle');
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }
}