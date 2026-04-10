/**
 * =============================================================================
 * 📍 COMPONENT: SERVER → CLIENT WRAPPER FOR TESTIMONIALS SECTION
 * =============================================================================
 * File: CategoriesParentsSection.tsx
 * Type: Server Component
 * 
 * Purpose:
 *   Entry point for the "Nuestros miembros ya disfrutan" testimonials section
 *   Delegates rendering to client wrapper component due to useAuth() requirement
 * 
 * Why This Pattern?
 *   - This is a Server Component (default in Next.js 13+)
 *   - The actual testimonials section needs useAuth() hook (Client Component)
 *   - Solution: This component imports and renders the client wrapper
 * 
 * Flow:
 *   CategoriesParentsSECTION (Server) → CategoriesClientWrapper (Client)
 * 
 * Modified: Session 9
 *   - Replaced inline JSX with CategoriesClientWrapper import/render
 *   - Enables auth-based conditional rendering
 * =============================================================================
 */

import { WaveVector } from "@/lib/icons/WaveVector";
import { Star } from "lucide-react";
import Testimonials3Cards from "./TestimonialSection";
import TestimonialsSection from "./TestimonialSection";
import { CategoriesClientWrapper } from "./CategoriesClientWrapper";

// ─────────────────────────────────────────────────────────────────────────
// SECTION 1: SERVER COMPONENT - ROUTES TO CLIENT WRAPPER
// ─────────────────────────────────────────────────────────────────────────
export default function CategoriesSection() {
  return <CategoriesClientWrapper />;
}
