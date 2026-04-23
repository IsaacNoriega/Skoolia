import CoursesNavbar from "@/components/courses/CoursesNavbar";
import CoursesSidebar from "@/components/courses/CoursesSidebar";
import MyCoursesList from "@/components/courses/MyCoursesList";

export default function CoursesAcademicPage() {
  return (
    <>
      <CoursesNavbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <CoursesSidebar active="courses" />
          <div className="space-y-5 sm:space-y-6">
            <div className="flex justify-end mb-4">
              <a
                href="/courses/create"
                className="inline-block rounded-lg bg-violet-600 px-4 py-2 text-white font-bold hover:bg-violet-700 transition"
              >
                Crear nuevo curso
              </a>
            </div>
            <MyCoursesList />
          </div>
        </div>
      </main>
    </>
  );
}
