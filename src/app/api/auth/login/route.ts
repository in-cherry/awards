import bcrypt from "bcrypt";
import prisma from "@/lib/database/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateToken, getCookieName } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email e senha são obrigatórios" }), { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        ownedTenants: true,
        memberTenants: {
          include: { tenant: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 404 });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 404 });
    }

    const token = await generateToken({ userId: user.id, email: user.email, type: "user" });
    const tenants = [...user.ownedTenants, ...user.memberTenants.map(m => m.tenant)];
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        tenants: tenants.map(t => ({ id: t.id, name: t.name, slug: t.slug })),
      },
      { status: 200 }
    )

    response.cookies.set({
      name: getCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}