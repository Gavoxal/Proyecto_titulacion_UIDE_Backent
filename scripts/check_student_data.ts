import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStudentData() {
    try {
        console.log('Buscando estudiante ID 45...');
        const students = await prisma.usuario.findMany({
            where: {
                id: 45
            },
            include: { estudiantePerfil: true }
        });

        console.log('Encontrados:', students.length);
        if (students.length > 0) {
            console.log('Ejemplo de estudiante (con perfil):');
            console.log(JSON.stringify(students[0], null, 2));
        } else {
            console.log('No hay estudiantes.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStudentData();
