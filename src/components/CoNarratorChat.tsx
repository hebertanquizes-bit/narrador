'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Lightbulb } from 'lucide-react';

interface Message {
  role: 'narrator' | 'user';
  content: string;
  timestamp: Date;
}

interface CoNarratorChatProps {
  sessionId: string;
  campaign: string;
  onSuggestEncounter?: (level: number, partySize: number) => void;
}

export function CoNarratorChat({
  sessionId,
  campaign,
  onSuggestEncounter,
}: CoNarratorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEncounterForm, setShowEncounterForm] = useState(false);
  const [encounterLevel, setEncounterLevel] = useState(3);
  const [partySize, setPartySize] = useState(4);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/co-narrator/history/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(
            data.history.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };

    loadHistory();
  }, [sessionId]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/co-narrator/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          campaign,
          searchAssets: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.history.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Suggest encounter
  const handleSuggestEncounter = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/co-narrator/encounter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: encounterLevel,
          partySize,
          campaign,
          searchAssets: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const encounterMsg: Message = {
          role: 'narrator',
          content: data.encounter,
          timestamp: new Date(),
        };
        setMessages([...messages, encounterMsg]);
        setShowEncounterForm(false);
        onSuggestEncounter?.(encounterLevel, partySize);
      }
    } catch (error) {
      console.error('Failed to suggest encounter:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-rpg-dark border border-rpg-accent rounded-lg">
      {/* Header */}
      <div className="bg-rpg-darker p-4 border-b border-rpg-accent">
        <h3 className="text-lg font-bold text-rpg-gold">Co-Narrator 🎭</h3>
        <p className="text-sm text-rpg-light">{campaign}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-rpg-accent py-8">
            <p className="text-sm">Ask for advice, encounter ideas, or rules clarification...</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded ${
                msg.role === 'user'
                  ? 'bg-rpg-accent text-rpg-dark'
                  : 'bg-rpg-darker border border-rpg-gold text-rpg-light'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-rpg-darker border border-rpg-gold text-rpg-light px-4 py-2 rounded flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Encounter Form */}
      {showEncounterForm && (
        <div className="bg-rpg-darker p-4 border-t border-rpg-accent space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-rpg-light">Party Level</label>
              <input
                type="number"
                min="1"
                max="20"
                value={encounterLevel}
                onChange={(e) => setEncounterLevel(parseInt(e.target.value))}
                className="w-full bg-rpg-dark text-rpg-light border border-rpg-accent rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-rpg-light">Party Size</label>
              <input
                type="number"
                min="1"
                max="8"
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value))}
                className="w-full bg-rpg-dark text-rpg-light border border-rpg-accent rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleSuggestEncounter}
            disabled={loading}
            className="w-full bg-rpg-accent text-rpg-dark py-2 rounded font-semibold text-sm hover:opacity-90 disabled:opacity-50"
          >
            Generate Encounter
          </button>
          <button
            onClick={() => setShowEncounterForm(false)}
            className="w-full bg-rpg-dark text-rpg-light border border-rpg-accent py-2 rounded text-sm hover:bg-rpg-darker"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-rpg-darker p-4 border-t border-rpg-accent space-y-2">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask for advice..."
            className="flex-1 bg-rpg-dark text-rpg-light border border-rpg-accent rounded px-3 py-2 text-sm focus:outline-none focus:border-rpg-gold disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-rpg-accent text-rpg-dark p-2 rounded hover:opacity-90 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>

        <button
          onClick={() => setShowEncounterForm(!showEncounterForm)}
          disabled={loading}
          className="w-full bg-rpg-dark text-rpg-light border border-rpg-accent py-2 rounded text-sm hover:bg-rpg-darker flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Lightbulb size={16} />
          Suggest Encounter
        </button>
      </div>
    </div>
  );
}
