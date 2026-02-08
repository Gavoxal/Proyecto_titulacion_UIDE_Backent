import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de la base de datos...');

    try {
        // 1. Limpiar datos existentes (opcional - comentar si no quieres borrar)
        console.log('🗑️  Limpiando datos existentes...');
        await prisma.auth.deleteMany();
        await prisma.usuario.deleteMany();
        await prisma.areaConocimiento.deleteMany();
        await prisma.catalogoPrerequisito.deleteMany();

        // 2. Crear Áreas de Conocimiento
        console.log('📚 Creando áreas de conocimiento...');
        const areas = await Promise.all([
            prisma.areaConocimiento.create({
                data: {
                    codigo: 'ING-SW',
                    nombre: 'Ingeniería de Software',
                    descripcion: 'Desarrollo de software y aplicaciones'
                }
            }),
            prisma.areaConocimiento.create({
                data: {
                    codigo: 'IA',
                    nombre: 'Inteligencia Artificial',
                    descripcion: 'Machine Learning y Data Science'
                }
            }),
            prisma.areaConocimiento.create({
                data: {
                    codigo: 'REDES',
                    nombre: 'Redes y Telecomunicaciones',
                    descripcion: 'Redes, IoT y Telecomunicaciones'
                }
            })
        ]);
        console.log(`✅ ${areas.length} áreas creadas`);

        // 3. Crear Catálogo de Prerrequisitos
        console.log('📋 Creando catálogo de prerrequisitos...');
        const prerequisitos = await Promise.all([
            prisma.catalogoPrerequisito.create({
                data: {
                    nombre: 'Aprobación de materias',
                    descripcion: 'Todas las materias del pensum aprobadas',
                    orden: 1,
                    activo: true
                }
            }),
            prisma.catalogoPrerequisito.create({
                data: {
                    nombre: 'Prácticas pre-profesionales',
                    descripcion: '240 horas de prácticas completadas',
                    orden: 2,
                    activo: true
                }
            }),
            prisma.catalogoPrerequisito.create({
                data: {
                    nombre: 'Vinculación con la comunidad',
                    descripcion: '160 horas de vinculación completadas',
                    orden: 3,
                    activo: true
                }
            })
        ]);
        console.log(`✅ ${prerequisitos.length} prerrequisitos creados`);

        // 4. Hash de contraseña
        const passwordHash = await bcrypt.hash('password123', 10);

        // 5. Crear Usuarios
        console.log('👥 Creando usuarios...');

        // Director
        const director = await prisma.usuario.create({
            data: {
                nombres: 'María',
                apellidos: 'González',
                cedula: '1234567890',
                correoInstitucional: 'director@uide.edu.ec',
                rol: 'DIRECTOR',
                auth: {
                    create: {
                        username: 'director@uide.edu.ec',
                        password: passwordHash
                    }
                }
            }
        });
        console.log('✅ Director creado');

        // Coordinador
        const coordinador = await prisma.usuario.create({
            data: {
                nombres: 'Carlos',
                apellidos: 'Ramírez',
                cedula: '1234567891',
                correoInstitucional: 'coordinador@uide.edu.ec',
                rol: 'COORDINADOR',
                auth: {
                    create: {
                        username: 'coordinador@uide.edu.ec',
                        password: passwordHash
                    }
                }
            }
        });
        console.log('✅ Coordinador creado');

        // Tutores
        const tutores = await Promise.all([
            prisma.usuario.create({
                data: {
                    nombres: 'Ana',
                    apellidos: 'Martínez',
                    cedula: '1234567892',
                    correoInstitucional: 'tutor1@uide.edu.ec',
                    rol: 'TUTOR',
                    auth: {
                        create: {
                            username: 'tutor1@uide.edu.ec',
                            password: passwordHash
                        }
                    }
                }
            }),
            prisma.usuario.create({
                data: {
                    nombres: 'Roberto',
                    apellidos: 'López',
                    cedula: '1234567893',
                    correoInstitucional: 'tutor2@uide.edu.ec',
                    rol: 'TUTOR',
                    auth: {
                        create: {
                            username: 'tutor2@uide.edu.ec',
                            password: passwordHash
                        }
                    }
                }
            }),
            prisma.usuario.create({
                data: {
                    nombres: 'Patricia',
                    apellidos: 'Sánchez',
                    cedula: '1234567894',
                    correoInstitucional: 'tutor3@uide.edu.ec',
                    rol: 'TUTOR',
                    auth: {
                        create: {
                            username: 'tutor3@uide.edu.ec',
                            password: passwordHash
                        }
                    }
                }
            })
        ]);
        console.log(`✅ ${tutores.length} tutores creados`);

        // Docente de Integración
        const docente = await prisma.usuario.create({
            data: {
                nombres: 'Luis',
                apellidos: 'Herrera',
                cedula: '1234567895',
                correoInstitucional: 'docente@uide.edu.ec',
                rol: 'DOCENTE_INTEGRACION',
                auth: {
                    create: {
                        username: 'docente@uide.edu.ec',
                        password: passwordHash
                    }
                }
            }
        });
        console.log('✅ Docente de integración creado');

        // Comité
        const comite = await Promise.all([
            prisma.usuario.create({
                data: {
                    nombres: 'Elena',
                    apellidos: 'Vargas',
                    cedula: '1234567896',
                    correoInstitucional: 'comite1@uide.edu.ec',
                    rol: 'COMITE',
                    auth: {
                        create: {
                            username: 'comite1@uide.edu.ec',
                            password: passwordHash
                        }
                    }
                }
            }),
            prisma.usuario.create({
                data: {
                    nombres: 'Jorge',
                    apellidos: 'Mendoza',
                    cedula: '1234567897',
                    correoInstitucional: 'comite2@uide.edu.ec',
                    rol: 'COMITE',
                    auth: {
                        create: {
                            username: 'comite2@uide.edu.ec',
                            password: passwordHash
                        }
                    }
                }
            })
        ]);
        console.log(`✅ ${comite.length} miembros del comité creados`);

        // Estudiantes
        const estudiantes = await Promise.all([
            prisma.usuario.create({
                data: {
                    nombres: 'Juan',
                    apellidos: 'Pérez',
                    cedula: '1234567898',
                    correoInstitucional: 'estudiante1@uide.edu.ec',
                    rol: 'ESTUDIANTE',
                    auth: {
                        create: {
                            username: 'estudiante1@uide.edu.ec',
                            password: passwordHash
                        }
                    }
                }
            }),
            prisma.usuario.create({
                data: {
                    nombres: 'Sofía',
                    apellidos: 'Rodríguez',
                    cedula: '1234567899',
                    correoInstitucional: 'estudiante2@uide.edu.ec',
                    rol: 'ESTUDIANTE',
                    auth: {
                        create: {
                            username: 'estudiante2@uide.edu.ec',
                            password: passwordHash
                        }
                    }
                }
            }),
            prisma.usuario.create({
                data: {
                    nombres: 'Diego',
                    apellidos: 'Torres',
                    cedula: '1234567800',
                    correoInstitucional: 'estudiante3@uide.edu.ec',
                    rol: 'ESTUDIANTE',
                    auth: {
                        create: {
                            username: 'estudiante3@uide.edu.ec',
                            password: passwordHash
                        }
                    }
                }
            })
        ]);
        console.log(`✅ ${estudiantes.length} estudiantes creados`);

        // 6. Crear prerrequisitos completados para estudiantes
        console.log('📝 Asignando prerrequisitos a estudiantes...');
        for (const estudiante of estudiantes) {
            for (const prereq of prerequisitos) {
                await prisma.estudiantePrerequisito.create({
                    data: {
                        fkEstudiante: estudiante.id,
                        prerequisitoId: prereq.id,
                        cumplido: true,
                        fechaCumplimiento: new Date(),
                        archivoUrl: `https://ejemplo.com/archivo-${estudiante.id}-${prereq.id}.pdf`
                    }
                });
            }
        }
        console.log('✅ Prerrequisitos asignados');

        // 7. Crear propuestas de ejemplo
        console.log('📄 Creando propuestas de ejemplo...');
        const propuestas = await Promise.all([
            prisma.propuesta.create({
                data: {
                    titulo: 'Sistema de Gestión de Inventario con IA',
                    objetivos: 'Desarrollar un sistema inteligente para gestión de inventarios',
                    problematica: 'Falta de control automatizado en inventarios',
                    alcance: 'Sistema web con módulos de predicción y alertas',
                    archivoUrl: 'https://ejemplo.com/propuesta1.pdf',
                    carrera: 'Ingeniería en Tecnologías de la Información',
                    malla: 'ITIL_MALLA 2019',
                    areaConocimientoId: areas[1].id, // IA
                    fkEstudiante: estudiantes[0].id,
                    estado: 'PENDIENTE'
                }
            }),
            prisma.propuesta.create({
                data: {
                    titulo: 'App Móvil para Gestión de Citas Médicas',
                    objetivos: 'Facilitar la gestión de citas médicas mediante app móvil',
                    problematica: 'Dificultad en la coordinación de citas médicas',
                    alcance: 'Aplicación móvil multiplataforma',
                    archivoUrl: 'https://ejemplo.com/propuesta2.pdf',
                    carrera: 'Ingeniería de Software',
                    malla: 'SINL_MALLA 2023',
                    areaConocimientoId: areas[0].id, // Ing. Software
                    fkEstudiante: estudiantes[1].id,
                    estado: 'APROBADA'
                }
            }),
            prisma.propuesta.create({
                data: {
                    titulo: 'Sistema de Monitoreo con IoT para Agricultura',
                    objetivos: 'Implementar sistema IoT para monitoreo de cultivos',
                    problematica: 'Falta de monitoreo en tiempo real de cultivos',
                    alcance: 'Red de sensores IoT con dashboard web',
                    archivoUrl: 'https://ejemplo.com/propuesta3.pdf',
                    carrera: 'Ingeniería en Tecnologías de la Información',
                    malla: 'ITIL_MALLA 2023',
                    areaConocimientoId: areas[2].id, // Redes
                    fkEstudiante: estudiantes[2].id,
                    estado: 'PENDIENTE'
                }
            })
        ]);
        console.log(`✅ ${propuestas.length} propuestas creadas`);

        console.log('\n🎉 ¡Seed completado exitosamente!');
        console.log('\n📋 Credenciales de acceso:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Contraseña para todos: password123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Director:     director@uide.edu.ec');
        console.log('Coordinador:  coordinador@uide.edu.ec');
        console.log('Tutor 1:      tutor1@uide.edu.ec');
        console.log('Tutor 2:      tutor2@uide.edu.ec');
        console.log('Tutor 3:      tutor3@uide.edu.ec');
        console.log('Docente:      docente@uide.edu.ec');
        console.log('Comité 1:     comite1@uide.edu.ec');
        console.log('Comité 2:     comite2@uide.edu.ec');
        console.log('Estudiante 1: estudiante1@uide.edu.ec');
        console.log('Estudiante 2: estudiante2@uide.edu.ec');
        console.log('Estudiante 3: estudiante3@uide.edu.ec');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error durante el seed:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
