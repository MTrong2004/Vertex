import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLang } from '../../contexts/LanguageContext';

export const FloatingAssistant: React.FC = () => {
  const { t } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset greeting when language changes
  useEffect(() => {
    setMessages([{ role: 'ai', content: t.chat.greeting }]);
  }, [t.chat.greeting]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let aiResponse: string = t.chat.processing;
      const lc = userMsg.toLowerCase();
      if (lc.includes('plan') || lc.includes('kế hoạch') || lc.includes('tạo')) {
        aiResponse = t.chat.resp_plan;
      } else if (lc.includes('deadline') || lc.includes('hạn') || lc.includes('kiểm tra') || lc.includes('check')) {
        aiResponse = t.chat.resp_deadline;
      } else if (lc.includes('task') || lc.includes('việc') || lc.includes('phân công') || lc.includes('break')) {
        aiResponse = t.chat.resp_task;
      }
      
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'bg-slate-800 rotate-90' : 'bg-gradient-to-r from-[#22C55E] to-[#EAB308]'
        }`}
      >
        {isOpen ? <X className="text-white" /> : <Sparkles className="text-white" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[350px] md:w-[400px] h-[500px] bg-[#0F1A2A]/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-[#22C55E]/10 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#22C55E] to-[#EAB308] p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{t.chat.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-xs opacity-90">{t.chat.online}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0F1A]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#22C55E] text-white rounded-br-none' 
                        : 'bg-[#162032] text-slate-300 shadow-sm border border-[#22C55E]/10 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#162032] p-3 rounded-2xl rounded-bl-none shadow-sm border border-[#22C55E]/10 flex gap-1">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-[#0F1A2A] border-t border-[#22C55E]/10">
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  placeholder={t.chat.placeholder}
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-[#22C55E]/10 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none text-sm bg-[#162032] text-white placeholder-slate-500 focus:bg-[#0A0F1A] transition-all"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button 
                  onClick={() => setInputValue(t.chat.qa1)}
                  className="whitespace-nowrap px-3 py-1 bg-[#162032] hover:bg-[#22C55E]/10 hover:text-[#22C55E] rounded-full text-xs text-slate-400 transition-colors border border-[#22C55E]/10 hover:border-[#22C55E]/30"
                >
                  {t.chat.qa1}
                </button>
                <button 
                  onClick={() => setInputValue(t.chat.qa2)}
                  className="whitespace-nowrap px-3 py-1 bg-[#162032] hover:bg-[#22C55E]/10 hover:text-[#22C55E] rounded-full text-xs text-slate-400 transition-colors border border-[#22C55E]/10 hover:border-[#22C55E]/30"
                >
                  {t.chat.qa2}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
