/* eslint-disable react-hooks/static-components */
"use client";
import Link from "next/link";
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
import { useAuth } from "@/contexts/AuthContext";

const sections = [
	{ icon: <Activity size={18} />, label: "Vista general", href: "/courses", key: "summary" },
	{ icon: <Layers3 size={18} />, label: "Oferta académica", href: "/courses/academic", key: "courses" },
	{ icon: <Users size={18} />, label: "Prospectos", href: "/courses/leads", key: "leads" },
	{ icon: <MessageCircle size={18} />, label: "Mensajería", href: "/courses/messages", key: "messages" },
	{ icon: <Inbox size={18} />, label: "Envíos Masivos", href: "/courses/broadcasts", key: "broadcasts" },
	{ icon: <Megaphone size={18} />, label: "Ofertas & Promos", href: "/courses/offer", key: "offers" },
	{ icon: <CreditCard size={18} />, label: "Planes & Pagos", href: "/courses/plans", key: "plans" },
	{ icon: <Settings size={18} />, label: "Configuración", href: "/courses/settings", key: "settings" },
];

type ActiveSection = typeof sections[number]["key"];
type Props = { active?: ActiveSection };

export default function CoursesSidebar({ active = "summary" }: Props) {
	const { logout } = useAuth();
	const Item = ({ icon, label, href, isActive }: { icon: JSX.Element; label: string; href: string; isActive?: boolean }) => (
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
		</Link>
	);
	return (
		<aside className="flex w-full max-w-72 flex-col gap-3 sm:gap-4">
			<div className="surface rounded-3xl bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
				<div className="flex flex-col gap-2">
					{sections.map((section) => {
						const { key, ...rest } = section;
						return <Item key={key} {...rest} isActive={active === key} />;
					})}
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
