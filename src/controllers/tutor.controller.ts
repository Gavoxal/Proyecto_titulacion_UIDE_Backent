import { FastifyReply, FastifyRequest } from 'fastify';

export const getMisEstudiantes = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const usuario = request.user as any; // From JWT

    try {
        // Obtenemos las propuestas donde el tutor está asignado en TrabajoTitulacion
        const propuestas = await prisma.propuesta.findMany({
            where: {
                trabajosTitulacion: {
                    some: {
                        fkTutorId: Number(usuario.id)
                    }
                }
            },
            include: {
                estudiante: {
                    select: {
                        id: true,
                        cedula: true,
                        nombres: true,
                        apellidos: true,
                        correoInstitucional: true,
                        estudiantePerfil: true
                    }
                },
                areaConocimiento: true,
                trabajosTitulacion: true // Para info extra si se requiere
            },
            orderBy: {
                fechaPublicacion: 'desc'
            }
        });

        // Transformamos para que el frontend vea una lista de "Estudiantes Asignados"
        // con su respectiva información de propuesta y actividad
        const estudiantesAsignados = await Promise.all(propuestas.map(async (p) => {
            // Buscamos info de actividades para este estudiante (vía propuesta)
            const actividades = await prisma.actividad.findMany({
                where: { propuestaId: p.id },
                include: {
                    evidencias: {
                        orderBy: { fechaEntrega: 'desc' },
                        take: 1
                    }
                }
            });

            // Contar evidencias totales
            const countEvidencias = await prisma.evidencia.count({
                where: { actividad: { propuestaId: p.id } }
            });

            const ultimaEvidencia = actividades
                .flatMap(a => a.evidencias)
                .sort((a, b) => b.fechaEntrega.getTime() - a.fechaEntrega.getTime())[0];

            return {
                id: p.estudiante.id,
                nombres: p.estudiante.nombres,
                apellidos: p.estudiante.apellidos,
                cedula: p.estudiante.cedula,
                correo: p.estudiante.correoInstitucional,
                perfil: p.estudiante.estudiantePerfil,
                propuesta: {
                    id: p.id,
                    titulo: p.titulo,
                    estado: p.estado,
                    area: p.areaConocimiento?.nombre,
                    fechaPublicacion: p.fechaPublicacion
                },
                actividadResumen: {
                    totalEvidencias: countEvidencias,
                    ultimaFecha: ultimaEvidencia?.fechaEntrega || p.fechaPublicacion,
                    ultimoContenido: ultimaEvidencia?.contenido || 'Sin entregas aún'
                }
            };
        }));

        return estudiantesAsignados;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error recuperando estudiantes asignados' });
    }
};
