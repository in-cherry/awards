import { Suspense } from "react";
import { Login } from "../login";
import { getAuthUser } from "@/lib/auth/mddleware";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const authUser = await getAuthUser();

  if (authUser) {
    redirect("/dashboard");
  }

  return (
    <Suspense>
      <Login mode="login" />
    </Suspense>
  )
}