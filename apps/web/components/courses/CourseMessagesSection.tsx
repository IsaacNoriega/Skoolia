"use client";
import { courseMessagesService, CourseThreadForOwner, CourseMessage } from "@/lib/services/services/course-messages.service";
import React from "react";

interface SelectedThread {
  courseId: string;
  publicUserId: string;
  courseName: string;
  publicUserName: string;
}

function CourseMessageConversationOwner({ courseId, publicUserId, publicUserName }: SelectedThread) {
  const [messages, setMessages] = React.useState<CourseMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await courseMessagesService.listCourseThreadMessagesByOwner(courseId, publicUserId);
        if (mounted) setMessages(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, publicUserId]);
  if (loading) return <div>Cargando mensajes...</div>;
  return (
    <div>
      <div className="mb-2 font-bold">Conversación con {publicUserName}</div>
      <div className="max-h-96 overflow-y-auto mb-2">
        {messages.length === 0 ? (
          <div className="text-slate-400">No hay mensajes en este curso.</div>
        ) : (
          <ul>
            {messages.map((msg) => (
              <li key={msg.id} className={`mb-2 ${msg.senderRole === "public" ? "text-right" : "text-left"}`}>
                <div className={`inline-block px-3 py-2 rounded-lg ${msg.senderRole === "public" ? "bg-violet-200" : "bg-slate-200"}`}>
                  <span>{msg.content}</span>
                  <div className="text-xs text-slate-500 mt-1">{new Date(msg.createdAt).toLocaleString("es-MX")}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function CourseMessagesSection() {
  const [threads, setThreads] = React.useState<CourseThreadForOwner[]>([]);
  const [selected, setSelected] = React.useState<SelectedThread | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await courseMessagesService.listCourseThreadsByOwner();
        if (mounted) setThreads(data);
      } catch (err: any) {
        setError(err?.data?.error || err?.message || 'Error desconocido');
        console.error('Error cargando hilos:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-500 font-bold">Error: {error}</div>;

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Mensajería de cursos (como dueño)</h2>
      <div className="flex gap-6">
        <div className="w-1/3 bg-white rounded-lg shadow p-4 max-h-125 overflow-y-auto">
          <h3 className="font-bold mb-2 text-slate-700">Tus cursos</h3>
          {threads.length === 0 ? (
            <div className="text-slate-400">No tienes conversaciones.</div>
          ) : (
            <ul>
              {threads.map((thread) => (
                <li
                  key={thread.courseId + thread.publicUserId}
                  className={`p-2 rounded cursor-pointer hover:bg-violet-100 ${selected && selected.courseId === thread.courseId && selected.publicUserId === thread.publicUserId ? "bg-violet-200" : ""}`}
                  onClick={() => setSelected({
                    courseId: thread.courseId,
                    publicUserId: thread.publicUserId,
                    courseName: thread.courseName,
                    publicUserName: thread.publicUserName,
                  })}
                >
                  <div className="font-semibold">{thread.courseName}</div>
                  <div className="text-xs text-slate-500 truncate">{thread.lastMessage}</div>
                  <div className="text-xs text-slate-400">{new Date(thread.lastMessageAt).toLocaleString("es-MX")}</div>
                  <div className="text-xs text-slate-400">Padre: {thread.publicUserName}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex-1 bg-white rounded-lg shadow p-4">
          {selected ? (
            <CourseMessageConversationOwner {...selected} />
          ) : (
            <div className="text-slate-400">Selecciona un curso y padre para ver la conversación.</div>
          )}
        </div>
      </div>
    </section>
  );
}
