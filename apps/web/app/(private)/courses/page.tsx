"use client";

import { useEffect, useState } from "react";
import { coursesService, type Course } from "@/lib/services/services/courses.service";

export default function PrivateCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    coursesService
      .listAll()
      .then((data) => {
        setCourses(data);
        console.log("[PRIVATE/COURSES] Cursos cargados:", data);
      })
      .catch(() => setError("Error al cargar los cursos"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Cargando cursos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mis cursos</h1>
      {courses.length === 0 ? (
        <div>No tienes cursos registrados.</div>
      ) : (
        <ul>
          {courses.map((course) => (
            <li key={course.id} className="mb-2">
              <strong>{course.name}</strong> <br />
              <span className="text-sm text-gray-500">{course.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
