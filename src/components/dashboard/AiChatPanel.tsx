import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Bot, User, CalendarClock, ListTodo, BarChart3, Zap } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

type ChatMessage = { role: 'user' | 'ai'; content: string; time: Date };

interface AiChatPanelProps {
  onSaveChat?: (title: string, preview: string) => void;
}

export const AiChatPanel: React.FC<AiChatPanelProps> = ({ onSaveChat }) => {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: 'ai', content: t.chat.greeting, time: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef(false);

  // Update initial greeting when language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'ai') {
        return [{ ...prev[0], content: t.chat.greeting }];
      }
      return prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSend = (text?: string) => {
    const msg = text || inputValue;
    if (!msg.trim() || isTyping) return;

    const isFirstUser = messages.filter(m => m.role === 'user').length === 0;
    setMessages(prev => [...prev, { role: 'user', content: msg, time: new Date() }]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let aiResponse: string = t.chat.processing;
      const lower = msg.toLowerCase();
      if (lower.includes('plan') || lower.includes('create') || lower.includes('sprint') ||
          lower.includes('kế hoạch') || lower.includes('lên kế') || lower.includes('tạo')) {
        aiResponse = t.chat.resp_plan;
      } else if (lower.includes('deadline') || lower.includes('check') || lower.includes('schedule') ||
                 lower.includes('hạn') || lower.includes('kiểm tra') || lower.includes('lịch')) {
        aiResponse = t.chat.resp_deadline;
      } else if (lower.includes('break') || lower.includes('task') || lower.includes('divide') ||
                 lower.includes('phân chia') || lower.includes('công việc') || lower.includes('chia nhỏ')) {
        aiResponse = t.chat.resp_task;
      } else if (lower.includes('report') || lower.includes('progress') || lower.includes('status') ||
                 lower.includes('báo cáo') || lower.includes('tiến độ') || lower.includes('trạng thái')) {
        aiResponse = t.chat.resp_report;
      } else if (lower.includes('help') || lower.includes('giúp') || lower.includes('hỗ trợ')) {
        aiResponse = t.chat.resp_help;
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse, time: new Date() }]);
      setIsTyping(false);

      if (isFirstUser && !savedRef.current) {
        savedRef.current = true;
        onSaveChat?.(msg.slice(0, 55), aiResponse.replace(/\n/g, ' ').slice(0, 65));
      }
    }, 1200);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const quickActions = [
    { icon: <CalendarClock size={13} />, text: t.chat.qa1, color: 'text-[#22C55E]' },
    { icon: <ListTodo size={13} />,      text: t.chat.qa2, color: 'text-[#06B6D4]' },
    { icon: <BarChart3 size={13} />,     text: t.chat.qa3, color: 'text-[#EAB308]' },
    { icon: <Zap size={13} />,           text: t.chat.qa4, color: 'text-purple-400' },
  ];

  return (
    <div data-chat-panel className="flex flex-col flex-1 min-h-0 bg-[#0A0F1A]">
      {/* Header */}
      <div className="px-4 py-3 bg-[#0F1A2A]/80 backdrop-blur-xl border-b border-[#22C55E]/10 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#22C55E] to-[#EAB308] flex items-center justify-center shadow-lg shadow-green-500/10">
          <Sparkles size={15} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white">{t.chat.title}</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs text-slate-500">{t.chat.online}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                msg.role === 'ai' 
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#EAB308]' 
                  : 'bg-[#162032] border border-[#22C55E]/10'
              }`}>
                {msg.role === 'ai' ? <Bot size={12} className="text-white" /> : <User size={12} className="text-slate-400" />}
              </div>
              <div className={`max-w-[80%] flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-[#22C55E] text-white rounded-br-sm'
                    : 'bg-[#0F1A2A] border border-[#22C55E]/10 text-slate-300 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-600 px-1">{formatTime(msg.time)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-[#22C55E] to-[#EAB308]">
              <Bot size={12} className="text-white" />
            </div>
            <div className="bg-[#0F1A2A] border border-[#22C55E]/10 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions — always visible */}
      <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide flex-shrink-0">
        {quickActions.map((action) => (
          <button
            key={action.text}
            onClick={() => handleSend(action.text)}
            className="whitespace-nowrap px-2.5 py-1.5 bg-[#162032] hover:bg-[#22C55E]/10 hover:text-white rounded-lg text-[11px] text-slate-400 transition-all border border-[#22C55E]/10 hover:border-[#22C55E]/25 flex items-center gap-1.5"
          >
            <span className={action.color}>{action.icon}</span>
            {action.text}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-[#0F1A2A]/60 backdrop-blur-sm border-t border-[#22C55E]/10 flex-shrink-0">
        <form onSubmit={handleFormSubmit} className="relative">
          <input
            type="text"
            placeholder={t.chat.placeholder}
            className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-[#22C55E]/10 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none text-sm bg-[#162032] text-white placeholder-slate-500 transition-all"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
