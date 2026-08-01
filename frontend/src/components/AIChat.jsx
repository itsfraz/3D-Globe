import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, Lightbulb, Utensils, Landmark, Plane, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIChat({ countryName }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Reset chat when country changes
  useEffect(() => {
    if (countryName) {
      setMessages([
        { 
          role: "model", 
          text: `Ask me anything about ${countryName}! I can share insights on history, culture, cuisine, or travel tips.` 
        }
      ]);
      setInputValue('');
      setIsLoading(false);
    } else {
      setMessages([]);
    }
  }, [countryName]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textOverride = null) => {
    const textToSend = typeof textOverride === 'string' ? textOverride.trim() : inputValue.trim();
    if (!textToSend || isLoading || !countryName) return;

    const currentHistory = [...messages];
    const newMessages = [...currentHistory, { role: "user", text: textToSend }];
    
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: countryName,
          question: textToSend,
          chatHistory: currentHistory
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch response');
      }

      setMessages([...newMessages, { role: "model", text: data.reply }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages([
        ...newMessages, 
        { role: "model", text: "Sorry, I couldn't respond right now — please try again." }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    { icon: <Lightbulb size={13} className="text-yellow-400" />, label: "Fun Fact" },
    { icon: <Utensils size={13} className="text-orange-400" />, label: "Famous Food" },
    { icon: <Landmark size={13} className="text-teal-400" />, label: "Key History" },
    { icon: <Plane size={13} className="text-cyan-400" />, label: "Top Sights" }
  ];

  return (
    <div className="flex-1 flex flex-col h-full relative min-h-0">
      {/* Chat Messages List */}
      <div className="flex-1 flex flex-col gap-3 mb-3 overflow-y-auto custom-scrollbar pr-1.5 pb-2">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isModel = msg.role === 'model';
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2.5 max-w-[92%] ${isModel ? 'self-start' : 'self-end flex-row-reverse'}`}
              >
                {/* Avatar Icon */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-md ${
                  isModel 
                    ? 'bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950 glow-teal' 
                    : 'bg-white/15 text-white border border-white/20'
                }`}>
                  {isModel ? <Sparkles size={14} /> : <User size={14} />}
                </div>

                {/* Bubble Content */}
                <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                  isModel 
                    ? 'bg-white/10 text-gray-100 rounded-tl-xs border border-white/10 backdrop-blur-md' 
                    : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-tr-xs shadow-md font-medium'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Suggestion Chips */}
        {messages.length === 1 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 mt-2 ml-9"
          >
            {suggestions.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSend(item.label)}
                className="glass-pill text-xs text-gray-200 py-1.5 px-3 rounded-full flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Typing Indicator */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="self-start flex items-center gap-2.5 ml-1"
          >
            <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Sparkles size={14} className="animate-spin-slow" />
            </div>
            <div className="bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl rounded-tl-xs flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              <span className="text-xs text-gray-400 ml-1.5 font-medium">Thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Bar */}
      <div className="relative mt-auto shrink-0 pt-2">
        <input 
          ref={inputRef}
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={`Ask AI about ${countryName}...`}
          className="w-full bg-black/40 border border-white/15 rounded-full py-3 pl-4 pr-12 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/80 focus:border-teal-400 transition-all shadow-inner backdrop-blur-md disabled:opacity-50"
        />
        <button 
          onClick={() => handleSend()}
          disabled={isLoading || !inputValue.trim()}
          className="absolute right-2 top-3 bottom-1 w-9 h-9 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          <Send size={15} className="ml-[-1px]" />
        </button>
      </div>
    </div>
  );
}
