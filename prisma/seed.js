const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...\n');

    // Password hash
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. ÁREAS DE CONOCIMIENTO
    console.log('📚 Creating Áreas de Conocimiento...');
    const area1 = await prisma.areaConocimiento.create({
        data: {
            codigo: 'ING-SW',
            nombre: 'Ingeniería de Software',
            descripcion: 'Desarrollo de software'
        }
    });

    const area2 = await prisma.areaConocimiento.create({
        data: {
            codigo: 'IA',
            nombre: 'Inteligencia Artificial',
            descripcion: 'Machine Learning'
        }
    });

    const area3 = await prisma.areaConocimiento.create({
        data: {
            codigo: 'REDES',
            nombre: 'Redes',
            descripcion: 'Redes e IoT'
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
            descripcion: '240 horas',
            activo: true
        }
    });

    const prereq3 = await prisma.catalogoPrerequisito.create({
        data: {
            nombre: 'Vinculación',
            descripcion: '160 horas',
            activo: true
        }
    });
    console.log('✅ Created 3 prerrequisitos\n');

    // 3. USUARIOS
    console.log('👥 Creating Users...');

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
                    password: hashedPassword
                }
            }
        }
    });

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
                    password: hashedPassword
                }
            }
        }
    });

    const tutor1 = await prisma.usuario.create({
        data: {
            nombres: 'Ana',
            apellidos: 'Martínez',
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
            apellidos: 'López',
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
            apellidos: 'Sánchez',
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
            apellidos: 'Herrera',
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
            apellidos: 'Vargas',
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
            apellidos: 'Mendoza',
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
            apellidos: 'Pérez',
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
            apellidos: 'Rodríguez',
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
            apellidos: 'Torres',
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
                    fechaValidacion: new Date()
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
            objetivos: 'Desarrollar sistema inteligente',
            problematica: 'Dificultad para predecir demanda',
            alcance: 'Sistema web',
            carrera: 'Ingeniería en Sistemas',
            malla: '2023',
            areaConocimientoId: area2.id,
            fkEstudiante: estudiante1.id,
            estado: 'APROBADA'
        }
    });

    const propuesta2 = await prisma.propuesta.create({
        data: {
            titulo: 'App Móvil para Gestión de Citas',
            objetivos: 'Crear app móvil',
            problematica: 'Dificultad en coordinación',
            alcance: 'App móvil',
            carrera: 'Ingeniería en Sistemas',
            malla: '2023',
            areaConocimientoId: area1.id,
            fkEstudiante: estudiante2.id,
            estado: 'APROBADA'
        }
    });

    const propuesta3 = await prisma.propuesta.create({
        data: {
            titulo: 'Sistema de Monitoreo con IoT',
            objetivos: 'Implementar monitoreo',
            problematica: 'Falta de visibilidad',
            alcance: 'Dashboard web',
            carrera: 'Ingeniería en Sistemas',
            malla: '2023',
            areaConocimientoId: area3.id,
            fkEstudiante: estudiante3.id,
            estado: 'PENDIENTE'
        }
    });

    console.log('✅ Created 3 propuestas\n');

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

    console.log('\n' + '='.repeat(60));
    console.log('🔑 CREDENCIALES DE ACCESO');
    console.log('='.repeat(60));
    console.log('\n⚠️  Todas las contraseñas son: password123\n');

    console.log('👨‍💼 DIRECTOR: director@uide.edu.ec');
    console.log('👨‍💼 COORDINADOR: coordinador@uide.edu.ec');
    console.log('👨‍🏫 TUTORES:');
    console.log('  • tutor1@uide.edu.ec');
    console.log('  • tutor2@uide.edu.ec');
    console.log('  • tutor3@uide.edu.ec');
    console.log('👨‍🏫 DOCENTE: docente@uide.edu.ec');
    console.log('👥 COMITÉ:');
    console.log('  • comite1@uide.edu.ec');
    console.log('  • comite2@uide.edu.ec');
    console.log('👨‍🎓 ESTUDIANTES:');
    console.log('  • estudiante1@uide.edu.ec');
    console.log('  • estudiante2@uide.edu.ec');
    console.log('  • estudiante3@uide.edu.ec\n');

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
