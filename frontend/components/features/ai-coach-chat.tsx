'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Minimize2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AICoachChatProps {
  sport?: string;
  injuryRisk?: number;
  cnsFatigue?: number;
  metabolicLoad?: number;
}

export function AICoachChat({ 
  sport = 'Athletics', 
  injuryRisk = 15, 
  cnsFatigue = 45, 
  metabolicLoad = 60 
}: AICoachChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actualSport, setActualSport] = useState(sport);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi! I'm your Khel Setu AI Coach. I've been analyzing your ${sport} telemetry. How can I help you optimize your recovery today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSport = () => {
      const savedSport = localStorage.getItem('demo_primary_sport');
      if (savedSport && savedSport !== actualSport) {
        setActualSport(savedSport);
        setMessages(prev => {
           const newMsg = [...prev];
           // Only update the greeting if it's the very first message
           if (newMsg.length === 1 && newMsg[0].role === 'assistant') {
               newMsg[0].content = `Hi! I'm your Khel Setu AI Coach. I've been analyzing your ${savedSport} telemetry. How can I help you optimize your recovery today?`;
           }
           return newMsg;
        });
      }
    };

    loadSport();
    window.addEventListener('profileUpdated', loadSport);
    return () => window.removeEventListener('profileUpdated', loadSport);
  }, [actualSport]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            sport: actualSport,
            injuryRisk,
            cnsFatigue,
            metabolicLoad
          }
        }),
      });

      const data = await response.json();
      
      if (data.message) {
        setMessages([...newMessages, { role: 'assistant', content: data.message }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now.' }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Connection error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-red-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-shadow"
          >
            <Bot size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 right-0 w-[350px] sm:w-[400px] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/90 shadow-2xl backdrop-blur-xl flex flex-col h-[550px] max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-black/40 px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-red-500">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-heading tracking-widest text-white uppercase">AI Coach</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-bank uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Minimize2 size={16} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex max-w-[85%] gap-2 ${
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`flex-shrink-0 mt-1 flex h-6 w-6 items-center justify-center rounded-full ${
                      msg.role === 'user' ? 'bg-orange-500/20' : 'bg-neutral-800 border border-white/10'
                    }`}>
                      {msg.role === 'user' ? <User size={12} className="text-orange-400" /> : <Bot size={12} className="text-gray-300" />}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm font-bank leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-tr-sm shadow-md'
                          : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 flex-row">
                    <div className="flex-shrink-0 mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 border border-white/10">
                      <Bot size={12} className="text-gray-300" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/5 rounded-tl-sm flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-black/40 border-t border-white/5">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your coach anything..."
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-full pl-4 pr-12 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all font-bank"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white disabled:opacity-50 disabled:bg-gray-700 transition-colors"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
