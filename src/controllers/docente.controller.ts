import { FastifyReply, FastifyRequest } from 'fastify';

export const getTodosEstudiantesNotasDocente = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;

    try {
        // Obtenemos todas las propuestas con su estudiante y actividades/evidencias
        const propuestas = await prisma.propuesta.findMany({
            include: {
                estudiante: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                        cedula: true
                    }
                },
                actividades: {
                    include: {
                        evidencias: {
                            orderBy: { semana: 'asc' }
                        }
                    }
                }
            }
        });

        // Ordenamos para que las aprobadas o pendientes tengan prioridad al deduplicar
        const sortedPropuestas = [...propuestas].sort((a, b) => {
            const statusOrder: any = { 'APROBADA': 3, 'PENDIENTE': 2, 'RECHAZADA': 1 };
            const orderA = statusOrder[a.estado] || 0;
            const orderB = statusOrder[b.estado] || 0;

            if (orderA !== orderB) return orderB - orderA; // Mayor prioridad primero
            return Number(b.id) - Number(a.id); // ID más reciente primero
        });

        // Deduplicar por estudiante ID
        const uniqueStudentPropuestas: any[] = [];
        const seenStudents = new Set();

        for (const p of sortedPropuestas) {
            const studentId = p.estudiante.id;
            if (!seenStudents.has(studentId)) {
                seenStudents.add(studentId);
                uniqueStudentPropuestas.push(p);
            }
        }

        const estudiantesNotas = uniqueStudentPropuestas.map(p => {
            // Inicializar array de 16 semanas
            const notasSemanales: any[] = new Array(16).fill(null).map((_, i) => ({
                week: i + 1,
                grade: null,
                evidenceId: null
            }));

            let suma = 0;
            let count = 0;

            p.actividades.forEach((act: any) => {
                act.evidencias.forEach((ev: any) => {
                    const semana = Number(ev.semana);
                    if (semana >= 1 && semana <= 16) {
                        const calif = ev.calificacionDocente ? Number(ev.calificacionDocente) : null;

                        // Si es la primera vez que tocamos esta semana, inicializamos el array si no lo estaba
                        if (!notasSemanales[semana - 1].evidences) {
                            notasSemanales[semana - 1].evidences = [];
                        }

                        notasSemanales[semana - 1].evidences.push({
                            id: ev.id,
                            grade: calif,
                            activityName: act.nombre,
                            tipo: act.tipo
                        });

                        // Para retrocompatibilidad y visualización simple: 
                        // el grade principal de la celda será el promedio de la semana o el primero
                        notasSemanales[semana - 1].grade = notasSemanales[semana - 1].evidences[0].grade;
                        notasSemanales[semana - 1].evidenceId = notasSemanales[semana - 1].evidences[0].id;

                        if (calif !== null) {
                            suma += calif;
                            count++;
                        }
                    }
                });
            });

            const promedio = count > 0 ? (suma / count).toFixed(2) : "0.00";

            return {
                studentId: p.estudiante.id,
                studentName: `${p.estudiante.nombres} ${p.estudiante.apellidos}`,
                cedula: p.estudiante.cedula,
                notas: notasSemanales,
                promedio: Number(promedio)
            };
        });

        return estudiantesNotas;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error recuperando notas de estudiantes para el docente' });
    }
};
