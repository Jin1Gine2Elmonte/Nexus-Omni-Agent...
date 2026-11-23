import React from 'react';
import { X, Search, AlertTriangle, Lightbulb, Link as LinkIcon, RefreshCw } from 'lucide-react';

interface MemoryAuditResult {
  contradictions: string[];
  forgottenThreads: string[];
  suggestedRefinements: string[];
}

interface MemoryAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuditing: boolean;
  result: MemoryAuditResult | null;
  onReAudit: () => void;
}

export default function MemoryAuditorModal({ isOpen, onClose, isAuditing, result, onReAudit }: MemoryAuditorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
        <div className="bg-zinc-950 border border-indigo-900/50 shadow-2xl shadow-indigo-900/20 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-indigo-900/30 bg-indigo-950/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 to-transparent pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-indigo-900/30 text-indigo-400 rounded-lg border border-indigo-800/30">
                        <Search size={18} className={isAuditing ? "animate-pulse" : ""} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                            PALE ARCHIVE AUDITOR <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-900/50 text-indigo-300">NEXUS COGNITION</span>
                        </h2>
                        <p className="text-[10px] text-indigo-500/70 font-mono">Cross-referencing memory axioms with active conversation vectors...</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                    <button 
                        onClick={onReAudit}
                        disabled={isAuditing}
                        className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 rounded transition-colors disabled:opacity-50"
                        title="Re-run Audit"
                    >
                        <RefreshCw size={16} className={isAuditing ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-950/50">
                {isAuditing ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-70">
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full animate-ping delay-75 duration-1000"></div>
                            <div className="absolute inset-2 border-2 border-indigo-400/30 rounded-full animate-ping delay-150 duration-700"></div>
                            <div className="absolute inset-4 border-2 border-indigo-300/40 rounded-full flex items-center justify-center animate-pulse">
                                <Search className="text-indigo-400" size={24} />
                            </div>
                        </div>
                        <span className="text-xs text-indigo-400 font-mono uppercase tracking-widest animate-pulse">
                            Synthesizing Paradox Engine...
                        </span>
                    </div>
                ) : !result ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                        <span className="text-xs font-mono">No audit data. Run audit to analyze the archive.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Contradictions */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-red-400 border-b border-red-900/30 pb-2">
                                <AlertTriangle size={16} />
                                <h3 className="text-xs font-bold uppercase tracking-wider">Detected Contradictions</h3>
                                <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded-full bg-red-900/20">{result.contradictions.length}</span>
                            </div>
                            <div className="space-y-2">
                                {result.contradictions.length === 0 ? (
                                    <div className="p-3 text-[11px] text-zinc-500 font-mono italic bg-zinc-900/30 rounded border border-zinc-800/50">
                                        No logical paradoxes detected. Archive integrity stable.
                                    </div>
                                ) : result.contradictions.map((c, i) => (
                                    <div key={i} className="p-3 rounded bg-red-950/20 border border-red-900/30 text-red-200/80 text-xs leading-relaxed">
                                        {c}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Forgotten Threads & Refinements container */}
                        <div className="space-y-6">
                            {/* Forgotten Threads */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-amber-500 border-b border-amber-900/30 pb-2">
                                    <LinkIcon size={16} />
                                    <h3 className="text-xs font-bold uppercase tracking-wider">Forgotten Threads</h3>
                                    <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded-full bg-amber-900/20">{result.forgottenThreads.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {result.forgottenThreads.length === 0 ? (
                                        <div className="p-3 text-[11px] text-zinc-500 font-mono italic bg-zinc-900/30 rounded border border-zinc-800/50">
                                            No abandoned vectors detected. All core concepts tracked.
                                        </div>
                                    ) : result.forgottenThreads.map((ft, i) => (
                                        <div key={i} className="p-3 rounded bg-amber-950/20 border border-amber-900/30 text-amber-200/80 text-xs leading-relaxed">
                                            {ft}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Refinements */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-emerald-400 border-b border-emerald-900/30 pb-2">
                                    <Lightbulb size={16} />
                                    <h3 className="text-xs font-bold uppercase tracking-wider">Suggested Refinements</h3>
                                    <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded-full bg-emerald-900/20">{result.suggestedRefinements.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {result.suggestedRefinements.length === 0 ? (
                                        <div className="p-3 text-[11px] text-zinc-500 font-mono italic bg-zinc-900/30 rounded border border-zinc-800/50">
                                            No explicit structural optimizations required at this sequence.
                                        </div>
                                    ) : result.suggestedRefinements.map((sr, i) => (
                                        <div key={i} className="p-3 rounded bg-emerald-950/10 border border-emerald-900/30 text-emerald-200/80 text-xs leading-relaxed">
                                            {sr}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-indigo-900/30 bg-black/40 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                <span>NEXUS COGNITIVE AUDIT CORE v2.1</span>
                {result && !isAuditing && <span>Audit Completed Successfully. Ready for Paradox Resolution.</span>}
            </div>
        </div>
    </div>
  );
}
