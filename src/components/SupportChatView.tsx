/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, HelpCircle, AlertCircle } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'model';
  text: string;
}

export default function SupportChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'model',
      text: 'Olá! Sou o assistente do Rayvora Vision Pro e posso ajudar com identificação do animal, estimativa de peso, organização do histórico e dicas de manejo. Como posso ajudar hoje?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const payload = [...messages, userMsg];
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload })
      });

      if (!res.ok) {
        throw new Error('Servidor indisponível.');
      }

      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'model', text: data.response }]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        sender: 'model', 
        text: 'Desculpe, houve uma instabilidade de conexão no momento. Você pode tentar novamente em instantes.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const commonQuestions = [
    'Como melhorar a estimativa de peso a partir da foto?',
    'Qual é a melhor forma de identificar o animal pelo brinco?',
    'Como organizar o histórico de avaliações do rebanho?',
    'Como revisar um registro anterior no histórico?'
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col justify-between max-w-4xl mx-auto bg-white dark:bg-[#0e1320] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden text-left">
      {/* Title block */}
      <div className="bg-[#0f2d5c] dark:bg-blue-950 text-white p-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/30">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="h-5 w-5 text-sky-300 shrink-0" />
          <div className="text-left">
            <h2 className="text-sm font-bold tracking-tight">Suporte Tecnico BoviAsis AI</h2>
            <span className="text-[10px] text-sky-300 font-mono">Rayvora Vision Pro Precision Core</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-start sm:justify-end">
            <span className="text-[9px] font-mono text-sky-305 text-sky-300 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/40 uppercase font-bold shrink-0">YOLOv8 Rump-Segment active</span>
            <span className="text-[9px] font-mono text-sky-305 text-sky-300 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/40 uppercase font-bold shrink-0">Sacral Fat Gauge 3D active</span>
          </div>
        </div>
      </div>

      {/* Messages layout pane */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
              <div className={`max-w-[75%] rounded-lg p-3.5 text-xs inline-block ${
                isUser 
                  ? 'bg-[#1e3a8a] dark:bg-blue-800 text-white shadow-sm rounded-br-none' 
                  : 'bg-[#f3f4f5] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none'
              }`}>
                {/* Avatar Row */}
                <div className="flex items-center gap-1.5 mb-1.5 border-b border-white/10 dark:border-gray-850 pb-1 opacity-75 font-mono text-[9px] font-bold">
                  {isUser ? (
                    <>
                      <User className="h-3 w-3" />
                      <span>VOCÊ (AGRÔNOMO)</span>
                    </>
                  ) : (
                    <>
                      <span>Rayvora Vision Pro</span>
                    </>
                  )}
                </div>
                
                {/* Actual Message */}
                <span className="leading-relaxed whitespace-pre-line text-xs font-sans">
                  {m.text}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing loading message */}
        {loading && (
          <div className="flex justify-start w-full">
            <div className="max-w-[75%] bg-gray-50 dark:bg-[#111827] rounded-lg p-4 border border-dashed border-gray-200 dark:border-gray-800 text-xs">
              <div className="flex items-center gap-2 font-mono text-gray-500 scroll-m-0.5 animate-pulse">
                <Send className="h-3.5 w-3.5 animate-spin text-[#1e3a8a] dark:text-sky-400" />
                <span>Especialista virtual consultando diretrizes agronômicas...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts buttons */}
      {messages.length === 1 && (
        <div className="px-4 py-2 shrink-0 bg-[#f8f9fa] dark:bg-[#111827] border-t border-gray-150 dark:border-gray-800 text-left">
          <span className="text-[9px] font-mono font-bold text-gray-400 dark:text-gray-500 block mb-1.5 uppercase tracking-wider">Tópicos Sugeridos:</span>
          <div className="flex flex-wrap gap-1.5">
            {commonQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                className="text-[10px] bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-gray-700 dark:text-gray-300 hover:text-[#1e3a8a] dark:hover:text-sky-305 dark:hover:text-sky-300 transition-all border border-gray-200 dark:border-gray-850 rounded px-2.5 py-1 text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input row block */}
      <div className="p-3 bg-gray-50 dark:bg-[#111827] border-t border-gray-150 dark:border-gray-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            required
            placeholder="Perguntar ao veterinário virtual..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            className="flex-1 h-11 px-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded text-xs focus:outline-[#1e3a8a] dark:focus:outline-sky-500 dark:text-gray-150 dark:placeholder-gray-500 disabled:opacity-50 font-sans"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="h-11 px-4 text-xs font-mono font-bold uppercase rounded bg-[#1e3a8a] hover:bg-blue-900 dark:bg-blue-800 dark:hover:bg-blue-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
          >
            <span>Perguntar</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
