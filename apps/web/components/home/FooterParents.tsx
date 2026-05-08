"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-[#2D6CDF] via-[#1F4FBF] to-[#153A8A] text-white overflow-hidden">

      {/* Newsletter */}
      <div className="border-b border-white/15">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold">
            Mantente informado sobre educación en México
          </h3>
          <p className="mt-4 text-white/80 max-w-2xl mx-auto">
            Recibe semanalmente noticias, tips educativos y nuevas escuelas en tu zona
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="flex-1 px-5 py-3 rounded-full bg-white/15 backdrop-blur-md placeholder:text-white/70 text-white outline-none border border-white/20"
            />
            <Link
              href="/auth/register"
              className="px-6 py-3 rounded-full bg-[#FF6B1A] hover:bg-[#ff7f3f] font-semibold transition shadow-lg text-center"
            >
              Suscribirme
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">

        {/* Brand */}
        <div>
          <h4 className="text-xl font-bold">Skoolia</h4>
          <p className="mt-4 text-white/80">
            La plataforma líder en México para encontrar la escuela perfecta.
            Conectamos familias con instituciones educativas de calidad.
          </p>

          <div className="flex gap-4 mt-6 text-white/80">
            <Facebook size={18} />
            <Instagram size={18} />
            <Linkedin size={18} />
          </div>
        </div>

        {/* Para Padres */}
        <div>
          <h5 className="font-semibold mb-4">Para Padres</h5>
          <ul className="space-y-2 text-white/80">
            <li><Link href="/search?tab=escuelas">Buscar Escuelas</Link></li>
            <li><Link href="/search?tab=escuelas&sortBy=rating">Comparador Inteligente</Link></li>
            <li><Link href="/search?tab=escuelas&verified=1">Reseñas y Calificaciones</Link></li>
            <li><Link href="/auth/login/parents">Guía de Inscripciones</Link></li>
            <li><Link href="/ayuda">Blog Educativo</Link></li>
            <li><Link href="/search?tab=escuelas&q=becas">Becas y Apoyos</Link></li>
          </ul>
        </div>

        {/* Para Escuelas */}
        <div>
          <h5 className="font-semibold mb-4">Para Escuelas</h5>
          <ul className="space-y-2 text-white/80">
            <li><Link href="/?audience=schools">Registra tu Escuela</Link></li>
            <li><Link href="/auth/login/schools">Panel de Administración</Link></li>
            <li><Link href="/auth/login/schools">Gestión de Leads</Link></li>
            <li><Link href="/auth/register?role=private">Planes de Suscripción</Link></li>
            <li><Link href="/auth/login/schools">Estadísticas y Reportes</Link></li>
            <li><Link href="/ayuda">Soporte Técnico</Link></li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h5 className="font-semibold mb-4">Contacto</h5>
          <ul className="space-y-3 text-white/80">
            <li className="flex items-center gap-2">
              <Phone size={16} />
              +52 55 1234 5678
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} />
              hola@skoolia.com
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={16} />
              Ciudad de México, México
            </li>
          </ul>

          <div className="mt-6">
            <h6 className="font-semibold">Horarios de Atención</h6>
            <p className="text-white/80 mt-2 text-sm">
              Lunes a Viernes: 9:00 AM - 6:00 PM
              <br />
              Sábados: 10:00 AM - 2:00 PM
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/15">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center text-white/70 text-sm gap-4">
          <span>© 2026 Skoolia. Todos los derechos reservados.</span>

          <div className="flex gap-6">
            <Link href="/ayuda">Términos de Uso</Link>
            <Link href="/ayuda">Política de Privacidad</Link>
            <Link href="/ayuda">Cookies</Link>
            <Link href="/ayuda">Ayuda</Link>
          </div>

          <span>Hecho con ❤️ en México</span>
        </div>
      </div>

    </footer>
  );
}
