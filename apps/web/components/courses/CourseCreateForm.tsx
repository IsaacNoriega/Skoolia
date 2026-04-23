'use client'
import React, { useState } from "react";
import { coursesService } from "@/lib/services/services/courses.service";

export default function CourseCreateForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modality, setModality] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await coursesService.create({
        name,
        description,
        coverImageUrl: coverImageUrl || undefined,
        price: price ? Number(price) : 0,
        capacity: capacity ? Number(capacity) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        modality: modality || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      });
      setSuccess(true);
      setName("");
      setDescription("");
      setCoverImageUrl("");
      setPrice("");
      setCapacity("");
      setStartDate("");
      setEndDate("");
      setModality("");
      setAddress("");
      setCity("");
      setState("");
      setLatitude("");
      setLongitude("");
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-bold mb-1">Nombre del curso</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block font-bold mb-1">Descripción</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block font-bold mb-1">URL de portada</label>
        <input
          type="text"
          value={coverImageUrl}
          onChange={e => setCoverImageUrl(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-bold mb-1">Precio</label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full border rounded px-3 py-2"
            min="0"
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Cupo</label>
          <input
            type="number"
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
            className="w-full border rounded px-3 py-2"
            min="0"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-bold mb-1">Fecha de inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Fecha de fin</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block font-bold mb-1">Modalidad</label>
        <input
          type="text"
          value={modality}
          onChange={e => setModality(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block font-bold mb-1">Dirección</label>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-bold mb-1">Ciudad</label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Estado</label>
          <input
            type="text"
            value={state}
            onChange={e => setState(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-bold mb-1">Latitud</label>
          <input
            type="number"
            value={latitude}
            onChange={e => setLatitude(e.target.value)}
            className="w-full border rounded px-3 py-2"
            step="any"
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Longitud</label>
          <input
            type="number"
            value={longitude}
            onChange={e => setLongitude(e.target.value)}
            className="w-full border rounded px-3 py-2"
            step="any"
          />
        </div>
      </div>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Curso creado correctamente</div>}
      <button
        type="submit"
        className="bg-violet-600 text-white px-4 py-2 rounded font-bold hover:bg-violet-700"
        disabled={loading}
      >
        {loading ? "Creando..." : "Crear curso"}
      </button>
    </form>
  );
}
