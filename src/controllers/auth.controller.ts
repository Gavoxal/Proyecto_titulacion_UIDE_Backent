import bcrypt from 'bcrypt';
import { FastifyReply, FastifyRequest } from 'fastify';

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
    const { correo, clave } = request.body as any;

    // Trim credentials to avoid whitespace issues
    const safeCorreo = correo?.trim();
    const safeClave = clave?.trim();

    console.log(`🔐 Login Attempt: ${safeCorreo} (Pass length: ${safeClave?.length})`);

    const prisma = request.server.prisma;

    try {
        // 1. Buscar credenciales en Auth
        const auth = await prisma.auth.findUnique({
            where: { username: safeCorreo },
            include: {
                usuario: {
                    include: { estudiantePerfil: true }
                }
            }
        });

        if (!auth || !auth.usuario) {
            console.warn(`❌ Login Failed: User not found or no auth record for ${safeCorreo}`);
            return reply.code(401).send({ message: 'Credenciales inválidas' });
        }

        console.log(`✅ User found: ${auth.usuario.id}. Hash prefix: ${auth.password.substring(0, 10)}...`);

        const usuario = auth.usuario;

        // 2. Verificar password
        const valid = await bcrypt.compare(safeClave, auth.password);
        if (!valid) {
            console.warn(`❌ Login Failed: Password mismatch for ${safeCorreo}`);
            return reply.code(401).send({ message: 'Credenciales inválidas' });
        }

        // 3. Generar token
        const token = request.server.jwt.sign({
            id: usuario.id,
            rol: usuario.rol,
            nombre: `${usuario.nombres} ${usuario.apellidos}`
        });

        return {
            token,
            usuario: {
                id: usuario.id,
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                correoInstitucional: usuario.correoInstitucional,
                rol: usuario.rol,
                perfil: usuario.estudiantePerfil
            }
        };

    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error interno del servidor' });
    }
};
