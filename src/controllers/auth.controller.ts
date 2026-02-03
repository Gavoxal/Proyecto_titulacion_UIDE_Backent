import bcrypt from 'bcrypt';
import { FastifyReply, FastifyRequest } from 'fastify';

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
    const { correo, clave } = request.body as any;
    const prisma = request.server.prisma;

    try {
        // 1. Buscar credenciales en Auth
        const auth = await prisma.auth.findUnique({
            where: { username: correo },
            include: { usuario: true }
        });

        if (!auth || !auth.usuario) {
            return reply.code(401).send({ message: 'Credenciales inválidas' });
        }

        const usuario = auth.usuario;

        // 2. Verificar password
        const valid = await bcrypt.compare(clave, auth.password);
        if (!valid) {
            return reply.code(401).send({ message: 'Credenciales inválidas' });
        }

        // 3. Generar token
        const token = request.server.jwt.sign({
            id: usuario.id,
            rol: usuario.rol,
            nombre: `${usuario.nombres} ${usuario.apellidos}`
        });

        return { token, usuario: { id: usuario.id, nombre: usuario.nombres, rol: usuario.rol } };

    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error interno del servidor' });
    }
};
