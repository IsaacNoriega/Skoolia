"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import { LineBackground } from "@/lib/icons/LineBackground";
import { authService } from "@/lib/services/services/auth.service";
import { ApiError } from "@/lib/services/api";
import { WaveVector } from "@/lib/icons/WaveVector";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Role = "public" | "private";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("public");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleRegister() {
    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await authService.register({
        name,
        email,
        password,
        role, // 🔥 aquí ya está controlado por el toggle
      });

      const loginPath = role === "private" ? "/auth/login/schools" : "/auth/login/parents";
      const params = new URLSearchParams({
        registered: "1",
        email,
      });

      router.push(`${loginPath}?${params.toString()}`);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof ApiError) {
        const data = err.data as { message?: string | string[] } | undefined;
        const message = Array.isArray(data?.message)
          ? data.message[0]
          : data?.message;

        if (err.status === 409) {
          setError("Ese correo ya está registrado. Inicia sesión.");
        } else if (message) {
          setError(message);
        } else {
          setError(`No se pudo crear la cuenta. Error ${err.status}.`);
        }
      } else {
        setError("No se pudo crear la cuenta. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* NAVBAR */}
      <div className="pt-0 px-6">
        <Navbar />
      </div>

      {/* CONTENIDO CENTRAL */}
      <div className="flex-1 flex items-center justify-center px-20 pb-20 mt-10 relative z-10">
        <div className="w-full max-w-7xl grid md:grid-cols-[550px_minmax(0,1fr)] gap-20 items-start">
          {/* ===== LEFT SIDE (DINÁMICO + ANIMADO) ===== */}
          <div className="w-137.5 min-h-100 bg-transparent rounded-3xl p-10 shrink-0 ml-20 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {role === "private" ? (
                <motion.div
                  key="private"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="space-y-2"
                >
                  {/* ===== CONTENIDO ESCUELAS (EL TUYO ORIGINAL) ===== */}
                  <h1 className="text-2xl font-semibold">
                    Únete a la experiencia
                  </h1>

                  <div className="flex gap-2 mt-1">
                    <h1 className="text-2xl font-semibold">Skoolia</h1>
                    <span className="text-2xl font-semibold text-[#1973FC]">
                      Gratuitamente hoy mismo
                    </span>
                  </div>

                  <h2 className="font-semibold mt-3">
                    La plataforma líder para buscar escuelas en México
                  </h2>

                  <span className="font-normal mt-1 block">
                    Registro gratuito y sin compromisos
                  </span>

                  <div className="mt-6">
                    <img
                      src="/illustrations/statsregister.svg"
                      alt=""
                      className="w-80"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="public"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="space-y-2"
                >
                  {/* ===== CONTENIDO PADRES ===== */}
                  <h1 className="text-2xl font-semibold">
                    Encuentra la mejor opción
                  </h1>

                  <div className="flex gap-2 mt-1">
                    <h1 className="text-2xl font-semibold">
                      para tu familia con
                    </h1>
                    <span className="text-2xl font-semibold text-[#1973FC]">
                      Skoolia
                    </span>
                  </div>

                  <h2 className="font-semibold mt-3">
                    Explora escuelas y cursos en un solo lugar
                  </h2>

                  <span className="font-normal mt-1 block">
                    Compara, guarda favoritos y contacta fácilmente.
                  </span>

                  <div className="mt-0">
                    <img
                      src="/illustrations/starvector.svg"
                      alt=""
                      className="w-60"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ===== RIGHT SIDE (REGISTER CARD) ===== */}
          <div className="w-full max-w-lg min-h-150 bg-white rounded-3xl p-10 space-y-6 border border-black/5 relative z-10">
            <h1 className="text-2xl font-bold text-center">Crear cuenta</h1>

            <div className="flex gap-1 justify-center">
              <p className="text-base">¿Ya tienes una cuenta?</p>
              <Link href="/auth/login" className="text-[#1973FC] underline">
                Inicia sesión
              </Link>
            </div>

            {/* ROLE TOGGLE */}
            <div className="w-full max-w-xs mx-auto">
              <div className="flex bg-[#efefef] rounded-full p-1">
                <button
                  onClick={() => setRole("public")}
                  className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                    role === "public"
                      ? "bg-white shadow text-black"
                      : "text-gray-500"
                  }`}
                >
                  Padres
                </button>

                <button
                  onClick={() => setRole("private")}
                  className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                    role === "private"
                      ? "bg-white shadow text-black"
                      : "text-gray-500"
                  }`}
                >
                  Escuela
                </button>
              </div>
            </div>

            {/* FORM */}
            <div className="space-y-4">
                <Input
                  placeholder="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 rounded-full bg-[#f3f3f3] border-0 px-6 focus-visible:ring-2 focus-visible:ring-[#1973FC]"
                />

              <Input
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-full bg-[#f3f3f3] border-0 px-6 focus-visible:ring-2 focus-visible:ring-[#1973FC]"
              />

              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 rounded-full bg-[#f3f3f3] border-0 px-6 focus-visible:ring-2 focus-visible:ring-[#1973FC]"
              />

              {/* TERMS */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded-md border border-black accent-[#1973FC] cursor-pointer"
                />

                <label
                  htmlFor="terms"
                  className="text-base text-[#2D2C2B] leading-tight"
                >
                  Acepto los{" "}
                  <Link
                    href="/terminos"
                    className="text-[#1973FC] underline hover:opacity-80"
                  >
                    Términos y condiciones
                  </Link>{" "}
                  y el{" "}
                  <Link
                    href="/privacidad"
                    className="text-[#1973FC] underline hover:opacity-80"
                  >
                    Aviso de privacidad
                  </Link>
                </label>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            {/* REGISTER BUTTON */}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full h-14 rounded-full bg-linear-to-r from-[#2A6EE8] to-[#1973FC] text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Cargando..." : "Registrarme"}
            </button>

            {/* GOOGLE BUTTON */}
            <button className="w-full h-14 rounded-full bg-[#f3f3f3] flex items-center justify-center gap-3 font-medium hover:bg-[#eaeaea] transition">
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Continuar con Google
            </button>
          </div>
        </div>
      </div>

      {/* VECTOR FIJO ABAJO */}
      <img
        src="/illustrations/registervector.svg"
        alt=""
        className="fixed bottom-[-50] left-0 w-380 pointer-events-none z-0"
      />
    </div>
  );
}
