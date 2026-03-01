import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { serialize } from "cookie"
import { PrismaClient } from "@prisma/client"

// const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { email, password, schoolName } = await req.json()

    if (!email || !password || !schoolName) {
        return NextResponse.json(
            { error: "Missing required fields" }, 
            { status: 400 }
        )
    }

    const existingUser = await prisma.user.findFirst({ where: { email } })

    if (existingUser) {
        return NextResponse.json(
            { error: "User already exists" }, 
            { status: 400 }
        )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx) => {
        
        const school = await tx.school.create({ 
            data: { 
                name: schoolName 
            } 
        })

        const user = await tx.user.create({
            data: { 
                email, 
                password: hashedPassword, 
                role: "PROPRIETOR", 
                schoolId: school.id 
            }
        })

        const session = await tx.session.create({
            data: { 
                userId: user.id, 
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
            }
        })

        return { user, session }
    })

    const cookie = serialize("sessionId", result.session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60
    })

    const response = NextResponse.json({ 
        message: "School created successfully" 
    })

    response.headers.set("Set-Cookie", cookie)

    return response

  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}