"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Send, Search, Filter, MessageSquare, GraduationCap, BookOpen, Clock, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { useToast } from "@/components/ui/toast";
import {
  messagesService,
  type SchoolMessage,
  type SchoolThread,
} from "@/lib/services/services/messages.service";
import { schoolsService } from "@/lib/services/services/schools.service";
import {
	SCHOOL_THREADS_UPDATED_EVENT,
} from "@/lib/school-thread-events";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import type { LeadStatus } from "@/lib/types/lead";

function formatDate(isoDate: string) {
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) return "";

	return date.toLocaleString("es-MX", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatFullDate(isoDate: string) {
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) return "";

	return date.toLocaleDateString("es-MX", {
		day: "numeric",
		month: "long",
	});
}

export default function SchoolMessagesSection() {
	const pathname = usePathname();
	const isCourseMode = pathname.startsWith("/courses");
	const accentColor = isCourseMode ? "violet" : "indigo";
	const accentBgClass = isCourseMode ? "bg-violet-600" : "bg-indigo-600";
	const accentHoverBgClass = isCourseMode ? "hover:bg-violet-700" : "hover:bg-indigo-700";
	const accentLightBgClass = isCourseMode ? "bg-violet-50" : "bg-indigo-50";
	const accentTextClass = isCourseMode ? "text-violet-600" : "text-indigo-600";
	const accentBorderClass = isCourseMode ? "border-violet-500" : "border-indigo-500";
	const accentActiveBgClass = isCourseMode ? "bg-violet-50/80" : "bg-indigo-50/80";

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
	const [schoolId, setSchoolId] = useState<string | null>(null);
	const [filter, setFilter] = useState<"all" | "school" | "course">("all");
	const [searchTerm, setSearchTerm] = useState("");

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const { user } = useAuth();

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	}, [messages]);

	const loadThreads = useCallback(async () => {
		if (!participantId) return;
		try {
			const data = isCourseMode 
				? await messagesService.listCourseThreadsByOwner(participantId)
				: await messagesService.listSchoolThreads(participantId);
			setThreads(data);
			
			if (requestedThreadId && data.some(t => t.id === requestedThreadId)) {
				setActiveThreadId(requestedThreadId);
			} else if (!activeThreadId && data.length > 0) {
				setActiveThreadId(data[0].id);
			}
		} catch (err) {
			console.error("Error loading threads:", err);
		}
	}, [participantId, isCourseMode, activeThreadId, requestedThreadId]);

	const loadMessages = useCallback(async (threadId: string, syncThreads = false) => {
		if (!participantId) return;
		try {
			const data = await messagesService.listThreadMessages(threadId);
			setMessages(data);

			if (syncThreads) {
				const refreshedThreads = isCourseMode
					? await messagesService.listCourseThreadsByOwner(participantId)
					: await messagesService.listSchoolThreads(participantId);
				setThreads(refreshedThreads);
			}
		} catch (err) {
			console.error("Error loading messages:", err);
		}
	}, [participantId, isCourseMode]);

	useEffect(() => {
		let mounted = true;
		(async () => {
			if (!user) return;
			try {
				if (isCourseMode) {
					setParticipantId(user.id);
				} else {
					const school = await schoolsService.getMySchool();
					if (!mounted) return;
					if (school && school.ownerId) {
						setParticipantId(school.ownerId);
						setSchoolId(school.id);
					}
				}
			} catch (err) {
				console.error("Error getting participantId:", err);
			} finally {
				if (mounted) setLoadingThreads(false);
			}
		})();
		return () => { mounted = false; };
	}, [user, isCourseMode]);

	useEffect(() => {
		if (!participantId) return;
		void loadThreads();
	}, [participantId, loadThreads]);

	useEffect(() => {
		const interval = setInterval(() => {
			if (!sending && participantId) {
				void loadThreads();
			}
		}, 8000);
		return () => clearInterval(interval);
	}, [loadThreads, participantId, sending]);

	useEffect(() => {
		if (!activeThreadId) {
			setMessages([]);
			return;
		}
		void loadMessages(activeThreadId, true);
	}, [activeThreadId, loadMessages]);

	const filteredThreads = useMemo(() => {
		return threads.filter((t) => {
			const matchesFilter = filter === "all" || t.type === filter;
			const matchesSearch = t.publicUserName.toLowerCase().includes(searchTerm.toLowerCase());
			return matchesFilter && matchesSearch;
		});
	}, [threads, filter, searchTerm]);

	const activeThread = useMemo(() => {
		return threads.find((thread) => thread.id === activeThreadId) ?? null;
	}, [activeThreadId, threads]);

	const sendMessage = async () => {
		const content = draft.trim();
		if (!activeThreadId || !content || sending || !participantId || !activeThread) return;

		try {
			setSending(true);
			const publicUserId = activeThread.publicUserId;
			const targetId = activeThread.courseId || schoolId || participantId;

			if (activeThread.type === 'course') {
				await messagesService.sendCourseMessage(publicUserId, content, targetId);
			} else {
				await messagesService.sendSchoolMessage(publicUserId, content, targetId);
			}

			await loadMessages(activeThreadId, true);
			setDraft("");
		} catch (error) {
			console.error("Failed to send message:", error);
			showToast({
				title: "Error",
				description: "No se pudo enviar el mensaje.",
				variant: "error",
			});
		} finally {
			setSending(false);
		}
	};

	return (
		<section className="flex flex-col h-[80vh] min-h-[600px] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden" style={{ fontFamily: 'SF Pro, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Arial, sans-serif' }}>
			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar */}
				<aside className="w-full md:w-[350px] flex flex-col border-r border-slate-100 bg-slate-50/30">
					<header className="p-6 space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-2xl font-black text-slate-900 tracking-tight">Chats</h2>
							<div className={`p-2 rounded-xl ${accentLightBgClass} ${accentTextClass}`}>
								<MessageSquare size={18} className="stroke-[2.5px]" />
							</div>
						</div>
						
						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
							<input 
								type="text" 
								placeholder="Buscar chat..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
							/>
						</div>

						{/* Filters */}
						<div className="flex gap-2">
							{(["all", "school", "course"] as const).map((f) => (
								<button
									key={f}
									onClick={() => setFilter(f)}
									className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
										filter === f 
											? `${accentBgClass} text-white shadow-lg` 
											: "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
									}`}
								>
									{f === "all" ? "Todos" : f === "school" ? "Escuela" : "Cursos"}
								</button>
							))}
						</div>
					</header>

					<div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-1">
						{loadingThreads ? (
							<div className="p-6 space-y-4">
								{[1, 2, 3].map(i => (
									<div key={i} className="flex gap-3 animate-pulse">
										<div className="w-12 h-12 bg-slate-200 rounded-full" />
										<div className="flex-1 space-y-2 py-1">
											<div className="h-3 bg-slate-200 rounded w-1/2" />
											<div className="h-2 bg-slate-100 rounded w-full" />
										</div>
									</div>
								))}
							</div>
						) : filteredThreads.length > 0 ? (
							filteredThreads.map((thread) => {
								const active = thread.id === activeThreadId;
								return (
									<button
										key={thread.id}
										onClick={() => setActiveThreadId(thread.id)}
										className={`w-full flex items-center gap-3 p-4 rounded-[1.5rem] transition-all duration-300 group ${
											active 
												? `${accentActiveBgClass} shadow-sm` 
												: "hover:bg-white hover:shadow-md"
										}`}
									>
										<div className={`relative shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
											active ? `${accentBgClass} text-white` : "bg-white border border-slate-200 text-slate-700"
										}`}>
											{thread.publicUserName[0]}
											{thread.threadHasUnread && (
												<span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full" />
											)}
										</div>
										<div className="flex-1 min-w-0 text-left">
											<div className="flex items-center justify-between mb-0.5">
												<h4 className={`text-sm font-black truncate ${active ? "text-slate-900" : "text-slate-700"}`}>
													{thread.publicUserName}
												</h4>
												<span className="text-[10px] font-bold text-slate-400">
													{formatDate(thread.lastMessageAt)}
												</span>
											</div>
											<p className={`text-xs truncate ${thread.threadHasUnread ? "font-bold text-slate-900" : "text-slate-400"}`}>
												{thread.lastMessage}
											</p>
											<div className="flex items-center gap-1.5 mt-1.5">
												{thread.type === 'course' ? (
													<span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md">
														<BookOpen size={8} /> {thread.courseName}
													</span>
												) : (
													<span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md">
														<GraduationCap size={8} /> Institucional
													</span>
												)}
											</div>
										</div>
										<ChevronRight size={14} className={`shrink-0 transition-transform ${active ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:opacity-50"}`} />
									</button>
								);
							})
						) : (
							<div className="p-12 text-center space-y-3">
								<div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
									<Search size={24} />
								</div>
								<p className="text-sm font-bold text-slate-400">No hay chats</p>
							</div>
						)}
					</div>
				</aside>

				{/* Chat Area */}
				<main className="flex-1 flex flex-col bg-white">
					{activeThread ? (
						<>
							<header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 sticky top-0">
								<div className="flex items-center gap-4">
									<div className={`w-12 h-12 rounded-2xl ${accentBgClass} text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20`}>
										{activeThread.publicUserName[0]}
									</div>
									<div>
										<h3 className="text-lg font-black text-slate-900 leading-tight">
											{activeThread.publicUserName}
										</h3>
										<div className="flex items-center gap-2 mt-1">
											<div className="flex items-center gap-1.5">
												<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
												<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En línea</span>
											</div>
											{activeThread.type === 'course' && (
												<span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest border-l border-slate-200 pl-2">
													{activeThread.courseName}
												</span>
											)}
										</div>
									</div>
								</div>
								{activeThread.leadStatus && (
									<LeadStatusBadge status={activeThread.leadStatus.toUpperCase() as LeadStatus} />
								)}
							</header>

							<div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 no-scrollbar bg-slate-50/30">
								{messages.map((msg, idx) => {
									const isMine = msg.senderRole === "private";
									const showDate = idx === 0 || formatFullDate(messages[idx-1].createdAt) !== formatFullDate(msg.createdAt);
									
									return (
										<div key={msg.id} className="space-y-4">
											{showDate && (
												<div className="flex justify-center">
													<span className="px-4 py-1.5 rounded-full bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm">
														{formatFullDate(msg.createdAt)}
													</span>
												</div>
											)}
											<div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
												<div className={`group relative max-w-[75%] space-y-1 ${isMine ? "items-end" : "items-start"}`}>
													<div className={`px-5 py-4 rounded-[1.8rem] text-sm md:text-base leading-relaxed shadow-sm transition-all duration-300 ${
														isMine 
															? `${accentBgClass} text-white rounded-br-none shadow-lg shadow-indigo-500/10` 
															: "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
													}`}>
														{msg.content}
													</div>
													<div className={`flex items-center gap-1.5 px-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 ${isMine ? "justify-end" : "justify-start"}`}>
														<Clock size={10} />
														{formatDate(msg.createdAt)}
													</div>
												</div>
											</div>
										</div>
									);
								})}
								<div ref={messagesEndRef} />
							</div>

							<footer className="p-6 bg-white border-t border-slate-100">
								<div className="relative flex items-center gap-3 p-2 bg-slate-100 rounded-[2rem] border border-slate-200/60 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all group">
									<input 
										type="text"
										value={draft}
										onChange={(e) => setDraft(e.target.value)}
										onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
										placeholder="Escribe tu respuesta aquí..."
										className="flex-1 bg-transparent px-5 py-3 outline-none text-slate-700 placeholder-slate-400 font-medium"
									/>
									<button
										onClick={sendMessage}
										disabled={!draft.trim() || sending}
										className={`p-4 rounded-full transition-all duration-300 ${
											draft.trim() && !sending 
												? `${accentBgClass} text-white shadow-lg shadow-indigo-500/30 scale-100` 
												: "bg-slate-200 text-slate-400 scale-90"
										}`}
									>
										<Send size={20} className={`stroke-[2.5px] ${sending ? "animate-pulse" : ""}`} />
									</button>
								</div>
							</footer>
						</>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/20">
							<div className="relative">
								<div className={`w-32 h-32 rounded-full ${accentLightBgClass} flex items-center justify-center ${accentTextClass} animate-bounce duration-[2000ms]`}>
									<MessageSquare size={48} className="stroke-[1.5px]" />
								</div>
								<div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center text-amber-500 animate-pulse">
									<Sparkles size={20} />
								</div>
							</div>
							<h3 className="mt-8 text-2xl font-black text-slate-900">Tu Centro de Mensajes</h3>
							<p className="mt-2 text-slate-500 font-medium max-w-sm text-center">
								Selecciona una conversación a la izquierda para comenzar a gestionar tus prospectos.
							</p>
						</div>
					)}
				</main>
			</div>
		</section>
	);
}
