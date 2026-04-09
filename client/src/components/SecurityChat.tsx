import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Zap, ShieldCheck, X } from 'lucide-react';
import { chatWithAI } from '@/lib/api';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface SecurityChatProps {
  telemetry: any;
  analysis: any;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_QUESTIONS = [
  "what is wrong",
  "what to do",
  "how soon",
  "is system safe"
];

export const SecurityChat: React.FC<SecurityChatProps> = ({ telemetry, analysis, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "TrustOps intelligence core active. How can I assist with your segment oversight?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLongRequest, setIsLongRequest] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setIsLongRequest(false);
    const longTimer = setTimeout(() => setIsLongRequest(true), 2000);

    try {
      const response = await chatWithAI(text, { telemetry, analysis });
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Error communicating with intelligence core." }]);
    } finally {
      clearTimeout(longTimer);
      setIsTyping(false);
      setIsLongRequest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-[500px] w-full bg-[#0a0f18] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Decision Support Chat</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Messages View */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
              m.role === 'user' 
                ? 'bg-cyan-600 text-white rounded-tr-none' 
                : 'bg-white/[0.04] border border-white/[0.08] text-gray-200 rounded-tl-none'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-start">
              <div className="bg-white/[0.04] border border-white/[0.08] px-3 py-2 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
            {isLongRequest && (
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400/60 animate-pulse ml-1">
                Recalibrating Neural Weights...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="shrink-0 px-4 py-2 border-t border-white/[0.06] bg-black/20 overflow-x-auto">
        <div className="flex gap-2 whitespace-nowrap">
          {QUICK_QUESTIONS.map(q => (
            <button 
              key={q} 
              onClick={() => handleSend(q)}
              className="px-3 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.02] text-[10px] font-bold text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-all uppercase tracking-widest"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
        className="shrink-0 p-4 bg-white/[0.02] flex items-center gap-2"
      >
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Query intelligence core..."
          className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
        <button 
          type="submit"
          className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors disabled:opacity-40"
          disabled={!input.trim() || isTyping}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
};
