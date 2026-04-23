"use client";
import React, { useEffect, useState } from "react";
import { plansService, Plan } from "@/lib/services/services/plans.service";

export default function CoursePlansSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    plansService
      .getAll()
      .then((data) => setPlans(data))
      .catch(() => setError("No se pudieron cargar los planes"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Planes y pagos de cursos</h2>
      <div className="bg-white rounded-lg shadow p-6">
        {loading && <p>Cargando planes...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <ul className="space-y-4">
            {plans.map((plan) => (
              <li key={plan.id} className="border rounded p-4">
                <div className="font-semibold text-lg">{plan.name}</div>
                <div className="text-gray-600">
                  ${plan.price} / {plan.interval === "monthly" ? "mes" : "año"}
                </div>
                <div className="mt-2">
                  <span className="font-medium">Características:</span>
                  <ul className="list-disc ml-6">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
