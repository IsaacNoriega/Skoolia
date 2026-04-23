"use client";

import { useEffect, useState } from "react";
import { FavoriteButton } from "@/components/leads/FavoriteButton";
import { useParams } from "next/navigation";
import { coursesService, Course } from "@/lib/services/services/courses.service";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";
import { useAuth } from "@/contexts/AuthContext";

export default function CourseDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { trackLead } = useLeadTracking({ userId: user?.id || "" });

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    capacity: 0,
    modality: "",
    startDate: "",
    endDate: "",
    isActive: true,
    status: "draft",
  });

  // Helpers
  const getId = () => {
    if (typeof params.id === "string") return params.id;
    if (Array.isArray(params.id)) return params.id[0];
    return "";
  };

  const fillForm = (data: Course) => {
    setForm({
      name: data.name || "",
      description: data.description || "",
      price: data.price || 0,
      capacity: data.capacity ?? 0,
      modality: data.modality || "",
      startDate: data.startDate?.slice(0, 10) || "",
      endDate: data.endDate?.slice(0, 10) || "",
      status: data.status || "draft",
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return { label: "Borrador", color: "bg-yellow-100 text-yellow-700" };
      case "published":
        return { label: "Publicado", color: "bg-green-100 text-green-700" };
      case "archived":
        return { label: "Archivado", color: "bg-gray-200 text-gray-700" };
      default:
        return { label: status, color: "bg-slate-100 text-slate-600" };
    }
  };

  // Fetch

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const id = getId();
        const data = await coursesService.getById(id);
        setCourse(data);
        fillForm(data);

        // Intentar obtener si es favorito
        if (user?.id && data.id) {
          trackLead({
            targetId: data.id,
            originType: "COURSE",
            trigger: "VIEW",
            status: "INTERESADO",
          });

          // Consulta rápida: si tienes endpoint de favoritos, aquí deberías consultar si es favorito
          // Por ahora, simplemente ignora y deja el corazón vacío por default
        }
      } catch {
        setError("No se pudo cargar el curso");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [params.id, user?.id]);
  const handleToggleFavorite = async () => {
    if (!course) return;
    setFavoriteLoading(true);
    try {
      const result = await coursesService.toggleFavorite(course.id);
      setIsFavorite(result.isFavorite);
    } catch {
      // opcional: mostrar error
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    if (!course) return;

    setSaving(true);
    setSaveError(null);

    try {
      const updated = await coursesService.update(course.id, {
        ...form,
        price: Number(form.price),
        capacity: Number(form.capacity),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      });

      setCourse(updated);
      setEditMode(false);
    } catch {
      setSaveError("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (course) fillForm(course);
    setEditMode(false);
  };

  // UI States
  if (loading) {
    return <div className="p-8 text-slate-500">Cargando curso...</div>;
  }

  if (error || !course) {
    return <div className="p-8 text-red-600">{error || "Error inesperado"}</div>;
  }

  const status = getStatusLabel(course.status);

  return (
    <main className="mx-auto max-w-3xl p-6">
      {/* Header */}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-slate-900">
            {course.name}
          </h1>
          {user?.role === "public" && course && (
            <FavoriteButton
              userId={user?.id || ""}
              targetId={course.id}
              originType="COURSE"
            />
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      {/* Image */}
      {course.coverImageUrl && (
        <img
          src={course.coverImageUrl}
          alt={course.name}
          className="mb-6 w-full h-64 object-cover rounded-2xl shadow"
        />
      )}

      {editMode ? (
        // EDIT MODE
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <Input label="Nombre" name="name" value={form.name} onChange={handleChange} />
          <Textarea label="Descripción" name="description" value={form.description} onChange={handleChange} />
          <Input label="Precio" name="price" type="number" value={form.price} onChange={handleChange} />
          <Input label="Cupo" name="capacity" type="number" value={form.capacity} onChange={handleChange} />

          <div>
            <label className="label">Modalidad</label>
            <select name="modality" value={form.modality} onChange={handleChange} className="input">
              <option value="">Selecciona</option>
              <option value="en-linea">En línea</option>
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>

          <div>
            <label className="label">Estado</label>
            <select name="status" value={form.status} onChange={handleChange} className="input">
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="input" />
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="input" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
            <span>Activo</span>
          </div>

          {saveError && <p className="text-red-500">{saveError}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Guardando..." : "Guardar"}
            </button>

            <button onClick={handleCancel} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        // VIEW MODE
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <p><strong>Descripción:</strong> {course.description || "Sin descripción"}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><strong>Precio:</strong> ${course.price || "-"}</p>
            <p><strong>Cupo:</strong> {course.capacity ?? "-"}</p>
            <p><strong>Modalidad:</strong> {course.modality || "-"}</p>
            <p><strong>Activo:</strong> {course.isActive ? "Sí" : "No"}</p>
            <p><strong>Inicio:</strong> {course.startDate ? new Date(course.startDate).toLocaleDateString() : "-"}</p>
            <p><strong>Fin:</strong> {course.endDate ? new Date(course.endDate).toLocaleDateString() : "-"}</p>
          </div>

          <button onClick={() => setEditMode(true)} className="btn-primary mt-4">
            Editar curso
          </button>
        </div>
      )}

      {/* Reusable Components */}
      <style jsx>{`
        .input {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }
        .label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
          display: block;
        }
        .btn-primary {
          background: #10b981;
          color: white;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 600;
        }
        .btn-secondary {
          background: #e2e8f0;
          padding: 10px 16px;
          border-radius: 10px;
        }
      `}</style>
    </main>
  );
}

// Mini components
function Input(props: any) {
  return (
    <div>
      <label className="label">{props.label}</label>
      <input {...props} className="input" />
    </div>
  );
}

function Textarea(props: any) {
  return (
    <div>
      <label className="label">{props.label}</label>
      <textarea {...props} className="input" />
    </div>
  );
}