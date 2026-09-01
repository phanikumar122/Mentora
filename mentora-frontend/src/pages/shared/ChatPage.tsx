import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Send, RefreshCw, MessageSquare, AlertCircle } from 'lucide-react';
import { ChatMessage, User } from '../../types';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [activeContact, setActiveContact] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch users directory
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/users');
      const otherUsers = (res.data || []).filter((u: User) => u.id !== user?.id && u.email !== user?.email);
      setUsersList(otherUsers);
      if (otherUsers.length > 0 && !activeContact) {
        setActiveContact(otherUsers[0]);
      }
    } catch (err) {
      console.error('Failed to fetch chat directory:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch direct messages with active contact
  const fetchMessages = async (contactId: string) => {
    if (!user?.id || !contactId) return;
    try {
      const res = await api.get(`/chat/messages/${user.id}/${contactId}`);
      const formatted = (res.data || []).map((item: any) => ({
        id: item.id,
        senderId: String(item.senderId),
        senderName: item.senderName,
        recipientId: String(item.recipientId),
        content: item.content,
        sentAt: item.sentAt ? new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      }));
      setMessages(formatted);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Poll messages every 2 seconds for live real-time sync across accounts
  useEffect(() => {
    if (activeContact?.id) {
      fetchMessages(activeContact.id);
      const interval = setInterval(() => {
        fetchMessages(activeContact.id);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeContact]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeContact || !user?.id) return;

    const messageText = inputMessage;
    setInputMessage('');
    setSending(true);

    try {
      await api.post('/chat/messages', {
        senderId: user.id,
        recipientId: activeContact.id,
        content: messageText,
      });
      await fetchMessages(activeContact.id);
    } catch (err: any) {
      console.warn('Message post warning:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] academic-card rounded-2xl overflow-hidden flex flex-col md:flex-row">
      {/* Directory Contacts Sidebar */}
      <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">Directory Messaging</h3>
          <button onClick={fetchUsers} className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Refresh Directory">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {loadingUsers ? (
          <div className="p-4 text-center text-xs text-slate-400">Loading Directory...</div>
        ) : usersList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
            <p>No other registered users found.</p>
            <p className="text-[11px] text-slate-400">Open another browser window (or Incognito), register a 2nd user account, and start chatting!</p>
          </div>
        ) : (
          <div className="space-y-1.5 flex-1 overflow-y-auto">
            {usersList.map((contact) => (
              <button
                key={contact.id}
                onClick={() => { setActiveContact(contact); fetchMessages(contact.id); }}
                className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all ${
                  activeContact?.id === contact.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                    activeContact?.id === contact.id ? 'bg-white/20 text-white' : 'bg-brand-500/10 text-brand-500'
                  }`}>
                    {contact.firstName[0]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs leading-none">{contact.firstName} {contact.lastName}</h4>
                    <p className={`text-[11px] mt-1 ${activeContact?.id === contact.id ? 'text-brand-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {contact.role.replace('ROLE_', '')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Real-Time Chat Stream */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {activeContact ? (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xs">
                  {activeContact.firstName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none">{activeContact.firstName} {activeContact.lastName}</h3>
                  <span className="text-[11px] text-emerald-500 font-medium">● Connected ({activeContact.role.replace('ROLE_', '')})</span>
                </div>
              </div>
              <button onClick={() => fetchMessages(activeContact.id)} className="p-1.5 text-slate-400 hover:text-white" title="Sync Messages">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
                  <p>No chat history with {activeContact.firstName} yet.</p>
                  <p className="text-[11px] text-slate-500">Type a message below to start your conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id || msg.senderId === user?.email;
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs md:max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                          isMe
                            ? 'bg-brand-600 text-white rounded-br-none shadow-md shadow-brand-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <span className={`text-[10px] block text-right ${isMe ? 'text-brand-200' : 'text-slate-400'}`}>
                          {msg.sentAt}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Message ${activeContact.firstName}...`}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={sending}
                className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/25 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-400">
            Select a contact from the directory sidebar to start messaging.
          </div>
        )}
      </div>
    </div>
  );
};
