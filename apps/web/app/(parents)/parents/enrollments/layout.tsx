"use client";
import { usePathname } from "next/navigation";
import ParentsCompactSidebar from "@/components/parents/ParentsCompactSidebar";

export default function EnrollmentsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    let active: "favorites" | "messages" | "info" | "history" | "enrollments" = "enrollments";
    
    if (pathname.includes("favorites")) active = "favorites";
    else if (pathname.includes("messages")) active = "messages";
    else if (pathname.includes("settings")) active = "info";
    else if (pathname.includes("history")) active = "history";
    else if (pathname.includes("enrollments")) active = "enrollments";

    return (
        <main className="mx-auto w-full max-w-6xl px-6 py-8">
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[96px_1fr]">
                <ParentsCompactSidebar active={active} />
                <div className="w-full">{children}</div>
            </div>
        </main>
    );
}
