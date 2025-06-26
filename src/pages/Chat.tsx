import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Phone, Video, MoreVertical, Heart, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Message, Chat as ChatType, Profile } from '../lib/supabase';

const Chat: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<ChatType | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!id || !user) return;
    
    const fetchChatAndUser = async () => {
      try {
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select(`
            *,
            items (*),
            sender:sender_id (id, full_name, avatar_url),
            receiver:receiver_id (id, full_name, avatar_url)
          `)
          .eq('id', id)
          .single();

        if (chatError) throw chatError;
        setChat(chatData);

        // Set other user's profile
        const otherUserId = chatData.sender_id === user.id ? chatData.receiver_id : chatData.sender_id;
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', otherUserId)
          .single();

        if (userError) throw userError;
        setOtherUser(userData);

        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);
      } catch (err) {
        console.error('Error fetching chat:', err);
        setError('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    fetchChatAndUser();

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${id}`
      }, payload => {
        setMessages(current => [...current, payload.new as Message]);
        
        // Create notification for new message
        if (payload.new.sender_id !== user.id) {
          supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'new_message',
              title: 'New Message',
              content: `You have a new message from ${otherUser?.full_name || 'someone'}.`
            });
        }
      })
      .subscribe();

    // Subscribe to typing indicators (you can implement this later)
    const typingSubscription = supabase
      .channel(`typing:${id}`)
      .on('broadcast', { event: 'typing' }, payload => {
        if (payload.user_id !== user.id) {
          setTyping(payload.typing);
        }
      })
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  }, [id, user, otherUser?.full_name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !chat) return;

    const messageContent = message.trim();
    setMessage('');

    try {
      const { error: sendError } = await supabase
        .from('messages')
        .insert({
          chat_id: chat.id,
          sender_id: user.id,
          content: messageContent
        });

      if (sendError) throw sendError;

      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chat.id);

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setMessage(messageContent); // Restore message on error
    }
  };

  const handleTyping = () => {
    // Broadcast typing indicator
    supabase.channel(`typing:${id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user?.id, typing: true }
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`typing:${id}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user?.id, typing: false }
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4A0E67] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 bg-[#4A0E67] text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!chat || !otherUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p>Chat not found</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 bg-[#4A0E67] text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Chat Header */}
          <div className="bg-[#4A0E67] text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-[#3a0b50] rounded-full transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white overflow-hidden">
                    <img
                      src={otherUser.avatar_url || "https://via.placeholder.com/40"}
                      alt={otherUser.full_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="font-semibold">{otherUser.full_name}</h2>
                    <p className="text-sm opacity-90">
                      {typing ? 'Typing...' : 'Online'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-2 hover:bg-[#3a0b50] rounded-full transition-colors">
                  <Phone size={20} />
                </button>
                <button className="p-2 hover:bg-[#3a0b50] rounded-full transition-colors">
                  <Video size={20} />
                </button>
                <button className="p-2 hover:bg-[#3a0b50] rounded-full transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex h-[calc(100vh-16rem)]">
            {/* Chat Messages */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_id === user?.id
                            ? 'bg-[#F7941D] text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type your message..."
                    className="flex-1 p-3 rounded-lg border focus:outline-none focus:border-[#4A0E67]"
                  />
                  <button
                    type="submit"
                    className="bg-[#4A0E67] text-white p-3 rounded-lg hover:bg-[#3a0b50] transition-colors disabled:opacity-50"
                    disabled={!message.trim()}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>

            {/* Item Details Sidebar */}
            <div className="w-80 border-l bg-gray-50 p-4 hidden lg:block">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Package size={20} className="mr-2" />
                Item Details
              </h3>
              <div className="space-y-4">
                <img
                  src={chat.items?.images[0]}
                  alt={chat.items?.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-semibold">{chat.items?.name}</h4>
                  <p className="text-sm text-gray-600">{chat.items?.description}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Condition:</p>
                  <p className="text-sm text-gray-600">{chat.items?.condition}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Estimated Value:</p>
                  <p className="text-sm text-gray-600">₦{chat.items?.estimated_cost}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Looking to swap for:</p>
                  <p className="text-sm text-gray-600">{chat.items?.swap_for}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Category:</p>
                  <p className="text-sm text-gray-600">{chat.items?.category}</p>
                </div>
                <button
                  onClick={() => navigate(`/items/${chat.items?.id}`)}
                  className="w-full bg-[#F7941D] text-white py-2 rounded hover:bg-[#e68a1c] transition-colors"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;