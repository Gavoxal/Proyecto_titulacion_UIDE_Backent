import {
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    bulkCreateUsuarios
} from '../../controllers/usuarioController.js';

export default async function (fastify, opts) {

    // Hook de seguridad global para este prefijo (todas las rutas de usuarios requieren auth)
    fastify.addHook('onRequest', fastify.authenticate);

    // Schema compartido para usuario
    const usuarioSchema = {
        type: 'object',
        properties: {
            id: { type: 'integer' },
            cedula: { type: 'string' },
            nombres: { type: 'string' },
            apellidos: { type: 'string' },
            correoInstitucional: { type: 'string', format: 'email' },
            rol: { type: 'string' }
        }
    };

    // GET / (Listar)
    fastify.get('/', {
        schema: {
            description: 'Obtener lista de usuarios',
            tags: ['Usuarios'],
            security: [{ apiKey: [] }],
            response: {
                200: {
                    type: 'array',
                    items: usuarioSchema
                }
            }
        }
    }, getUsuarios);

    // GET /:id (Obtener uno)
    fastify.get('/:id', {
        schema: {
            description: 'Obtener usuario por ID',
            tags: ['Usuarios'],
            security: [{ apiKey: [] }],
            params: {
                type: 'object',
                properties: { id: { type: 'integer' } }
            },
            response: {
                200: usuarioSchema
            }
        }
    }, getUsuarioById);

    // POST / (Crear)
    fastify.post('/', {
        schema: {
            description: 'Crear nuevo usuario',
            tags: ['Usuarios'],
            security: [{ apiKey: [] }],
            body: {
                type: 'object',
                required: ['cedula', 'nombres', 'apellidos', 'correo', 'clave'],
                properties: {
                    cedula: { type: 'string' },
                    nombres: { type: 'string' },
                    apellidos: { type: 'string' },
                    correo: { type: 'string', format: 'email' },
                    clave: { type: 'string' },
                    rol: {
                        type: 'string',
                        enum: ['ESTUDIANTE', 'TUTOR', 'DIRECTOR', 'COORDINADOR', 'COMITE', 'DOCENTE_INTEGRACION']
                    }
                }
            }
        }
    }, createUsuario);

    // POST /bulk (Carga masiva)
    fastify.post('/bulk', {
        schema: {
            description: 'Carga masiva de usuarios',
            tags: ['Usuarios'],
            security: [{ apiKey: [] }],
            body: {
                type: 'object',
                required: ['usuarios'],
                properties: {
                    usuarios: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['cedula', 'nombres', 'apellidos', 'correo', 'clave'],
                            properties: {
                                cedula: { type: 'string' },
                                nombres: { type: 'string' },
                                apellidos: { type: 'string' },
                                correo: { type: 'string', format: 'email' },
                                clave: { type: 'string' },
                                rol: { type: 'string' }
                            }
                        }
                    }
                }
            }
        },
        preHandler: async (request, reply) => {
            const user = request.user;
            if (!['DIRECTOR', 'COORDINADOR'].includes(user.rol)) {
                return reply.code(403).send({
                    message: 'Solo directores y coordinadores pueden realizar carga masiva'
                });
            }
        }
    }, (request, reply) => {
        console.log('📌 Recibida petición POST /bulk');
        return bulkCreateUsuarios(request, reply);
    });
    console.log('✅ Ruta POST /api/v1/usuarios/bulk registrada');

    // PUT /:id (Actualizar)
    fastify.put('/:id', {
        schema: {
            description: 'Actualizar usuario',
            tags: ['Usuarios'],
            security: [{ apiKey: [] }],
            params: {
                type: 'object',
                properties: { id: { type: 'integer' } }
            },
            body: {
                type: 'object',
                properties: {
                    nombres: { type: 'string' },
                    apellidos: { type: 'string' },
                    rol: { type: 'string' },
                    clave: { type: 'string' }
                }
            }
        }
    }, updateUsuario);

    // DELETE /:id (Eliminar)
    fastify.delete('/:id', {
        schema: {
            description: 'Eliminar usuario',
            tags: ['Usuarios'],
            security: [{ apiKey: [] }],
            params: {
                type: 'object',
                properties: { id: { type: 'integer' } }
            }
        }
    }, deleteUsuario);
}
