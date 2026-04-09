import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatWidget({ hidden }: { hidden?: boolean }) {
  if (hidden) return null;
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          context: 'family_accounting'
        })
      });

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu mensaje.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: 'Error de conexión. Asegúrate de que el servidor API esté funcionando.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetConversation = () => {
    if (chatMessages.length > 0 && !window.confirm('¿Borrar la conversación actual?')) return;
    setChatMessages([]);
  };

  return (
    <>
      {/* Floating button with glow pulse */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-purple-500 text-white p-4 rounded-2xl shadow-glow-lg hover:shadow-glow transition-all duration-300 z-40 hover:scale-105 active:scale-95 group"
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <MessageCircle size={24} className="group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[28rem] glass rounded-2xl shadow-glass-lg flex flex-col z-50 animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-primary to-purple-500 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Asistente Familiar</h3>
                <p className="text-[10px] text-white/70">Siempre disponible</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {chatMessages.length > 0 && (
                <button
                  onClick={resetConversation}
                  className="text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  title="Nueva conversación"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={20} className="text-primary" />
                </div>
                <p className="text-slate-600 text-sm font-medium mb-1">
                  ¡Hola! Soy tu asistente
                </p>
                <p className="text-slate-400 text-xs">
                  Puedo informarte sobre gastos, ingresos y balance mensual.
                </p>
              </div>
            )}
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`animate-fade-in ${
                  msg.role === 'user'
                    ? 'ml-auto bg-gradient-to-r from-primary to-purple-500 text-white'
                    : 'mr-auto bg-slate-100 text-slate-800'
                } px-4 py-2.5 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap shadow-sm ${
                  msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-sm animate-fade-in">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs">Pensando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: 'var(--color-sidebar-border)' }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                className="input-modern flex-1 !py-2.5 !text-sm !rounded-xl"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-primary to-purple-500 text-white p-2.5 rounded-xl hover:shadow-glow disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
