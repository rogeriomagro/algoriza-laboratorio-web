import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Validação de Orçamentos",
  description: "Ferramenta interna para validação de orçamentos laboratoriais"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
