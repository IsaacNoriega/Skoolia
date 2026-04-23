import CoursesNavbar from "@/components/courses/CoursesNavbar";
import CoursesSidebar from "@/components/courses/CoursesSidebar";
import CourseCreateForm from "@/components/courses/CourseCreateForm";

export default function CourseCreatePage() {
  return (
    <>
      <CoursesNavbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <CoursesSidebar />
          <div className="space-y-5 sm:space-y-6">
            <h1 className="text-2xl font-bold mb-4">Crear nuevo curso</h1>
            <CourseCreateForm />
          </div>
        </div>
      </main>
    </>
  );
}
