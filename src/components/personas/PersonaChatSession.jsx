import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Copy, CheckCircle2, ChevronDown, ChevronUp, Star, Trash2, Plus, MessageSquare, HelpCircle, Download } from 'lucide-react';
import { getElasticsearchConfig } from '@/components/admin/ElasticsearchDataSource';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getSessions(personaName) {
  try {
    return JSON.parse(localStorage.getItem(`sessions_${personaName}`) || '[]');
  } catch { return []; }
}

function saveSessions(personaName, sessions) {
  localStorage.setItem(`sessions_${personaName}`, JSON.stringify(sessions));
}

export default function PersonaChatSession({ open, onOpenChange, persona, initialQuestion, allQuestions, endpoint, model }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [currentModel, setCurrentModel] = useState(model || 'llama3.2');
  const [availableModels, setAvailableModels] = useState([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [scores, setScores] = useState({});
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const bottomRef = useRef(null);

  const expertiseSection = persona?.expertise_areas?.length
    ? `\n\nExpertise Areas: ${persona.expertise_areas.join(', ')}`
    : '';
  const systemPrompt = `You are ${persona?.name}. ${persona?.description || ''}\n\n${persona?.instructions || ''}${expertiseSection}`.trim();

  // Load sessions list when dialog opens
  useEffect(() => {
    if (!open || !persona?.name) return;
    setInput('');
    setShowPrompt(false);

    const loaded = getSessions(persona.name);
    setSessions(loaded);

    if (endpoint) {
      fetch(`${endpoint}/v1/models`)
        .then(r => r.json())
        .then(d => setAvailableModels((d.data || []).map(m => m.id)))
        .catch(() => {});
    }

    // Resume latest session or start fresh
    if (loaded.length > 0) {
      const latest = loaded[0];
      setActiveSessionId(latest.id);
      setMessages(latest.messages);
      setScores(latest.scores || {});
    } else {
      startNewSession([]);
    }
  }, [open, persona?.name]);

  // Auto-send all questions when opened with allQuestions but no initialQuestion
  useEffect(() => {
    if (!open || initialQuestion || !allQuestions?.length) return;
    const run = async () => {
      let current = [{ role: 'system', content: systemPrompt }];
      setMessages(current);
      setIsLoading(true);
      try {
        for (const q of allQuestions) {
          current = [...current, { role: 'user', content: q }];
          setMessages(current);
          let reply;
          try { reply = await fetchReply(current); }
          catch (e) { reply = { role: 'assistant', content: `Error: ${e.message}` }; }
          current = [...current, reply];
          setMessages(current);
        }
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [open, allQuestions, initialQuestion]);

  // Trigger initial question for fresh sessions — auto-submit
  useEffect(() => {
    if (!open || !initialQuestion) return;
    const todayTitle = `${formatDate(Date.now())} — ${persona?.name}`;
    const loaded = getSessions(persona?.name);
    const existing = loaded.find(s => s.title === todayTitle);
    const id = existing ? existing.id : Date.now().toString();
    const updated = [{ role: 'system', content: systemPrompt }, { role: 'user', content: initialQuestion }];
    setActiveSessionId(id);
    setMessages(updated);
    setScores(existing?.scores || {});
    doSend(updated);
  }, [open, initialQuestion]);

  // Persist active session whenever messages/scores change (only if there's at least one user message)
  useEffect(() => {
    const hasUserMessage = messages.some(m => m.role === 'user');
    if (!persona?.name || !activeSessionId || !hasUserMessage) return;
    setSessions(prev => {
      const existing = prev.find(s => s.id === activeSessionId);
      const sessionData = {
        id: activeSessionId,
        title: existing?.title || `${formatDate(Date.now())} — ${persona.name}`,
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
        messages,
        scores,
        dbId: existing?.dbId // track the backend record id
      };
      const updated = existing
        ? prev.map(s => s.id === activeSessionId ? sessionData : s)
        : [sessionData, ...prev];
      saveSessions(persona.name, updated);
      // Sync to ChatSession entity
      syncSessionToDb(sessionData, persona);
      return updated;
    });
  }, [messages, scores]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Map local session id -> db record id
  const dbIdMapRef = useRef({});

  const syncSessionToDb = async (sessionData, personaData) => {
    const userMessages = sessionData.messages.filter(m => m.role !== 'system');
    if (userMessages.length === 0) return;
    try {
      const esConfig = getElasticsearchConfig();
      const index = esConfig.indices?.['ChatSession'] || 'prompt-hub-session';
      const esEndpoint = esConfig.endpoint;
      if (!esEndpoint) return;

      const payload = {
        title: sessionData.title,
        persona_id: personaData?.id || personaData?.name,
        persona_name: personaData?.name,
        persona_icon: personaData?.icon,
        messages: sessionData.messages,
        model: currentModel,
        session_date: new Date().toISOString().slice(0, 10),
        message_count: userMessages.length,
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      const existingDbId = dbIdMapRef.current[sessionData.id];
      if (existingDbId) {
        // Update existing ES doc
        await fetch(`${esEndpoint}/${index}/_update/${existingDbId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doc: payload, doc_as_upsert: true })
        });
      } else {
        // Create new ES doc using the local session id as the ES doc id for stable references
        const res = await fetch(`${esEndpoint}/${index}/_doc/${sessionData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          dbIdMapRef.current[sessionData.id] = sessionData.id;
        }
      }
    } catch (e) {
      // silent fail — localStorage is the source of truth
    }
  };

  const startNewSession = (existingSessions = sessions) => {
    const id = Date.now().toString();
    setActiveSessionId(id);
    setMessages([{ role: 'system', content: systemPrompt }]);
    setScores({});
    // Don't add to sessions list yet — it will be added on first user message via the persist effect
  };

  const loadSession = (session) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setScores(session.scores || {});
  };

  const deleteSession = (id, e) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    saveSessions(persona.name, updated);
    if (activeSessionId === id) {
      if (updated.length > 0) {
        loadSession(updated[0]);
      } else {
        startNewSession([], false);
      }
    }
  };

  const fetchReply = async (history) => {
    if (!endpoint) return null;
    const payload = [
      { role: 'system', content: systemPrompt },
      ...history.filter(m => m.role !== 'system')
    ];
    const res = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: currentModel, messages: payload, stream: false })
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();
    return { role: 'assistant', content: data?.choices?.[0]?.message?.content || 'No response.' };
  };

  const doSend = async (history) => {
    if (!endpoint) return null;
    setIsLoading(true);
    let reply;
    try {
      reply = await fetchReply(history);
    } catch (e) {
      reply = { role: 'assistant', content: `Error: ${e.message}` };
    } finally {
      setIsLoading(false);
    }
    setMessages(prev => [...prev, reply]);
    return reply;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    const updated = [...messages, { role: 'user', content: text }];
    setMessages(updated);
    setInput('');
    await doSend(updated);
  };

  const copyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const visibleMessages = messages.filter(m => m.role !== 'system');

  const exchanges = [];
  for (let i = 0; i < visibleMessages.length; i++) {
    if (visibleMessages[i].role === 'user') {
      const assistantIdx = i + 1;
      exchanges.push({
        user: visibleMessages[i].content,
        assistant: visibleMessages[assistantIdx]?.content || null,
        score: scores[assistantIdx] || null
      });
      i++;
    }
  }

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="flex flex-1 min-h-0">

          {/* Sidebar */}
          <div className="w-52 flex-shrink-0 border-r bg-gray-50 flex flex-col">
            <div className="px-3 pt-4 pb-2 border-b flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sessions</span>
              <div className="flex items-center gap-1">
                {sessions.length > 0 && (
                  <button
                    title="Export all sessions"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${persona?.name}_sessions.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  title="New session"
                  onClick={() => startNewSession()}
                  className="text-gray-400 hover:text-emerald-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="py-1">
                {sessions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => loadSession(s)}
                    className={`group flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-white transition-colors ${s.id === activeSessionId ? 'bg-white border-r-2 border-emerald-500' : ''}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{formatDate(s.createdAt)}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {s.messages.filter(m => m.role === 'user').length} msg{s.messages.filter(m => m.role === 'user').length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6 px-3">No sessions yet</p>
                )}
              </div>
              {/* Test Questions in sidebar */}
              {persona?.test_questions?.length > 0 && (
                <div className="border-t pt-2 pb-2">
                  <div className="px-3 pb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Questions</span>
                    <span className="text-xs text-gray-400">{persona.test_questions.length}</span>
                  </div>
                  <div className="px-2 space-y-0.5">
                    {persona.test_questions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const updated = [...messages, { role: 'user', content: q }];
                          setMessages(updated);
                          setInput('');
                          doSend(updated);
                        }}
                        className="w-full text-left text-xs bg-white hover:bg-purple-50 text-gray-600 hover:text-purple-700 border border-gray-100 hover:border-purple-200 rounded-lg px-2.5 py-1.5 transition-colors flex items-start gap-1.5"
                        title={q}
                      >
                        <HelpCircle className="w-3 h-3 flex-shrink-0 mt-0.5 text-purple-400" />
                        <span className="line-clamp-2 leading-tight">{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Main chat area */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Header */}
            <DialogHeader className="px-5 pt-4 pb-3 border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${persona?.color} flex items-center justify-center text-xl flex-shrink-0`}>
                  {persona?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-base truncate">{activeSession?.title || persona?.name}</DialogTitle>
                  <p className="text-xs text-gray-400">{persona?.tone} tone • {currentModel}</p>
                </div>
                {availableModels.length > 0 && (
                  <Select value={currentModel} onValueChange={setCurrentModel}>
                    <SelectTrigger className="w-36 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map(m => (
                        <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </DialogHeader>

            {/* Final Prompt collapsible */}
            <div className="flex-shrink-0 border-b">
              <button
                className="w-full flex items-center justify-between px-5 py-2 bg-purple-50 hover:bg-purple-100 transition-colors text-left"
                onClick={() => setShowPrompt(v => !v)}
              >
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Instructions</span>
                {showPrompt ? <ChevronUp className="w-4 h-4 text-purple-500" /> : <ChevronDown className="w-4 h-4 text-purple-500" />}
              </button>
              {showPrompt && (
                <div className="px-5 py-3 bg-purple-50 border-t border-purple-100 relative group">
                  <pre className="text-xs text-purple-900 whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto pr-6">
                    {systemPrompt}
                  </pre>
                  <button className="absolute top-3 right-5 opacity-60 hover:opacity-100" onClick={() => copyText(systemPrompt, 'prompt')}>
                    {copiedIdx === 'prompt' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-purple-500" />}
                  </button>
                </div>
              )}
            </div>

            {/* Chat messages */}
            <ScrollArea className="flex-1 px-5 py-4">
              <div className="space-y-4">
                {visibleMessages.length === 0 && !isLoading && (
                  <p className="text-sm text-gray-400 text-center py-8">Send a message to begin.</p>
                )}
                {visibleMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm relative group ${
                      msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-800'
                    }`}>
                      <p className={`whitespace-pre-wrap leading-relaxed ${msg.role === 'assistant' ? 'line-clamp-3' : ''}`}>{msg.content}</p>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {[1,2,3,4,5].map(star => (
                            <button key={star} onClick={() => setScores(s => ({ ...s, [idx]: star }))}>
                              <Star className={`w-3 h-3 transition-colors ${scores[idx] >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                            </button>
                          ))}
                          {scores[idx] && <span className="ml-1 text-xs text-amber-500">{scores[idx]}/5</span>}
                        </div>
                      )}
                      <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyText(msg.content, idx)}>
                        {copiedIdx === idx
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          : <Copy className={`w-3.5 h-3.5 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      <span className="text-xs text-gray-400">Thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Results summary */}
            {exchanges.length > 0 && (
              <div className="flex-shrink-0 border-t bg-gray-50 px-5 py-3 max-h-44 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Results ({exchanges.length} exchange{exchanges.length > 1 ? 's' : ''})</p>
                <div className="space-y-2">
                  {exchanges.map((ex, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                      <p className="text-emerald-700 font-medium truncate">Q: {ex.user}</p>
                      {ex.assistant ? (
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-gray-400 italic text-xs">Response received</span>
                          <span className="flex items-center gap-0.5 flex-shrink-0">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={`w-3 h-3 ${ex.score >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                            {ex.score && <span className="ml-1 text-amber-600 font-medium">{ex.score}/5</span>}
                          </span>
                        </div>
                      ) : (
                        <p className="text-gray-400 mt-1 italic">Waiting for response…</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-5 py-3 border-t flex-shrink-0">
              {/* Custom input + Send All */}
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Type a message…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>

              </div>

            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}