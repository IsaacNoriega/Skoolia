import Navbar from "@/components/layout/Navbar";
import { Suspense } from "react";

export default function ParentsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-20" />}>
        <Navbar />
      </Suspense>
      {children}
    </>
  );
}