import Link from "next/link";

export default function HeroInstitutionSection() {
  return (
    <section className="relative w-full bg-[#f3f3f3] overflow-hidden">
      {/* ===== CONTENIDO ===== */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-18 pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
          {/* LEFT */}
          <div>
            <p className="text-base font-normall text-[#333331]">
              Skoolia para escuelas
            </p>

            <h1 className="mt-4 text-5xl sm:text-6xl font-extrabold leading-[1.05] text-[#333331]">
              Reduce el costo de
              <br />
              Adquisición de alumnos
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Skoolia ayuda a escuelas y centros educativos en México a captar
              leads calificados mediante marketing segmentado y datos en tiempo
              real.
            </p>

            <div className="mt-10">
              <Link
                href="/auth/register?role=private"
                className="inline-flex items-center justify-center rounded-2xl bg-[#2A6EE8] px-8 py-4 text-base font-bold text-white shadow-md hover:bg-[#1f5ed1] transition"
              >
                Regístrate gratis
              </Link>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex justify-center lg:justify-end">
            <img
              src="/illustrations/schoolsinfo.svg"
              alt=""
              className="w-full max-w-xl"
            />
          </div>
        </div>
      </div>
      <div className="h-[100vh] w-full relative overflow-hidden">
        <img
          src="/illustrations/schoolscloud.svg"
          alt=""
          className="
                  absolute 
                  left-1/2 
                  -translate-x-1/2 
                  top-0 
                  w-[100%] 
                  max-w-none 
                  pointer-events-none 
                  select-none 
                  z-0
                "
        />
        
      </div>

    </section>
  );
}
