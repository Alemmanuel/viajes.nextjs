// ./layout.tsx
import "./globals.css";
import { comfortaa } from "./fonts";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trip Cost Manager",
  description: "Gestor de Costos de Viaje",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="./favicon.ico" />
      </head>
      <body className={comfortaa.className}>
        <aside className="sidebar">
          <h2>Menú</h2>
          <Link href="/">Inicio</Link>
          <Link href="/calculate">Calcular Viaje</Link>
          <Link href="/about">Acerca de</Link>
        </aside>
        <div className="content">
          {children}
          <footer className="footer">
            © {new Date().getFullYear()} Trip Cost Manager. Todos los derechos reservados.
          </footer>
        </div>
      </body>
    </html>
  );
}