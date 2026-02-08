import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const director = await prisma.usuario.findFirst({
        where: { correoInstitucional: 'director@uide.edu.ec' },
        include: { auth: true }
    });

    if (director && director.auth) {
        console.log('✅ Director existe y tiene Auth.');
    } else {
        console.log('❌ Director o Auth faltante:', director);
    }
}

main().finally(() => prisma.$disconnect());
