import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProfiles() {
    try {
        const profiles = await prisma.estudiantePerfil.findMany();
        console.log('Total perfiles raw:', profiles.length);
        if (profiles.length > 0) {
            console.log('Primer perfil:', profiles[0]);
            console.log('IDs de usuarios con perfil:', profiles.map(p => p.usuarioId));
        }

        const specificUser = await prisma.usuario.findUnique({
            where: { id: 12 },
            include: { estudiantePerfil: true }
        });
        console.log('User 12 Profile:', specificUser?.estudiantePerfil);

        const users = await prisma.usuario.findMany({
            where: { rol: 'ESTUDIANTE' },
            include: { estudiantePerfil: true },
            take: 5,
            orderBy: { id: 'desc' }
        });

        console.log('Ultimos 5 estudiantes:');
        users.forEach(u => {
            console.log(`ID: ${u.id}, Email: ${u.correoInstitucional}, Perfil: ${u.estudiantePerfil ? 'SI' : 'NO'}`);
            if (u.estudiantePerfil) console.log(u.estudiantePerfil);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProfiles();
