import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Braces, X, Code2 } from 'lucide-react';

interface ModelInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  rawMLData: any;
}

export const ModelInspector: React.FC<ModelInspectorProps> = ({ isOpen, onClose, rawMLData }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-6 top-24 bottom-6 w-[400px] z-[100] flex flex-col"
        >
          <div className="flex-1 bg-[#0a0f1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-gray-100 text-xs font-bold uppercase tracking-widest">Model Inference Trace</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Content Swatch */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 font-mono">
              
              {/* Architecture Context */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Inference Pipeline</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Reflex Model</p>
                    <p className="text-xs text-gray-200">Isolation Forest</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Decision Model</p>
                    <p className="text-xs text-gray-200">Random Forest</p>
                  </div>
                </div>
              </div>

              {/* Raw JSON Trace */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Braces className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Real-Time Prediction Vector</span>
                </div>
                <div className="bg-black/60 border border-white/10 rounded-xl p-4 overflow-x-auto text-[11px] leading-relaxed">
                  <pre className="whitespace-pre-wrap font-mono">
                    {rawMLData ? (
                      Object.entries(rawMLData).map(([key, value], i) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-gray-500">"{key}":</span>
                          <span className={
                            typeof value === 'number' ? 'text-amber-400' : 
                            typeof value === 'boolean' ? 'text-purple-400' : 'text-emerald-400'
                          }>
                            {JSON.stringify(value)}
                            {i < Object.keys(rawMLData).length - 1 ? ',' : ''}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-600">// Awaiting decision layer trigger...</span>
                    )}
                  </pre>
                </div>
              </div>

              {/* Interpretation Layer */}
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Code2 className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Decision Logic</span>
                </div>
                {rawMLData ? (
                  <div className="text-[10px] text-gray-300 leading-relaxed space-y-2">
                    <p>
                      <strong className="text-white">Analysis:</strong> The model identified a <span className="text-amber-400">{rawMLData.context}</span> pattern 
                      detected via <span className="text-cyan-400">{rawMLData.origin}</span>.
                    </p>
                    <p>
                      <strong className="text-white">Safety Buffer:</strong> Time-to-failure is estimated at <span className="text-red-400">{rawMLData.ttf} mins</span>.
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 italic">No live vector data available.</p>
                )}
              </div>

              {/* Decision Heuristics */}
              <div className="space-y-3">
                <div className="text-[10px] text-gray-600 space-y-2 italic border-t border-white/5 pt-4">
                  <p>• Contamination Threshold: 0.1 (Optimized Baseline)</p>
                  <p>• LLM Engine: Mistral (Corporate Liable Config)</p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <span className="text-[9px] text-gray-500 font-bold uppercase">Audit Sync Enabled</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Live</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
