"use client";
import React, { useEffect, useRef, useState } from "react";
import { courseMessagesService, CourseMessage } from "@/lib/services/services/course-messages.service";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  courseId: string;
}

export default function CourseMessageConversation({ courseId }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CourseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const data = await courseMessagesService.listCourseThreadMessages(courseId, user.id);
        if (mounted) setMessages(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const msg = await courseMessagesService.sendCourseMessage(courseId, input.trim());
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div>Cargando mensajes...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto mb-4 max-h-87.5">
        {messages.length === 0 ? (
          <div className="text-slate-400">No hay mensajes en este curso.</div>
        ) : (
          <ul>
            {messages.map((msg) => {
              const isMine = msg.senderType === "parent" && msg.senderId === user?.id;
              return (
                <li key={msg.id} className={`mb-2 ${isMine ? "text-right" : "text-left"}`}>
                  <div className={`inline-block px-3 py-2 rounded-lg ${isMine ? "bg-violet-200" : "bg-slate-200"}`}>
                    <span>{msg.content}</span>
                    <div className="text-xs text-slate-500 mt-1">{new Date(msg.createdAt).toLocaleString("es-MX")}</div>
                  </div>
                </li>
              );
            })}
            <div ref={messagesEndRef} />
          </ul>
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Escribe un mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          className="bg-violet-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={sending || !input.trim()}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
