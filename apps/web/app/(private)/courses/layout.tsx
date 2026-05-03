import SchoolsNavbar from "@/components/schools/SchoolsNavbar";
import SchoolsSidebar from "@/components/schools/SchoolsSidebar";

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarWidth = 100;
  const navbarHeight = 96;

  return (
    <div className="min-h-screen">
      <div
        className="fixed inset-y-0 left-0 z-[200] overflow-visible"
        style={{ width: sidebarWidth }}
      >
        <SchoolsSidebar mode="course" />
      </div>
      <div
        className="fixed right-0 top-0 z-30"
        style={{
          left: sidebarWidth,
          height: navbarHeight,
        }}
      >
        <SchoolsNavbar />
      </div>
      <main
        className="min-h-screen min-w-0 px-8 pb-8"
        style={{
          marginLeft: sidebarWidth,
          paddingTop: navbarHeight + 32,
        }}
      >
        <section className="mx-auto min-w-0 max-w-[1440px]">{children}</section>
      </main>
    </div>
  );
}
