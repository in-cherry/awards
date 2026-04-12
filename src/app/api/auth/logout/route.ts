import { getActiveTenantCookieName, getCookieName } from "@/lib/auth/jwt";
import { jsonNoStore } from "@/lib/server/http";

export async function POST() {
  const response = jsonNoStore({ success: true, message: "Logout realizado com sucesso" }, 200);

  response.cookies.set({
    name: getCookieName(),
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  })

  response.cookies.set({
    name: getActiveTenantCookieName(),
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  })

  return response;
}