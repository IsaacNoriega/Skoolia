
import CoursesNavbar from "@/components/courses/CoursesNavbar";
import CoursesSidebar from "@/components/courses/CoursesSidebar";
import CourseLeadsSection from "@/components/courses/CourseLeadsSection";

export default function CoursesLeadsPage() {
  return (
    <>
      <CoursesNavbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <CoursesSidebar active="leads" />
          <div className="space-y-5 sm:space-y-6">
            <CourseLeadsSection />
          </div>
        </div>
      </main>
    </>
  );
}
