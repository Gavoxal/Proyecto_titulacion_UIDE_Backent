
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Catalogo Prerequisitos...');

    const prerequisitos = [
        { nombre: 'CERTIFICADO_INGLES', descripcion: 'Certificado de suficiencia de inglés', orden: 1 },
        { nombre: 'MALLA_CURRICULAR', descripcion: 'Malla curricular completa', orden: 2 },
        { nombre: 'PRACTICAS_PREPROFESIONALES', descripcion: 'Certificado de prácticas preprofesionales', orden: 3 },
        { nombre: 'VINCULACION', descripcion: 'Certificado de vinculación con la sociedad', orden: 4 }
    ];

    for (const req of prerequisitos) {
        await prisma.catalogoPrerequisito.upsert({
            where: { id: req.orden },
        });

        // Better logic: find by name
        const existing = await prisma.catalogoPrerequisito.findFirst({ where: { nombre: req.nombre } });
        if (!existing) {
            await prisma.catalogoPrerequisito.create({ data: { ...req, active: true } });
            console.log(`Created: ${req.nombre}`);
        } else {
            console.log(`Exists: ${req.nombre}`);
        }
    }
}

// Fixed logic for proper script
async function run() {
    const prerequisitos = [
        { nombre: 'CERTIFICADO_INGLES', descripcion: 'Certificado de suficiencia de inglés', orden: 1 },
        { nombre: 'MALLA_CURRICULAR', descripcion: 'Malla curricular completa', orden: 2 },
        { nombre: 'PRACTICAS_PREPROFESIONALES', descripcion: 'Certificado de prácticas preprofesionales', orden: 3 },
        { nombre: 'VINCULACION', descripcion: 'Certificado de vinculación con la sociedad', orden: 4 }
    ];

    for (const req of prerequisitos) {
        // We use findFirst because 'nombre' is not marked unique in schema shown earlier (or is it 'codigo'?). 
        // Schema showed 'nombre' but not unique.
        const existing = await prisma.catalogoPrerequisito.findFirst({
            where: { nombre: req.nombre }
        });

        if (!existing) {
            await prisma.catalogoPrerequisito.create({
                data: {
                    nombre: req.nombre,
                    descripcion: req.descripcion,
                    orden: req.orden,
                    activo: true
                }
            });
            console.log(`Created: ${req.nombre}`);
        } else {
            console.log(`Already exists: ${req.nombre}`);
        }
    }
}

run()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
