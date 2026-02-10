import { FastifyReply, FastifyRequest } from 'fastify';

export const createEntregable = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const parts = request.parts();

    let tipo: any;
    let propuestasId: any;
    let archivoUrl: string | undefined;
    let fileProcessed = false;

    // Helper imports for file saving
    const fs = await import('fs');
    const path = await import('path');
    const util = await import('util');
    const { pipeline } = await import('stream');
    const pump = util.promisify(pipeline);

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'uploads', 'entregables');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    try {
        for await (const part of parts) {
            if (part.type === 'file') {
                if (part.fieldname === 'file') {
                    const timestamp = Date.now();
                    const filename = `entregable_${timestamp}_${part.filename.replace(/\s/g, '_')}`;
                    const savePath = path.join(uploadDir, filename);

                    await pump(part.file, fs.createWriteStream(savePath));
                    archivoUrl = `/uploads/entregables/${filename}`;
                    fileProcessed = true;
                } else {
                    await part.toBuffer();
                }
            } else {
                if (part.fieldname === 'tipo') tipo = (part as any).value;
                if (part.fieldname === 'propuestasId') propuestasId = (part as any).value;
            }
        }

        if (!tipo || !propuestasId || !fileProcessed || !archivoUrl) {
            return reply.code(400).send({ message: 'Faltan datos (tipo, propuestasId, file)' });
        }

        const user = request.user as any;
        let propId = Number(propuestasId);

        // Seguridad/Robustez: Forzar el ID de la propuesta aprobada si el usuario es ESTUDIANTE
        if (user.rol === 'ESTUDIANTE') {
            const approvedProp = await prisma.propuesta.findFirst({
                where: {
                    fkEstudiante: user.id,
                    estado: { in: ['APROBADA', 'APROBADA_CON_COMENTARIOS'] }
                },
                select: { id: true }
            });
            if (approvedProp) {
                propId = approvedProp.id;
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            const existingActive = await tx.entregableFinal.findFirst({
                where: { propuestasId: propId, tipo: tipo, isActive: true }
            });

            let newVersion = 1;
            if (existingActive) {
                newVersion = existingActive.version + 1;
                await tx.entregableFinal.update({
                    where: { id: existingActive.id },
                    data: { isActive: false }
                });
            }

            return await tx.entregableFinal.create({
                data: {
                    tipo,
                    urlArchivo: archivoUrl!,
                    propuestasId: propId,
                    version: newVersion,
                    isActive: true
                }
            });
        });

        return reply.code(201).send(result);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error subiendo entregable final' });
    }
};

export const serveEntregableFile = async (request: FastifyRequest, reply: FastifyReply) => {
    const { filename } = request.params as any;
    const path = await import('path');
    const fs = await import('fs');

    const uploadDir = path.join(process.cwd(), 'uploads', 'entregables');
    const filePath = path.join(uploadDir, filename);

    if (!filePath.startsWith(uploadDir)) {
        return reply.code(403).send({ message: 'Acceso denegado' });
    }

    if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ message: 'Archivo no encontrado' });
    }

    const stream = fs.createReadStream(filePath);
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';

    reply.header('Content-Type', contentType);
    return reply.send(stream);
};

export const getEntregablesByPropuesta = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { propuestaId } = request.params as any;
    const { history } = request.query as any;
    const user = request.user as any;

    try {
        const propId = Number(propuestaId);

        // Verificar que el usuario tenga permiso para ver esta propuesta
        const propuesta = await prisma.propuesta.findUnique({
            where: { id: propId },
            select: { fkEstudiante: true }
        });

        if (!propuesta) {
            return reply.code(404).send({ message: 'Propuesta no encontrada' });
        }

        // Solo el estudiante dueño, tutores, directores y coordinadores pueden ver entregables
        const isOwner = user.id === propuesta.fkEstudiante;
        const canView = isOwner || ['TUTOR', 'DIRECTOR', 'COORDINADOR', 'COMITE'].includes(user.rol);

        if (!canView) {
            return reply.code(403).send({ message: 'No tienes permiso para ver estos entregables' });
        }

        const whereClause: any = { propuestasId: propId };

        // Si no piden historial explícitamente, solo devolver activos
        if (history !== 'true') {
            whereClause.isActive = true;
        }

        const entregables = await prisma.entregableFinal.findMany({
            where: whereClause,
            orderBy: {
                version: 'desc' // Mostrar la versión más reciente primero
            }
        });
        return reply.code(200).send(entregables);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo entregables' });
    }
};

export const updateEntregable = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;
    const { urlArchivo } = request.body as any;

    try {
        const entregableActualizado = await prisma.entregableFinal.update({
            where: { id: Number(id) },
            data: { urlArchivo }
        });
        return reply.code(200).send(entregableActualizado);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error actualizando entregable' });
    }
};
export const getUnlockStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;

    try {
        // 1. Contar evidencias aprobadas del estudiante actual
        const approvedCount = await prisma.evidencia.count({
            where: {
                estadoRevisionTutor: 'APROBADO',
                actividad: {
                    propuesta: {
                        fkEstudiante: Number(user.id)
                    }
                }
            }
        });

        // 2. Verificar entregables finales cargados
        const entregables = await prisma.entregableFinal.findMany({
            where: {
                isActive: true,
                propuesta: {
                    fkEstudiante: Number(user.id)
                }
            },
            select: { tipo: true }
        });

        const uploadedTypes = entregables.map(e => e.tipo);
        const hasTesis = uploadedTypes.includes('TESIS');
        const hasManual = uploadedTypes.includes('MANUAL_USUARIO');
        const hasArticulo = uploadedTypes.includes('ARTICULO');

        const allDocsUploaded = hasTesis && hasManual && hasArticulo;

        return {
            unlocked: approvedCount >= 16, // Esto mantiene el desbloqueo de la sección "Proyecto"
            approvedWeeks: approvedCount,
            requiredWeeks: 16,
            documents: {
                hasTesis,
                hasManual,
                hasArticulo
            },
            unlockedDefense: approvedCount >= 16
        };
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error consultando estado de desbloqueo' });
    }
};
