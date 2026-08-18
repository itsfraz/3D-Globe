import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Sparkles, Send, MapPin, Scale, RefreshCw, Copy, CheckCircle2, Navigation, Coffee, Landmark, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useCountryDetails } from '../../hooks/useCountryDetails';

const SUGGESTIONS = [
  { icon: <Navigation size={14} className="text-blue-400" />, label: "Plan a Trip" },
  { icon: <Landmark size={14} className="text-yellow-400" />, label: "Explore History" },
  { icon: <Coffee size={14} className="text-orange-400" />, label: "Discover Food" },
  { icon: <Sparkles size={14} className="text-teal-400" />, label: "Fun Fact" }
];

export default function AIWorldGuide({ 
  isOpen, 
  onClose, 
  selectedCountry, 
  compareCountries, 
  isCompareMode 
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { countryDetails } = useCountryDetails(selectedCountry);

  // Derive Context
  const context = useMemo(() => {
    if (isCompareMode && compareCountries.length === 2) {
      return { type: 'compare', data: { countryA: compareCountries[0].name, countryB: compareCountries[1].name } };
    }
    if (selectedCountry) {
      return { 
        type: 'country', 
        data: { 
          country: selectedCountry.name,
          ...selectedCountry,
          ...(countryDetails || {})
        } 
      };
    }
    return { type: 'global', data: null };
  }, [selectedCountry, compareCountries, isCompareMode, countryDetails]);

  // Context Label for Header
  const contextLabel = useMemo(() => {
    if (context.type === 'compare') return `Comparing ${context.data.countryA} & ${context.data.countryB}`;
    if (context.type === 'country') return `Exploring ${context.data.country}`;
    return "Exploring the World";
  }, [context]);

  // Reset/Welcome Message on Context Change
  const prevCountryRef = useRef(selectedCountry?.name);
  useEffect(() => {
    const currentName = selectedCountry?.name;
    if (currentName !== prevCountryRef.current) {
      setMessages([]);
      prevCountryRef.current = currentName;
    }
  }, [selectedCountry?.name]);

  // Auto-scroll only when user sends a message or opens chat
  useEffect(() => {
    if (isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isLoading]);

  // Focus input and scroll to bottom when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    }
  }, [isOpen]);

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
          contextType: context.type,
          contextData: context.data,
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
      console.error("AI Guide Error:", error);
      setMessages([...newMessages, { role: "model", text: "⚠️ " + error.message, isError: true }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setTimeout(() => inputRef.current?.focus(), 0);
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-x-4 bottom-4 top-24 md:inset-auto md:bottom-6 md:right-6 md:top-auto md:w-[400px] lg:w-[450px] md:h-[600px] md:max-h-[calc(100vh-110px)] z-50 bg-[#0d1322]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex flex-col gap-1 shrink-0 bg-white/5 relative overflow-hidden">
          {/* Subtle animated background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-teal-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">AI World Guide</h2>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button onClick={clearChat} title="Clear Chat" className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors">
                  <RefreshCw size={14} />
                </button>
              )}
              <button onClick={onClose} title="Close" className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors bg-black/20">
                <X size={16} />
              </button>
            </div>
          </div>
          
          {/* Context Badge */}
          <div className="flex items-center gap-1.5 mt-1 relative z-10">
            {context.type === 'global' ? <Globe size={12} className="text-gray-400" /> : 
             context.type === 'compare' ? <Scale size={12} className="text-purple-400" /> : 
             <MapPin size={12} className="text-teal-400" />}
            <span className="text-xs font-medium text-gray-400">{contextLabel}</span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
          
          {/* Landing State */}
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center mt-8">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 glow-subtle">
                <Sparkles size={28} className="text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {context.type === 'country' ? `✨ ${context.data.country} AI` : 'What would you like to explore?'}
              </h3>
              <p className="text-gray-400 text-sm mb-8 px-4">
                {context.type === 'country' 
                  ? `👋 Hi! I'm your AI guide for ${context.data.country}. Ask me anything about its history, culture, geography, travel, food, wildlife, or interesting facts.`
                  : "Ask me about history, culture, travel plans, or comparisons. I adapt to whatever you're looking at on the globe."
                }
              </p>
              
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm px-2">
                {(context.type === 'country' ? [
                  { icon: <MapPin size={14} className="text-blue-400" />, label: "What is the capital?" },
                  { icon: <Globe size={14} className="text-teal-400" />, label: "Languages spoken?" },
                  { icon: <Navigation size={14} className="text-purple-400" />, label: "Places to visit?" },
                  { icon: <Coffee size={14} className="text-orange-400" />, label: "Famous food?" }
                ] : SUGGESTIONS).map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(s.label)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                  >
                    {s.icon}
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white">{s.label}</span>
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
                className={`flex flex-col max-w-[90%] ${isModel ? 'self-start' : 'self-end'}`}
              >
                <div 
                  className={`p-3.5 rounded-2xl ${
                    isModel 
                      ? msg.isError 
                        ? 'bg-red-500/10 border border-red-500/20 text-red-200 rounded-tl-sm' 
                        : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm shadow-lg' 
                      : 'bg-teal-500 text-slate-900 font-medium rounded-tr-sm shadow-[0_0_15px_rgba(45,212,191,0.2)]'
                  }`}
                >
                  {isModel && !msg.isError ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-teal-300 prose-a:text-teal-400 prose-strong:text-white">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>

                {isModel && !msg.isError && (
                  <div className="flex items-center gap-2 mt-1.5 ml-1">
                    <button 
                      onClick={() => copyToClipboard(msg.text, idx)}
                      className="text-gray-500 hover:text-gray-300 flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold"
                    >
                      {copiedIndex === idx ? <CheckCircle2 size={12} className="text-teal-400" /> : <Copy size={12} />}
                      {copiedIndex === idx ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-start bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/20 border-t border-white/10 shrink-0">
          <div className="relative flex items-end bg-[#070a12] border border-white/10 focus-within:border-teal-500/50 rounded-2xl transition-colors shadow-inner overflow-hidden">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={context.type === 'country' ? `Ask anything about ${context.data.country}...` : "Ask anything..."}
              className="w-full bg-transparent text-white placeholder-gray-500 text-sm p-3.5 pr-12 focus:outline-none resize-none min-h-[48px] max-h-[120px] custom-scrollbar"
              rows={1}
              style={{
                height: inputRef.current ? `${Math.min(inputRef.current.scrollHeight, 120)}px` : '48px'
              }}
            />
            <button 
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              className={`absolute right-2 bottom-2 w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                inputValue.trim() && !isLoading 
                  ? 'bg-teal-500 text-slate-900 shadow-[0_0_10px_rgba(45,212,191,0.3)] hover:bg-teal-400' 
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send size={14} className={inputValue.trim() && !isLoading ? 'ml-0.5' : ''} />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-500 mt-2">
            AI World Guide adapts to your current globe view.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
