
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Sembrando usuarios de prueba (Director y Tutor)...');

    const passwordHash = await bcrypt.hash('password123', 10);

    // 2. Crear Tutor
    const tutorData = {
        cedula: '1789888888',
        nombres: 'Tutor',
        apellidos: 'De Prueba',
        correoInstitucional: 'tutor1@test.com',
        rol: 'TUTOR' as const,
    };

    const tutorUser = await prisma.usuario.upsert({
        where: { correoInstitucional: tutorData.correoInstitucional },
        update: tutorData,
        create: tutorData,
    });

    await prisma.auth.upsert({
        where: { username: tutorData.correoInstitucional },
        update: { password: passwordHash },
        create: {
            username: tutorData.correoInstitucional,
            password: passwordHash,
            usuarioId: tutorUser.id,
        },
    });

    // Perfil del Tutor
    await prisma.tutorPerfil.upsert({
        where: { usuarioId: tutorUser.id },
        update: {
            titulo: 'Magíster en Software',
            especialidad: 'Ingeniería de Software',
            departamento: 'TI'
        },
        create: {
            usuarioId: tutorUser.id,
            titulo: 'Magíster en Software',
            especialidad: 'Ingeniería de Software',
            departamento: 'TI'
        }
    });

    console.log('✅ Tutor creado: tutor1@test.com / password123');

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
