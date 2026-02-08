
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log("Checking Prisma Types...");

    try {
        // Check EntregableFinal
        // This will throw at runtime if DB doesn't match, but we care about Build/Type availability first.
        // Actually, tsx compiles it. If it fails to run due to "Invalid field", it means Client doesn't have it.
        await prisma.entregableFinal.findFirst({
            where: {
                isActive: true,
                version: 1,
                propuestasId: 1
            }
        });

        // Check Comentario
        await prisma.comentario.findFirst({
            where: {
                propuestaId: 1
            }
        });

        console.log("✅ Types and Client are valid! Fields exist.");
    } catch (e) {
        console.error("❌ Prisma check failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
