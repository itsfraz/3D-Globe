import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, MapPin, Globe, Navigation, Coffee, Copy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  { icon: <MapPin size={12} className="text-blue-400" />, label: "What is the capital?" },
  { icon: <Globe size={12} className="text-teal-400" />, label: "Languages spoken?" },
  { icon: <Navigation size={12} className="text-purple-400" />, label: "Places to visit?" },
  { icon: <Coffee size={12} className="text-orange-400" />, label: "Famous food?" }
];

export default function InlineAIChat({ country, countryDetails }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevCountryRef = useRef(country?.name);

  // Reset messages when country changes
  useEffect(() => {
    if (country?.name !== prevCountryRef.current) {
      setMessages([]);
      setInputValue('');
      prevCountryRef.current = country?.name;
    }
  }, [country?.name]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (overrideText = null) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : inputValue;
    if (!textToSend.trim() || isLoading) return;

    const newMessages = [...messages, { role: "user", text: textToSend.trim() }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType: 'country',
          contextData: {
            country: country.name,
            ...country,
            ...(countryDetails || {})
          },
          question: textToSend.trim(),
          chatHistory: messages // Send previous history
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }

      setMessages([...newMessages, { role: "model", text: data.reply }]);
    } catch (error) {
      console.error("Inline AI Error:", error);
      setMessages([...newMessages, { role: "model", text: "⚠️ " + error.message, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
      
      {/* Chat History Area */}
      <div className="flex-1 max-h-[350px] overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
        
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3">
              <Sparkles size={16} className="text-teal-400" />
            </div>
            <p className="text-gray-300 text-xs mb-4 px-2 leading-relaxed">
              Hi! I'm your AI guide for <strong>{country?.name}</strong>. Ask me anything about its history, culture, or travel.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(s.label)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  {s.icon}
                  <span className="text-[10px] font-medium text-gray-300 group-hover:text-white whitespace-nowrap">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => {
          const isModel = msg.role === 'model';
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col max-w-[95%] ${isModel ? 'self-start' : 'self-end'}`}
            >
              <div 
                className={`p-3 rounded-2xl ${
                  isModel 
                    ? msg.isError 
                      ? 'bg-red-500/10 border border-red-500/20 text-red-200 rounded-tl-sm' 
                      : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm shadow-sm' 
                    : 'bg-teal-500/90 text-slate-900 font-medium rounded-tr-sm shadow-[0_0_10px_rgba(45,212,191,0.15)]'
                }`}
              >
                {isModel && !msg.isError ? (
                  <div className="prose prose-invert prose-[11px] max-w-none prose-p:leading-relaxed prose-headings:text-teal-300 prose-a:text-teal-400 prose-strong:text-white">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs whitespace-pre-wrap">{msg.text}</p>
                )}
              </div>

              {isModel && !msg.isError && (
                <div className="flex items-center gap-2 mt-1 ml-1">
                  <button 
                    onClick={() => copyToClipboard(msg.text, idx)}
                    className="text-gray-500 hover:text-gray-300 flex items-center gap-1 text-[9px] uppercase tracking-wider font-semibold"
                  >
                    {copiedIndex === idx ? <CheckCircle2 size={10} className="text-teal-400" /> : <Copy size={10} />}
                    {copiedIndex === idx ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-start bg-white/5 border border-white/10 px-3 py-2.5 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-white/5 shrink-0 bg-[#070a12]/50">
        <div className="relative flex items-end bg-[#0a0f1c] border border-white/10 focus-within:border-teal-500/50 rounded-xl transition-colors overflow-hidden">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${country?.name}...`}
            className="w-full bg-transparent text-white placeholder-gray-500 text-xs p-3 pr-10 focus:outline-none resize-none min-h-[40px] max-h-[100px] custom-scrollbar"
            rows={1}
            style={{
              height: inputRef.current ? `${Math.min(inputRef.current.scrollHeight, 100)}px` : '40px'
            }}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            className={`absolute right-1.5 bottom-1.5 w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
              inputValue.trim() && !isLoading 
                ? 'bg-teal-500 text-slate-900 shadow-[0_0_10px_rgba(45,212,191,0.3)] hover:bg-teal-400' 
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send size={12} className={inputValue.trim() && !isLoading ? 'ml-0.5' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
