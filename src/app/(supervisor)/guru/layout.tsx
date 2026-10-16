import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppNavbar } from "@/components/layout/AppNavbar";

export default async function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "TEACHER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavbar user={user} showTerminalSwitcher={false} />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
