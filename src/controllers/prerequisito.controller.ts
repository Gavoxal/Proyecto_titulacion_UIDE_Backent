import { FastifyReply, FastifyRequest } from 'fastify';

// ============================================
// CRUD para Catálogo de Prerrequisitos (Admin)
// ============================================

export const getCatalogoPrerequisitos = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;

    try {
        const catalogo = await prisma.catalogoPrerequisito.findMany({
            where: { activo: true },
            orderBy: { orden: 'asc' }
        });
        return catalogo;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo catálogo de prerrequisitos' });
    }
};

export const createCatalogoPrerequisito = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { nombre, descripcion, orden } = request.body as any;

    try {
        const nuevoRequisito = await prisma.catalogoPrerequisito.create({
            data: { nombre, descripcion, orden: orden || 1, activo: true }
        });
        return reply.code(201).send(nuevoRequisito);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error creando prerrequisito en catálogo' });
    }
};

// ============================================
// CRUD para Cumplimiento de Prerrequisitos (Estudiantes)
// ============================================

export const createEstudiantePrerequisito = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { prerequisitoId, archivoUrl } = request.body as any;
    const usuario = request.user as any;

    try {
        // Verificar si ya existe
        const existente = await prisma.estudiantePrerequisito.findUnique({
            where: {
                fkEstudiante_prerequisitoId: {
                    fkEstudiante: usuario.id,
                    prerequisitoId: Number(prerequisitoId)
                }
            }
        });

        if (existente) {
            // Actualizar si ya existe
            const actualizado = await prisma.estudiantePrerequisito.update({
                where: {
                    fkEstudiante_prerequisitoId: {
                        fkEstudiante: usuario.id,
                        prerequisitoId: Number(prerequisitoId)
                    }
                },
                data: {
                    archivoUrl,
                    cumplido: false // Reset a false hasta que director valide
                }
            });
            return reply.code(200).send(actualizado);
        } else {
            // Crear nuevo
            const nuevoPrerequisito = await prisma.estudiantePrerequisito.create({
                data: {
                    prerequisitoId: Number(prerequisitoId),
                    fkEstudiante: usuario.id,
                    archivoUrl,
                    cumplido: false
                }
            });
            return reply.code(201).send(nuevoPrerequisito);
        }
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error subiendo prerrequisito' });
    }
};

export const getEstudiantePrerequisitos = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const usuario = request.user as any;
    const { estudianteId } = request.query as any;

    try {
        let fkEstudiante = usuario.id;

        // Si es director/coordinador, puede ver de cualquier estudiante
        if ((usuario.rol === 'DIRECTOR' || usuario.rol === 'COORDINADOR') && estudianteId) {
            fkEstudiante = Number(estudianteId);
        }

        const prerequisitos = await prisma.estudiantePrerequisito.findMany({
            where: { fkEstudiante },
            include: {
                prerequisito: true,
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
    const { cumplido } = request.body as any;

    try {
        const prerequisitoActualizado = await prisma.estudiantePrerequisito.update({
            where: { id: Number(id) },
            data: {
                cumplido: Boolean(cumplido),
                fechaCumplimiento: cumplido ? new Date() : null
            }
        });
        return prerequisitoActualizado;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error validando prerrequisito' });
    }
};

export const deleteEstudiantePrerequisito = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;

    try {
        await prisma.estudiantePrerequisito.delete({
            where: { id: Number(id) }
        });
        return reply.code(204).send();
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error eliminando prerrequisito' });
    }
};

// ============================================
// Dashboard para Director/Coordinador
// ============================================

export const getPrerequisitosDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;

    try {
        // 1. Obtener catálogo de prerrequisitos
        const catalogo = await prisma.catalogoPrerequisito.findMany({
            where: { activo: true },
            orderBy: { orden: 'asc' }
        });

        // 2. Obtener todos los estudiantes con sus cumplimientos
        const estudiantes = await prisma.usuario.findMany({
            where: { rol: 'ESTUDIANTE' },
            select: {
                id: true,
                nombres: true,
                apellidos: true,
                cedula: true,
                prerequisitos: {
                    include: {
                        prerequisito: true
                    }
                }
            }
        });

        // 3. Transformar data para el dashboard
        const dataDashboard = estudiantes.map((estudiante: any) => {
            const cumplimientos = estudiante.prerequisitos || [];

            // Mapear cada requisito del catálogo
            const requisitos = catalogo.map(req => {
                const cumplimiento = cumplimientos.find((c: any) => c.prerequisitoId === req.id);
                return {
                    id: req.id,
                    nombre: req.nombre,
                    completed: !!cumplimiento, // Si existe registro
                    verified: cumplimiento ? cumplimiento.cumplido : false, // Si está validado
                    file: cumplimiento ? cumplimiento.archivoUrl : null,
                    fechaCumplimiento: cumplimiento ? cumplimiento.fechaCumplimiento : null
                };
            });

            // Access granted solo si todos están verified
            const accessGranted = requisitos.every(r => r.verified);

            return {
                id: estudiante.id,
                name: `${estudiante.nombres} ${estudiante.apellidos}`,
                cedula: estudiante.cedula,
                prerequisitos: requisitos,
                accessGranted,
                totalRequisitos: catalogo.length,
                cumplidos: requisitos.filter(r => r.verified).length
            };
        });

        return dataDashboard;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error generando dashboard de requisitos' });
    }
};

// ============================================
// Verificar si estudiante puede crear propuesta
// ============================================

export const checkCanCreatePropuesta = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const usuario = request.user as any;

    try {
        // Contar prerrequisitos cumplidos
        const cumplidos = await prisma.estudiantePrerequisito.count({
            where: {
                fkEstudiante: usuario.id,
                cumplido: true
            }
        });

        // Contar total de prerrequisitos activos
        const totalRequisitos = await prisma.catalogoPrerequisito.count({
            where: { activo: true }
        });

        const canCreate = cumplidos === totalRequisitos && totalRequisitos > 0;

        return {
            canCreate,
            cumplidos,
            totalRequisitos,
            message: canCreate
                ? 'Puedes crear tu propuesta'
                : `Te faltan ${totalRequisitos - cumplidos} prerrequisito(s) por cumplir`
        };
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error verificando prerrequisitos' });
    }
};
