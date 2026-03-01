import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { serialize } from "cookie"

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json()

        const user = await prisma.user.findFirst({
            where: { email }
        })

        if (!user || !user.isActive) {
            return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
            )
        }

        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
            return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
            )
        }

        // Create session
        const session = await prisma.session.create({
            data: {
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        })

        const cookie = serialize("sessionId", session.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60
        })

        const response = NextResponse.json({
            message: "Login successful"
        })

        response.headers.set("Set-Cookie", cookie)

        return response

    } catch (error) {
        console.error("Login error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
