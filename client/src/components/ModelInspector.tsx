import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Braces, X, Code2, Send, MessageSquare, Database } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ModelInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  rawMLData: any;
}

export const ModelInspector: React.FC<ModelInspectorProps> = ({ isOpen, onClose, rawMLData }) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { role: 'assistant', content: '[SYSTEM]: TrustOps Expert Advisor Online. Analyzing 11-dimensional Industrial Telemetry. How can I assist with the current Decision Trace?' }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          contextData: {
            ...rawMLData,
            location: window.location.pathname.split('/').pop() || 'Fleet_Core'
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        const errData = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: `[ERROR]: Advisory Bridge Rejected: ${errData.error || 'Unknown'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "[TIMEOUT]: Neural Bridge Offline. Check Local Inference Service." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-6 top-24 bottom-6 w-[450px] z-[100] flex flex-col"
        >
          <div className="flex-1 bg-[#0a0f1a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-gray-100 text-[10px] font-black uppercase tracking-[0.2em]">High-Fidelity Decision Trace</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Content Swatch */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 font-mono custom-scrollbar">
              
              {/* Industrial Pipeline Architecture */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Decision Architecture</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                    <p className="text-[8px] text-gray-500 mb-1 font-black">Anomaly Layer</p>
                    <p className="text-[10px] text-gray-200">Isolation Forest (n=150)</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                    <p className="text-[8px] text-gray-500 mb-1 font-black">Classification Layer</p>
                    <p className="text-[10px] text-gray-200">XGB-Scale Random Forest</p>
                  </div>
                </div>
              </div>

              {/* 11-Dimensional Vector Trace */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Braces className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Industry-Scale Telemetry Vector</span>
                </div>
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4 overflow-hidden text-[11px] leading-relaxed">
                  <div className="grid grid-cols-2 gap-y-1">
                    {Object.entries(rawMLData?.telemetry_vector || rawMLData || {}).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-gray-500 whitespace-nowrap">"{key}":</span>
                        <span className={typeof value === 'number' ? 'text-amber-400' : 'text-emerald-400'}>
                          {typeof value === 'number' ? value.toFixed(2) : JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!rawMLData && <span className="text-gray-600">// Awaiting high-fidelity sync...</span>}
                </div>
              </div>

              {/* Contextual Intelligence Layer */}
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 space-y-3 shadow-inner">
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Inference Insight</span>
                </div>
                <div className="text-[11px] text-gray-300 leading-relaxed font-sans">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] uppercase font-black text-gray-500">Predicted Context</span>
                    <span className="text-amber-400 font-bold">{rawMLData?.context || 'Calibrating...'}</span>
                  </div>
                  <div className="p-3 bg-black/30 rounded-lg border border-white/5 text-[10px]">
                    <p className="text-cyan-400 font-black mb-1 uppercase tracking-tighter">Automated Advisory:</p>
                    <p className="text-gray-400 italic">"{rawMLData?.explainable_brain || 'Scanning 11 dimensions for diagnostic patterns...'}"</p>
                  </div>
                </div>
              </div>

              {/* Advisory Chat */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Expert Advisory Chat (Ollama)</span>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10" ref={scrollRef}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl text-[10px] leading-relaxed relative ${
                        msg.role === 'user' 
                          ? 'bg-cyan-500/10 border border-cyan-400/20 ml-6 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.05)]' 
                          : 'bg-white/5 border border-white/5 mr-6 text-gray-300'
                      }`}
                    >
                      <div className={`flex items-center gap-1.5 mb-1.5 text-[8px] font-black uppercase tracking-tighter opacity-50 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'user' ? 'Operator' : 'TrustOps Expert AI'}
                      </div>
                      <div className={msg.role === 'assistant' ? 'font-serif text-[11px]' : ''}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-3 ml-2">
                      <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" />
                      <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>

                <div className="relative group p-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Query the 11-dimensional expert..."
                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-[11px] text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400/50 transition-all font-mono"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading}
                    className="absolute right-4 top-3.5 p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest font-mono">Industry Scale v2.0.4</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest animate-pulse">Sync Active</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
