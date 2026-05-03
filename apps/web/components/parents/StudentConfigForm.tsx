import { Save, Wand2, Sparkles, Baby, User, Check, Trash2, Heart, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentService, Student } from '@/lib/services/services/student.service';
import type { Category } from '@/lib/services/services/schools-categories.service';

interface Props {
  mode: 'create' | 'edit';
  initial?: Student;
  presetInterests?: Category[];
  onSaved?: (student: Student) => void;
  onCancel?: () => void;
}

const AVATARS = ['👶', '👧', '👦', '🧒', '🧑', '🎓', '🎨', '🚀', '⚽', '🎸'];

export default function StudentConfigForm({ mode, initial, presetInterests = [], onSaved, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [age, setAge] = useState(String(initial?.age ?? ''));
  const [budget, setBudget] = useState(String(initial?.monthlyBudget ?? ''));
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    initial?.interests?.map((interest) => interest.id) ?? [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isValid = useMemo(() => {
    const parsedAge = parseInt(age, 10);
    const parsedBudget = budget ? parseInt(budget, 10) : undefined;
    return (
      name.trim().length > 0 &&
      Number.isInteger(parsedAge) && parsedAge > 0 &&
      (parsedBudget === undefined || (Number.isInteger(parsedBudget) && parsedBudget >= 0))
    );
  }, [name, age, budget]);

  const handleAgeChange = (value: string) => {
    const digits = value.replace(/\D+/g, '');
    setAge(digits);
  };

  const handleBudgetChange = (value: string) => {
    const digits = value.replace(/\D+/g, '');
    setBudget(digits);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const parsedAge = parseInt(age, 10);
      const parsedBudget = budget ? parseInt(budget, 10) : undefined;
      const payload = {
        name: name.trim(),
        age: parsedAge,
        monthlyBudget: parsedBudget,
        categoryIds: selectedInterests,
      };
      mode === 'edit'
        ? await studentService.update(payload)
        : await studentService.create(payload);
      const saved = await studentService.getMyStudent();
      if (!saved) {
        throw new Error('No se pudo recuperar el alumno guardado.');
      }
      setSuccess(mode === 'edit' ? 'Perfil actualizado con éxito.' : '¡Hijo agregado con éxito!');
      onSaved?.(saved);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? 'Error al procesar la solicitud';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-[2.5rem] bg-white p-8 shadow-2xl shadow-indigo-100/50 border border-slate-50"
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Baby className="text-white w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              {mode === 'create' ? 'Nuevo Perfil' : 'Editar Perfil'}
            </h3>
            <p className="text-sm font-medium text-slate-500">Personaliza la experiencia para tu hijo.</p>
          </div>
        </div>
        <div className="hidden sm:flex h-10 items-center gap-1 rounded-full bg-slate-50 px-4 text-xs font-bold text-slate-400">
          <Sparkles className="h-3 w-3 text-indigo-500" />
          IA de Recomendación Activa
        </div>
      </div>

      <div className="space-y-10">
        {/* Avatar Selection */}
        <div>
          <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Selecciona un Avatar</label>
          <div className="flex flex-wrap gap-3">
            {AVATARS.map((avatar) => (
              <motion.button
                key={avatar}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedAvatar(avatar)}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-all ${
                  selectedAvatar === avatar 
                    ? 'bg-indigo-600 shadow-lg shadow-indigo-200 ring-4 ring-indigo-50' 
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {avatar}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Nombre */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <User size={16} className="text-indigo-500" />
              Nombre del niño/a
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Carlos o Sofía"
              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 py-4 text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          {/* Edad */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Plus size={16} className="text-indigo-500" />
              Edad actual
            </label>
            <input
              value={age}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(e) => handleAgeChange(e.target.value)}
              placeholder="Ej. 12"
              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 py-4 text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          {/* Presupuesto */}
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Heart size={16} className="text-indigo-500" />
              Presupuesto Mensual Sugerido
            </label>
            <div className="relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-indigo-600 transition-colors">$</span>
              <input
                value={budget}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(e) => handleBudgetChange(e.target.value)}
                placeholder="Ej. 12,000"
                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 pl-10 pr-5 py-4 text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 font-bold"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">MXN</span>
            </div>
          </div>

          {/* Intereses */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700">Áreas de Interés</label>
              {selectedInterests.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedInterests([])}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700"
                >
                  <Trash2 size={12} />
                  Limpiar
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              {presetInterests.map((opt) => {
                const selected = selectedInterests.includes(opt.id);
                return (
                  <motion.button
                    type="button"
                    key={opt.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedInterests((prev) =>
                        prev.includes(opt.id)
                          ? prev.filter((i) => i !== opt.id)
                          : [...prev, opt.id]
                      );
                    }}
                    className={
                      `flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-xs font-black transition-all ${
                        selected
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-100'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                      }`
                    }
                  >
                    {selected ? <Check size={14} className="stroke-[3px]" /> : <Sparkles size={14} className="text-slate-300" />}
                    {opt.name}
                  </motion.button>
                );
              })}
              {presetInterests.length === 0 && (
                <p className="text-xs font-medium text-slate-400 italic">Cargando categorías sugeridas...</p>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-600 border border-rose-100"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">!</div>
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-600 border border-emerald-100"
            >
              <Check size={18} className="shrink-0 stroke-[3px]" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto min-w-[140px] rounded-2xl border-2 border-slate-100 bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600"
            >
              Cancelar
            </button>
          )}
          
          <button
            disabled={!isValid || isSaving}
            onClick={handleSave}
            className="group relative w-full flex-1 overflow-hidden rounded-2xl bg-slate-900 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save size={18} className="group-hover:scale-110 transition-transform" />
              )}
              {isSaving ? 'Procesando…' : mode === 'create' ? 'Crear Perfil' : 'Guardar Cambios'}
            </span>
          </button>
        </div>
      </div>
    </motion.section>
  );
}
