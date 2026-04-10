/**
 * =============================================================================
 * 📍 COMPONENT: CALL-TO-ACTION SECTION - "EMPIEZA A PLANEAR TU FUTURO"
 * =============================================================================
 * File: CallParentsSections.tsx
 * Type: Client Component
 * 
 * Purpose:
 *   Marketing CTA section for UNAUTHENTICATED parents
 *   Encourages sign-up with prominent messaging and call-to-action button
 * 
 * Features:
 *   ✓ Large heading: "Empieza a planear su futuro / Hoy mismo"
 *   ✓ Signup CTA button → links to /signup page
 *   ✓ Decorative SVG footer illustration (/illustrations/footer.svg)
 *   ✓ Gradient and responsive layout using Tailwind
 * 
 * Auth Guard:
 *   ✓ Returns null if user is authenticated
 *   ✓ Hidden from logged-in users (no marketing noise)
 * 
 * Modified: Session 9
 *   - Added useAuth() hook check
 *   - Hides section when user is logged in
 * =============================================================================
 */

"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function CallParentsSections() {
  const { user } = useAuth();

  // ─────────────────────────────────────────────────────────────────────────
  // AUTH GUARD: Hide this CTA from authenticated users
  // ─────────────────────────────────────────────────────────────────────────
  if (user) return null;

  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center flex flex-col items-center">

        {/* TÍTULO */}
        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-black">
          Empieza a planear su futuro
          <br />
          <span className="text-[#2D6CDF] mt-2 inline-block">
            Hoy mismo
          </span>
        </h2>

        {/* BOTÓN */}
        <div className="mt-12">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-[#333331] hover:bg-[#2a2a28] text-white font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-[1.03]"
          >
            Crear mi cuenta
          </Link>
        </div>
      </div>

      {/* SVG DECORATIVO PRINCIPAL */}
      <img
        src="/illustrations/footer.svg"
        alt=""
        className="pointer-events-none absolute left-0 bottom-0 w-350 max-w-none opacity-90"
      />


    </section>
  );
}

