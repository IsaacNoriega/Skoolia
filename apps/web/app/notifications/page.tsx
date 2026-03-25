"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";

type NotificationType = "message" | "favorite" | "system";

type AppNotification = {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
};

const STORAGE_KEY_PREFIX = "skoolia:notifications";

function getStorageKey(userId?: string) {
  return `${STORAGE_KEY_PREFIX}:${userId ?? "anon"}`;
}

function getSeedNotifications(role?: "public" | "private"): AppNotification[] {
  const now = new Date();

  if (role === "private") {
    return [
      {
        id: "seed-private-1",
        title: "Nuevo mensaje recibido",
        description: "Un padre de familia te escribió desde la sección de mensajería.",
        type: "message",
        createdAt: now.toISOString(),
        read: false,
      },
      {
        id: "seed-private-2",
        title: "Perfil de escuela actualizado",
        description: "Tu perfil institucional fue actualizado correctamente.",
        type: "system",
        createdAt: new Date(now.getTime() - 1000 * 60 * 35).toISOString(),
        read: true,
      },
    ];
  }

  return [
    {
      id: "seed-public-1",
      title: "Escuela guardada en favoritos",
      description: "Tu lista de favoritos está lista para comparar opciones.",
      type: "favorite",
      createdAt: now.toISOString(),
      read: false,
    },
    {
      id: "seed-public-2",
      title: "Tip de búsqueda",
      description: "Aplica filtros por ciudad y nivel para encontrar escuelas más rápido.",
      type: "system",
      createdAt: new Date(now.getTime() - 1000 * 60 * 75).toISOString(),
      read: true,
    },
  ];
}

function readNotifications(userId?: string): AppNotification[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

function writeNotifications(items: AppNotification[], userId?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(items));
}

function getTypeBadgeClasses(type: NotificationType) {
  if (type === "message") return "bg-sky-50 text-sky-700";
  if (type === "favorite") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

function formatRelativeDate(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} d`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    const existing = readNotifications(user?.id);

    if (existing.length) {
      setItems(existing);
      return;
    }

    const seeded = getSeedNotifications(user?.role);
    setItems(seeded);
    writeNotifications(seeded, user?.id);
  }, [user?.id, user?.role]);

  const unreadCount = useMemo(
    () => items.filter((notification) => !notification.read).length,
    [items],
  );

  const markAllAsRead = () => {
    const updated = items.map((notification) => ({ ...notification, read: true }));
    setItems(updated);
    writeNotifications(updated, user?.id);
  };

  const clearAll = () => {
    setItems([]);
    writeNotifications([], user?.id);
  };

  const markAsRead = (id: string) => {
    const updated = items.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    );
    setItems(updated);
    writeNotifications(updated, user?.id);
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="surface overflow-hidden rounded-4xl bg-white p-0 shadow-sm ring-1 ring-black/5">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100/70 px-5 py-4 sm:px-6 sm:py-5">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Notificaciones</h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {unreadCount} sin leer
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={!unreadCount}
              >
                <CheckCheck size={14} />
                Marcar todo leído
              </button>

              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                disabled={!items.length}
              >
                <Trash2 size={14} />
                Limpiar
              </button>
            </div>
          </header>

          {!items.length ? (
            <div className="px-5 py-12 text-center sm:px-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Bell size={20} />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-700">No hay notificaciones por ahora</p>
              <p className="mt-1 text-xs text-slate-500">Aquí verás novedades de tu actividad en Skoolia.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/70">
              {items.map((notification) => (
                <article
                  key={notification.id}
                  className={`px-5 py-4 sm:px-6 ${notification.read ? "bg-white" : "bg-indigo-50/40"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${getTypeBadgeClasses(
                            notification.type,
                          )}`}
                        >
                          {notification.type}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {formatRelativeDate(notification.createdAt)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-extrabold text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{notification.description}</p>
                    </div>

                    {!notification.read ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className="shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Marcar leída
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
