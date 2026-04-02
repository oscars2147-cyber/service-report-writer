import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Report Writer",
  description: "Turn rough technician notes into polished service reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}