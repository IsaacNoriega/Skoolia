
import SchoolsNavbar from "@/components/schools/SchoolsNavbar";
import CoursesSidebar from "@/components/courses/CoursesSidebar";

export default function CoursesDashboardPage() {
	return (
		<>
			<SchoolsNavbar />
			<main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
					<CoursesSidebar active="summary" />
					<div className="space-y-5 sm:space-y-6">
						<h1 className="text-2xl font-bold">Panel de Cursos</h1>
						<p className="text-neutral-600">Aquí verás el resumen y gestión de tus cursos.</p>
					</div>
				</div>
			</main>
		</>
	);
}
