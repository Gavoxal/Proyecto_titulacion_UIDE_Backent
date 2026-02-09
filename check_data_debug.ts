
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const students = await prisma.usuario.findMany({
        where: { rol: 'ESTUDIANTE' },
        include: {
            estudiantePerfil: true,
            propuestas: true
        }
    });

    console.log(JSON.stringify(students, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
