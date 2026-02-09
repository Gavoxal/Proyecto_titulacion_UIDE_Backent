
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Sembrando usuarios de prueba (Director y Tutor)...');

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Crear Director
    const directorData = {
        cedula: '1799999999',
        nombres: 'Director',
        apellidos: 'De Prueba',
        correoInstitucional: 'director@test.com',
        rol: 'DIRECTOR' as const,
    };

    const directorUser = await prisma.usuario.upsert({
        where: { correoInstitucional: directorData.correoInstitucional },
        update: directorData,
        create: directorData,
    });

    await prisma.auth.upsert({
        where: { username: directorData.correoInstitucional },
        update: { password: passwordHash },
        create: {
            username: directorData.correoInstitucional,
            password: passwordHash,
            usuarioId: directorUser.id,
        },
    });

    console.log('✅ Director creado: director@test.com / password123');

    // 2. Crear Tutor
    const tutorData = {
        cedula: '1788888888',
        nombres: 'Tutor',
        apellidos: 'De Prueba',
        correoInstitucional: 'tutor@test.com',
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

    console.log('✅ Tutor creado: tutor@test.com / password123');

    // 3. Crear Estudiante
    const estudianteData = {
        cedula: '1777777777',
        nombres: 'Estudiante',
        apellidos: 'De Prueba',
        correoInstitucional: 'estudiante@test.com',
        rol: 'ESTUDIANTE' as const,
    };

    const estudianteUser = await prisma.usuario.upsert({
        where: { correoInstitucional: estudianteData.correoInstitucional },
        update: estudianteData,
        create: estudianteData,
    });

    await prisma.auth.upsert({
        where: { username: estudianteData.correoInstitucional },
        update: { password: passwordHash },
        create: {
            username: estudianteData.correoInstitucional,
            password: passwordHash,
            usuarioId: estudianteUser.id,
        },
    });

    // Perfil del Estudiante
    await prisma.estudiantePerfil.upsert({
        where: { usuarioId: estudianteUser.id },
        update: {
            escuela: 'Escuela de Informática',
            sede: 'Quito',
            malla: '2022',
            periodoLectivo: '2025-2026',
            ciudad: 'Quito'
        },
        create: {
            usuarioId: estudianteUser.id,
            escuela: 'Escuela de Informática',
            sede: 'Quito',
            malla: '2022',
            periodoLectivo: '2025-2026',
            ciudad: 'Quito'
        }
    });

    console.log('✅ Estudiante creado: estudiante@test.com / password123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
