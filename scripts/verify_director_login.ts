import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkDirector() {
    try {
        console.log('Verificando usuario director@uide.edu.ec...');
        const auth = await prisma.auth.findUnique({
            where: { username: 'director@uide.edu.ec' },
            include: { usuario: true }
        });

        if (!auth) {
            console.log('❌ Usuario director@uide.edu.ec NO encontrado en tabla Auth.');
            // Check in Usuario table just in case
            const user = await prisma.usuario.findFirst({ where: { correoInstitucional: 'director@uide.edu.ec' } });
            if (user) console.log('✅ Pero SÍ existe en tabla Usuario (ID:', user.id, '). Falta registro Auth.');
            return;
        }

        console.log('✅ Usuario encontrado. ID:', auth.usuarioId, 'Rol:', auth.usuario.rol);

        const passwordMatches = await bcrypt.compare('password123', auth.password);
        if (passwordMatches) {
            console.log('✅ La contraseña "password123" ES CORRECTA.');
        } else {
            console.log('❌ La contraseña "password123" ES INCORRECTA.');
            console.log('Hash en DB:', auth.password);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDirector();
