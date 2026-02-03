import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Sembrando base de datos...');

    // 1. Crear Admin (Director)
    const saltRounds = 10;
    const password = await bcrypt.hash('admin123', saltRounds);

    const adminUser = await prisma.usuario.upsert({
        where: { correoInstitucional: 'director@uide.edu.ec' },
        update: {},
        create: {
            cedula: '1700000001',
            nombres: 'Admin',
            apellidos: 'Director',
            correoInstitucional: 'director@uide.edu.ec',
            rol: 'DIRECTOR'
        },
    });

    await prisma.auth.upsert({
        where: { usuarioId: adminUser.id },
        update: { password: password },
        create: {
            username: 'director@uide.edu.ec',
            password: password,
            usuarioId: adminUser.id
        }
    });

    console.log('✅ Usuario ADMIN creado:', adminUser.correoInstitucional);
    console.log('🔑 Credenciales: director@uide.edu.ec / admin123');

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
