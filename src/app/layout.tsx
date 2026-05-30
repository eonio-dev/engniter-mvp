import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Engniter Workspace",
  description: "Secure opportunity intake workspace for technical pre-sales teams.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
