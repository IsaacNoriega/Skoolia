/* eslint-disable react-hooks/static-components */
"use client";
import Link from "next/link";
import { Heart, History, MessageCircle, User, ClipboardCheck } from "lucide-react";
import { JSX } from "react";

type Props = { active?: "favorites" | "messages" | "info" | "history" | "enrollments" };

type ItemProps = {
  icon: JSX.Element;
  label: string;
  href: string;
  isActive?: boolean;
};

export default function ParentsCompactSidebar({ active = "info" }: Props) {
  const Item = ({ icon, label, href, isActive }: ItemProps) => (
    <Link
      href={href}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-full border transition-colors sm:h-10 sm:w-10 ${
        isActive
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
      }`}
    >
      {icon}
    </Link>
  );

  return (
    <aside className="flex w-full items-start">
      <div className="surface flex flex-col items-center gap-3 rounded-3xl bg-white px-3 py-4">
        <span className="text-[11px] font-bold text-slate-500">Cuenta</span>
        <Item
          icon={<Heart size={16} />}
          label="Mis Guardados"
          href="/parents/favorites"
          isActive={active === "favorites"}
        />
        <Item
          icon={<MessageCircle size={16} />}
          label="Mensajes"
          href="/parents/messages"
          isActive={active === "messages"}
        />
        <Item
          icon={<User size={16} />}
          label="Info del Nino"
          href="/parents/settings"
          isActive={active === "info"}
        />
        <Item
          icon={<History size={16} />}
          label="Historial"
          href="/parents/history"
          isActive={active === "history"}
        />
        <Item
          icon={<ClipboardCheck size={16} />}
          label="Inscripciones"
          href="/parents/enrollments"
          isActive={active === "enrollments"}
        />
      </div>
    </aside>
  );
}
