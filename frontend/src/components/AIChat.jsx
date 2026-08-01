import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

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
          text: `Ask me anything about ${countryName}! I know about its history, culture, geography, and more.` 
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

    // Capture current messages to send as history
    const currentHistory = [...messages];
    
    // Optimistic UI update
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
      // Keep focus on input after sending
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
    "Tell me a fun fact",
    "What's the food like?",
    "Major historical events?"
  ];

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Chat Messages */}
      <div className="flex-1 flex flex-col gap-4 mb-4 overflow-y-auto custom-scrollbar pr-2 pb-2">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`px-4 py-2 rounded-2xl max-w-[90%] text-[15px] leading-relaxed ${
              msg.role === 'user' 
                ? 'self-end bg-teal-500/80 text-white rounded-tr-sm' 
                : 'self-start bg-white/10 text-gray-200 rounded-tl-sm'
            }`}
          >
            {msg.text}
          </div>
        ))}
        
        {/* Suggestions (only show if just the starter message is present) */}
        {messages.length === 1 && !isLoading && (
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSend(suggestion)}
                className="text-xs bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 py-1.5 px-3 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="self-start bg-white/10 text-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] flex gap-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="relative mt-auto shrink-0">
        <input 
          ref={inputRef}
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Ask a question..."
          className="w-full bg-black/30 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all disabled:opacity-50"
        />
        <button 
          onClick={() => handleSend()}
          disabled={isLoading || !inputValue.trim()}
          className="absolute right-1.5 top-1.5 bottom-1.5 w-9 bg-teal-500 hover:bg-teal-400 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-teal-500"
        >
          <Send size={16} className="ml-[-2px]" />
        </button>
      </div>
    </div>
  );
}
