import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface Counselor {
  id: string;
  name: string;
  role: string;
  username: string;
  initials: string;
  avatarBg: string;
  specialty: string;
  bio: string;
  online: boolean;
}

const availableCounselors: Counselor[] = [
  {
    id: 'amelia',
    name: 'Dr. Amelia Chen',
    role: 'Clinical Psychologist',
    username: 'dr_amelia',
    initials: 'AC',
    avatarBg: '#3b6e58',
    specialty: 'Anxiety, Stress & Mindfulness',
    bio: '10+ years specializing in cognitive behavioral therapy and workplace stress management.',
    online: true
  },
  {
    id: 'iman',
    name: 'Iman Hakimi',
    role: 'Peer Counselor',
    username: 'ImanHakimi',
    initials: 'IH',
    avatarBg: '#4e6e48',
    specialty: 'Mindfulness & Active Listening',
    bio: 'Compassionate peer supporter ready to walk through life challenges together.',
    online: true
  },
  {
    id: 'sachin',
    name: 'Sachin Kumar',
    role: 'Youth & Academic Counselor',
    username: 'sachin_k',
    initials: 'SK',
    avatarBg: '#3e5c5a',
    specialty: 'Academic & Career Pressure',
    bio: 'Passionate about student wellness, resilience building, and stress relief.',
    online: true
  },
  {
    id: 'sarah',
    name: 'Sarah Jenkins',
    role: 'Licensed Therapist',
    username: 'sarah_j',
    initials: 'SJ',
    avatarBg: '#2c5364',
    specialty: 'Sleep, Trauma & Burnout',
    bio: 'Empathetic counselor focusing on gentle grounding techniques and burnout recovery.',
    online: true
  },
  {
    id: 'aqil',
    name: 'Aqil Mansor',
    role: 'Life & Wellness Coach',
    username: 'aqil_m',
    initials: 'AM',
    avatarBg: '#5a6243',
    specialty: 'Personal Growth & Daily Habits',
    bio: 'Dedicated to helping you cultivate emotional clarity and inner calm.',
    online: false
  },
  {
    id: 'marcus',
    name: 'Marcus Lee',
    role: 'Behavioral Therapist',
    username: 'marcus_l',
    initials: 'ML',
    avatarBg: '#4b5563',
    specialty: 'Emotional Resilience & CBT',
    bio: 'Evidence-based counseling to navigate life transitions with confidence.',
    online: true
  }
];

const initialContacts: PeerContact[] = [
  {
    id: 'iman',
    name: 'Iman Hakimi',
    username: 'ImanHakimi',
    initials: 'IH',
    avatarBg: '#4e6e48'
  },
  {
    id: 'sachin',
    name: 'Sachin Kumar',
    username: 'sachin_k',
    initials: 'SK',
    avatarBg: '#3e5c5a'
  },
  {
    id: 'aqil',
    name: 'Aqil Mansor',
    username: 'aqil_m',
    initials: 'AM',
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
  const navigate = useNavigate();
  const [contactsList, setContactsList] = useState<PeerContact[]>(initialContacts);
  const [selectedContactId, setSelectedContactId] = useState<string>('iman');
  const [messagesByContact, setMessagesByContact] = useState<Record<string, PeerMessage[]>>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isMobileViewingChat, setIsMobileViewingChat] = useState<boolean>(false);
  const [isCounselorModalOpen, setIsCounselorModalOpen] = useState<boolean>(false);
  const [counselorSearch, setCounselorSearch] = useState<string>('');

  useEffect(() => {
    const handlePopState = () => {
      setIsMobileViewingChat(false);
      setIsCounselorModalOpen(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleBack = () => {
    if (isCounselorModalOpen) {
      setIsCounselorModalOpen(false);
    } else if (isMobileViewingChat) {
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

  const currentContact = contactsList.find(c => c.id === selectedContactId) || contactsList[0];
  const currentMessages = messagesByContact[selectedContactId] || [];

  const handleSelectContact = (id: string) => {
    setSelectedContactId(id);
    setIsMobileViewingChat(true);
    window.history.pushState({ mobileChat: true }, '');
  };

  const handleSelectCounselorToChat = (counselor: Counselor) => {
    // Add to contacts list if not already present
    if (!contactsList.some(c => c.id === counselor.id)) {
      setContactsList(prev => [
        ...prev,
        {
          id: counselor.id,
          name: counselor.name,
          username: counselor.username,
          initials: counselor.initials,
          avatarBg: counselor.avatarBg
        }
      ]);
    }

    // Initialize welcoming greeting if empty
    if (!messagesByContact[counselor.id] || messagesByContact[counselor.id].length === 0) {
      setMessagesByContact(prev => ({
        ...prev,
        [counselor.id]: [
          {
            id: Date.now(),
            contactId: counselor.id,
            sender: 'peer',
            text: `Hello! I'm ${counselor.name}. I'm here to support you. Feel free to share what's on your mind.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }));
    }

    setSelectedContactId(counselor.id);
    setIsMobileViewingChat(true);
    window.history.pushState({ mobileChat: true }, '');
    setIsCounselorModalOpen(false);
    setCounselorSearch('');
  };

  const filteredCounselors = availableCounselors.filter(c => 
    c.name.toLowerCase().includes(counselorSearch.toLowerCase()) ||
    c.specialty.toLowerCase().includes(counselorSearch.toLowerCase()) ||
    c.role.toLowerCase().includes(counselorSearch.toLowerCase())
  );

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
      <div className="peer-contacts-list">
        {contactsList.map((contact) => {
          const isSelected = contact.id === selectedContactId;
          const contactMsgs = messagesByContact[contact.id] || [];
          const lastMsg = contactMsgs.length > 0 ? contactMsgs[contactMsgs.length - 1] : null;

          return (
            <button
              key={contact.id}
              className={`peer-contact-card ${isSelected ? 'active' : ''}`}
              onClick={() => handleSelectContact(contact.id)}
            >
              <div 
                className="peer-contact-avatar"
                style={{ backgroundColor: contact.avatarBg }}
              >
                {contact.initials}
                <span className="peer-online-badge" />
              </div>
              <div className="peer-contact-details">
                <div className="peer-contact-row">
                  <span className="peer-contact-name">{contact.name}</span>
                  {lastMsg && <span className="peer-last-time">{lastMsg.time}</span>}
                </div>
                <p className="peer-last-preview">
                  {lastMsg ? lastMsg.text : 'Start conversation...'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Floating / Sticky Action Button in sidebar (works on both mobile & desktop) */}
      <button 
        className="peer-fab-add-btn"
        onClick={() => setIsCounselorModalOpen(true)}
        title="Choose a counselor to chat"
        aria-label="Choose counselor"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );

  return (
    <>
      <SidebarLayout 
        sidebarContent={sidebarContent}
        isMobileViewingChat={isMobileViewingChat}
      >
        <div className="peer-chat-container">
          {/* Top Header Row for selected contact with Back Button on Mobile */}
          <div className="peer-chat-header">
            <button 
              className="chat-back-btn"
              onClick={handleBack}
              aria-label="Back to chat list"
              title="Back to all chats"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div 
              className="peer-avatar"
              style={{ backgroundColor: currentContact.avatarBg }}
            >
              {currentContact.initials}
            </div>
            <div className="peer-header-info">
              <h2 className="peer-name">{currentContact.name}</h2>
              <span className="peer-username">
                <span className="online-indicator" /> @{currentContact.username} · Online
              </span>
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

      {/* Choose Counselor Modal (Works on both Mobile and Desktop) */}
      {isCounselorModalOpen && (
        <div className="counselor-modal-backdrop" onClick={() => setIsCounselorModalOpen(false)}>
          <div className="counselor-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="counselor-modal-handle-bar" />
            <div className="counselor-modal-header">
              <div className="counselor-modal-header-text">
                <h3 className="counselor-modal-title">Choose your Counselor</h3>
                <p className="counselor-modal-subtitle">Connect with a certified counselor or peer supporter</p>
              </div>
              <button 
                className="counselor-modal-close-btn"
                onClick={() => setIsCounselorModalOpen(false)}
                aria-label="Close modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="counselor-search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search by name, role, or specialty..."
                value={counselorSearch}
                onChange={(e) => setCounselorSearch(e.target.value)}
                autoFocus
              />
              {counselorSearch && (
                <button 
                  className="counselor-search-clear"
                  onClick={() => setCounselorSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="counselor-list-container">
              {filteredCounselors.length === 0 ? (
                <div className="counselor-no-results">
                  <p>No counselors found matching "{counselorSearch}"</p>
                </div>
              ) : (
                filteredCounselors.map((counselor) => {
                  const isExisting = contactsList.some(c => c.id === counselor.id);
                  return (
                    <div 
                      key={counselor.id}
                      className="counselor-option-card"
                      onClick={() => handleSelectCounselorToChat(counselor)}
                    >
                      <div 
                        className="counselor-avatar"
                        style={{ backgroundColor: counselor.avatarBg }}
                      >
                        {counselor.initials}
                        {counselor.online && <span className="counselor-online-badge" />}
                      </div>
                      <div className="counselor-details">
                        <div className="counselor-details-top">
                          <span className="counselor-name">{counselor.name}</span>
                          <span className="counselor-role-tag">{counselor.role}</span>
                        </div>
                        <span className="counselor-specialty-text">{counselor.specialty}</span>
                        <p className="counselor-bio-text">{counselor.bio}</p>
                      </div>
                      <button 
                        className="counselor-select-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCounselorToChat(counselor);
                        }}
                      >
                        {isExisting ? 'Open' : 'Chat'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chats;
