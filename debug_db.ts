import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const proposalId = 4; // Cambiar si es necesario
    const activities = await prisma.actividad.findMany({
        where: { propuestaId: proposalId },
        select: {
            id: true,
            nombre: true,
            semana: true,
            tipo: true,
            fechaEntrega: true,
            propuestaId: true
        },
        orderBy: { id: 'asc' }
    });

    fs.writeFileSync('debug_data.json', JSON.stringify(activities, null, 2));
    console.log(`Saved ${activities.length} activities to debug_data.json`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
