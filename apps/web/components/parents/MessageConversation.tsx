"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Link as LinkIcon, Send } from 'lucide-react';
import Link from 'next/link';
import {
  messagesService,
  type ParentMessage,
} from '@/lib/services/services/messages.service';
import { useAuth } from '@/contexts/AuthContext';

function formatTime(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessageConversation({ schoolId }: { schoolId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ParentMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadThread = useCallback(async () => {
    if (!user) return;
    const thread = await messagesService.listParentThreadMessages(schoolId, user.id);
    setMessages(thread);
  }, [schoolId, user]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!user) return;
      try {
        const thread = await messagesService.listParentThreadMessages(schoolId, user.id);
        if (mounted) {
          setMessages(thread);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [schoolId, user]);

  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      if (!sending) {
        void loadThread();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loadThread, loading, sending]);

  const schoolName = useMemo(() => {
    return messages[0]?.schoolName ?? 'Escuela';
  }, [messages]);

  const sendMessage = async () => {
    const content = text.trim();
    if (!content || sending || !user) return;

    try {
      setSending(true);
      await messagesService.sendParentMessage(schoolId, content, user.id);
      await loadThread();
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="surface w-full rounded-4xl bg-white p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100/60">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/parents/messages" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center justify-center" aria-label="Regresar">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-slate-100 font-extrabold text-slate-700">L</div>
          <div>
            <p className="text-sm sm:text-base font-extrabold text-slate-900">{schoolName}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              <LinkIcon size={12} className="text-slate-400" /> MENSAJERIA
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-6 min-h-80">
        {loading ? <p className="text-sm text-slate-500">Cargando conversacion...</p> : null}

        {!loading && !messages.length ? (
          <p className="text-sm text-slate-500">Aun no hay mensajes. Escribe el primero para contactar a la escuela.</p>
        ) : null}

        {messages.map((m) => {
          const isMine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-170 rounded-2xl px-4 py-3 text-sm sm:text-base shadow-sm ${
                isMine
                  ? 'bg-violet-600 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
                  : 'bg-slate-50 text-slate-800 ring-1 ring-slate-200 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'
              }`}>
                {m.content}
                <div className={`mt-2 text-[10px] ${isMine ? 'text-violet-100' : 'text-slate-400'}`}>
                  {formatTime(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-t border-slate-100/60">
        <div className="flex items-center gap-2 sm:gap-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 sm:px-4 py-2">
          <input
            className="flex-1 bg-transparent outline-none text-sm sm:text-base placeholder-slate-400"
            placeholder="Escribe un mensaje..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void sendMessage();
              }
            }}
          />
          <button
            className="h-8 w-8 rounded-xl bg-violet-600 text-white hover:bg-violet-700 flex items-center justify-center disabled:opacity-50"
            aria-label="Enviar"
            onClick={() => void sendMessage()}
            disabled={sending || !text.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
