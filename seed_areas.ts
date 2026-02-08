import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const areas = [
    { codigo: 'DESARROLLO_SOFTWARE', nombre: 'Desarrollo de Software' },
    { codigo: 'INTELIGENCIA_ARTIFICIAL', nombre: 'Inteligencia Artificial' },
    { codigo: 'CIBERSEGURIDAD', nombre: 'Ciberseguridad' },
    { codigo: 'SISTEMAS_INFORMACION', nombre: 'Sistemas de Información' },
    { codigo: 'PROGRAMACION_Y_DESARROLLO_DE_SOFTWARE', nombre: 'Programación y Desarrollo' },
    { codigo: 'CIENCIA_DE_DATOS_E_INTELIGENCIA_ARTIFICIAL', nombre: 'Ciencia de Datos e IA' },
    { codigo: 'GESTION_DE_LA_INFORMACION_Y_TRANSFORMACION_DIGITAL', nombre: 'Gestión de Info y Transformación Digital' },
    { codigo: 'INFRAESTRUCTURA_TI_Y_CIBERSEGURIDAD', nombre: 'Infraestructura TI y Ciberseguridad' },
    { codigo: 'INNOVACION_EMPRENDIMIENTO_Y_ETICA_TECNOLOGICA', nombre: 'Innovación y Ética' }
];

async function main() {
    console.log('🌱 Sembrando Áreas de Conocimiento...');

    for (const area of areas) {
        await prisma.areaConocimiento.upsert({
            where: { codigo: area.codigo },
            update: { nombre: area.nombre },
            create: {
                codigo: area.codigo,
                nombre: area.nombre
            }
        });
    }

    console.log('✅ Áreas de conocimiento sembradas con éxito.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
