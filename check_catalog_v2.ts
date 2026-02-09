
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const items = await prisma.catalogoPrerequisito.findMany();
        console.log("--- START CATALOG ---");
        console.log(JSON.stringify(items, null, 2));
        console.log("--- END CATALOG ---");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
