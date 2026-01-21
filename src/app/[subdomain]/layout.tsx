"use client";

import { AuthProvider } from "@/shared/contexts/AuthContext";

export default function SubdomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}