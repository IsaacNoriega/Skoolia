"use client";
import { useEffect, useState } from "react";
import { LeadsDashboard } from "@/components/leads/LeadsDashboard";
import { api } from "@/lib/services/api";
import SchoolsNavbar from "@/components/schools/SchoolsNavbar";
import SchoolsSidebar from "@/components/schools/SchoolsSidebar";
import SchoolSummaryHeader from "@/components/schools/SchoolSummaryHeader";
import SchoolLeadsSection from "@/components/schools/SchoolLeadsSection";

export default function SchoolsLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  useEffect(() => {
    api("/leads/school").then(setLeads);
  }, []);

  return (
    <>
      <SchoolsNavbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <SchoolsSidebar active="leads" />
          <div className="space-y-5 sm:space-y-6">
            {/* <SchoolSummaryHeader /> */}
            <LeadsDashboard leads={leads} />
          </div>
        </div>
      </main>
    </>
  );
}
