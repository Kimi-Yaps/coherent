import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import mascotImg from '../assets/MascotDog.png';
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

const initialSessions: AIChatSession[] = [
  {
    id: 'chat1',
    title: 'Daily Mindfulness & Stress',
    preview: "Take three deep breaths. You are doing fine.",
    date: 'Today',
    messages: [
      {
        id: 1,
        sender: 'assistant',
        text: "Hello! I'm your AI care companion. How are you feeling today?",
        time: '10:00 AM'
      },
      {
        id: 2,
        sender: 'user',
        text: "Feeling a bit overwhelmed with work deadlines.",
        time: '10:02 AM'
      },
      {
        id: 3,
        sender: 'assistant',
        text: "I hear you. Take a slow, deep breath. You don't have to carry everything all at once. What's one small step we can tackle together?",
        time: '10:03 AM'
      }
    ]
  },
  {
    id: 'chat2',
    title: 'Sleep & Relaxation Routine',
    preview: "2-minute gentle evening wind-down.",
    date: 'Yesterday',
    messages: [
      {
        id: 101,
        sender: 'assistant',
        text: "Welcome back! Would you like to practice a 2-minute breathing exercise before bedtime?",
        time: '09:30 PM'
      }
    ]
  }
];

const AISupport = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AIChatSession[]>(initialSessions);
  const [activeChatId, setActiveChatId] = useState<string>('chat1');
  const [inputValue, setInputValue] = useState('');
  const [isMobileViewingChat, setIsMobileViewingChat] = useState<boolean>(false);

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

  const activeSession = sessions.find(s => s.id === activeChatId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setIsMobileViewingChat(true);
    window.history.pushState({ mobileChat: true }, '');
  };

  const handleCreateNewChat = () => {
    const newId = `chat_${Date.now()}`;
    const newSession: AIChatSession = {
      id: newId,
      title: `Session ${sessions.length + 1}`,
      preview: 'Start a new conversation...',
      date: 'Just now',
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveChatId(newId);
    setIsMobileViewingChat(true);
    window.history.pushState({ mobileChat: true }, '');
  };

  const handleSend = () => {
    if (!inputValue.trim() || !activeSession) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputValue.trim(),
      time: currentTime
    };

    const updatedMessages = [...messages, userMsg];

    setSessions(prev =>
      prev.map(s =>
        s.id === activeChatId
          ? { ...s, preview: userMsg.text, date: 'Just now', messages: updatedMessages }
          : s
      )
    );
    setInputValue('');

    // Empathetic AI response
    setTimeout(() => {
      const replyMsg: Message = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: "I'm listening. Take your time, whenever you feel ready to share more, I'm right here with you.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSessions(prev =>
        prev.map(s =>
          s.id === activeChatId
            ? { ...s, preview: replyMsg.text, messages: [...s.messages, replyMsg] }
            : s
        )
      );
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const sidebarContent = (
    <div className="ai-sidebar">
      <div className="chat-list">
        {sessions.map((session) => (
          <button 
            key={session.id}
            className={`ai-session-item ${activeChatId === session.id ? 'active' : ''}`}
            onClick={() => handleSelectChat(session.id)}
          >
            <div className="ai-session-top">
              <span className="ai-session-title">{session.title}</span>
              <span className="ai-session-date">{session.date}</span>
            </div>
            <p className="ai-session-preview">{session.preview}</p>
          </button>
        ))}
      </div>

      {/* Floating Action Button at the bottom with gaps, overlaying on top of the chats element */}
      <button 
        className="ai-fab-add-btn"
        onClick={handleCreateNewChat}
        title="New Chat"
        aria-label="Create new chat"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );

  return (
    <SidebarLayout 
      sidebarContent={sidebarContent}
      isMobileViewingChat={isMobileViewingChat}
    >
      <div className="ai-chat-container">
        {/* Top Header Row with Back Button on Mobile */}
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
        </div>

        <div className="ai-chat-history">
          {messages.length === 0 ? (
            <div className="empty-state">
              <img src={mascotImg} alt="Mascot" className="mascot-img" />
              <p>Type below to start your conversation with AI Companion.</p>
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
            </div>
          )}
        </div>
        
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <input 
              type="text" 
              className="chat-input" 
              placeholder="What is in your mind?" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="send-btn" onClick={handleSend} aria-label="Send message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default AISupport;
