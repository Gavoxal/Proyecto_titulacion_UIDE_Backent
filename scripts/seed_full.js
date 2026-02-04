import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

/**
 * seed_full.js
 * 
 * Script para poblar la base de datos con un escenario completo:
 * 1. Director, Tutor, Docente Integración.
 * 2. Estudiante A (Listo para tesis, con Propuesta, con Tutor).
 * 3. Estudiante B (Nuevo, sin prerrequisitos).
 * 4. Actividades de Docencia y Tutoría.
 */

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'root', // Asumiendo root/root por los scripts anteriores
    database: 'db-proyecto-titulacion'
};

async function seed() {
    console.log('🌱 Iniciando Seed Completo...');
    const connection = await mysql.createConnection(DB_CONFIG);

    try {
        // Limpiar para evitar duplicados (Orden inverso por FKs)
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        const tables = ['entregables_finales', 'comentarios', 'Evidencia', 'Actividades', 'comite', 'propuestas', 'prerequisitos', 'estudiantes_perfil', 'auth', 'usuarios'];
        for (const t of tables) {
            await connection.execute(`TRUNCATE TABLE ${t}`);
        }
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Tablas limpiadas.');

        // ==========================================
        // 1. USUARIOS
        // ==========================================
        const passHash = await bcrypt.hash('123456', 10);

        const insertUser = async (user) => {
            const [res] = await connection.execute(
                `INSERT INTO usuarios (cedula, nombres, apellidos, correo_institucional, rol, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [user.cedula, user.nombres, user.apellidos, user.correo, user.rol]
            );
            const userId = res.insertId;
            await connection.execute(
                `INSERT INTO auth (username, password, usuario_id) VALUES (?, ?, ?)`,
                [user.username, passHash, userId]
            );
            return userId;
        };

        const idDirector = await insertUser({ cedula: '0101', nombres: 'Juan', apellidos: 'Director', correo: 'dir@uide.edu.ec', rol: 'DIRECTOR', username: 'director' });
        const idCoord = await insertUser({ cedula: '0102', nombres: 'Dario', apellidos: 'Coordinador', correo: 'coord@uide.edu.ec', rol: 'COORDINADOR', username: 'coordinador' });
        const idDocente = await insertUser({ cedula: '0103', nombres: 'Maria', apellidos: 'Integracion', correo: 'docente@uide.edu.ec', rol: 'DOCENTE_INTEGRACION', username: 'docente' });
        const idTutor = await insertUser({ cedula: '0104', nombres: 'Pedro', apellidos: 'Tutor', correo: 'tutor@uide.edu.ec', rol: 'TUTOR', username: 'tutor' });

        const idEst1 = await insertUser({ cedula: '0201', nombres: 'Carlos', apellidos: 'Avanzado', correo: 'est1@uide.edu.ec', rol: 'ESTUDIANTE', username: 'estudiante1' });
        const idEst2 = await insertUser({ cedula: '0202', nombres: 'Ana', apellidos: 'Nueva', correo: 'est2@uide.edu.ec', rol: 'ESTUDIANTE', username: 'estudiante2' });

        console.log('✅ Usuarios creados.');

        // ==========================================
        // 2. PRERREQUISITOS
        // ==========================================
        // Estudiante 1: Cumple todo
        const reqs = ['CERTIFICADO_INGLES', 'PRACTICAS_PREPROFESIONALES', 'VINCULACION'];
        for (const r of reqs) {
            await connection.execute(
                `INSERT INTO prerequisitos (nombre, descripcion, cumplido, archivo_url, fk_estudiante) VALUES (?, 'Requisito validados', true, 'http://fake.url/doc.pdf', ?)`,
                [r, idEst1]
            );
        }
        // Estudiante 2: Solo Inglés
        await connection.execute(
            `INSERT INTO prerequisitos (nombre, descripcion, cumplido, archivo_url, fk_estudiante) VALUES (?, 'Solo ingles', true, 'http://fake.url/english.pdf', ?)`,
            ['CERTIFICADO_INGLES', idEst2]
        );
        console.log('✅ Prerrequisitos creados.');


        // ==========================================
        // 3. PROPUESTAS
        // ==========================================
        // Estudiante 1 tiene propuesta APROBADA con Tutor asignado
        const [resProp] = await connection.execute(
            `INSERT INTO propuestas (titulo, objetivos, problematica, area_conocimiento, estado, fk_estudiante, tutor_id) 
             VALUES (?, ?, ?, 'CIENCIA_DE_DATOS_E_INTELIGENCIA_ARTIFICIAL', 'APROBADA', ?, ?)`,
            ['Sistema de Predicción con IA', 'Objetivo 1\nObjetivo 2', 'Problema X', idEst1, idTutor]
        );
        const idPropuesta = resProp.insertId;
        console.log('✅ Propuestas creadas.');

        // ==========================================
        // 4. ACTIVIDADES Y EVIDENCIAS
        // ==========================================

        // Actividad 1: Docencia (Tarea para todos, pero asignamos a esta propuesta)
        // Nota: El modelo actual asocia actividad a propuesta. 
        // Docente crea tarea -> Se asocia a propuesta del alumno.
        await connection.execute(
            `INSERT INTO Actividades (nombre, descripcion, propuestas_id, usuarios_id, tipo) VALUES (?, ?, ?, ?, 'DOCENCIA')`,
            ['Avance Cap 1', 'Subir marco teorico', idPropuesta, idDocente]
        );

        // Actividad 2: Tutoría (Revisión específica)
        const [resActTutor] = await connection.execute(
            `INSERT INTO Actividades (nombre, descripcion, propuestas_id, usuarios_id, tipo) VALUES (?, ?, ?, ?, 'TUTORIA')`,
            ['Corregir Objetivos', 'Mejorar redaccion', idPropuesta, idTutor]
        );
        const idActTutor = resActTutor.insertId;

        console.log('✅ Actividades creadas.');

        // Evidencia
        await connection.execute(
            `INSERT INTO Evidencia (semana, contenido, archivo_url, Actividades_idActividades, estado) VALUES (1, 'Mis objetivos corregidos', 'http://url.pdf', ?, 'ENTREGADO')`,
            [idActTutor]
        );
        console.log('✅ Evidencias creadas.');

        console.log('🌱 Seed Terminado Exitosamente.');

    } catch (e) {
        console.error('❌ Error en Seed:', e);
    } finally {
        await connection.end();
    }
}

seed();
