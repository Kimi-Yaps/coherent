import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { useChatQuota } from '../context/useChatQuota';
import {
  callGeminiCompanion,
  getGeminiModel,
  setGeminiModel,
  AVAILABLE_GEMINI_MODELS,
} from '../services/geminiService';
import './AISupport.css';

interface Message {
  id: number;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

interface AIChatSession {
  id: string;
  title: string;
  preview: string;
  date: string;
  messages: Message[];
}

const STORAGE_SESSIONS_KEY = 'coherent_ai_chat_sessions';

const createFreshSession = (): AIChatSession => ({
  id: `chat_${Date.now()}`,
  title: 'New Conversation',
  preview: 'Start a conversation...',
  date: 'Today',
  messages: [],
});

const loadInitialSessions = (): AIChatSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return [createFreshSession()];
};

const AISupport = () => {
  const navigate = useNavigate();
  const {
    dailyLimit,
    messagesRemaining,
    tokensUsedToday,
    modelLimitInfo,
    isQuotaExceeded,
    consumeMessage,
    recordTokens,
    resetQuota,
  } = useChatQuota();
  
  const [currentModel, setCurrentModel] = useState<string>(() => getGeminiModel());
  const [sessions, setSessions] = useState<AIChatSession[]>(loadInitialSessions);
  const [activeChatId, setActiveChatId] = useState<string>(() => sessions[0]?.id || `chat_${Date.now()}`);
  const [inputValue, setInputValue] = useState('');
  const [isMobileViewingChat, setIsMobileViewingChat] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseSpeechRef = useRef<string>('');

  const handleModelChange = (modelId: string) => {
    setCurrentModel(modelId);
    setGeminiModel(modelId);
    window.dispatchEvent(new Event('storage'));
  };

  // Close model menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSpeech = () => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      inputRef.current?.focus();
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      baseSpeechRef.current = inputValue ? inputValue.trim() : '';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const spoken = (finalTranscript || interimTranscript).trim();
        if (spoken) {
          const prefix = baseSpeechRef.current ? `${baseSpeechRef.current} ` : '';
          setInputValue(prefix + spoken);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone permissions in your browser.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
    } catch {
      // Ignore storage error
    }
  }, [sessions]);

  // Auto-scroll when messages or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, isTyping]);

  // Focus input when changing chats or after reply
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    if (!isQuotaExceeded) {
      inputRef.current?.focus();
    }
  }, [activeChatId]);

  useEffect(() => {
    if (!isTyping && !isQuotaExceeded) {
      inputRef.current?.focus();
    }
  }, [isTyping, isQuotaExceeded]);

  useEffect(() => {
    const handlePopState = () => {
      setIsMobileViewingChat(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleBack = () => {
    if (isMobileViewingChat) {
      setIsMobileViewingChat(false);
      if (window.history.state?.mobileChat) {
        window.history.back();
      }
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const activeSession = sessions.find((s) => s.id === activeChatId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setIsMobileViewingChat(true);
    window.history.pushState({ mobileChat: true }, '');
  };

  const handleCreateNewChat = () => {
    const newSession = createFreshSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveChatId(newSession.id);
    setIsMobileViewingChat(true);
    window.history.pushState({ mobileChat: true }, '');
  };

  const handleDeleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const fresh = createFreshSession();
      setSessions([fresh]);
      setActiveChatId(fresh.id);
    } else {
      setSessions(remaining);
      if (activeChatId === id) {
        setActiveChatId(remaining[0].id);
      }
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText ?? inputValue).trim();
    if (!textToSend || !activeSession || isTyping) return;

    // Check & consume quota
    if (!consumeMessage()) {
      return;
    }

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: currentTime,
    };

    const updatedMessages = [...messages, userMsg];

    // If first message in conversation, auto-title from prompt
    const sessionTitle =
      activeSession.title === 'New Conversation'
        ? textToSend.slice(0, 26) + (textToSend.length > 26 ? '...' : '')
        : activeSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeChatId
          ? {
              ...s,
              title: sessionTitle,
              preview: textToSend,
              date: 'Just now',
              messages: updatedMessages,
            }
          : s
      )
    );
    if (!customText) {
      setInputValue('');
    }
    setIsTyping(true);

    try {
      const response = await callGeminiCompanion(
        updatedMessages.map((m) => ({ sender: m.sender, text: m.text })),
        textToSend
      );

      if (response.tokensUsed) {
        recordTokens(response.tokensUsed);
      }

      const replyMsg: Message = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: response.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeChatId
            ? { ...s, preview: replyMsg.text, messages: [...s.messages, replyMsg] }
            : s
        )
      );
    } catch (err) {
      console.error('Companion error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const sidebarContent = (
    <div className="bookings-sidebar ai-bookings-sidebar">
      <button
        type="button"
        className="claude-new-chat-btn"
        onClick={handleCreateNewChat}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>New Chat</span>
      </button>

      <div className="claude-sidebar-section-title" style={{ fontSize: '0.74rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.4rem 0.65rem 0.2rem' }}>
        Conversations
      </div>

      <div className="ai-chat-nav-scroll">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`sidebar-nav-btn ai-nav-chat-btn ${activeChatId === session.id ? 'active' : ''}`}
            onClick={() => handleSelectChat(session.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSelectChat(session.id);
            }}
          >
            <span className="sidebar-nav-bullet" />
            <span className="sidebar-nav-chat-title">{session.title}</span>
            <button
              type="button"
              className="sidebar-nav-chat-delete"
              onClick={(e) => handleDeleteChat(e, session.id)}
              title="Delete chat"
              aria-label="Delete chat"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="ai-sidebar-quota-box" onClick={resetQuota} title="Click to refresh quota" role="button" tabIndex={0}>
        <div className="sidebar-quota-header">
          <span className="sidebar-quota-label">Daily Limits</span>
          <span className="sidebar-quota-val">{modelLimitInfo.rpm} RPM</span>
        </div>
        <div className="sidebar-quota-stats">
          <div className="sidebar-stat-row">
            <span>Requests</span>
            <strong>{messagesRemaining.toLocaleString()} / {dailyLimit.toLocaleString()} RPD</strong>
          </div>
          <div className="sidebar-stat-row">
            <span>Live Tokens</span>
            <strong>{tokensUsedToday.toLocaleString()} ({modelLimitInfo.tpm} TPM)</strong>
          </div>
        </div>
        <div className="sidebar-quota-bar">
          <div
            className={`sidebar-quota-fill ${messagesRemaining <= 10 ? 'low' : ''}`}
            style={{ width: `${Math.min(100, Math.max(0, (messagesRemaining / dailyLimit) * 100))}%` }}
          />
        </div>
      </div>
    </div>
  );

  const activeModelMeta =
    AVAILABLE_GEMINI_MODELS.find((m) => m.id === currentModel) || AVAILABLE_GEMINI_MODELS[0];
  const modelParts = activeModelMeta.name.split(' ');
  const modelPrimary = modelParts.slice(0, 2).join(' ');
  const modelVariant = modelParts.slice(2).join(' ') || 'Standard';

  return (
    <SidebarLayout
      sidebarContent={sidebarContent}
      className="ai-support-layout"
      isMobileViewingChat={isMobileViewingChat}
    >
      <div className="ai-chat-container">
        {/* Top Header - clean and without duplicate quota */}
        <div className="ai-chat-header">
          <button
            className="mobile-back-btn"
            onClick={handleBack}
            aria-label="Go back"
            title="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div className="ai-header-info">
            <h3 className="ai-header-title">{activeSession?.title || 'AI Companion'}</h3>
          </div>
        </div>        {/* Chat Messages */}
        <div className="ai-chat-history">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h2 className="empty-state-headline">How can I support you today?</h2>
              <p>Type below or use your microphone to start a conversation.</p>
            </div>
          ) : (
            <div className="messages-flow">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-bubble-wrapper ${msg.sender}`}>
                  <div className={`message-bubble ${msg.sender}`}>
                    <p className="message-text">{msg.text}</p>
                    <span className="message-timestamp">{msg.time}</span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message-bubble-wrapper assistant">
                  <div className="message-bubble assistant typing-bubble">
                    <div className="typing-indicator-wrap">
                      <div className="typing-dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                      <span className="typing-label">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input - Clean Minimalist Pattern */}
        <div className="chat-input-container">
          {isQuotaExceeded && (
            <div className="quota-exceeded-notice">
              <div className="notice-text">
                <strong>Model limit reached ({dailyLimit.toLocaleString()} RPD)</strong>
                <p>Requests reset at midnight, or book a private session for 1-on-1 care.</p>
              </div>
              <button
                className="quota-action-btn"
                onClick={() => navigate('/bookings')}
                type="button"
              >
                Book Session
              </button>
            </div>
          )}

          <div className="claude-input-card">
            <input
              ref={inputRef}
              type="text"
              className="claude-text-input"
              placeholder={
                isListening
                  ? 'Listening... speak into your microphone'
                  : isQuotaExceeded
                  ? 'Daily request limit reached. Reset or wait until midnight.'
                  : isTyping
                  ? 'Care Companion is typing...'
                  : 'Write a message...'
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isQuotaExceeded || isTyping}
            />

            <div className="claude-right-actions">
              <button
                type="button"
                className={`claude-icon-btn ${isListening ? 'listening' : ''}`}
                onClick={handleToggleSpeech}
                title={isListening ? 'Listening... click to stop' : 'Microphone dictation'}
                aria-label={isListening ? 'Stop listening' : 'Start microphone'}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </button>

              {inputValue.trim() ? (
                <button
                  type="button"
                  className="claude-send-btn"
                  onClick={() => handleSend()}
                  aria-label="Send message"
                  disabled={isQuotaExceeded || isTyping}
                  title="Send message"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>

          {/* Footer row: Disclaimer on left, Model switcher on right */}
          <div className="claude-footer-row">
            <span className="claude-disclaimer">
              Coherent is AI and can make mistakes. Please double-check responses.
            </span>

            <div className="claude-model-selector-wrap" ref={modelMenuRef}>
              <button
                type="button"
                className="claude-model-btn"
                onClick={() => setIsModelMenuOpen((prev) => !prev)}
                title="Change AI model"
                aria-label="Change AI model"
              >
                <span className="model-primary">{modelPrimary}</span>
                <span className="model-variant">{modelVariant}</span>
              </button>

              {isModelMenuOpen && (
                <div className="claude-model-popover">
                  <div className="claude-popover-header">AI Model</div>
                  {AVAILABLE_GEMINI_MODELS.map((m) => {
                    const parts = m.name.split(' ');
                    const prim = parts.slice(0, 2).join(' ');
                    const vari = parts.slice(2).join(' ') || '';
                    return (
                      <div
                        key={m.id}
                        className={`claude-popover-item ${currentModel === m.id ? 'active' : ''}`}
                        onClick={() => {
                          handleModelChange(m.id);
                          setIsModelMenuOpen(false);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="popover-item-info">
                          <div className="popover-item-title">
                            <span className="popover-item-primary">{prim}</span>{' '}
                            <span className="popover-item-variant">{vari}</span>
                          </div>
                          <div className="popover-item-sub">
                            {m.rpm} RPM · {m.rpd.toLocaleString()} RPD
                          </div>
                        </div>
                        {currentModel === m.id && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2b563f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default AISupport;
