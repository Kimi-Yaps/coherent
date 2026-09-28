import { useEffect, useMemo, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../context/useAuth';
import {
  saveAiMessage,
  subscribeToAdminRequestedSessions,
  subscribeToAiSessionMessages,
  type DbAiMessage,
  type DbAiSession,
} from '../services/aiDbService';
import './AdminChat.css';

const AdminChat = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DbAiSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [messages, setMessages] = useState<DbAiMessage[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToAdminRequestedSessions((nextSessions) => {
    const ordered = [...nextSessions].sort((first, second) => {
      const firstTime = (first.updatedAt as { toMillis?: () => number } | undefined)?.toMillis?.() || 0;
      const secondTime = (second.updatedAt as { toMillis?: () => number } | undefined)?.toMillis?.() || 0;
      return secondTime - firstTime;
    });
    queueMicrotask(() => {
      setSessions(ordered);
      setActiveSessionId((current) =>
        ordered.some((session) => session.id === current) ? current : ordered[0]?.id || ''
      );
    });
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }
    return subscribeToAiSessionMessages(activeSessionId, setMessages);
  }, [activeSessionId]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId),
    [sessions, activeSessionId]
  );
  const displayedMessages = activeSessionId ? messages : [];

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = reply.trim();
    if (!text || !activeSession || sending) return;
    setSending(true);
    setError('');
    try {
      await saveAiMessage(activeSession.id, 'admin', text);
      setReply('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Reply could not be sent.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SidebarLayout sidebarContent={<AdminSidebar />} className="admin-chat-layout">
      <main className="admin-chat-page">
        <header className="admin-chat-heading">
          <div>
            <p>Admin</p>
            <h1>Patient Chats</h1>
          </div>
          <span>{sessions.length} conversation{sessions.length === 1 ? '' : 's'} requesting admin</span>
        </header>

        {!user && (
          <p className="admin-chat-notice" role="status">
            Shared messages require an authenticated admin account. The access-key demo does not connect to Firebase chats.
          </p>
        )}

        <div className="admin-chat-workspace">
          <aside className="admin-chat-list" aria-label="Patient conversations">
            {sessions.length === 0 ? (
              <p className="admin-chat-empty-list">No users have requested admin support.</p>
            ) : sessions.map((session) => (
              <button
                type="button"
                key={session.id}
                className={`admin-chat-session ${activeSessionId === session.id ? 'active' : ''}`}
                onClick={() => setActiveSessionId(session.id)}
              >
                <strong>{session.userName || session.userEmail || 'User'}</strong>
                <span>{session.title || 'Conversation'}</span>
                <small>{session.preview || 'No messages yet'}</small>
              </button>
            ))}
          </aside>

          <section className="admin-chat-thread" aria-label="Conversation messages">
            {activeSession ? (
              <>
                <header className="admin-chat-thread-heading">
                  <div>
                    <h2>{activeSession.userName || 'User'}</h2>
                    <p>{activeSession.userEmail || activeSession.title}</p>
                  </div>
                  <span>Live</span>
                </header>
                <div className="admin-chat-messages" aria-live="polite">
                  {displayedMessages.map((message) => (
                    <article key={message.id} className={`admin-chat-message ${message.sender}`}>
                      <strong>{message.sender === 'admin' ? 'Admin' : message.sender === 'assistant' ? 'AI companion' : activeSession.userName || 'User'}</strong>
                      <p>{message.text}</p>
                      {message.timeFormatted && <time>{message.timeFormatted}</time>}
                    </article>
                  ))}
                </div>
                {error && <p className="admin-chat-error" role="alert">{error}</p>}
                <form className="admin-chat-reply" onSubmit={handleSend}>
                  <input
                    aria-label="Reply to user"
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Write a reply..."
                    maxLength={4000}
                  />
                  <button type="submit" disabled={!reply.trim() || sending}>
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div className="admin-chat-empty-thread">
                <h2>Choose a conversation</h2>
                <p>User requests for admin support appear here.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </SidebarLayout>
  );
};

export default AdminChat;
