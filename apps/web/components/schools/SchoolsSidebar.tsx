"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  CreditCard,
  Headphones,
  Inbox,
  LogOut,
  Megaphone,
  MessageCircle,
  School,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { SCHOOL_THREADS_UPDATED_EVENT } from "@/lib/school-thread-events";
import {
  messagesService,
  type SchoolThread,
} from "@/lib/services/services/messages.service";

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

type SidebarItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  key: ActiveSection;
  badge?: string | number;
};

function SidebarLink({
  icon: Icon,
  label,
  href,
  isActive,
  badge,
}: Omit<SidebarItem, "key"> & { isActive?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      title={label}
      className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
        isActive
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-600 hover:bg-white hover:text-slate-950"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${
          isActive
            ? "text-slate-950"
            : "text-slate-500 group-hover:text-slate-800"
        }`}
      >
        <Icon size={20} strokeWidth={2} />
      </span>

      {badge !== undefined && (
        <span
          className={`absolute -right-1 -top-1 z-10 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
            isActive ? "bg-[#1973fd] text-white" : "bg-[#1973fd]/10 text-[#1973fd]"
          }`}
        >
          {badge}
        </span>
      )}

      <span className="pointer-events-none absolute left-full top-1/2 z-[100] ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block">
        {label}
      </span>
    </Link>
  );
}

export default function SchoolsSidebar({ active = "summary" }: Props) {
  const { logout, user } = useAuth();
  const pathname = usePathname();
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
  }, [user]);

  const pendingCount = useMemo(
    () => threads.reduce((sum, thread) => sum + thread.unreadCount, 0),
    [threads]
  );

  const groups = [
    {
      label: "Panel",
      items: [
        {
          icon: Activity,
          label: "Vista general",
          href: "/schools",
          key: "summary" as const,
        },
        {
          icon: BookOpen,
          label: "Oferta académica",
          href: "/schools/courses",
          key: "courses" as const,
        },
      ],
    },
    {
      label: "Gestión",
      items: [
        {
          icon: Users,
          label: "Prospectos",
          href: "/schools/leads",
          key: "leads" as const,
          badge: pendingCount || undefined,
        },
        {
          icon: MessageCircle,
          label: "Mensajería",
          href: "/schools/messages",
          key: "messages" as const,
          badge: pendingCount || undefined,
        },
        {
          icon: Inbox,
          label: "Envíos masivos",
          href: "/schools/broadcasts",
          key: "broadcasts" as const,
        },
        {
          icon: Megaphone,
          label: "Ofertas y promos",
          href: "/schools/offers",
          key: "offers" as const,
        },
      ],
    },
    {
      label: "Cuenta",
      items: [
        {
          icon: CreditCard,
          label: "Planes y pagos",
          href: "/schools/plans",
          key: "plans" as const,
        },
        {
          icon: Settings,
          label: "Configuración",
          href: "/schools/settings",
          key: "settings" as const,
        },
      ],
    },
  ];

  const currentSection: ActiveSection =
    pathname === "/schools/courses"
      ? "courses"
      : pathname === "/schools/leads"
      ? "leads"
      : pathname === "/schools/messages"
      ? "messages"
      : pathname === "/schools/broadcasts"
      ? "broadcasts"
      : pathname === "/schools/offers"
      ? "offers"
      : pathname === "/schools/plans"
      ? "plans"
      : pathname === "/schools/settings"
      ? "settings"
      : active;

  return (
    <aside className="relative z-[100] flex h-screen w-full flex-col border-r border-slate-200 bg-[#f6f6f6]">
      <div className="flex min-h-0 flex-1 flex-col items-center px-3 py-6">
        <div className="mb-9">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1973fd] text-white">
              <School size={22} strokeWidth={2.4} />
            </div>
          </div>
        </div>

        <div className="min-h-0 w-full flex-1 space-y-6 overflow-visible">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col items-center">
              <div className="mb-3 h-px w-8 bg-slate-300" />
              <div className="space-y-2">
                {group.items.map((item) => {
                  const { key, ...sidebarItem } = item;

                  return (
                    <SidebarLink
                      key={item.href}
                      {...sidebarItem}
                      isActive={currentSection === key}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex w-full flex-col items-center space-y-3">
          <button
            type="button"
            title="Soporte"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-950 transition hover:border-slate-400"
          >
            <Headphones size={16} />
          </button>

          <button
            onClick={logout}
            title="Cerrar sesión"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-950"
          >
            <LogOut size={16} />
          </button>

          <div
            title={user?.name ?? "Cuenta escuela"}
            className="mt-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#1973fd] text-sm font-bold text-white"
          >
            {(user?.name?.charAt(0) || user?.email?.charAt(0) || "S").toUpperCase()}
          </div>
        </div>
      </div>
    </aside>
  );
}
