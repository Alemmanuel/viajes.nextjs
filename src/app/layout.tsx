import "./globals.css";
import { comfortaa } from "./fonts";
import { Metadata } from "next";
import MobileMenu from "./components/page";

export const metadata: Metadata = {
  title: "Trip Cost Manager",
  description: "Gestor de Costos de Viaje",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={comfortaa.className}>
        <MobileMenu />
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
