import { useEffect, useRef, useState, useCallback } from 'react';
import Head from 'next/head';
import { VoiceClient, type Message, type ConnectionState } from '../lib/voiceClient';

const styles = `
* { margin: 0; padding: 0; box-sizing: border-box; }

html {
  -webkit-tap-highlight-color: transparent;
  -webkit-text-size-adjust: 100%;
  height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'SF Pro Text', 'Segoe UI', sans-serif;
  background: #050505;
  color: #fafafa;
  min-height: 100dvh;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Ambient background ── */
.bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(ellipse 100% 60% at 50% 85%, rgba(34,197,94,0.06) 0%, transparent 70%),
    radial-gradient(ellipse 70% 40% at 50% 20%, rgba(34,197,94,0.03) 0%, transparent 60%),
    #050505;
}

/* ── Noise overlay ── */
.bg::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.015;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  pointer-events: none;
}

/* ── Container ── */
.page {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  min-height: 100svh;
  padding: env(safe-area-inset-top) 24px env(safe-area-inset-bottom);
}

/* ── Brand Orb ── */
.orb-wrap {
  position: fixed;
  top: calc(52px + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.orb {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #4ade80, #22c55e 40%, #16a34a 70%, #15803d);
  box-shadow:
    0 0 20px rgba(34,197,94,0.3),
    0 0 60px rgba(34,197,94,0.1),
    inset 0 -2px 4px rgba(0,0,0,0.2),
    inset 0 2px 4px rgba(255,255,255,0.15);
  animation: orb-float 4s ease-in-out infinite;
}

@keyframes orb-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, #fafafa 0%, #a1a1aa 80%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-sub {
  font-size: 11px;
  color: #52525b;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-weight: 500;
}

/* ── Button area ── */
.button-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.subtitle {
  font-size: 12px;
  color: #52525b;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  font-weight: 600;
  transition: color 0.3s;
}

.subtitle.active {
  color: #22c55e;
}

/* ── Big Mic Button ── */
.big-btn {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: radial-gradient(circle at 40% 35%, #4ade80, #22c55e 40%, #16a34a 70%, #15803d 100%);
  box-shadow:
    0 8px 32px rgba(34,197,94,0.25),
    0 2px 8px rgba(34,197,94,0.15),
    inset 0 1px 0 rgba(255,255,255,0.2),
    inset 0 -3px 6px rgba(0,0,0,0.15);
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  outline: none;
}

.big-btn:active:not(:disabled) {
  transform: scale(0.94);
}

.big-btn.active {
  box-shadow:
    0 0 40px rgba(34,197,94,0.3),
    0 0 80px rgba(34,197,94,0.15),
    0 8px 32px rgba(34,197,94,0.2),
    inset 0 2px 4px rgba(0,0,0,0.2);
  background: radial-gradient(circle at 40% 35%, #22c55e, #16a34a 40%, #15803d 70%, #14532d 100%);
}

.big-btn .mic-icon {
  width: 64px;
  height: 64px;
  position: relative;
  z-index: 1;
  color: #050505;
  transition: transform 0.3s;
}

.big-btn.active .mic-icon {
  transform: scale(0.9);
}

/* ── Outer glow ring ── */
.btn-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1.5px solid rgba(34,197,94,0.15);
  pointer-events: none;
  animation: ring-breathe 3s ease-in-out infinite;
}

@keyframes ring-breathe {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.04); }
}

/* ── Connecting pulse rings ── */
.pulse {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid rgba(34,197,94,0.4);
  opacity: 0;
  animation: pulse-out 1.5s ease-out infinite;
  pointer-events: none;
}

.pulse:nth-child(2) { animation-delay: 0.4s; }
.pulse:nth-child(3) { animation-delay: 0.8s; }

@keyframes pulse-out {
  0% { transform: scale(0.95); opacity: 0.5; }
  100% { transform: scale(1.3); opacity: 0; }
}

/* ── Chat area ── */
.chat-area {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  height: 100dvh;
  height: 100svh;
  padding-top: calc(120px + env(safe-area-inset-top));
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0 16px;
  flex-shrink: 0;
}

.mini-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 40% 35%, #4ade80, #22c55e 40%, #16a34a 70%, #15803d);
  box-shadow: 0 2px 12px rgba(34,197,94,0.2);
  transition: box-shadow 0.3s;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.mini-btn.active {
  box-shadow: 0 0 20px rgba(34,197,94,0.3), 0 0 40px rgba(34,197,94,0.15);
}

.mini-btn .mic-icon {
  width: 20px;
  height: 20px;
  color: #050505;
}

.chat-status {
  font-size: 11px;
  color: #a1a1aa;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #52525b;
  transition: background 0.3s, box-shadow 0.3s;
}

.status-dot.live {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34,197,94,0.5);
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ── Messages ── */
.messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

.messages::-webkit-scrollbar { width: 2px; }
.messages::-webkit-scrollbar-track { background: transparent; }
.messages::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }

.msg {
  display: flex;
  animation: msg-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes msg-in {
  from { opacity: 0; transform: translateY(6px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.msg.user { justify-content: flex-end; }
.msg.sterling { justify-content: flex-start; }

.bubble {
  max-width: 82%;
  padding: 10px 15px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.5;
  word-wrap: break-word;
}

.msg.user .bubble {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #050505;
  font-weight: 500;
  border-bottom-right-radius: 4px;
}

.msg.sterling .bubble {
  background: #141414;
  border: 1px solid #1f1f1f;
  color: #fafafa;
  border-bottom-left-radius: 4px;
}

/* ── Audio indicator ── */
.audio-indicator {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 10px 15px;
}

.audio-indicator .bar {
  width: 3px;
  height: 16px;
  background: #22c55e;
  border-radius: 2px;
  animation: wave 0.8s ease-in-out infinite;
}

.audio-indicator .bar:nth-child(2) { animation-delay: 0.1s; height: 24px; }
.audio-indicator .bar:nth-child(3) { animation-delay: 0.2s; height: 14px; }
.audio-indicator .bar:nth-child(4) { animation-delay: 0.3s; height: 22px; }
.audio-indicator .bar:nth-child(5) { animation-delay: 0.4s; height: 18px; }

@keyframes wave {
  0%, 100% { transform: scaleY(0.5); opacity: 0.4; }
  50% { transform: scaleY(1); opacity: 1; }
}

/* ── Empty chat ── */
.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #52525b;
  font-size: 13px;
}

.empty-chat .mic-icon { width: 36px; height: 36px; opacity: 0.15; }

/* ── Error toast ── */
.toast {
  position: fixed;
  bottom: calc(48px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.25);
  padding: 10px 20px;
  border-radius: 12px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  z-index: 10;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* ── Install prompt ── */
.install-banner {
  position: fixed;
  bottom: calc(32px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  background: #141414;
  border: 1px solid #1f1f1f;
  padding: 12px 20px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  animation: toast-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  max-width: calc(100% - 48px);
}

.install-banner .txt { font-size: 13px; color: #a1a1aa; line-height: 1.3; }
.install-banner .txt strong { color: #fafafa; font-weight: 600; }
.install-banner .close { background: none; border: none; color: #52525b; font-size: 18px; cursor: pointer; padding: 4px; line-height: 1; flex-shrink: 0; }

@media (min-width: 768px) {
  .big-btn { width: 200px; height: 200px; }
  .big-btn .mic-icon { width: 76px; height: 76px; }
  .mini-btn { width: 48px; height: 48px; }
  .mini-btn .mic-icon { width: 22px; height: 22px; }
  .brand-name { font-size: 24px; }
  .orb { width: 40px; height: 40px; }
  .orb-wrap { gap: 12px; top: calc(64px + env(safe-area-inset-top)); }
  .bubble { font-size: 16px; padding: 12px 18px; }
  .chat-area { max-width: 600px; padding-top: calc(140px + env(safe-area-inset-top)); }
  .subtitle { font-size: 13px; }
}

@media (min-height: 800px) {
  .big-btn { width: 180px; height: 180px; }
  .big-btn .mic-icon { width: 70px; height: 70px; }
}
`;

type View = 'idle' | 'conversation';

export default function Home() {
  const [view, setView] = useState<View>('idle');
  const [state, setState] = useState<ConnectionState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const clientRef = useRef<VoiceClient | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const onMsg = useCallback((msg: Message) => {
    setMessages(p => [...p, msg]);
    if (msg.role === 'sterling') {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2500);
    }
  }, []);

  const onState = useCallback((s: ConnectionState) => {
    setState(s);
    if (s === 'connected') setView('conversation');
    if (s === 'error') setView('idle');
  }, []);

  const onErr = useCallback((e: string) => {
    setError(e);
    setTimeout(() => setError(null), 5000);
  }, []);

  useEffect(() => {
    clientRef.current = new VoiceClient({ onStateChange: onState, onMessage: onMsg, onError: onErr });
    return () => { clientRef.current?.disconnect(); };
  }, [onState, onMsg, onErr]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = (navigator as any).standalone === true;
    const dismissed = localStorage.getItem('sv-install-dismissed');
    if (isSafari && isIOS && !standalone && !dismissed) {
      const t = setTimeout(() => setShowInstall(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  const dismissInstall = () => {
    setShowInstall(false);
    localStorage.setItem('sv-install-dismissed', 'true');
  };

  const toggle = async () => {
    const c = clientRef.current;
    if (!c) return;
    if (state === 'connected') {
      await c.disconnect();
      setView('idle');
      setMessages([]);
    } else if (state === 'idle' || state === 'error') {
      setError(null);
      setMessages([]);
      setIsSpeaking(false);
      await c.connect();
    }
  };

  const loading = state === 'connecting';
  const connected = state === 'connected';
  const active = loading || connected;

  return (
    <>
      <Head>
        <style>{styles}</style>
        <title>Sterling Voice</title>
        <meta name="description" content="Talk to Sterling — your AI copilot" />
        <meta property="og:title" content="Sterling Voice" />
        <meta property="og:description" content="Talk to Sterling — your AI copilot" />
        <meta property="og:image" content="/favicon.svg" />
      </Head>

      <div className="bg" />
      <div className="page">

        {/* Brand */}
        <div className="orb-wrap">
          <div className="orb" />
          <div className="brand-name">Sterling</div>
          <div className="brand-sub">AI Copilot</div>
        </div>

        {/* Idle */}
        {view === 'idle' && (
          <div className="button-area">
            <button
              className={`big-btn ${active ? 'active' : ''}`}
              onClick={toggle}
              disabled={loading}
              aria-label={connected ? 'Disconnect' : 'Talk to Sterling'}
            >
              <div className="btn-ring" />
              {loading && <><div className="pulse" /><div className="pulse" /><div className="pulse" /></>}
              <svg className="mic-icon" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
                <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <p className={`subtitle ${connected ? 'active' : ''}`}>
              {loading ? 'Connecting' : connected ? 'Tap to end' : 'Tap to talk'}
            </p>
          </div>
        )}

        {/* Conversation */}
        {view === 'conversation' && (
          <div className="chat-area">
            <div className="chat-header">
              <button
                className={`mini-btn ${connected ? 'active' : ''}`}
                onClick={toggle}
                aria-label={connected ? 'End call' : 'Reconnect'}
              >
                <svg className="mic-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
                  <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <span className="chat-status">
                <span className={`status-dot ${connected ? 'live' : ''}`} />
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>

            {messages.length === 0 ? (
              <div className="empty-chat">
                <svg className="mic-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
                  <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>{connected ? 'Listening...' : 'Disconnected'}</span>
              </div>
            ) : (
              <div className="messages">
                {messages.map(m => (
                  <div key={m.id} className={`msg ${m.role}`}>
                    <div className="bubble">{m.text}</div>
                  </div>
                ))}
                {isSpeaking && connected && (
                  <div className="msg sterling">
                    <div className="audio-indicator">
                      <div className="bar" /><div className="bar" /><div className="bar" /><div className="bar" /><div className="bar" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && <div className="toast">{error}</div>}

        {/* Install banner */}
        {showInstall && (
          <div className="install-banner">
            <span className="txt">Install <strong>Sterling</strong> on your home screen for the best experience</span>
            <button className="close" onClick={dismissInstall}>✕</button>
          </div>
        )}

      </div>
    </>
  );
}
