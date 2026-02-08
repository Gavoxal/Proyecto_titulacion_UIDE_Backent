import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const catalogo = await prisma.catalogoPrerequisito.findMany();
    console.log('Catalogo:', catalogo);
}

main().finally(() => prisma.$disconnect());
