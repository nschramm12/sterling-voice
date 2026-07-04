import { useEffect, useRef, useState, useCallback } from 'react';
import Head from 'next/head';
import { VoiceClient, type Message, type ConnectionState } from '../lib/voiceClient';

type View = 'idle' | 'conversation';

export default function Home() {
  const [view, setView] = useState<View>('idle');
  const [state, setState] = useState<ConnectionState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isSterlingSpeaking, setIsSterlingSpeaking] = useState(false);
  const clientRef = useRef<VoiceClient | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const onMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
    if (msg.role === 'sterling') {
      setIsSterlingSpeaking(true);
      setTimeout(() => setIsSterlingSpeaking(false), 2000);
    }
  }, []);

  const onStateChange = useCallback((newState: ConnectionState) => {
    setState(newState);
    if (newState === 'connected') setView('conversation');
    if (newState === 'error') setView('idle');
  }, []);

  const onError = useCallback((err: string) => {
    setError(err);
    setTimeout(() => setError(null), 5000);
  }, []);

  useEffect(() => {
    clientRef.current = new VoiceClient({ onStateChange, onMessage, onError });
    return () => { clientRef.current?.disconnect(); };
  }, [onStateChange, onMessage, onError]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // iOS Safari install prompt detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (isSafari && isIOS && !isStandalone && !dismissed) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  const handleToggle = async () => {
    const client = clientRef.current;
    if (!client) return;

    if (state === 'connected') {
      await client.disconnect();
      setView('idle');
      setMessages([]);
    } else if (state === 'idle' || state === 'error') {
      setError(null);
      setMessages([]);
      setIsSterlingSpeaking(false);
      await client.connect();
    }
  };

  const isLoading = state === 'connecting';
  const isConnected = state === 'connected';
  const isActive = isLoading || isConnected;
  const showError = state === 'error';

  return (
    <>
      <Head>
        <title>Sterling Voice</title>
        <meta name="description" content="Talk to Sterling — your AI copilot" />
        <meta property="og:title" content="Sterling Voice" />
        <meta property="og:description" content="Talk to Sterling — your AI copilot" />
        <meta property="og:image" content="/favicon.svg" />
      </Head>

      {/* Ambient background */}
      <div className="bg-ambient" />

      {/* Sterling brand */}
      <div className="brand">
        <span className="brand-dot">🟢</span>
        <h1 className="brand-name">Sterling</h1>
      </div>

      {/* Idle state: big button centered */}
      {view === 'idle' && (
        <div className="button-area" style={{ position: 'relative', zIndex: 1 }}>
          <button
            className={`mic-button ${isActive ? 'active' : ''} ${showError ? 'error' : ''}`}
            onClick={handleToggle}
            disabled={isLoading}
            aria-label={isConnected ? 'Disconnect' : 'Talk to Sterling'}
          >
            {/* Glow ring */}
            <div className="glow-ring" />

            {/* Pulse rings when connecting */}
            {isLoading && (
              <>
                <div className="pulse-ring" />
                <div className="pulse-ring" />
                <div className="pulse-ring" />
              </>
            )}

            {/* Mic SVG */}
            <svg className="mic-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
              <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <p className={`subtitle ${isConnected ? 'active' : ''}`}>
            {isLoading ? 'Connecting' : isConnected ? 'Tap to end' : 'Tap to talk'}
          </p>
        </div>
      )}

      {/* Conversation state */}
      {view === 'conversation' && (
        <div className="chat-area">
          {/* Header */}
          <div className="chat-header">
            <button
              className={`mic-button mini ${isConnected ? 'active' : ''}`}
              onClick={handleToggle}
              aria-label={isConnected ? 'End call' : 'Reconnect'}
            >
              <svg className="mic-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
                <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="chat-status">
              <span className={`status-dot ${isConnected ? 'live' : ''}`} />
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>

          {/* Messages or empty state */}
          {messages.length === 0 ? (
            <div className="empty-chat">
              <svg className="mic-icon-muted" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
                <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {isConnected ? (
                <span>Listening... tap the mic to end</span>
              ) : (
                <span>Disconnected — tap the mic to reconnect</span>
              )}
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="bubble">{msg.text}</div>
                </div>
              ))}

              {/* Live audio indicator when Sterling is speaking */}
              {isSterlingSpeaking && isConnected && (
                <div className="message sterling">
                  <div className="audio-indicator">
                    <div className="bar" />
                    <div className="bar" />
                    <div className="bar" />
                    <div className="bar" />
                    <div className="bar" />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="error-toast">
          {error}
        </div>
      )}

      {/* iOS install prompt */}
      {showInstallPrompt && (
        <div className="install-prompt">
          <span className="prompt-text">
            Install <strong>Sterling</strong> on your home screen for the best experience
          </span>
          <button className="close-btn" onClick={dismissInstallPrompt}>✕</button>
        </div>
      )}
    </>
  );
}