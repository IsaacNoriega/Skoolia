"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/services/api";

type LeadStatus = "NUEVO" | "INTERESADO" | "VISITA" | "INSCRITO";

interface Lead {
  id: string;
  userId: string;
  targetId: string;
  originType: string;
  status: LeadStatus;
  lastTrigger: string;
  metadata?: any;
  updatedAt: string;
}

export default function CourseLeadsSection() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    api(`/leads/school?originType=COURSE`, { method: "GET" })
      .then((data) => setLeads(data as Lead[]))
      .catch(() => setError("No se pudieron cargar los leads de cursos."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Prospectos de cursos</h2>
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <p className="text-slate-500">Cargando leads...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : leads.length === 0 ? (
          <p>No hay prospectos registrados para tus cursos.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Nombre del usuario</th>
                <th className="text-left py-2">Estado</th>
                <th className="text-left py-2">Última acción</th>
                <th className="text-left py-2">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b">
                  <td className="py-2">{lead.id}</td>
                  <td className="py-2">{lead.userName || lead.userId}</td>
                  <td className="py-2">{lead.status}</td>
                  <td className="py-2">{lead.lastTrigger}</td>
                  <td className="py-2">{new Date(lead.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
