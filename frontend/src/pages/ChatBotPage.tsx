import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Settings, Zap, Brain, X, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface LlmSettings {
  configured: boolean;
  provider: string;
  model: string;
  updated_at: string;
}

const suggestedQuestions = [
  '¿Cuánto hemos gastado este mes?',
  '¿Cuáles son los mayores gastos?',
  '¿Cuánto queda de presupuesto?',
  'Análisis de gastos familiares',
];

const GROQ_MODELS = [
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Recomendado)', description: 'Más potente, contexto 128k' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', description: 'Rápido, contexto 32k' },
];

function LlmSettingsModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/llm/settings`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.configured) {
          setApiKey('••••••••••••••••');
        }
        setModel(data.model || 'llama-3.3-70b-versatile');
      });
  }, []);

  const handleTest = async () => {
    if (!apiKey || apiKey === '••••••••••••••••') {
      setTestResult({ success: false, message: 'Introduce una API key válida' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`${API_URL}/api/llm/test`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, model })
      });
      const data = await res.json();
      setTestResult(data.success ? { success: true, message: data.message } : { success: false, message: data.error });
    } catch {
      setTestResult({ success: false, message: 'Error de conexión' });
    }
    setTesting(false);
  };

  const handleSave = async () => {
    if (!apiKey || apiKey === '••••••••••••••••') {
      setTestResult({ success: false, message: 'Introduce una API key válida' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/llm/settings`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, model })
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = await res.json();
        setTestResult({ success: false, message: data.error });
      }
    } catch {
      setTestResult({ success: false, message: 'Error guardando' });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Brain className="text-purple-500" size={24} />
            Configurar IA Avanzada
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              <strong>Groq</strong> es gratuito y muy rápido. Obtén tu API key gratis en{' '}
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline font-medium inline-flex items-center gap-1"
              >
                console.groq.com
                <ExternalLink size={14} />
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key de Groq
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="gsk_xxxxxxxxxxxx"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modelo
            </label>
            <div className="space-y-2">
              {GROQ_MODELS.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    model === m.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.value}
                    checked={model === m.value}
                    onChange={(e) => setModel(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{m.label}</p>
                    <p className="text-sm text-gray-500">{m.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleTest}
            disabled={testing || !apiKey}
            className="flex-1 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-50"
          >
            {testing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Probando...
              </span>
            ) : (
              'Probar conexión'
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !apiKey}
            className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Guardando...
              </span>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatBotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'quick' | 'advanced'>('quick');
  const [llmSettings, setLlmSettings] = useState<LlmSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/llm/settings`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(setLlmSettings)
      .catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const endpoint = mode === 'advanced' ? '/api/chat/llm' : '/api/chat';
      const body = mode === 'advanced' 
        ? { message: input, session_id: 'web' }
        : { message: input, context: 'family_accounting' };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el servidor');
      }

      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu mensaje.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Error de conexión.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModeChange = (newMode: 'quick' | 'advanced') => {
    if (newMode === 'advanced' && !llmSettings?.configured) {
      setShowSettings(true);
      return;
    }
    setMode(newMode);
    setMessages([]);
  };

  const canUseAdvanced = llmSettings?.configured;

  return (
    <div className="p-8 h-[calc(100vh-2rem)]">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Bot className="text-primary" size={28} />
                Chat IA
              </h2>
              <p className="text-gray-500 mt-1">
                {mode === 'quick' 
                  ? 'Respuestas rápidas basadas en tus datos'
                  : 'Modo avanzado con IA generativa'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleModeChange('quick')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    mode === 'quick' 
                      ? 'bg-white shadow-sm text-primary font-medium' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Zap size={16} />
                  Rápido
                </button>
                <button
                  onClick={() => handleModeChange('advanced')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    mode === 'advanced' 
                      ? 'bg-white shadow-sm text-purple-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Brain size={16} />
                  Avanzado
                  {!canUseAdvanced && (
                    <span className="w-2 h-2 bg-yellow-500 rounded-full" title="Configurar" />
                  )}
                </button>
              </div>
              
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Configurar IA"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className={`mx-auto mb-4 ${mode === 'advanced' ? 'text-purple-300' : 'text-gray-300'}`} size={48} />
              <p className="text-gray-500 mb-6">
                {mode === 'quick' 
                  ? '¿En qué puedo ayudarte hoy?' 
                  : 'Chatea con IA avanzada sobre tu economía familiar'
                }
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuestion(q)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      mode === 'advanced'
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-primary hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              
              {mode === 'advanced' && !canUseAdvanced && (
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                  <p className="text-yellow-800 text-sm">
                    <strong>Modo avanzado no configurado.</strong><br />
                    Haz clic en el icono ⚙️ para configurar tu API key de Groq.
                  </p>
                </div>
              )}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-primary' 
                    : mode === 'advanced' ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="text-white" size={16} />
                  ) : (
                    mode === 'advanced' ? (
                      <Brain className="text-purple-600" size={16} />
                    ) : (
                      <Bot className="text-gray-600" size={16} />
                    )
                  )}
                </div>
                <div className={`max-w-[70%] px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : mode === 'advanced'
                      ? 'bg-purple-50 text-gray-800'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                mode === 'advanced' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                {mode === 'advanced' ? (
                  <Brain className="text-purple-600 animate-pulse" size={16} />
                ) : (
                  <Bot className="text-gray-600" size={16} />
                )}
              </div>
              <div className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
                mode === 'advanced' ? 'bg-purple-50' : 'bg-gray-100'
              }`}>
                <Loader2 className="animate-spin text-gray-500" size={16} />
                <span className="text-gray-500 text-sm">
                  {mode === 'advanced' ? 'Pensando con IA avanzada...' : 'Pensando...'}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={mode === 'advanced' ? 'Pregunta algo a la IA avanzada...' : 'Escribe tu pregunta...'}
              className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                mode === 'advanced' 
                  ? 'focus:ring-purple-500 border-purple-200' 
                  : 'focus:ring-primary'
              }`}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                mode === 'advanced' ? 'bg-purple-600' : 'bg-primary'
              }`}
            >
              <Send size={18} />
              Enviar
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <LlmSettingsModal 
          onClose={() => setShowSettings(false)} 
          onSaved={() => {
            fetch(`${API_URL}/api/llm/settings`, { headers: getAuthHeaders() })
              .then(res => res.json())
              .then(setLlmSettings)
              .then(() => {
                setMode('advanced');
                setMessages([]);
              });
          }}
        />
      )}
    </div>
  );
}
