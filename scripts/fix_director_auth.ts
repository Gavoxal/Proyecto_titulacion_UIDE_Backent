import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function fixDirectorAuth() {
    try {
        console.log('Buscando usuario director@uide.edu.ec...');
        const user = await prisma.usuario.findFirst({
            where: { correoInstitucional: 'director@uide.edu.ec' }
        });

        if (!user) {
            console.error('❌ Usuario no encontrado en la tabla Usuario.');
            return;
        }

        console.log('✅ Usuario encontrado (ID:', user.id, '). Creando Auth record...');

        const hashedPassword = await bcrypt.hash('password123', 10);

        await prisma.auth.upsert({
            where: { username: 'director@uide.edu.ec' },
            update: {
                password: hashedPassword,
                usuarioId: user.id
            },
            create: {
                username: 'director@uide.edu.ec',
                password: hashedPassword,
                usuarioId: user.id
            }
        });

        console.log('✅ Auth record creado/actualizado exitosamente.');
        console.log('🔑 Nuevo password: password123');

    } catch (error) {
        console.error('Error al fix auth:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixDirectorAuth();
