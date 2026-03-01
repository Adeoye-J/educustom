import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function POST() {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("sessionId")?.value

    if (sessionId) {
        await prisma.session.delete({
            where: { id: sessionId }
        })
    }

    cookieStore.delete("sessionId")

    return Response.json({ message: "Logged out successfully" })
}