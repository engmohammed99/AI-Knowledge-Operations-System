'use client';

import { useState, useRef } from 'react';
import {
  UploadCloud, FileText, Send, Loader2, ShieldCheck,
  Search, Filter, X, Info, Sparkles, AlertTriangle,
  CheckCircle2, Zap
} from 'lucide-react';
import { useDocuments, useUploadFile, useAskQuestion, useInsights } from '../hooks/useKnowledge';

interface Message {
  role: 'user' | 'ai';
  content: string;
  sources?: string[];
  confidence?: number;
  reasoning?: string;
}

export default function KnowledgeCopilot() {
  // Local state for the chat interface
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hello! I've analyzed your platform's compliance documents. What would you like to know?" }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'processed' | 'pending'>('all');
  const [activeSource, setActiveSource] = useState<{ filename: string, reasoning?: string } | null>(null);

  const [leftPaneView, setLeftPaneView] = useState<'documents' | 'insights'>('documents');

  // React Query Hooks
  const { data: documents, isLoading: isLoadingDocs, isError: isDocsError } = useDocuments();
  const uploadMutation = useUploadFile();
  const askMutation = useAskQuestion();
  const { data: insights, isLoading: isLoadingInsights, isError: isInsightsError } = useInsights();

  // Derived state for Search & Filters
  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || askMutation.isPending) return;

    const userQ = input;
    setInput('');

    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: userQ }]);

    // Trigger API call
    askMutation.mutate(userQ, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: data.answer,
          sources: data.sources,
          confidence: data.confidence,
          reasoning: data.reasoning
        }]);
      }
    });
  };

  return (
    <main className="container mx-auto flex gap-6 p-6 h-screen max-h-screen">

      {/* --------------------------------------------------- */}
      {/* LEFT PANE: Upload & Insights Dashboard (25%) */}
      {/* --------------------------------------------------- */}
      <div className="glass-card w-[25%] p-6 rounded-3xl flex flex-col overflow-hidden">

        {/* Header & Segmented Control */}
        <div className="mb-6">
          <h3 className="text-primary font-extrabold text-xl mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Workspace
          </h3>
          <div className="flex bg-white/50 p-1 rounded-xl shadow-inner border border-white/40">
            <button
              onClick={() => setLeftPaneView('documents')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${leftPaneView === 'documents' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-dark'}`}
            >
              Documents
            </button>
            <button
              onClick={() => setLeftPaneView('insights')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${leftPaneView === 'insights' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-dark'}`}
            >
              Daily Briefing
            </button>
          </div>
        </div>

        {/* --- VIEW: DOCUMENTS --- */}
        {leftPaneView === 'documents' && (
          <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary-light/50 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-white/50 mb-4 shrink-0"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="w-8 h-8 text-primary-light mx-auto mb-2 animate-spin" />
              ) : (
                <UploadCloud className="w-8 h-8 text-primary-light mx-auto mb-2" />
              )}
              <p className="text-xs text-text-muted">Click to upload files</p>
            </div>

            <div className="space-y-3 mb-4 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white rounded-lg border-none shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="flex-1 text-sm bg-white rounded-lg px-2 py-1.5 border-none shadow-sm focus:outline-none text-text-dark cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="processed">Processed Only</option>
                  <option value="pending">Pending Only</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {isLoadingDocs ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-primary-light" /></div>
              ) : isDocsError ? (
                <p className="text-xs text-red-500 text-center mt-4">Failed to connect to server.</p>
              ) : filteredDocuments?.length === 0 ? (
                <p className="text-sm text-text-muted text-center italic mt-4">No documents found.</p>
              ) : (
                filteredDocuments?.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm mb-2 border border-gray-100 transition-all hover:border-primary-light/30">
                    <FileText className={`w-4 h-4 shrink-0 ${doc.status === 'processed' ? 'text-accent' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate text-text-dark font-medium">{doc.filename}</p>
                      <p className="text-xs text-text-muted capitalize">{doc.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- VIEW: DAILY INSIGHTS --- */}
        {leftPaneView === 'insights' && (
          <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-primary to-primary-light p-4 rounded-2xl text-white mb-4 shrink-0 shadow-md">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                Proactive Intelligence
              </h4>
              <p className="text-xs mt-1 text-white/80">AI-generated analysis of your latest workspace activity.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {isLoadingInsights ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-primary-light" /></div>
              ) : isInsightsError ? (
                <p className="text-xs text-red-500 text-center mt-4">Failed to load insights.</p>
              ) : insights?.length === 0 ? (
                <p className="text-sm text-text-muted text-center italic mt-4">No insights generated yet.</p>
              ) : (
                insights?.map(insight => (
                  <div key={insight.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-primary-light/30 transition-all">

                    {/* Insight Category Badge */}
                    <div className="flex items-center gap-1.5 mb-2">
                      {insight.category === 'issue' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      {insight.category === 'decision' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                      {insight.category === 'conflict' && <Zap className="w-3.5 h-3.5 text-accent" />}
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${insight.category === 'issue' ? 'text-red-500' :
                        insight.category === 'decision' ? 'text-green-500' : 'text-accent'
                        }`}>
                        {insight.category}
                      </span>
                    </div>

                    {/* Insight Content */}
                    <h5 className="text-sm font-bold text-text-dark mb-1">{insight.title}</h5>
                    <p className="text-xs text-text-muted leading-relaxed line-clamp-3 mb-3">
                      {insight.description}
                    </p>

                    {/* Insight Sources */}
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mr-1 mt-0.5">Sources:</span>
                      {insight.source_document_ids?.map((id, idx) => (
                        <span key={idx} className="text-[10px] bg-background text-primary px-1.5 py-0.5 rounded border border-primary-light/20">
                          {id?.substring(0, 8)}...
                        </span>
                      ))}
                      {(!insight.source_document_ids || insight.source_document_ids.length === 0) && (
                        <span className="text-[10px] text-gray-400 italic mt-0.5">No specific sources cited</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------- */}
      {/* CENTER PANE: Chat Interface (Flex 1) */}
      {/* --------------------------------------------------- */}
      <div className="glass-card flex-1 rounded-3xl flex flex-col overflow-hidden relative">
        <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
              <div className={`p-5 shadow-chat ${msg.role === 'user'
                ? 'bg-gradient-to-br from-primary to-primary-light rounded-tl-3xl rounded-tr-3xl rounded-bl-3xl text-white'
                : 'bg-white rounded-tr-3xl rounded-tl-3xl rounded-br-3xl text-text-dark'
                }`}>
                <p className="leading-relaxed text-sm">{msg.content}</p>

                {/* --- UPDATED: Clickable Sources --- */}
                {msg.role === 'ai' && msg.sources && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveSource({ filename: src, reasoning: msg.reasoning })}
                          className="text-xs flex items-center gap-1.5 bg-background text-primary px-3 py-1.5 rounded-full border border-primary-light/20 hover:bg-primary-light hover:text-white transition-colors shadow-sm"
                        >
                          <FileText className="w-3 h-3" />
                          {src}
                        </button>
                      ))}
                    </div>
                    {msg.confidence && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                        <ShieldCheck className="w-4 h-4" />
                        {Math.round(msg.confidence * 100)}% Confidence Match
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {askMutation.isPending && (
            <div className="self-start max-w-[80%]">
              <div className="bg-white p-5 rounded-tr-3xl rounded-tl-3xl rounded-br-3xl shadow-chat flex gap-2">
                <div className="w-2 h-2 bg-primary-light rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-light rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-primary-light rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleAskQuestion} className="p-5 bg-white/60 border-t border-white/40 flex gap-4 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 p-4 px-6 text-sm rounded-full border-none bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-light"
            disabled={askMutation.isPending}
          />
          <button type="submit" disabled={askMutation.isPending || !input.trim()} className="btn-primary p-4 rounded-full">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* --------------------------------------------------- */}
      {/* RIGHT PANE: Source Preview (Bonus Feature) */}
      {/* --------------------------------------------------- */}
      {activeSource && (
        <div className="glass-card w-[30%] rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
          {/* Header */}
          <div className="p-6 border-b border-white/40 bg-white/40 flex items-center justify-between">
            <h3 className="text-primary font-bold flex items-center gap-2">
              <Info className="w-5 h-5" />
              Source Details
            </h3>
            <button
              onClick={() => setActiveSource(null)}
              className="p-1.5 hover:bg-white rounded-full text-gray-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <FileText className="w-8 h-8 text-accent mb-3" />
              <h4 className="font-semibold text-text-dark break-words">{activeSource.filename}</h4>
              <p className="text-xs text-text-muted mt-1">Verified Database Source</p>
            </div>

            <div className="space-y-4">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Reasoning</h5>
              <div className="bg-gradient-to-b from-white to-transparent p-4 rounded-xl border border-white/50 text-sm text-gray-700 leading-relaxed shadow-sm">
                {/* Render the actual AI reasoning here! */}
                {activeSource.reasoning || "No detailed reasoning was provided for this extraction."}
              </div>

              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 mt-4">
                <p className="text-xs text-primary-dark">
                  <strong>Why this panel exists:</strong> In an enterprise setting, transparency is critical. This panel proves to the user exactly where the RAG pipeline sourced its facts, preventing hallucinations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
