import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.usuario.findUnique({
        where: { id: 12 },
        include: { estudiantePerfil: true }
    });
    console.log('User 12:', user);
    console.log('ESCUELA:', user?.estudiantePerfil?.escuela);
    console.log('SEDE:', user?.estudiantePerfil?.sede);
    console.log('MALLA:', user?.estudiantePerfil?.malla);
}

main().finally(() => prisma.$disconnect());
