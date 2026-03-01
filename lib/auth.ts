import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function getCurrentUser() {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("sessionId")?.value

    if (!sessionId) return null

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true }
    })

    if (!session) return null

    // Check expiration
    if (new Date() > session.expiresAt) {
        await prisma.session.delete({ where: { id: session.id } })
        return null
    }

    // Check if user still active
    if (!session.user.isActive) return null

    return session.user
}