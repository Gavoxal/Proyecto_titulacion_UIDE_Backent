import { FastifyReply, FastifyRequest } from 'fastify';

export const createPrerequisito = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { nombre, descripcion, archivoUrl } = request.body as any;
    const usuario = request.user as any;

    try {
        const nuevoPrerequisito = await prisma.prerequisito.create({
            data: {
                nombre,
                descripcion,
                archivoUrl,
                fkEstudiante: usuario.id,
                cumplido: false
            }
        });
        return reply.code(201).send(nuevoPrerequisito);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error subiendo prerrequisito' });
    }
};

export const getPrerequisitos = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const usuario = request.user as any;
    const { estudianteId } = request.query as any; // Allow filtering by student for admins

    try {
        let where = {};
        if (usuario.rol === 'ESTUDIANTE') {
            where = { fkEstudiante: usuario.id };
        } else if (estudianteId) {
            where = { fkEstudiante: Number(estudianteId) };
        }

        const prerequisitos = await prisma.prerequisito.findMany({
            where,
            include: {
                estudiante: {
                    select: { nombres: true, apellidos: true, cedula: true }
                }
            }
        });
        return prerequisitos;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo prerrequisitos' });
    }
};

export const validatePrerequisito = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;
    const { cumplido } = request.body as any; // Boolean

    try {
        const prerequisitoActualizado = await prisma.prerequisito.update({
            where: { id: Number(id) },
            data: { cumplido: Boolean(cumplido) }
        });
        return prerequisitoActualizado;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error validando prerrequisito' });
    }
};

export const deletePrerequisito = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;

    try {
        await prisma.prerequisito.delete({
            where: { id: Number(id) }
        });
        return reply.code(204).send();
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error eliminando prerrequisito' });
    }
};

// Dashboard para el Director (Formato Frontend exacto)
export const getPrerequisitosDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;

    try {
        // 1. Obtener todos los estudiantes y sus requisitos
        const estudiantes = await prisma.usuario.findMany({
            where: { rol: 'ESTUDIANTE' },
            select: {
                id: true,
                nombres: true,
                apellidos: true,
                cedula: true,
                prerequisitos: {
                    select: { nombre: true, cumplido: true, id: true, archivoUrl: true }
                }
            }
        });

        // 2. Transformar data para matchear Frontend: { english: {...}, internship: {...}, community: {...} }
        const dataDashboard = estudiantes.map((e: any) => {
            const reqs = e.prerequisitos || [];

            // Helper para buscar status. Asumimos nombres estandarizados o "contains"
            const getStatus = (keyword: string) => {
                const found = reqs.find((r: any) => r.nombre.toLowerCase().includes(keyword));
                return {
                    completed: !!found, // Si subió archivo (existe registro)
                    verified: found ? found.cumplido : false, // Si Director validó
                    id: found ? found.id : null,
                    file: found ? found.archivoUrl : null
                };
            };

            const english = getStatus('ingle'); // ingles o inglés
            const internship = getStatus('practica'); // practicas
            const community = getStatus('vinculacion'); // vinculacion

            // Access Granted solo si los 3 están verified: true
            const accessGranted = english.verified && internship.verified && community.verified;

            return {
                id: e.id,
                name: `${e.nombres} ${e.apellidos}`,
                cedula: e.cedula,
                cycle: 9, // Hardcoded o calcular si existiera tabla de escolaridad
                english,
                internship,
                community,
                accessGranted
            };
        });

        return dataDashboard;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error generando dashboard de requisitos' });
    }
};
