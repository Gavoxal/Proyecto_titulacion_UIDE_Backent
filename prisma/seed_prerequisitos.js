import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPrerequisitos() {
    console.log('🌱 Seeding prerequisitos catalog...');

    try {
        // Crear catálogo de prerrequisitos
        const prerequisitos = [
            {
                nombre: 'Inglés',
                descripcion: 'Certificado de suficiencia en inglés',
                orden: 1,
                activo: true
            },
            {
                nombre: 'Prácticas Preprofesionales',
                descripcion: 'Certificado de prácticas preprofesionales completadas',
                orden: 2,
                activo: true
            },
            {
                nombre: 'Vinculación con la Comunidad',
                descripcion: 'Certificado de horas de vinculación con la comunidad',
                orden: 3,
                activo: true
            }
        ];

        for (const prereq of prerequisitos) {
            const existing = await prisma.catalogoPrerequisito.findFirst({
                where: { nombre: prereq.nombre }
            });

            if (!existing) {
                await prisma.catalogoPrerequisito.create({
                    data: prereq
                });
                console.log(`✅ Prerrequisito creado: ${prereq.nombre}`);
            } else {
                console.log(`ℹ️  Prerrequisito ya existe: ${prereq.nombre}`);
            }
        }

        console.log('✅ Catálogo de prerrequisitos creado exitosamente');
    } catch (error) {
        console.error('❌ Error al crear catálogo de prerrequisitos:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedPrerequisitos()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
