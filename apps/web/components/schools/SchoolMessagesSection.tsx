"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
	import { useAuth } from "@/contexts/AuthContext";

import { useToast } from "@/components/ui/toast";
import {
  messagesService,
  type SchoolMessage,
  type SchoolThread,
} from "@/lib/services/services/messages.service";
import { schoolsService } from "@/lib/services/services/schools.service";
import {
	notifySchoolThreadsUpdated,
	SCHOOL_THREADS_UPDATED_EVENT,
} from "@/lib/school-thread-events";

function formatDate(isoDate: string) {
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) return "";

	return date.toLocaleString("es-MX", {
		dateStyle: "short",
		timeStyle: "short",
	});
}

export default function SchoolMessagesSection() {
	const pathname = usePathname();
	const isCourseMode = pathname.startsWith("/courses");
	const accentBgClass = isCourseMode ? "bg-violet-600" : "bg-indigo-600";
	const accentHoverBgClass = isCourseMode ? "hover:bg-violet-700" : "hover:bg-indigo-700";
	const accentLightBgClass = isCourseMode ? "bg-violet-50" : "bg-indigo-50";
	const accentBorderClass = isCourseMode ? "border-l-violet-500" : "border-l-indigo-500";
	const accentActiveBgClass = isCourseMode ? "bg-violet-50/90" : "bg-indigo-50/90";

	const searchParams = useSearchParams();
	const { showToast } = useToast();
	const requestedThreadId = searchParams.get("thread");
		const [threads, setThreads] = useState<SchoolThread[]>([]);
		const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
		const [messages, setMessages] = useState<SchoolMessage[]>([]);
		const [draft, setDraft] = useState("");
		const [loadingThreads, setLoadingThreads] = useState(true);
		const [loadingMessages, setLoadingMessages] = useState(false);
		const [sending, setSending] = useState(false);
		const [participantId, setParticipantId] = useState<string | null>(null);
		const [filter, setFilter] = useState<"all" | "school" | "course">("all");

	// ...existing code...

		const { user } = useAuth();
	const { logout } = useAuth(); // I might not need logout here

	// Depuración: mostrar el valor de user y user.id
	console.log('[SchoolMessagesSection] user:', user);
	if (user && !user.id) {
		console.warn('[SchoolMessagesSection] El objeto user no tiene campo id:', user);
	}

		const loadThreads = useCallback(async () => {
			if (!participantId) return;
			const data = isCourseMode 
				? await messagesService.listCourseThreadsByOwner(participantId)
				: await messagesService.listSchoolThreads(participantId);
			console.log('[SchoolMessagesSection] Threads data:', data);
			setThreads(data);
			setActiveThreadId((current) => {
				if (current && data.some((thread) => thread.id === current)) {
					return current;
				}
				return data[0]?.id ?? null;
			});
		}, [participantId, isCourseMode]);

		const loadMessages = useCallback(async (threadId: string, syncThreads = false) => {
			if (!participantId) return;
			const data = await messagesService.listThreadMessages(threadId);
			setMessages(data);

			if (syncThreads) {
				const refreshedThreads = isCourseMode
					? await messagesService.listCourseThreadsByOwner(participantId)
					: await messagesService.listSchoolThreads(participantId);
				setThreads(refreshedThreads);
				notifySchoolThreadsUpdated();
			}
		}, [participantId, isCourseMode]);

		// Al montar, obtener participantId (schoolId o userId del dueño del curso)
		useEffect(() => {
			let mounted = true;
			(async () => {
				if (!user) return;
				try {
					if (isCourseMode) {
						// Para cursos independientes, el ID del participante es el ID del usuario (dueño)
						setParticipantId(user.id);
					} else {
						const school = await schoolsService.getMySchool();
						if (!mounted) return;
						if (school && school.id) {
							setParticipantId(school.id);
						} else {
							setParticipantId(null);
						}
					}
				} catch (err) {
					console.error('[SchoolMessagesSection] Error al obtener participantId:', err);
					setParticipantId(null);
				} finally {
					if (mounted) setLoadingThreads(false);
				}
			})();
			return () => {
				mounted = false;
			};
		}, [user, isCourseMode]);

		// Cuando participantId esté listo, cargar hilos
		useEffect(() => {
			if (!participantId) return;
			void loadThreads();
		}, [participantId, loadThreads, requestedThreadId]);

	useEffect(() => {
		if (loadingThreads) return;

		const interval = setInterval(() => {
			if (!sending) {
				void loadThreads();
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [loadThreads, loadingThreads, sending]);

	useEffect(() => {
		const handleRefresh = () => {
			void loadThreads();
		};

		window.addEventListener(SCHOOL_THREADS_UPDATED_EVENT, handleRefresh);

		return () => {
			window.removeEventListener(SCHOOL_THREADS_UPDATED_EVENT, handleRefresh);
		};
	}, [loadThreads]);

	useEffect(() => {
		if (!activeThreadId) {
			setMessages([]);
			return;
		}

		let mounted = true;

		(async () => {
			try {
				setLoadingMessages(true);
				await loadMessages(activeThreadId, true);
			} finally {
				if (mounted) setLoadingMessages(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, [activeThreadId, loadMessages]);

	useEffect(() => {
		if (!activeThreadId || loadingMessages) return;

		const interval = setInterval(() => {
			if (!sending) {
				void loadMessages(activeThreadId);
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [activeThreadId, loadMessages, loadingMessages, sending]);

	const uniqueCourseIds = useMemo(() => {
		const ids = new Map<string, string>();
		threads.forEach((t) => {
			if (t.courseId && t.courseName) ids.set(t.courseId, t.courseName);
		});
		return Array.from(ids.entries());
	}, [threads]);

	const [courseFilter, setCourseFilter] = useState<string | null>(null);

	const filteredThreads = useMemo(() => {
		let result = threads;
		if (filter !== "all") {
			result = result.filter((t) => t.type === filter);
		}
		if (courseFilter) {
			result = result.filter((t) => t.courseId === courseFilter);
		}
		return result;
	}, [threads, filter, courseFilter]);

	const activeThread = useMemo(() => {
		return threads.find((thread) => thread.id === activeThreadId) ?? null;
	}, [activeThreadId, threads]);

	const sendMessage = async () => {
		const content = draft.trim();
		if (!activeThreadId || !content || sending || !participantId || !activeThread) return;

		try {
			setSending(true);
			const publicUserId = activeThread.publicUserId;
			const targetId = activeThread.courseId || participantId;

			if (activeThread.type === 'course') {
				await messagesService.sendCourseMessage(publicUserId, content, targetId);
			} else {
				await messagesService.sendSchoolMessage(publicUserId, content, targetId);
			}

			await loadMessages(activeThreadId, true);
			setDraft("");
			showToast({
				title: "Mensaje enviado",
				description: "La conversación se actualizó correctamente.",
				variant: "success",
			});
		} catch (error) {
			console.error("No se pudo enviar el mensaje", error);
			showToast({
				title: "No se pudo enviar el mensaje",
				description: "Inténtalo otra vez en unos segundos.",
				variant: "error",
			});
		} finally {
			setSending(false);
		}
	};

	return (
		<section className="surface rounded-4xl bg-white p-0 shadow-sm ring-1 ring-black/5 overflow-hidden">
			<div className="grid grid-cols-1 md:grid-cols-[290px_1fr]">
				<div className="border-b border-slate-100/70 md:border-b-0 md:border-r">
					<header className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100/70">
						<h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Mensajes</h2>
						<p className="mt-2 text-xs text-slate-500">Conversaciones con padres de familia.</p>
					</header>

					{!isCourseMode ? (
						<div className="flex border-b border-slate-100/70 p-2 gap-1 bg-slate-50/50">
							<button
								onClick={() => { setFilter("all"); setCourseFilter(null); }}
								className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
									filter === "all" ? `${accentBgClass} text-white shadow-sm` : "text-slate-500 hover:bg-slate-100"
								}`}
							>
								Todos
							</button>
							<button
								onClick={() => { setFilter("school"); setCourseFilter(null); }}
								className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
									filter === "school" ? `${accentBgClass} text-white shadow-sm` : "text-slate-500 hover:bg-slate-100"
								}`}
							>
								Escuela
							</button>
							<button
								onClick={() => setFilter("course")}
								className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
									filter === "course" ? `${accentBgClass} text-white shadow-sm` : "text-slate-500 hover:bg-slate-100"
								}`}
							>
								Cursos
							</button>
						</div>
					) : uniqueCourseIds.length > 1 ? (
						<div className="flex border-b border-slate-100/70 p-2 gap-1 bg-slate-50/50 overflow-x-auto whitespace-nowrap no-scrollbar">
							<button
								onClick={() => setCourseFilter(null)}
								className={`px-4 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
									!courseFilter ? `${accentBgClass} text-white shadow-sm` : "text-slate-500 hover:bg-slate-100"
								}`}
							>
								Todos
							</button>
							{uniqueCourseIds.map(([id, name]) => (
								<button
									key={id}
									onClick={() => setCourseFilter(id)}
									className={`px-4 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
										courseFilter === id ? `${accentBgClass} text-white shadow-sm` : "text-slate-500 hover:bg-slate-100"
									}`}
								>
									{name}
								</button>
							))}
						</div>
					) : null}

					{loadingThreads ? (
						<div className="px-5 py-4 text-sm text-slate-500">Cargando conversaciones...</div>
					) : (
						<div className="divide-y divide-slate-100/70">
							{threads.map((thread) => {
								const active = thread.id === activeThreadId;
								const initials = thread.publicUserName
									.split(" ")
									.map((part) => part[0])
									.join("")
									.slice(0, 2)
									.toUpperCase();

								return (
									<button
										key={thread.id}
										type="button"
										className={`flex w-full items-center justify-between px-5 py-4 sm:px-6 sm:py-4 text-left transition-colors ${
											active ? `${accentActiveBgClass} border-l-4 ${accentBorderClass}` : "hover:bg-slate-50"
										}`}
										onClick={() => setActiveThreadId(thread.id)}
									>
										<div className="flex items-center gap-3 sm:gap-4">
											<div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold ${
												active ? `${accentBgClass} text-white` : "bg-slate-100 text-slate-700"
											}`}>
												{initials || "PF"}
											</div>
											<div>
												<p className="text-sm font-extrabold text-slate-900">{thread.publicUserName}</p>
												<div className="flex items-center gap-1.5 mt-0.5">
													<span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
														thread.type === 'course' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
													}`}>
														{thread.type === 'course' ? `CH-CURSO: ${thread.courseName || '?'}` : 'CH-ESC'}
													</span>
													<p className="line-clamp-1 text-xs text-slate-500">{thread.lastMessage}</p>
												</div>
												{thread.threadHasUnread ? (
													<p className="mt-1 text-[11px] font-bold text-amber-600">
														{thread.unreadCount} sin leer
													</p>
												) : null}
											</div>
										</div>
										<div className="flex items-center gap-2">
											{thread.threadHasUnread ? (
												<span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
													{thread.unreadCount}
												</span>
											) : null}
											<div className="text-[11px] text-slate-400">{formatDate(thread.lastMessageAt)}</div>
										</div>
									</button>
								);
							})}

							{!filteredThreads.length ? (
								<div className="px-5 py-12 text-center">
									<p className="text-sm text-slate-400 font-medium">No hay conversaciones en esta categoría.</p>
								</div>
							) : null}
						</div>
					)}
				</div>

				<div className="flex flex-col min-h-140">
					<header className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100/70 bg-white z-10">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm sm:text-base font-extrabold text-slate-900">
									{activeThread?.publicUserName ?? "Selecciona una conversacion"}
								</p>
								<div className="flex items-center gap-2 mt-1">
									<span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
										activeThread?.type === 'course' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
									}`}>
										{activeThread?.type === 'course' ? `CH-CURSO-DETALLE: ${activeThread.courseName}` : 'CH-ESC-GENERAL'}
									</span>
								</div>
							</div>
							{activeThread?.leadStatus && (
								<div className="hidden sm:block">
									<span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
										Lead: {activeThread.leadStatus}
									</span>
								</div>
							)}
						</div>
					</header>

					<div className="flex-1 px-5 py-4 sm:px-6 sm:py-6 space-y-4 bg-slate-50/40">
						{loadingMessages ? <p className="text-sm text-slate-500">Cargando mensajes...</p> : null}

						{!loadingMessages && !messages.length ? (
							<p className="text-sm text-slate-500">No hay mensajes en esta conversacion.</p>
						) : null}

						{messages.map((message) => {
							const isMine = message.senderRole === "private";
							return (
								<div
									key={message.id}
									className={`flex ${isMine ? "justify-end" : "justify-start"}`}
								>
									<div
										className={`max-w-xl rounded-3xl px-4 py-3 text-sm sm:text-base shadow-sm ${
											isMine
												? `${accentBgClass} text-white rounded-br-none`
												: "bg-white text-slate-800 ring-1 ring-slate-200 rounded-bl-none"
										}`}
									>
										{message.content}
										<div className="mt-2 text-[10px] font-semibold opacity-75">{formatDate(message.createdAt)}</div>
									</div>
								</div>
							);
						})}
					</div>

					<footer className="border-t border-slate-100/70 bg-white px-5 py-4 sm:px-6 sm:py-5">
						<div className="flex items-center gap-2 sm:gap-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 sm:px-4 py-2">
							<input
								className="flex-1 bg-transparent outline-none text-sm sm:text-base placeholder-slate-400"
								placeholder="Escribe un mensaje..."
								value={draft}
								onChange={(event) => setDraft(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										void sendMessage();
									}
								}}
								disabled={!activeThreadId}
							/>
							<button
								type="button"
								className={`h-9 w-9 rounded-xl ${accentBgClass} text-white ${accentHoverBgClass} flex items-center justify-center disabled:opacity-50`}
								aria-label="Enviar mensaje"
								onClick={() => void sendMessage()}
								disabled={!activeThreadId || !draft.trim() || sending}
							>
								<Send size={16} />
							</button>
						</div>
					</footer>
				</div>
			</div>
		</section>
	);
}
