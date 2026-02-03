import bcrypt from 'bcrypt';
import { FastifyReply, FastifyRequest } from 'fastify';

export const getUsuarios = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                cedula: true,
                nombres: true,
                apellidos: true,
                correoInstitucional: true,
                rol: true,
                createdAt: true
            }
        });
        return usuarios;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error recuperando usuarios' });
    }
};

export const getUsuarioById = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;
    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                cedula: true,
                nombres: true,
                apellidos: true,
                correoInstitucional: true,
                rol: true,
                createdAt: true
            }
        });
        if (!usuario) {
            return reply.code(404).send({ message: 'Usuario no encontrado' });
        }
        return usuario;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error recuperando usuario' });
    }
};

export const createUsuario = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const prisma = request.server.prisma;
    const { cedula, nombres, apellidos, correo, clave, rol } = request.body as any;

    try {
        const hashedPassword = await bcrypt.hash(clave, 10);

        const result = await prisma.$transaction(async (tx) => {
            const nuevoUsuario = await tx.usuario.create({
                data: {
                    cedula,
                    nombres,
                    apellidos,
                    correoInstitucional: correo,
                    rol: rol || 'ESTUDIANTE'
                }
            });

            await tx.auth.create({
                data: {
                    username: correo,
                    password: hashedPassword,
                    usuarioId: nuevoUsuario.id
                }
            });

            return nuevoUsuario;
        });

        return reply.code(201).send(result);
    } catch (error) {
        request.log.error(error);
        if ((error as any).code === 'P2002') {
            return reply.code(400).send({ message: 'Cédula o Correo ya registrado' });
        }
        return reply.code(500).send({ message: 'Error creando usuario' });
    }
};

export const updateUsuario = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const prisma = request.server.prisma;
    const { id } = request.params as any;
    const data = request.body as any;

    try {
        // Separar clave del resto de datos
        const { clave, ...usuarioData } = data;

        await prisma.$transaction(async (tx) => {
            // Actualizar usuario
            await tx.usuario.update({
                where: { id: Number(id) },
                data: {
                    ...usuarioData,
                    updatedAt: new Date()
                }
            });

            // Si hay clave, actualizar Auth
            if (clave) {
                const hashedPassword = await bcrypt.hash(clave, 10);
                await tx.auth.update({
                    where: { usuarioId: Number(id) },
                    data: { password: hashedPassword }
                });
            }
        });

        const usuarioActualizado = await prisma.usuario.findUnique({ where: { id: Number(id) } });
        return usuarioActualizado;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error actualizando usuario' });
    }
};

export const deleteUsuario = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;

    try {
        await prisma.usuario.delete({
            where: { id: Number(id) }
        });
        return reply.code(204).send();
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error eliminando usuario' });
    }
};
