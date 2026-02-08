
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'proyectotesis' // Confirmed database name
};

// ============================================
// DATA SOURCES
// ============================================

const tutores = [
    {
        cedula: '1710234567',
        nombres: 'Charlie',
        apellidos: 'Cárdenas Toledo',
        correo: 'chcardenasto@uide.edu.ec',
        password: 'tutor123'
    },
    {
        cedula: '1720345678',
        nombres: 'Milton',
        apellidos: 'Palacios Morocho',
        correo: 'mipalaciomo@uide.edu.ec',
        password: 'tutor123'
    },
    {
        cedula: '1730456789',
        nombres: 'Wilson',
        apellidos: 'Valverde Jadan',
        correo: 'wivalverdeja@uide.edu.ec',
        password: 'tutor123'
    },
    {
        cedula: '1740567890',
        nombres: 'Dario',
        apellidos: 'Valarezo León',
        correo: 'davalarezole@uide.edu.ec',
        password: 'tutor123'
    }
];

// Areas de Conocimiento
const areasToSeed = [
    { codigo: 'DESARROLLO_SOFTWARE', nombre: 'Desarrollo de Software' },
    { codigo: 'INTELIGENCIA_ARTIFICIAL', nombre: 'Inteligencia Artificial' },
    { codigo: 'CIBERSEGURIDAD', nombre: 'Ciberseguridad' },
    { codigo: 'SISTEMAS_INFORMACION', nombre: 'Sistemas de Información' },
    { codigo: 'PROGRAMACION_Y_DESARROLLO_DE_SOFTWARE', nombre: 'Programación y Desarrollo' }, // Old keys mapping
    { codigo: 'CIENCIA_DE_DATOS_E_INTELIGENCIA_ARTIFICIAL', nombre: 'Ciencia de Datos e IA' },
    { codigo: 'GESTION_DE_LA_INFORMACION_Y_TRANSFORMACION_DIGITAL', nombre: 'Gestión de Info y Transformación Digital' },
    { codigo: 'INFRAESTRUCTURA_TI_Y_CIBERSEGURIDAD', nombre: 'Infraestructura TI y Ciberseguridad' },
    { codigo: 'INNOVACION_EMPRENDIMIENTO_Y_ETICA_TECNOLOGICA', nombre: 'Innovación y Ética' }
];

// Propuestas para estudiantes ID 1-4
const propuestasTargetParams = [
    {
        estudianteId: 1, // Fernando José Castillo Arrobo ? (Based on order of execution historically, assuming ID 1 exists)
        templateIndex: 0 // Sistema de Gestión...
    },
    {
        estudianteId: 2, // Gabriel Rodríguez López ?
        templateIndex: 1 // App Salud Mental...
    },
    {
        estudianteId: 3,
        templateIndex: 2 // Plataforma E-Learning...
    },
    {
        estudianteId: 4,
        templateIndex: 3 // Sistema Monitoreo IoT...
    }
];

const propuestasTemplates = [
    {
        titulo: 'Sistema de Gestión de Inventarios para PYMES',
        objetivos: 'Desarrollar una aplicación web que permita a las pequeñas empresas gestionar su inventario de manera eficiente',
        area: 'PROGRAMACION_Y_DESARROLLO_DE_SOFTWARE',
        tutorIndex: 0
    },
    {
        titulo: 'Aplicación Móvil de Salud Mental con IA',
        objetivos: 'Crear una app móvil que use inteligencia artificial para detectar patrones de ansiedad y depresión',
        area: 'CIENCIA_DE_DATOS_E_INTELIGENCIA_ARTIFICIAL',
        tutorIndex: 1
    },
    {
        titulo: 'Plataforma E-Learning con Gamificación',
        objetivos: 'Desarrollar una plataforma educativa que incorpore elementos de juego para aumentar la motivación',
        area: 'GESTION_DE_LA_INFORMACION_Y_TRANSFORMACION_DIGITAL',
        tutorIndex: 2
    },
    {
        titulo: 'Sistema de Monitoreo IoT para Agricultura',
        objetivos: 'Implementar sensores IoT para monitorear condiciones de cultivos en tiempo real',
        area: 'INFRAESTRUCTURA_TI_Y_CIBERSEGURIDAD',
        tutorIndex: 0
    }
];

const actividadesStandard = [
    { nombre: 'Análisis de Requerimientos', descripcion: 'Documentar requerimientos del sistema' },
    { nombre: 'Diseño de Arquitectura', descripcion: 'Diseñar arquitectura y diagramas' },
    { nombre: 'Implementación Módulo de Usuarios', descripcion: 'Desarrollar gestión de usuarios y roles' },
    { nombre: 'Implementación Core', descripcion: 'Desarrollar núcleo de la lógica de negocio' },
    { nombre: 'Pruebas Unitarias', descripcion: 'Realizar pruebas del sistema' }
];


// ============================================
// MAIN SCRIPT
// ============================================

async function seedDatosPrueba() {
    console.log('🌱 Iniciando seed complementario para Tutores y Propuestas (IDs 1-4)...\n');

    const connection = await mysql.createConnection(DB_CONFIG);

    try {
        await connection.beginTransaction();

        // 1. SEMBRAR AREAS (SI NO EXISTEN)
        console.log('� Verificando Areas de Conocimiento...');
        const areasMap = {};
        for (const area of areasToSeed) {
            await connection.execute(
                `INSERT INTO areas_conocimiento (codigo, nombre) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE nombre=VALUES(nombre)`,
                [area.codigo, area.nombre]
            );
            const [rows] = await connection.execute('SELECT id FROM areas_conocimiento WHERE codigo = ?', [area.codigo]);
            areasMap[area.codigo] = rows[0].id;
        }

        // 2. CREAR TUTORES
        console.log('\n👨‍� Creando/Verificando Tutores...');
        const tutorIds = [];
        for (const tutor of tutores) {
            const hashedPassword = await bcrypt.hash(tutor.password, 10);

            // Upsert Usuario
            await connection.execute(
                `INSERT INTO usuarios (cedula, nombres, apellidos, correo_institucional, rol, updated_at)
                 VALUES (?, ?, ?, ?, 'TUTOR', NOW(3))
                 ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), rol='TUTOR'`,
                [tutor.cedula, tutor.nombres, tutor.apellidos, tutor.correo]
            );

            const [rows] = await connection.execute('SELECT id FROM usuarios WHERE correo_institucional = ?', [tutor.correo]);
            const tutorId = rows[0].id;
            tutorIds.push(tutorId);

            // Upsert Auth
            await connection.execute(
                `INSERT INTO auth (username, password, usuario_id)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE password = VALUES(password)`,
                [tutor.correo, hashedPassword, tutorId]
            );
            console.log(`   ✓ Tutor listo: ${tutor.nombres} ${tutor.apellidos}`);
        }

        // 3. ASIGNAR PROPUESTAS A ESTUDIANTES 1-4
        console.log('\n📄 Asignando Propuestas a estudiantes 1-4...');

        for (const target of propuestasTargetParams) {
            const estId = target.estudianteId;
            const template = propuestasTemplates[target.templateIndex];
            const tutorId = tutorIds[template.tutorIndex % tutorIds.length];
            const areaId = areasMap[template.area] || areasMap['DESARROLLO_SOFTWARE'];

            // Verificar si el estudiante existe
            const [estCheck] = await connection.execute('SELECT id, nombres, apellidos FROM usuarios WHERE id = ?', [estId]);
            if (estCheck.length === 0) {
                console.warn(`   ⚠️ Estudiante con ID ${estId} no encontrado. Saltando...`);
                continue;
            }
            const estudiante = estCheck[0];

            // Crear Propuesta
            // Nota: Se elimina el campo 'tutor_id' de insert en Propuestas, solo se usa trabajo_titulacion
            // Nota 2: Se usa area_conocimiento_id
            const [res] = await connection.execute(
                `INSERT INTO propuestas (titulo, objetivos, area_conocimiento_id, fk_estudiante, estado, fecha_publicacion)
                 VALUES (?, ?, ?, ?, 'APROBADA', NOW(3))`,
                [template.titulo, template.objetivos, areaId, estId]
            );
            const propId = res.insertId;

            // Link Tutor via TrabajoTitulacion
            await connection.execute(
                `INSERT INTO trabajo_titulacion (propuestas_id, fk_tutor_id)
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE fk_tutor_id=VALUES(fk_tutor_id)`,
                [propId, tutorId]
            );

            console.log(`   ✓ Propuesta asignada a ${estudiante.nombres} (ID: ${estId})`);
            console.log(`     Titulo: ${template.titulo}`);
            console.log(`     Tutor asignado: ${tutores[template.tutorIndex].nombres}`);

            // 4. CREAR ACTIVIDADES Y AVANCES
            await createActivitiesForProposal(connection, propId, tutorId);
        }

        await connection.commit();
        console.log('\n✅ PROCESO COMPLETADO EXITOSAMENTE');

    } catch (e) {
        await connection.rollback();
        console.error('❌ Error:', e);
    } finally {
        await connection.end();
    }
}

async function createActivitiesForProposal(conn, propId, tutorId) {
    for (const act of actividadesStandard) {
        // Insert Actividad
        const [res] = await conn.execute(
            `INSERT INTO actividades (nombre, descripcion, propuesta_id, tipo)
             VALUES (?, ?, ?, 'DOCENCIA')`,
            [act.nombre, act.descripcion, propId]
        );
        const actId = res.insertId;

        // Crear Evidencia (Simular algunas entregadas con feedback)
        // Probabilidad de entrega alta para demonstration
        if (Math.random() > 0.2) {
            const [evRes] = await conn.execute(
                `INSERT INTO evidencia (semana, contenido, estado, calificacion, actividad_id, fecha_entrega)
                 VALUES (?, 'Entrega de avance del documento y código fuente.', 'ENTREGADO', ?, ?, NOW(3))`,
                [
                    Math.floor(Math.random() * 8) + 1, // Semana aleatoria
                    (8 + Math.random() * 2).toFixed(2), // Calificacion 8-10
                    actId
                ]
            );

            // Añadir comentario feedback
            const evidenciaId = evRes.insertId;
            await conn.execute(
                `INSERT INTO comentarios (evidencia_id, usuario_id, descripcion)
                 VALUES (?, ?, ?)`,
                [evidenciaId, tutorId, 'Buen trabajo, falta detallar más el diagrama de secuencia.']
            );
        }
    }
}

seedDatosPrueba().catch(console.error);
