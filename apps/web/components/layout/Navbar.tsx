"use client";

import {
  GraduationCap,
  LogIn,
  PlusCircle,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  User,
  Crown,
  Bell,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { JSX, Suspense, useEffect, useState } from "react";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import { useAuth } from "@/contexts/AuthContext";

function NavbarContent(): JSX.Element {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const audience = searchParams.get("audience") ?? "parents";

  if (loading) {
    return (
      <div className="sticky top-0 z-50 bg-transparent pt-5">
        <nav className="w-full max-w-6xl mx-auto px-8 py-4 bg-white/55 backdrop-blur-md rounded-4xl flex items-center justify-between h-[80px]">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-4">
             <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse" />
             <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </nav>
      </div>
    );
  }

  const isWhite = pathname?.includes("login") || audience === "schools";

  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const displayName = user?.name ?? user?.email.split("@")[0] ?? "";

  return (
    <div className="sticky top-0 z-50 bg-transparent pt-5">
      <nav
        className={`w-full max-w-6xl mx-auto px-8 py-4 ${
          scrolled
            ? "bg-white/55 backdrop-blur-md shadow-lg border border-white/30"
            : isWhite
              ? "bg-white"
              : "bg-[#f3f3f3]"
        } text-black rounded-4xl flex items-center justify-between transition-all duration-300`}
      >
        {/* ===== LEFT SIDE (LOGO + LINKS) ===== */}
        <div className="flex items-center gap-10">
          {/* LOGO */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 bg-[#1973FC] rounded-xl">
              <GraduationCap size={28} className="text-white" />
            </div>
            <span className="font-extrabold text-2xl text-slate-800">
              Skoolia
            </span>
          </div>

          {/* LINKS */}
          <ul className="hidden md:flex gap-8 font-semibold text-base">
            {!user && (
              <>
                <li>
                  <Link
                    href="/?audience=parents"
                    className={`font-medium ${
                      pathname === "/" && audience === "parents"
                        ? "text-[#1973FC]"
                        : "text-[#2d2c2b] hover:text-black"
                    }`}
                  >
                    Para padres
                  </Link>
                </li>

                <li>
                  <Link
                    href="/?audience=schools"
                    className={`font-medium ${
                      pathname === "/" && audience === "schools"
                        ? "text-[#1973FC]"
                        : "text-[#2d2c2b] hover:text-black"
                    }`}
                  >
                    Para escuelas
                  </Link>
                </li>

                <li>
                  <Link
                    href="/?audience=help"
                    className={`font-medium ${
                      pathname === "/" && audience === "help"
                        ? "text-[#1973FC]"
                        : "text-[#2d2c2b] hover:text-black"
                    }`}
                  >
                    Ayuda
                  </Link>
                </li>
              </>
            )}

            {user?.role === "public" && (
              <>
                <li>
                  <Link
                    href="/?audience=parents"
                    className="font-medium text-[#2d2c2b] hover:text-black"
                  >
                    Buscar escuelas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/?audience=help"
                    className={`font-medium ${
                      pathname === "/" && audience === "help"
                        ? "text-[#1973FC]"
                        : "text-[#2d2c2b] hover:text-black"
                    }`}
                  >
                    Ayuda
                  </Link>
                </li>
              </>
            )}

            {user?.role === "private" && (
              <li>
                <Link 
                  href={user.hasSchool ? "/schools" : "/courses"} 
                  className="font-medium text-[#2d2c2b] hover:text-black"
                >
                  Dashboard
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* ===== RIGHT SIDE (AUTH) ===== */}
        {!user ? (
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/auth/login")}
              className="px-5 py-2 text-slate-800 rounded-full font-medium flex items-center gap-2 cursor-pointer"
            >
              Iniciar sesión
            </button>

            <button
              onClick={() => router.push("/auth/register")}
              className="px-5 py-2 rounded-2xl bg-[#1973FC] text-white font-semibold flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              Regístrate gratis
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((p) => !p)}
              className="flex items-center gap-3 bg-white hover:bg-[#f3f3f3] px-4 py-2 rounded-2xl transition"
            >
              <div className="w-9 h-9 bg-[#FF33FF]/24 rounded-full flex items-center justify-center text-white font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <span className="font-medium max-w-35 truncate text-base">
                {displayName}
              </span>

              <ChevronDown size={18} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white shadow-xl rounded-2xl p-2 border z-50">
                {/* 🔹 PRIVATE MENU */}
                {user.role === "private" && (
                  <>
                    <Link
                      href={user.hasSchool ? "/schools" : "/courses"}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>

                    <Link
                      href="/billing"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      <Crown size={16} />
                      Mejorar plan
                    </Link>

                    <Link
                      href="/notifications"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      <Bell size={16} />
                      Notificaciones
                    </Link>
                  </>
                )}

                {/* 🔹 PUBLIC MENU */}
                {user.role === "public" && (
                  <>
                    <Link
                      href="/parents/favorites"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      <Heart size={16} />
                      Favoritos
                    </Link>

                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      <User size={16} />
                      Mi perfil
                    </Link>
                  </>
                )}

                {/* 🔹 Divider */}
                <div className="my-2 h-px bg-gray-200" />

                {/* 🔹 Logout (para ambos) */}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg text-sm text-red-600 w-full text-left"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}

export default function Navbar(): JSX.Element {
  return (
    <Suspense fallback={<div className="h-20" />}>
      <NavbarContent />
    </Suspense>
  );
}
