"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info" | "warning";

type ToastItem = {
	id: number;
	title: string;
	description?: string;
	variant: ToastVariant;
};

type ToastInput = {
	title: string;
	description?: string;
	variant?: ToastVariant;
	duration?: number;
};

type ToastContextValue = {
	showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastStyles(variant: ToastVariant) {
	if (variant === "success") {
		return {
			icon: CheckCircle2,
			iconClassName: "text-emerald-600",
			containerClassName: "border-emerald-200 bg-emerald-50/95",
		};
	}

	if (variant === "error") {
		return {
			icon: CircleAlert,
			iconClassName: "text-rose-600",
			containerClassName: "border-rose-200 bg-rose-50/95",
		};
	}

	if (variant === "warning") {
		return {
			icon: CircleAlert,
			iconClassName: "text-amber-600",
			containerClassName: "border-amber-200 bg-amber-50/95",
		};
	}

	return {
		icon: Info,
		iconClassName: "text-sky-600",
		containerClassName: "border-sky-200 bg-sky-50/95",
	};
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const nextId = useRef(1);

	const removeToast = useCallback((id: number) => {
		setToasts((current) => current.filter((toast) => toast.id !== id));
	}, []);

	const showToast = useCallback(
		({ title, description, variant = "info", duration = 3500 }: ToastInput) => {
			const id = nextId.current++;

			setToasts((current) => [...current, { id, title, description, variant }]);

			window.setTimeout(() => {
				removeToast(id);
			}, duration);
		},
		[removeToast],
	);

	const value = useMemo(() => ({ showToast }), [showToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-3">
				{toasts.map((toast) => {
					const styles = getToastStyles(toast.variant);
					const Icon = styles.icon;

					return (
						<div
							key={toast.id}
							className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur ${styles.containerClassName}`}
						>
							<div className="flex items-start gap-3">
								<Icon size={18} className={`mt-0.5 shrink-0 ${styles.iconClassName}`} />
								<div className="min-w-0 flex-1">
									<p className="text-sm font-extrabold text-slate-900">{toast.title}</p>
									{toast.description ? (
										<p className="mt-1 text-xs text-slate-600">{toast.description}</p>
									) : null}
								</div>
								<button
									type="button"
									onClick={() => removeToast(toast.id)}
									className="rounded-full p-1 text-slate-400 transition hover:bg-white/70 hover:text-slate-600"
									aria-label="Cerrar notificación"
								>
									<X size={14} />
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);

	if (!context) {
		throw new Error("useToast must be used within ToastProvider");
	}

	return context;
}
