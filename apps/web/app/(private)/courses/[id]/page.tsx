'use client';
import { useEffect, useState } from "react";
import { coursesService, Course } from "@/lib/services/services/courses.service";
import { useParams, useRouter } from "next/navigation";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";
import { useAuth } from "@/contexts/AuthContext";

  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { trackLead } = useLeadTracking({ userId: user?.id || "" });
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
        const data = await coursesService.getById(id);
        setCourse(data);
        setForm({
          name: data.name || "",
          description: data.description || "",
          price: data.price || 0,
          capacity: data.capacity ?? 0,
          modality: data.modality || "",
          startDate: data.startDate ? data.startDate.slice(0, 10) : "",
          endDate: data.endDate ? data.endDate.slice(0, 10) : "",
          isActive: data.isActive,
          status: data.status || "draft",
        });
        // Registrar lead cuando un padre ve la página de detalles
        if (user?.id && data.id) {
          trackLead({
            targetId: data.id,
            originType: "COURSE",
            trigger: "VIEW",
            status: "INTERESADO",
          });
        }
      } catch (e) {
        setError("No se pudo cargar el curso");
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user?.id]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    if (course) {
      setForm({
        name: course.name || "",
        description: course.description || "",
        price: course.price || 0,
        capacity: course.capacity ?? 0,
        modality: course.modality || "",
        startDate: course.startDate ? course.startDate.slice(0, 10) : "",
        endDate: course.endDate ? course.endDate.slice(0, 10) : "",
        isActive: course.isActive,
        status: course.status || "draft",
      });
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
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
        status: form.status,
        startDate: form.startDate === "" ? null : form.startDate,
        endDate: form.endDate === "" ? null : form.endDate,
      });
      setCourse(updated);
      setEditMode(false);
    } catch (e) {
      setSaveError("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (error || !course) return <div className="p-8 text-red-600">No se pudo cargar el curso.</div>;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-extrabold mb-4">{course.name}</h1>
      {course.coverImageUrl && (
        <img src={course.coverImageUrl} alt={course.name} className="mb-4 rounded-xl w-full max-h-72 object-cover" />
      )}
      {editMode ? (
        <div className="bg-slate-50 p-4 rounded-xl mb-6 border">
          <div className="mb-3">
            <label className="block font-bold mb-1">Nombre</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full p-2 rounded border" />
          </div>
          <div className="mb-3">
            <label className="block font-bold mb-1">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full p-2 rounded border" />
          </div>
          <div className="mb-3">
            <label className="block font-bold mb-1">Precio</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} className="w-full p-2 rounded border" />
          </div>
          <div className="mb-3">
            <label className="block font-bold mb-1">Cupo</label>
            <input name="capacity" type="number" value={form.capacity} onChange={handleChange} className="w-full p-2 rounded border" />
          </div>
          <div className="mb-3">
            <label className="block font-bold mb-1">Modalidad</label>
            <select name="modality" value={form.modality} onChange={handleChange} className="w-full p-2 rounded border">
              <option value="">Selecciona</option>
              <option value="en-linea">En línea</option>
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block font-bold mb-1">Inicio</label>
            <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className="w-full p-2 rounded border" />
          </div>
          <div className="mb-3">
            <label className="block font-bold mb-1">Fin</label>
            <input name="endDate" type="date" value={form.endDate} onChange={handleChange} className="w-full p-2 rounded border" />
          </div>
          <div className="mb-3">
            <label className="inline-flex items-center gap-2">
              <input name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} /> Activo
            </label>
          </div>
          <div className="mb-3">
            <label className="block font-bold mb-1">Estado</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full p-2 rounded border">
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          {saveError && <div className="text-red-600 mb-2">{saveError}</div>}
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded font-bold hover:bg-emerald-700 disabled:opacity-60">
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={handleCancel} disabled={saving} className="bg-slate-300 text-slate-800 px-4 py-2 rounded font-bold hover:bg-slate-400 disabled:opacity-60">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 text-slate-700">
            <strong>Descripción:</strong> {course.description || "Sin descripción"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div><strong>Precio:</strong> {course.price ? `$${course.price}` : "Sin definir"}</div>
            <div><strong>Cupo:</strong> {course.capacity ?? "Sin definir"}</div>
            <div><strong>Modalidad:</strong> {course.modality ?? "Sin definir"}</div>
            <div><strong>Estado:</strong> {course.status === "draft" ? "Borrador" : course.status === "published" ? "Publicado" : "Archivado"}</div>
            <div><strong>Activo:</strong> {course.isActive ? "Sí" : "No"}</div>
            <div><strong>Inicio:</strong> {course.startDate ? new Date(course.startDate).toLocaleDateString() : "Sin definir"}</div>
            <div><strong>Fin:</strong> {course.endDate ? new Date(course.endDate).toLocaleDateString() : "Sin definir"}</div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-white font-bold hover:bg-emerald-700 transition"
            onClick={handleEdit}
          >
            Editar
          </button>
        </>
      )}
    </main>
  );
}
