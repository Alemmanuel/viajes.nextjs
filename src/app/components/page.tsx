// src/components/MobileMenu.tsx
"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function MobileMenu() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Encabezado móvil */}
      <header className="mobile-header">
        <button className="menu-toggle" onClick={() => setMenuOpen((prev) => !prev)}>
          {menuOpen ? "Cerrar Menú" : "Abrir Menú"}
        </button>
      </header>

      {/* Sidebar: en desktop se muestra siempre; en móvil, se muestra si está abierto */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <h2>Menú</h2>
        <Link href="/">Inicio</Link>
        <Link href="/calculate">Calcular Viaje</Link>
        <Link href="/about">Acerca de</Link>
      </aside>
    </>
  );
}
