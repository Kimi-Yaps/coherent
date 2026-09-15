import { useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import mascotImg from '../assets/MascotDog.png';
import './AISupport.css';

interface Message {
  id: number;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

const AISupport = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeChat, setActiveChat] = useState<'chat1' | 'chat2'>('chat1');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputValue.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');

    // Empathetic AI response
    setTimeout(() => {
      const reply: Message = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: "I'm listening. Take your time, whenever you feel ready to share more, I'm right here with you.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, reply]);
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
      <button 
        className="btn-dark full-width new-chat-btn"
        onClick={() => {
          setMessages([]);
        }}
      >
        + New Chat
      </button>
      <div className="chat-list">
        <button 
          className={`sidebar-btn ${activeChat === 'chat1' ? 'active' : ''}`}
          onClick={() => setActiveChat('chat1')}
        >
          Chat 1
        </button>
        <button 
          className={`sidebar-btn ${activeChat === 'chat2' ? 'active' : ''}`}
          onClick={() => setActiveChat('chat2')}
        >
          Chat 2
        </button>
      </div>
    </div>
  );

  return (
    <SidebarLayout sidebarContent={sidebarContent}>
      <div className="ai-chat-container">
        <div className="ai-chat-history">
          {messages.length === 0 ? (
            <div className="empty-state">
              <img src={mascotImg} alt="Mascot" className="mascot-img" />
              <p>Select a chat or start a new one.</p>
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
