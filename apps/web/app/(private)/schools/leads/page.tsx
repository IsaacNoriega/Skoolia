"use client";

import { useEffect, useState } from "react";
import { LeadsDashboard } from "@/components/leads/LeadsDashboard";
import { api } from "@/lib/services/api";
import { schoolsService, type School } from "@/lib/services/services/schools.service";

export default function SchoolsLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  useEffect(() => {
    schoolsService.getMySchool().then((schoolData) => {
      setSchool(schoolData);
      if (schoolData?.id) {
        api(`/leads/school?schoolId=${schoolData.id}`).then((data) => {
          setLeads(Array.isArray(data) ? data.map(l => ({ userName: l.userName || "", ...l })) : []);
        });
      }
    });
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6">
      <LeadsDashboard leads={leads} />
    </div>
  );
}
