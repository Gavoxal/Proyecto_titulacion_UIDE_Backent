import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...\n');

    // Limpiar datos existentes (opcional - comentar si no quieres borrar)
    console.log('🗑️  Cleaning existing data...');
    await prisma.comentario.deleteMany();
    await prisma.evidencia.deleteMany();
    await prisma.actividad.deleteMany();
    await prisma.estudiantePrerequisito.deleteMany();
    await prisma.catalogoPrerequisito.deleteMany();
    await prisma.propuesta.deleteMany();
    await prisma.areaConocimiento.deleteMany();
    await prisma.auth.deleteMany();
    await prisma.usuario.deleteMany();
    console.log('✅ Cleaned\n');

    // Password hash
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. ÁREAS DE CONOCIMIENTO
    console.log('📚 Creating Áreas de Conocimiento...');
    const area1 = await prisma.areaConocimiento.create({
        data: {
            codigo: 'ING-SW',
            nombre: 'Ingeniería de Software',
            descripcion: 'Desarrollo de software, metodologías ágiles'
        }
    });

    const area2 = await prisma.areaConocimiento.create({
        data: {
            codigo: 'IA',
            nombre: 'Inteligencia Artificial',
            descripcion: 'Machine Learning, Deep Learning'
        }
    });

    const area3 = await prisma.areaConocimiento.create({
        data: {
            codigo: 'REDES',
            nombre: 'Redes y Telecomunicaciones',
            descripcion: 'Infraestructura de red, IoT'
        }
    });
    console.log('✅ Created 3 áreas\n');

    // 2. PRERREQUISITOS
    console.log('📋 Creating Prerrequisitos...');
    const prereq1 = await prisma.catalogoPrerequisito.create({
        data: {
            nombre: 'Aprobación de materias',
            descripcion: 'Todas las materias aprobadas',
            activo: true
        }
    });

    const prereq2 = await prisma.catalogoPrerequisito.create({
        data: {
            nombre: 'Prácticas pre-profesionales',
            descripcion: '240 horas completadas',
            activo: true
        }
    });

    const prereq3 = await prisma.catalogoPrerequisito.create({
        data: {
            nombre: 'Vinculación con la sociedad',
            descripcion: '160 horas completadas',
            activo: true
        }
    });
    console.log('✅ Created 3 prerrequisitos\n');

    // 3. USUARIOS
    console.log('👥 Creating Users...');

    const director = await prisma.usuario.create({
        data: {
            nombres: 'María',
            apellidos: 'González Pérez',
            cedula: '1234567890',
            correoInstitucional: 'director@uide.edu.ec',
            rol: 'DIRECTOR',
            auth: {
                create: {
                    username: 'director@uide.edu.ec',
                    password: hashedPassword
                }
            }
        }
    });

    const coordinador = await prisma.usuario.create({
        data: {
            nombres: 'Carlos',
            apellidos: 'Ramírez Torres',
            cedula: '1234567891',
            correoInstitucional: 'coordinador@uide.edu.ec',
            rol: 'COORDINADOR',
            auth: {
                create: {
                    username: 'coordinador@uide.edu.ec',
                    password: hashedPassword
                }
            }
        }
    });

    const tutor1 = await prisma.usuario.create({
        data: {
            nombres: 'Ana',
            apellidos: 'Martínez Silva',
            cedula: '1234567892',
            correoInstitucional: 'tutor1@uide.edu.ec',
            rol: 'TUTOR',
            auth: {
                create: {
                    username: 'tutor1@uide.edu.ec',
                    password: hashedPassword
                }
            }
        }
    });

    const tutor2 = await prisma.usuario.create({
        data: {
            nombres: 'Roberto',
            apellidos: 'López Fernández',
            cedula: '1234567893',
            correoInstitucional: 'tutor2@uide.edu.ec',
            rol: 'TUTOR',
            auth: {
                create: {
                    username: 'tutor2@uide.edu.ec',
                    password: hashedPassword
                }
            }
        }
    });

    const tutor3 = await prisma.usuario.create({
        data: {
            nombres: 'Patricia',
            apellidos: 'Sánchez Morales',
            cedula: '1234567894',
            correoInstitucional: 'tutor3@uide.edu.ec',
            rol: 'TUTOR',
            auth: {
                create: {
                    username: 'tutor3@uide.edu.ec',
                    password: hashedPassword
                }
            }
        }
    });

    const docente = await prisma.usuario.create({
        data: {
            nombres: 'Luis',
            apellidos: 'Herrera Castro',
            cedula: '1234567895',
            correoInstitucional: 'docente@uide.edu.ec',
            rol: 'DOCENTE_INTEGRACION',
            auth: {
                create: {
                    username: 'docente@uide.edu.ec',
                    password: hashedPassword
                }
            }
        }
    });

    const comite1 = await prisma.usuario.create({
        data: {
            nombres: 'Elena',
            apellidos: 'Vargas Ruiz',
            cedula: '1234567896',
            correoInstitucional: 'comite1@uide.edu.ec',
            rol: 'COMITE',
            auth: {
                create: {
                    username: 'comite1@uide.edu.ec',
                    password: hashedPassword
                }
            }
        }
    });

    const comite2 = await prisma.usuario.create({
        data: {
            nombres: 'Jorge',
            apellidos: 'Mendoza Ortiz',
            cedula: '1234567897',
            correoInstitucional: 'comite2@uide.edu.ec',
            rol: 'COMITE',
            auth: {
                create: {
                    username: 'comite2@uide.edu.ec',
                    password: hashedPassword
                }
            }
        }
    });

    const estudiante1 = await prisma.usuario.create({
        data: {
            nombres: 'Juan',
            apellidos: 'Pérez Gómez',
            cedula: '1234567898',
            correoInstitucional: 'estudiante1@uide.edu.ec',
            rol: 'ESTUDIANTE',
            auth: {
                create: {
                    username: 'estudiante1@uide.edu.ec',
                    password: hashedPassword
                }
            }
        }
    });

    const estudiante2 = await prisma.usuario.create({
        data: {
            nombres: 'Sofía',
            apellidos: 'Rodríguez Díaz',
            cedula: '1234567899',
            correoInstitucional: 'estudiante2@uide.edu.ec',
            rol: 'ESTUDIANTE',
            auth: {
                create: {
                    username: 'estudiante2@uide.edu.ec',
                    password: hashedPassword
                }
            }
        }
    });

    const estudiante3 = await prisma.usuario.create({
        data: {
            nombres: 'Diego',
            apellidos: 'Torres Vega',
            cedula: '1234567800',
            correoInstitucional: 'estudiante3@uide.edu.ec',
            rol: 'ESTUDIANTE',
            auth: {
                create: {
                    username: 'estudiante3@uide.edu.ec',
                    password: hashedPassword
                }
            }
        }
    });

    console.log('✅ Created 12 users\n');

    // 4. PRERREQUISITOS DE ESTUDIANTES
    console.log('✅ Creating Estudiante Prerrequisitos...');
    for (const estudiante of [estudiante1, estudiante2, estudiante3]) {
        for (const prereq of [prereq1, prereq2, prereq3]) {
            await prisma.estudiantePrerequisito.create({
                data: {
                    fkEstudiante: estudiante.id,
                    catalogoPrerequisitoId: prereq.id,
                    cumplido: true,
                    fechaValidacion: new Date(),
                    observaciones: 'Validado por seed'
                }
            });
        }
    }
    console.log('✅ All students have prerequisites\n');

    // 5. PROPUESTAS
    console.log('📄 Creating Propuestas...');
    const propuesta1 = await prisma.propuesta.create({
        data: {
            titulo: 'Sistema de Gestión de Inventario con IA',
            objetivos: 'Desarrollar sistema inteligente para optimizar inventario',
            problematica: 'Dificultad para predecir demanda',
            alcance: 'Sistema web con predicción de demanda',
            carrera: 'Ingeniería en Sistemas',
            malla: '2023',
            archivoUrl: 'https://example.com/propuesta1.pdf',
            areaConocimientoId: area2.id,
            fkEstudiante: estudiante1.id,
            estado: 'APROBADA'
        }
    });

    const propuesta2 = await prisma.propuesta.create({
        data: {
            titulo: 'App Móvil para Gestión de Citas Médicas',
            objetivos: 'Crear app móvil para agendar citas médicas',
            problematica: 'Dificultad en coordinación de citas',
            alcance: 'App móvil iOS/Android',
            carrera: 'Ingeniería en Sistemas',
            malla: '2023',
            archivoUrl: 'https://example.com/propuesta2.pdf',
            areaConocimientoId: area1.id,
            fkEstudiante: estudiante2.id,
            estado: 'APROBADA'
        }
    });

    const propuesta3 = await prisma.propuesta.create({
        data: {
            titulo: 'Sistema de Monitoreo de Red con IoT',
            objetivos: 'Implementar sistema de monitoreo en tiempo real',
            problematica: 'Falta de visibilidad en estado de red',
            alcance: 'Dashboard web con sensores IoT',
            carrera: 'Ingeniería en Sistemas',
            malla: '2023',
            archivoUrl: 'https://example.com/propuesta3.pdf',
            areaConocimientoId: area3.id,
            fkEstudiante: estudiante3.id,
            estado: 'PENDIENTE'
        }
    });

    console.log('✅ Created 3 propuestas\n');

    // 6. ACTIVIDADES
    console.log('📝 Creating Actividades...');
    const actividad1 = await prisma.actividad.create({
        data: {
            nombre: 'Capítulo 1: Marco Teórico',
            descripcion: 'Investigación y redacción del marco teórico',
            tipo: 'TUTORIA',
            propuestaId: propuesta1.id,
            fechaActivacion: new Date('2026-01-15'),
            fechaEntrega: new Date('2026-02-15'),
            requisitos: ['Mínimo 20 páginas', '15 referencias bibliográficas'],
            estado: 'ENTREGADO'
        }
    });

    const actividad2 = await prisma.actividad.create({
        data: {
            nombre: 'Desarrollo del Prototipo',
            descripcion: 'Implementación del prototipo funcional',
            tipo: 'DOCENCIA',
            propuestaId: propuesta1.id,
            fechaActivacion: new Date('2026-02-01'),
            fechaEntrega: new Date('2026-03-15'),
            requisitos: ['Prototipo funcional', 'Funcionalidades básicas'],
            estado: 'ENTREGADO'
        }
    });

    console.log('✅ Created 2 actividades\n');

    // 7. EVIDENCIAS CON CALIFICACIÓN DUAL
    console.log('📎 Creating Evidencias...');
    const evidencia1 = await prisma.evidencia.create({
        data: {
            semana: 4,
            contenido: 'Marco teórico completo con 25 páginas y 18 referencias',
            archivoUrl: 'https://example.com/evidencia1.pdf',
            estado: 'ENTREGADO',
            actividadId: actividad1.id,
            calificacionTutor: 9.0,
            feedbackTutor: 'Excelente trabajo, muy bien fundamentado',
            estadoRevisionTutor: 'APROBADO',
            fechaCalificacionTutor: new Date(),
            calificacionDocente: 8.5,
            feedbackDocente: 'Buen trabajo, mejorar conclusiones',
            estadoRevisionDocente: 'APROBADO',
            fechaCalificacionDocente: new Date(),
            calificacionFinal: 8.7
        }
    });

    const evidencia2 = await prisma.evidencia.create({
        data: {
            semana: 6,
            contenido: 'Prototipo funcional implementado',
            archivoUrl: 'https://example.com/evidencia2.pdf',
            estado: 'ENTREGADO',
            actividadId: actividad2.id,
            calificacionTutor: 8.0,
            feedbackTutor: 'Buen avance',
            estadoRevisionTutor: 'APROBADO',
            fechaCalificacionTutor: new Date()
        }
    });

    console.log('✅ Created 2 evidencias\n');

    // 8. COMENTARIOS
    console.log('💬 Creating Comentarios...');
    await prisma.comentario.createMany({
        data: [
            {
                descripcion: 'Revisar la sección de metodología',
                evidenciaId: evidencia1.id,
                usuarioId: tutor1.id
            },
            {
                descripcion: 'Excelente investigación bibliográfica',
                evidenciaId: evidencia1.id,
                usuarioId: docente.id
            }
        ]
    });
    console.log('✅ Created 2 comentarios\n');

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE SEED COMPLETED!');
    console.log('='.repeat(60) + '\n');

    console.log('📊 SUMMARY:');
    console.log('  • 3 Áreas de Conocimiento');
    console.log('  • 3 Prerrequisitos');
    console.log('  • 12 Usuarios (todos los roles)');
    console.log('  • 9 Prerrequisitos de Estudiantes');
    console.log('  • 3 Propuestas');
    console.log('  • 2 Actividades');
    console.log('  • 2 Evidencias (con calificación dual)');
    console.log('  • 2 Comentarios');

    console.log('\n' + '='.repeat(60));
    console.log('🔑 CREDENCIALES DE ACCESO');
    console.log('='.repeat(60));
    console.log('\n⚠️  Todas las contraseñas son: password123\n');

    console.log('👨‍💼 DIRECTOR:');
    console.log('  Email: director@uide.edu.ec\n');

    console.log('👨‍💼 COORDINADOR:');
    console.log('  Email: coordinador@uide.edu.ec\n');

    console.log('👨‍🏫 TUTORES:');
    console.log('  1. tutor1@uide.edu.ec - Ana Martínez Silva');
    console.log('  2. tutor2@uide.edu.ec - Roberto López Fernández');
    console.log('  3. tutor3@uide.edu.ec - Patricia Sánchez Morales\n');

    console.log('👨‍🏫 DOCENTE INTEGRACIÓN:');
    console.log('  Email: docente@uide.edu.ec\n');

    console.log('👥 COMITÉ:');
    console.log('  1. comite1@uide.edu.ec - Elena Vargas Ruiz');
    console.log('  2. comite2@uide.edu.ec - Jorge Mendoza Ortiz\n');

    console.log('👨‍🎓 ESTUDIANTES:');
    console.log('  1. estudiante1@uide.edu.ec - Juan Pérez Gómez');
    console.log('  2. estudiante2@uide.edu.ec - Sofía Rodríguez Díaz');
    console.log('  3. estudiante3@uide.edu.ec - Diego Torres Vega\n');

    console.log('='.repeat(60) + '\n');
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
