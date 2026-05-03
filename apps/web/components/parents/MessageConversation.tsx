"use client";
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ArrowLeft, Link as LinkIcon, Send, MoreVertical, Info, User, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadThread = useCallback(async () => {
    if (!user) return;
    const thread = await messagesService.listParentThreadMessages(schoolId, user.id);
    setMessages(thread);
    setTimeout(scrollToBottom, 100);
  }, [schoolId, user]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!user) return;
      try {
        const thread = await messagesService.listParentThreadMessages(schoolId, user.id);
        if (mounted) {
          setMessages(thread);
          setTimeout(scrollToBottom, 100);
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
    return messages[0]?.schoolName ?? 'Institución';
  }, [messages]);

  const sendMessage = async () => {
    const content = text.trim();
    if (!content || sending || !user) return;

    try {
      setSending(true);
      await messagesService.sendParentMessage(schoolId, content, user.id);
      await loadThread();
      setText('');
      setTimeout(scrollToBottom, 50);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[600px] w-full rounded-[2.5rem] bg-white shadow-2xl shadow-indigo-100/40 border border-slate-50 overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link 
            href="/parents/messages" 
            className="group flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-all hover:bg-indigo-600 hover:text-white"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          </Link>
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-gradient-to-br from-indigo-600 to-violet-600 font-black text-xl text-white shadow-lg shadow-indigo-200">
              {schoolName.charAt(0)}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <h4 className="text-lg font-black tracking-tight text-slate-900 leading-tight">{schoolName}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">En línea</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors">
            <Info size={18} />
          </button>
          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scroll-smooth scrollbar-hide bg-slate-50/30"
      >
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sincronizando...</p>
            </div>
          ) : null}

          {!loading && !messages.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center max-w-xs mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-400 italic font-black text-2xl">?</div>
              <p className="text-sm font-medium text-slate-400 leading-relaxed">Aún no hay mensajes. ¡Inicia la conversación para conocer más sobre esta institución!</p>
            </div>
          ) : null}

          {messages.map((m, idx) => {
            const isMine = m.senderId !== schoolId && m.senderRole !== 'private'; 
            const showAvatar = idx === 0 || messages[idx - 1].senderRole !== m.senderRole;
            
            return (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2`}
              >
                {!isMine && showAvatar && (
                  <div className="h-8 w-8 rounded-lg bg-slate-200 shrink-0 flex items-center justify-center text-xs font-black text-slate-500 mb-1">
                    {schoolName.charAt(0)}
                  </div>
                )}
                {!isMine && !showAvatar && <div className="w-8 shrink-0" />}

                <div className={`max-w-[80%] relative group ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-5 py-3.5 text-sm sm:text-base font-medium shadow-sm transition-all ${
                    isMine
                      ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-[1.5rem] rounded-br-none shadow-indigo-100'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-[1.5rem] rounded-bl-none shadow-slate-200/50'
                  }`}>
                    {m.content}
                  </div>
                  <div className={`mt-1.5 flex items-center gap-2 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                      {formatTime(m.createdAt)}
                    </span>
                    {isMine && <CheckCheck size={10} className="text-indigo-400" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="shrink-0 p-6 bg-white border-t border-slate-100">
        <div className="relative flex items-center gap-3 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 px-5 py-3 transition-all focus-within:border-indigo-500 focus-within:bg-white focus-within:shadow-xl focus-within:shadow-indigo-50">
          <input
            className="flex-1 bg-transparent outline-none text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400"
            placeholder="Escribe tu mensaje aquí..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void sendMessage();
              }
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`h-11 w-11 rounded-[1.1rem] flex items-center justify-center transition-all ${
              text.trim() && !sending
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            onClick={() => void sendMessage()}
            disabled={sending || !text.trim()}
          >
            {sending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send size={18} className={text.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''} />
            )}
          </motion.button>
        </div>
        <p className="mt-3 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">
          Presiona Enter para enviar · Skoolia Chat Seguro
        </p>
      </div>
    </motion.section>
  );
}
