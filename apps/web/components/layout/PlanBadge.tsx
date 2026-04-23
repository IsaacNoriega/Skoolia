import { BadgeCheck, Star, Gem } from "lucide-react";

export function PlanBadge({ plan }: { plan?: string }) {
  if (!plan) return null;
  if (plan === "PREMIUM_SUBSCRIPTION")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-pink-500 px-3 py-1 text-xs font-bold text-white shadow-md border-2 border-yellow-400 animate-pulse">
        <Gem className="w-4 h-4" /> PREMIUM
      </span>
    );
  if (plan === "FREEMIUM")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-300">
        <Star className="w-4 h-4 text-slate-400" /> FREEMIUM
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
      <BadgeCheck className="w-4 h-4 text-blue-400" /> {plan.replace(/_/g, ' ')}
    </span>
  );
}
