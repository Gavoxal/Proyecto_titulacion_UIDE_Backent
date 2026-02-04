
import { PrismaClient, Rol } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'gavo3212@gmail.com';
    const password = 'payper123';
    const nombres = 'Gabriel';
    const apellidos = 'Sarango';
    const rol = Rol.COORDINADOR;

    console.log(`Creating user: ${nombres} ${apellidos} (${email})...`);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // 1. Check if user exists
        const existingUser = await prisma.usuario.findUnique({
            where: { correoInstitucional: email },
        });

        if (existingUser) {
            console.log('User already exists:', existingUser);
            return;
        }

        // 2. Create Usuario and Auth
        const newUser = await prisma.usuario.create({
            data: {
                nombres,
                apellidos,
                correoInstitucional: email,
                cedula: '9999999999', // Placeholder cedula, ensure it is unique or valid if needed
                rol: rol,
                auth: {
                    create: {
                        username: email, // Using email as username for simplicity
                        password: hashedPassword,
                    },
                },
            },
            include: {
                auth: true,
            },
        });

        console.log('User created successfully:', newUser);

    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
