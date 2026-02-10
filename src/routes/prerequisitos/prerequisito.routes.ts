import {
    createEstudiantePrerequisito,
    getEstudiantePrerequisitos,
    validatePrerequisito,
    deleteEstudiantePrerequisito,
    getPrerequisitosDashboard,
    uploadPrerequisitoFile,
    servePrerequisitoFile,
    checkCanCreatePropuesta,
    enableStudentAccess
} from '../../controllers/prerequisito.controller.js';
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance, opts: any) {

    // GET /file/:filename (Servir archivo) - PUBLICO
    fastify.get('/file/:filename', {
        schema: {
            tags: ['Prerrequisitos'],
            description: 'Obtener archivo de prerrequisito',
            params: {
                type: 'object',
                properties: { filename: { type: 'string' } }
            }
        }
    }, servePrerequisitoFile);

    // Rutas protegidas
    fastify.register(async (protectedRoutes) => {
        protectedRoutes.addHook('onRequest', fastify.authenticate);

        // GET /status (Verificar estado)
        protectedRoutes.get('/status', {
            schema: {
                tags: ['Prerrequisitos'],
                description: 'Verificar si el estudiante puede crear propuesta',
                security: [{ bearerAuth: [] }]
            },
            preHandler: async (request: any, reply: any) => {
                const user = request.user;
                const userRole = user.rol ? user.rol.toUpperCase() : '';
                if (userRole !== 'ESTUDIANTE') {
                    return reply.code(403).send({ message: 'Solo estudiantes verifican su estado' });
                }
            }
        }, checkCanCreatePropuesta);

        // POST / (Subir Documento - Estudiante)
        protectedRoutes.post('/', {
            schema: {
                tags: ['Prerrequisitos'],
                description: 'Subir prerrequisito (Estudiante)',
                security: [{ bearerAuth: [] }],
            },
            preHandler: async (request: any, reply: any) => {
                const user = request.user;
                const userRole = user.rol ? user.rol.toUpperCase() : '';
                if (userRole !== 'ESTUDIANTE') {
                    return reply.code(403).send({ message: 'Solo estudiantes suben prerrequisitos' });
                }
            }
        }, createEstudiantePrerequisito);

        // GET /dashboard (Dashboard de Cumplimiento)
        protectedRoutes.get('/dashboard', {
            schema: {
                tags: ['Prerrequisitos'],
                description: 'Obtener dashboard de cumplimiento de estudiantes',
                security: [{ bearerAuth: [] }]
            },
            preHandler: async (request: any, reply: any) => {
                const user = request.user;
                const userRole = user.rol ? user.rol.toUpperCase() : '';
                if (!['DIRECTOR', 'COORDINADOR'].includes(userRole)) {
                    return reply.code(403).send({ message: 'Acceso denegado' });
                }
            }
        }, getPrerequisitosDashboard);

        // GET / (Listar)
        protectedRoutes.get('/', {
            schema: {
                tags: ['Prerrequisitos'],
                description: 'Listar prerrequisitos',
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: 'object',
                    properties: { estudianteId: { type: 'integer' } }
                },
                // response schema removed to avoid conflicts usually
            }
        }, getEstudiantePrerequisitos);

        // PUT /:id/validate (Validar - Director/Coordinador)
        protectedRoutes.put('/:id/validate', {
            schema: {
                tags: ['Prerrequisitos'],
                description: 'Validar prerrequisito',
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: { id: { type: 'integer' } }
                },
                body: {
                    type: 'object',
                    required: ['cumplido'],
                    properties: {
                        cumplido: { type: 'boolean' }
                    }
                }
            },
            preHandler: async (request: any, reply: any) => {
                const user = request.user;
                const userRole = user.rol ? user.rol.toUpperCase() : '';
                if (!['DIRECTOR', 'COORDINADOR'].includes(userRole)) {
                    return reply.code(403).send({ message: 'No tienes permisos para validar' });
                }
            }
        }, validatePrerequisito);

        // POST /:studentId/enable-access (Habilitar acceso - Director)
        protectedRoutes.post('/:studentId/enable-access', {
            schema: {
                tags: ['Prerrequisitos'],
                description: 'Habilitar acceso a plataforma (Email + Notificación)',
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: { studentId: { type: 'integer' } }
                }
            },
            preHandler: async (request: any, reply: any) => {
                const user = request.user;
                const userRole = user.rol ? user.rol.toUpperCase() : '';
                if (userRole !== 'DIRECTOR') {
                    return reply.code(403).send({ message: 'Solo el director puede habilitar acceso' });
                }
            }
        }, enableStudentAccess);

        // DELETE /:id
        protectedRoutes.delete('/:id', {
            schema: {
                tags: ['Prerrequisitos'],
                description: 'Eliminar prerrequisito',
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: { id: { type: 'integer' } }
                }
            },
            preHandler: async (request: any, reply: any) => {
                const user = request.user;
                // Logica de permisos
            }
        }, deleteEstudiantePrerequisito);

        // POST /upload (Subir documento físico)
        protectedRoutes.post('/upload', {
            schema: {
                tags: ['Prerrequisitos'],
                description: 'Subir archivo de prerrequisito (PDF/Imagen)',
                security: [{ bearerAuth: [] }],
                consumes: ['multipart/form-data']
            }
        }, uploadPrerequisitoFile);
    });



}