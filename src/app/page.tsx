import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/kasir");
  } else if (user.role === "TEACHER") {
    redirect("/guru");
  } else if (user.role === "AUDIT") {
    redirect("/audit");
  }

  redirect("/login");
}
