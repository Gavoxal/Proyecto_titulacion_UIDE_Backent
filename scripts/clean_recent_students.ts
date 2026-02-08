import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanRecentStudents() {
    try {
        console.log('🧹 Limpiando estudiantes recientes (ID > 10)...');

        // 1. Delete EstudiantePerfil if they exist (though verification said they likely don't)
        const deletedProfiles = await prisma.estudiantePerfil.deleteMany({
            where: { usuario: { id: { gt: 10 }, rol: 'ESTUDIANTE' } }
        });
        console.log(`- Perfiles eliminados: ${deletedProfiles.count}`);

        // 2. Delete Auth (if any)
        const deletedAuth = await prisma.auth.deleteMany({
            where: { usuario: { id: { gt: 10 }, rol: 'ESTUDIANTE' } }
        });
        console.log(`- Auth records eliminados: ${deletedAuth.count}`);

        // 3. Delete Usuario
        const deletedUsers = await prisma.usuario.deleteMany({
            where: {
                id: { gt: 10 },
                rol: 'ESTUDIANTE'
            }
        });
        console.log(`- Usuarios eliminados: ${deletedUsers.count}`);

        console.log('✅ Limpieza completada.');

    } catch (error) {
        console.error('❌ Error limpiando estudiantes:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanRecentStudents();
