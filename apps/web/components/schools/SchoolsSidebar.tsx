/* eslint-disable react-hooks/static-components */
"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
	Activity,
	CreditCard,
	Inbox,
	Layers3,
	LogOut,
	Megaphone,
	MessageCircle,
	Settings,
	Users,
} from "lucide-react";
import { JSX } from "react";
import { messagesService, type SchoolThread } from "@/lib/services/services/messages.service";
import { useAuth } from "@/contexts/AuthContext";
import { SCHOOL_THREADS_UPDATED_EVENT } from "@/lib/school-thread-events";

type ActiveSection =
	| "summary"
	| "courses"
	| "leads"
	| "messages"
	| "broadcasts"
	| "offers"
	| "plans"
	| "settings";

type Props = { active?: ActiveSection };

export default function SchoolsSidebar({ active = "summary" }: Props) {
	const { logout } = useAuth();
	const { user } = useAuth();
	const [threads, setThreads] = useState<SchoolThread[]>([]);

	useEffect(() => {
		let mounted = true;

		const loadThreads = async () => {
			try {
				if (!user) return;
				const data = await messagesService.listSchoolThreads(user.id);
				if (mounted) setThreads(data);
			} catch {
				if (mounted) setThreads([]);
			}
		};

		void loadThreads();

		const interval = window.setInterval(() => {
			void loadThreads();
		}, 5000);

		const handleRefresh = () => {
			void loadThreads();
		};

		window.addEventListener(SCHOOL_THREADS_UPDATED_EVENT, handleRefresh);

		return () => {
			mounted = false;
			window.clearInterval(interval);
			window.removeEventListener(SCHOOL_THREADS_UPDATED_EVENT, handleRefresh);
		};
	}, []);

	const pendingCount = useMemo(
		() => threads.reduce((sum, thread) => sum + thread.unreadCount, 0),
		[threads],
	);

	const Item = ({
		icon,
		label,
		href,
		isActive,
		badge,
	}: {
		icon: JSX.Element;
		label: string;
		href: string;
		isActive?: boolean;
		badge?: string | number;
	}) => (
		<Link
			href={href}
			className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold transition-colors ${
				isActive
					? "bg-violet-600 text-white shadow-lg shadow-violet-500/40"
					: "text-slate-700 hover:bg-slate-50"
			}`}
		>
			<span className="flex items-center gap-3">
				<span className={isActive ? "text-white" : "text-slate-500"}>{icon}</span>
				<span>{label}</span>
			</span>
			{badge !== undefined && (
				<span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
					{badge}
				</span>
			)}
		</Link>
	);

	return (
		<aside className="flex w-full max-w-72 flex-col gap-3 sm:gap-4">
			<div className="surface rounded-3xl bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
				<div className="flex flex-col gap-2">
					<Item
						icon={<Activity size={18} />}
						label="Vista general"
						href="/schools"
						isActive={active === "summary"}
					/>
					<Item
						icon={<Layers3 size={18} />}
						label="Oferta académica"
						href="/schools/courses"
						isActive={active === "courses"}
					/>
					<Item
						icon={<Users size={18} />}
						label="Prospectos"
						href="/schools/leads"
						isActive={active === "leads"}
						badge={pendingCount || undefined}
					/>
					<Item
						icon={<MessageCircle size={18} />}
						label="Mensajería"
						href="/schools/messages"
						isActive={active === "messages"}
						badge={pendingCount || undefined}
					/>
					<Item
						icon={<Inbox size={18} />}
						label="Envíos Masivos"
						href="/schools/broadcasts"
						isActive={active === "broadcasts"}
					/>
					<Item
						icon={<Megaphone size={18} />}
						label="Ofertas & Promos"
						href="/schools/offers"
						isActive={active === "offers"}
					/>
					<Item
						icon={<CreditCard size={18} />}
						label="Planes & Pagos"
						href="/schools/plans"
						isActive={active === "plans"}
					/>
					<Item
						icon={<Settings size={18} />}
						label="Configuración"
						href="/schools/settings"
						isActive={active === "settings"}
					/>
				</div>
				<div className="mt-4 border-t border-slate-100 pt-3">
					<button
						onClick={logout}
						className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-rose-500 hover:text-rose-600"
					>
						<LogOut size={16} />
						<span>Cerrar Sesión</span>
					</button>
				</div>
			</div>
		</aside>
	);
}
