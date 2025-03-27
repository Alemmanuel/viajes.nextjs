"use client";
import Link from "next/link";
import { useState } from "react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Encabezado móvil */}
      <div className="mobile-header">
        <button className="menu-toggle" onClick={() => setOpen(!open)}>
          {open ? "Cerrar Menú" : "Abrir Menú"}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <h2>Trip Cost Manager</h2>
        <Link href="/">Inicio</Link>
        <Link href="/calculate">Calcular Viaje</Link>
        <Link href="/about">Acerca de</Link>
      </aside>
    </>
  );
}
