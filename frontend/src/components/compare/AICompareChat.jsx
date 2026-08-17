import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, Plane, Wallet, Briefcase, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AICompareChat({ countryA, countryB }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Reset chat when countries change
  useEffect(() => {
    if (countryA && countryB) {
      setMessages([
        { 
          role: "model", 
          text: `I'm ready to compare ${countryA} and ${countryB}. Ask me about travel, cost of living, tech jobs, or anything else!` 
        }
      ]);
      setInputValue('');
      setIsLoading(false);
    } else {
      setMessages([]);
    }
  }, [countryA, countryB]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textOverride = null) => {
    const textToSend = typeof textOverride === 'string' ? textOverride.trim() : inputValue.trim();
    if (!textToSend || isLoading || !countryA || !countryB) return;

    const currentHistory = [...messages];
    const newMessages = [...currentHistory, { role: "user", text: textToSend }];
    
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryA,
          countryB,
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
      console.error("Compare Chat Error:", error);
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
    { icon: <Plane size={13} className="text-blue-400" />, label: "Which is better for travel?" },
    { icon: <Wallet size={13} className="text-green-400" />, label: "Cost of living comparison" },
    { icon: <Briefcase size={13} className="text-purple-400" />, label: "Tech jobs comparison" },
    { icon: <GraduationCap size={13} className="text-yellow-400" />, label: "Better for students?" }
  ];

  return (
    <div className="flex-1 flex flex-col h-full relative min-h-0 bg-white/5 rounded-2xl border border-white/10 p-3">
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
                className={`flex gap-2.5 max-w-[95%] ${isModel ? 'self-start' : 'self-end flex-row-reverse'}`}
              >
                {/* Avatar Icon */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-md ${
                  isModel 
                    ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white glow-pink' 
                    : 'bg-white/15 text-white border border-white/20'
                }`}>
                  {isModel ? <Sparkles size={14} /> : <User size={14} />}
                </div>

                {/* Bubble Content */}
                <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                  isModel 
                    ? 'bg-white/10 text-gray-100 rounded-tl-xs border border-white/10 backdrop-blur-md' 
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-tr-xs shadow-md font-medium'
                }`}>
                  <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
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
                className="glass-pill text-xs text-gray-200 py-1.5 px-3 rounded-full flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 border border-white/10 bg-white/5 hover:bg-white/15"
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
            <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300">
              <Sparkles size={14} className="animate-spin-slow" />
            </div>
            <div className="bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl rounded-tl-xs flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              <span className="text-xs text-gray-400 ml-1.5 font-medium">Comparing...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Bar */}
      <div className="relative mt-auto shrink-0 pt-2 border-t border-white/10">
        <input 
          ref={inputRef}
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={`Ask AI to compare ${countryA} and ${countryB}...`}
          className="w-full bg-black/40 border border-white/15 rounded-full py-3 pl-4 pr-12 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400/80 focus:border-pink-400 transition-all shadow-inner backdrop-blur-md disabled:opacity-50"
        />
        <button 
          onClick={() => handleSend()}
          disabled={isLoading || !inputValue.trim()}
          className="absolute right-2 top-3 bottom-1 w-9 h-9 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          <Send size={15} className="ml-[-1px]" />
        </button>
      </div>
    </div>
  );
}
