import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Send, RefreshCw, MessageSquare, Zap, CheckCheck } from 'lucide-react';
import { ChatMessage, User } from '../../types';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';
const WS_BASE = API_BASE.replace('/api/v1', '');

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [activeContact, setActiveContact] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);

  const stompClientRef = useRef<Client | null>(null);
  const activeContactRef = useRef<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep activeContactRef synced
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  // Smooth scroll to bottom on message change
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length, scrollToBottom]);

  // Fast directory fetch using role-safe /directory endpoint
  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/users/directory');
      const list: User[] = res.data || [];

      setUsersList(list);
      if (list.length > 0) {
        if (!activeContactRef.current || !list.some((u) => u.id === activeContactRef.current?.id)) {
          setActiveContact(list[0]);
        }
      } else {
        setActiveContact(null);
      }
    } catch (err) {
      console.error('Failed to fetch chat directory:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch messages history for selected contact
  const fetchMessages = useCallback(async (contactId: string) => {
    if (!user?.id || !contactId) return;
    try {
      setLoadingMessages(true);
      const res = await api.get(`/chat/messages/${user.id}/${contactId}`);
      const formatted = (res.data || []).map((item: any) => ({
        id: item.id,
        senderId: String(item.senderId),
        senderName: item.senderName,
        recipientId: String(item.recipientId),
        content: item.content,
        sentAt: item.sentAt
          ? new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just now',
      }));
      setMessages(formatted);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.id]);

  // Incoming message handler for WebSocket STOMP
  const handleIncomingMessage = useCallback(
    (item: any) => {
      const formatted: ChatMessage = {
        id: item.id || `ws-${Date.now()}`,
        senderId: String(item.senderId),
        senderName: item.senderName,
        recipientId: String(item.recipientId),
        content: item.content,
        sentAt: item.sentAt
          ? new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => {
        // Deduplicate exact ID
        if (formatted.id && prev.some((m) => m.id === formatted.id)) {
          return prev;
        }

        // Replace matching optimistic temp message
        const tempIdx = prev.findIndex(
          (m) =>
            m.id &&
            String(m.id).startsWith('temp-') &&
            m.senderId === formatted.senderId &&
            m.content === formatted.content
        );

        if (tempIdx !== -1) {
          const updated = [...prev];
          updated[tempIdx] = formatted;
          return updated;
        }

        // Check if message belongs to current open conversation
        const isCurrentChat =
          (formatted.senderId === user?.id && formatted.recipientId === activeContactRef.current?.id) ||
          (formatted.senderId === activeContactRef.current?.id && formatted.recipientId === user?.id);

        if (isCurrentChat) {
          return [...prev, formatted];
        }

        return prev;
      });
    },
    [user?.id]
  );

  // Real-time STOMP WebSocket Connection lifecycle
  useEffect(() => {
    if (!user?.id) return;

    fetchUsers();

    const stompUrl = `${WS_BASE}/ws-mentora`;
    const client = new Client({
      webSocketFactory: () => new SockJS(stompUrl),
      reconnectDelay: 2500,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsWsConnected(true);

        // Subscribe to direct user broadcast topic
        client.subscribe(`/topic/user/${user.id}`, (stompMsg) => {
          if (stompMsg.body) {
            try {
              const data = JSON.parse(stompMsg.body);
              handleIncomingMessage(data);
            } catch (e) {
              console.warn('STOMP parse error:', e);
            }
          }
        });

        // Also subscribe to user queue
        client.subscribe(`/user/queue/messages`, (stompMsg) => {
          if (stompMsg.body) {
            try {
              const data = JSON.parse(stompMsg.body);
              handleIncomingMessage(data);
            } catch (e) {
              console.warn('STOMP parse error:', e);
            }
          }
        });
      },
      onDisconnect: () => {
        setIsWsConnected(false);
      },
      onStompError: (frame) => {
        console.warn('STOMP connection error:', frame.headers['message']);
        setIsWsConnected(false);
      },
      onWebSocketClose: () => {
        setIsWsConnected(false);
      },
    });

    try {
      client.activate();
      stompClientRef.current = client;
    } catch (e) {
      console.warn('WebSocket activate error:', e);
    }

    return () => {
      if (stompClientRef.current) {
        try {
          stompClientRef.current.deactivate();
        } catch (_) {}
      }
    };
  }, [user?.id, fetchUsers, handleIncomingMessage]);

  // When active contact changes, fetch their message history
  useEffect(() => {
    if (activeContact?.id) {
      fetchMessages(activeContact.id);
      inputRef.current?.focus();
    }
  }, [activeContact, fetchMessages]);

  // High-Speed Optimistic Message Dispatch
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeContact || !user?.id) return;

    const messageText = inputMessage.trim();
    setInputMessage('');

    // 1. Optimistic Instant UI Update (0ms latency for user)
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: user.id,
      senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Me',
      recipientId: activeContact.id,
      content: messageText,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // 2. Send to backend (saves + triggers real-time STOMP broadcast)
    try {
      const res = await api.post('/chat/messages', {
        senderId: user.id,
        recipientId: activeContact.id,
        content: messageText,
      });

      if (res.data && res.data.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: res.data.id,
                  sentAt: res.data.sentAt
                    ? new Date(res.data.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : m.sentAt,
                }
              : m
          )
        );
      }
    } catch (err: any) {
      console.warn('Message post warning:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] academic-card rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-sm">
      {/* Directory Contacts Sidebar */}
      <div className="w-full md:w-80 border-r border-slate-200 p-4 flex flex-col bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-sm text-slate-900">Direct Messaging</h3>
            <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              {usersList.length}
            </span>
          </div>
          <button
            onClick={fetchUsers}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
            title="Refresh Contacts"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Real-Time WebSocket Status Indicator */}
        <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/70 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Channel Status:</span>
          {isWsConnected ? (
            <span className="inline-flex items-center font-bold text-emerald-700 gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Zap className="w-3 h-3 text-emerald-600" />
              Live Real-Time
            </span>
          ) : (
            <span className="inline-flex items-center text-amber-600 font-medium gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Syncing...
            </span>
          )}
        </div>

        {loadingUsers ? (
          <div className="p-4 text-center text-xs text-slate-400">Loading Directory...</div>
        ) : usersList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
            <p>
              {user?.role === 'ROLE_STUDENT'
                ? 'No faculty teachers or administrators found.'
                : 'No other registered users found.'}
            </p>
            <p className="text-[11px] text-slate-400">
              {user?.role === 'ROLE_STUDENT'
                ? 'Students can communicate directly with teachers and administrators once registered.'
                : 'Registered colleagues and advisees will appear here automatically.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
            {usersList.map((contact) => {
              const isSelected = activeContact?.id === contact.id;
              return (
                <button
                  key={contact.id}
                  onClick={() => setActiveContact(contact)}
                  className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 font-bold'
                      : 'hover:bg-slate-200/60 text-slate-700 bg-white border border-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {contact.firstName ? contact.firstName[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs leading-none truncate">
                        {contact.firstName} {contact.lastName}
                      </h4>
                      <p
                        className={`text-[11px] mt-1 font-medium truncate ${
                          isSelected ? 'text-emerald-100' : 'text-slate-500'
                        }`}
                      >
                        {contact.role.replace('ROLE_', '')}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Chat Stream Container */}
      <div className="flex-1 flex flex-col bg-white">
        {activeContact ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm border border-emerald-200/60 shadow-xs">
                  {activeContact.firstName ? activeContact.firstName[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-none">
                    {activeContact.firstName} {activeContact.lastName}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {activeContact.role.replace('ROLE_', '')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">• {activeContact.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchMessages(activeContact.id)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Resync Conversation"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
              {loadingMessages ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading conversation history...</div>
              ) : messages.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-600">No chat history with {activeContact.firstName} yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Send a message below for instant bidirectional delivery!
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id || msg.senderId === user?.email;
                  const isTemp = msg.id && String(msg.id).startsWith('temp-');

                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs md:max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-none shadow-sm shadow-emerald-600/20'
                            : 'bg-white text-slate-900 rounded-bl-none border border-slate-200 shadow-2xs'
                        }`}
                      >
                        <p className="leading-relaxed font-medium whitespace-pre-wrap break-words">{msg.content}</p>
                        <div
                          className={`flex items-center justify-end space-x-1 text-[10px] font-mono ${
                            isMe ? 'text-emerald-100' : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.sentAt}</span>
                          {isMe && (
                            <span>
                              {isTemp ? (
                                <span className="opacity-75">⋯</span>
                              ) : (
                                <CheckCheck className="w-3.5 h-3.5 inline text-emerald-200" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3.5 border-t border-slate-200 bg-white flex items-center space-x-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Type a message to ${activeContact.firstName}... (Enter to send)`}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-300" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-700">Select a Conversation</h4>
              <p className="text-xs text-slate-400">Choose a contact from the left directory to begin chatting.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
