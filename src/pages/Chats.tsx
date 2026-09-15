import { useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import './Chats.css';

interface PeerContact {
  id: string;
  name: string;
  username: string;
  initials: string;
  avatarBg: string;
}

interface PeerMessage {
  id: number;
  contactId: string;
  sender: 'user' | 'peer';
  text: string;
  time: string;
}

const contacts: PeerContact[] = [
  {
    id: 'iman',
    name: 'Iman Hakimi',
    username: 'ImanHakimi',
    initials: 'IH',
    avatarBg: '#4e6e48'
  },
  {
    id: 'sachin',
    name: 'Sachin',
    username: 'sachin_k',
    initials: 'S',
    avatarBg: '#3e5c5a'
  },
  {
    id: 'aqil',
    name: 'Aqil',
    username: 'aqil_m',
    initials: 'A',
    avatarBg: '#5a6243'
  }
];

const initialMessages: Record<string, PeerMessage[]> = {
  iman: [
    {
      id: 1,
      contactId: 'iman',
      sender: 'peer',
      text: 'Hey there! How has your day been treating you so far?',
      time: '10:14'
    }
  ],
  sachin: [
    {
      id: 2,
      contactId: 'sachin',
      sender: 'peer',
      text: 'Hello! Feel free to talk about whatever is weighing on you.',
      time: '09:30'
    }
  ],
  aqil: []
};

const Chats = () => {
  const [selectedContactId, setSelectedContactId] = useState<string>('iman');
  const [messagesByContact, setMessagesByContact] = useState<Record<string, PeerMessage[]>>(initialMessages);
  const [inputText, setInputText] = useState('');

  const currentContact = contacts.find(c => c.id === selectedContactId) || contacts[0];
  const currentMessages = messagesByContact[selectedContactId] || [];

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg: PeerMessage = {
      id: Date.now(),
      contactId: selectedContactId,
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessagesByContact(prev => ({
      ...prev,
      [selectedContactId]: [...(prev[selectedContactId] || []), newMsg]
    }));

    const textToSend = inputText;
    setInputText('');

    // Peer reply simulation
    setTimeout(() => {
      const replyMsg: PeerMessage = {
        id: Date.now() + 1,
        contactId: selectedContactId,
        sender: 'peer',
        text: `Thank you for sharing that. Take a deep breath — I'm right here with you.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessagesByContact(prev => ({
        ...prev,
        [selectedContactId]: [...(prev[selectedContactId] || []), replyMsg]
      }));
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const sidebarContent = (
    <div className="peer-chats-sidebar">
      {contacts.map((contact) => {
        const isSelected = contact.id === selectedContactId;
        return (
          <button
            key={contact.id}
            className={`peer-contact-btn ${isSelected ? 'active' : ''}`}
            onClick={() => setSelectedContactId(contact.id)}
          >
            {contact.name}
          </button>
        );
      })}
    </div>
  );

  return (
    <SidebarLayout sidebarContent={sidebarContent}>
      <div className="peer-chat-container">
        {/* Top Header Row for selected contact */}
        <div className="peer-chat-header">
          <div 
            className="peer-avatar"
            style={{ backgroundColor: currentContact.avatarBg }}
          >
            {currentContact.initials}
          </div>
          <div className="peer-header-info">
            <h2 className="peer-name">{currentContact.name}</h2>
            <span className="peer-username">@{currentContact.username}</span>
          </div>
        </div>

        {/* Message Area */}
        <div className="peer-messages-area">
          {currentMessages.length === 0 ? (
            <div className="peer-empty-chat">
              <p>No messages yet. Send a message to start the conversation.</p>
            </div>
          ) : (
            <div className="peer-messages-list">
              {currentMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`peer-msg-row ${msg.sender === 'user' ? 'user' : 'peer'}`}
                >
                  <div className={`peer-msg-bubble ${msg.sender}`}>
                    <p className="peer-msg-text">{msg.text}</p>
                    <span className="peer-msg-time">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Input Area matching reference screenshot */}
        <div className="peer-input-bar">
          <div className="peer-input-inner">
            <input 
              type="text" 
              className="peer-text-input" 
              placeholder="Write your message" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              className="peer-send-btn" 
              onClick={handleSendMessage}
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Chats;
