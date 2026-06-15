import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fluxo de Caixa MVP",
  description: "MVP para validar projecao de fluxo de caixa empresarial"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <Link href="/dashboard" className="brand">
              Fluxo de Caixa MVP
            </Link>
            <nav className="nav" aria-label="Navegacao principal">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/transactions">Transacoes</Link>
              <Link href="/recurring">Recorrencias</Link>
              <Link href="/projection">Projecao</Link>
              <Link href="/import">Importar</Link>
            </nav>
          </header>
          <main className="container">{children}</main>
        </div>
      </body>
    </html>
  );
}
