/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Plus, 
  Trash2, 
  Activity, 
  Cpu, 
  Database as DbIcon, 
  MessageSquare, 
  Settings, 
  ChevronRight,
  Loader2,
  Box,
  Zap,
  ShieldCheck,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Session, SessionEvent, AgentType } from './types';

const AGENTS: { id: AgentType; name: string; icon: React.ReactNode }[] = [
  { id: 'claude', name: 'Claude Code', icon: <Zap className="w-4 h-4" /> },
  { id: 'codex', name: 'Codex', icon: <Code className="w-4 h-4" /> },
  { id: 'opencode', name: 'OpenCode', icon: <Box className="w-4 h-4" /> },
  { id: 'amp', name: 'Amp', icon: <Activity className="w-4 h-4" /> },
  { id: 'mock', name: 'Mock Agent', icon: <ShieldCheck className="w-4 h-4" /> },
];

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      fetchEvents(activeSessionId);
      const interval = setInterval(() => fetchEvents(activeSessionId), 3000);
      return () => clearInterval(interval);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data);
      if (data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const fetchEvents = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}/events`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const createSession = async (agent: AgentType) => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent }),
      });
      const data = await res.json();
      await fetchSessions();
      setActiveSessionId(data.id);
    } catch (err) {
      console.error("Failed to create session:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      await fetchSessions();
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setEvents([]);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const sendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !activeSessionId) return;

    const currentPrompt = prompt;
    setPrompt('');
    
    try {
      await fetch(`/api/sessions/${activeSessionId}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentPrompt }),
      });
      fetchEvents(activeSessionId);
    } catch (err) {
      console.error("Failed to send prompt:", err);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#E4E3E0] font-sans selection:bg-[#E4E3E0] selection:text-[#0A0A0A]">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[#1F1F1F] flex flex-col bg-[#0F0F0F]">
        <div className="p-6 border-b border-[#1F1F1F]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-[#E4E3E0] rounded flex items-center justify-center">
              <Terminal className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <h1 className="font-mono text-sm font-bold tracking-tighter uppercase">Sandbox Agent</h1>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase opacity-40 mb-2 px-2">New Session</p>
            <div className="grid grid-cols-1 gap-1">
              {AGENTS.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => createSession(agent.id)}
                  disabled={isCreating}
                  className="flex items-center gap-3 px-3 py-2 text-xs font-mono rounded hover:bg-[#1F1F1F] transition-colors text-left group disabled:opacity-50"
                >
                  <span className="opacity-50 group-hover:opacity-100">{agent.icon}</span>
                  <span>{agent.name}</span>
                  <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-40" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="text-[10px] font-mono uppercase opacity-40 mb-4 px-2">Active Sessions</p>
          <div className="space-y-1">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`group flex items-center gap-3 px-3 py-3 rounded cursor-pointer transition-all border ${
                  activeSessionId === session.id 
                    ? 'bg-[#1F1F1F] border-[#333]' 
                    : 'border-transparent hover:bg-[#161616]'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${session.status === 'running' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate">{session.agent}</p>
                  <p className="text-[9px] font-mono opacity-30 uppercase">{session.id.substring(0, 8)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-40 hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#1F1F1F] bg-[#0A0A0A]">
          <div className="flex items-center justify-between text-[10px] font-mono opacity-40">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3" />
              <span>SYSTEM OK</span>
            </div>
            <span>v0.3.x</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-[#0A0A0A]">
        {activeSessionId ? (
          <>
            {/* Header */}
            <header className="h-16 border-b border-[#1F1F1F] flex items-center justify-between px-8 bg-[#0F0F0F]/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-6">
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                    {activeSession?.agent} 
                    <span className="text-[10px] opacity-30 font-normal">/ {activeSession?.id}</span>
                  </h2>
                </div>
                <div className="h-4 w-[1px] bg-[#1F1F1F]" />
                <div className="flex items-center gap-4 text-[10px] font-mono opacity-50">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3" />
                    <span>0.4% CPU</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DbIcon className="w-3 h-3" />
                    <span>12.4MB RAM</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-[#1F1F1F] rounded transition-colors opacity-60 hover:opacity-100">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Events Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth"
            >
              <AnimatePresence initial={false}>
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${event.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${
                      event.sender === 'system' 
                        ? 'w-full text-center py-4' 
                        : ''
                    }`}>
                      {event.sender === 'system' ? (
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-20 border-y border-[#1F1F1F] py-1 px-8">
                          {event.payload.text}
                        </span>
                      ) : (
                        <div className={`flex gap-4 ${event.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border ${
                            event.sender === 'user' 
                              ? 'bg-[#E4E3E0] border-[#E4E3E0]' 
                              : 'bg-[#1F1F1F] border-[#333]'
                          }`}>
                            {event.sender === 'user' ? (
                              <ChevronRight className="w-4 h-4 text-[#0A0A0A]" />
                            ) : (
                              <Box className="w-4 h-4 text-[#E4E3E0]" />
                            )}
                          </div>
                          <div className={`space-y-1 ${event.sender === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`px-4 py-3 rounded-lg text-sm font-mono leading-relaxed ${
                              event.sender === 'user'
                                ? 'bg-[#1F1F1F] text-[#E4E3E0] border border-[#333]'
                                : 'bg-[#0F0F0F] text-[#E4E3E0] border border-[#1F1F1F]'
                            }`}>
                              {event.payload.text}
                            </div>
                            <p className="text-[9px] font-mono opacity-20 uppercase">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-8 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent">
              <form 
                onSubmit={sendPrompt}
                className="max-w-4xl mx-auto relative group"
              >
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Send a command to the sandbox..."
                  className="w-full bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl px-6 py-4 text-sm font-mono focus:outline-none focus:border-[#444] transition-all pr-16 shadow-2xl"
                />
                <button 
                  type="submit"
                  disabled={!prompt.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#E4E3E0] text-[#0A0A0A] rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
              <p className="text-center text-[9px] font-mono opacity-20 mt-4 uppercase tracking-widest">
                Press Enter to execute • Sandbox is isolated
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-[#1F1F1F] rounded-2xl flex items-center justify-center mb-8 border border-[#333]">
              <Terminal className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-lg font-mono font-bold uppercase tracking-widest mb-2">No Active Session</h3>
            <p className="text-sm font-mono opacity-40 max-w-xs mx-auto mb-8">
              Select an agent from the sidebar to initialize a new sandboxed environment.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {AGENTS.slice(0, 3).map(agent => (
                <button
                  key={agent.id}
                  onClick={() => createSession(agent.id)}
                  className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#252525] border border-[#333] rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all"
                >
                  Start {agent.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Status Overlay */}
      <div className="fixed top-6 right-6 flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 bg-[#0F0F0F]/80 backdrop-blur-md border border-[#1F1F1F] rounded-full flex items-center gap-2 shadow-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Live Connection</span>
        </div>
      </div>
    </div>
  );
}
