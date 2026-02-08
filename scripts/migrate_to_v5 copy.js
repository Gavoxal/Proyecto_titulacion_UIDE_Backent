/**
 * Script de Migración: Base de Datos v4 → v5
 * 
 * Este script aplica las mejoras al esquema de la base de datos:
 * - Estandarización de nombres (snake_case)
 * - Corrección de Primary Keys y Foreign Keys
 * - Normalización con tablas catálogo
 * 
 * IMPORTANTE: Este script eliminará la base de datos actual y creará una nueva.
 * Asegúrate de hacer un backup antes de ejecutar.
 */

import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateDatabase() {
    let connection;

    try {
        console.log('🔄 Iniciando migración de base de datos v4 → v5...\n');

        // Conectar a MySQL (sin especificar base de datos)
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            multipleStatements: true
        });

        console.log('✅ Conexión a MySQL establecida');

        // Leer el archivo SQL v5
        const sqlFilePath = path.join(__dirname, '..', '..', 'base de datos v5.sql');
        let sqlContent = await fs.readFile(sqlFilePath, 'utf-8');

        console.log('📄 Archivo SQL v5 cargado');

        // Eliminar la base de datos antigua si existe
        console.log('\n⚠️  Eliminando base de datos antigua (db-proyecto-titulacion)...');
        await connection.query('DROP DATABASE IF EXISTS `db-proyecto-titulacion`');
        console.log('✅ Base de datos antigua eliminada');

        // Dividir el SQL en secciones (antes y después de DELIMITER)
        const delimiterIndex = sqlContent.indexOf('DELIMITER $$');

        if (delimiterIndex !== -1) {
            // Parte 1: Todo antes de DELIMITER (tablas, índices, etc.)
            const part1 = sqlContent.substring(0, delimiterIndex).trim();

            console.log('\n🔨 Creando estructura de base de datos (tablas, índices)...');
            await connection.query(part1);
            console.log('✅ Estructura base creada');

            // Parte 2: Función (extraer solo el cuerpo de la función)
            console.log('\n🔧 Creando función get_app_role...');
            const functionSQL = `
        CREATE FUNCTION get_app_role() RETURNS varchar(50) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
        READS SQL DATA
        DETERMINISTIC
        BEGIN
          RETURN @app_current_role;
        END
      `;
            await connection.query(`USE db_proyecto_titulacion`);
            await connection.query(functionSQL);
            console.log('✅ Función creada');

            // Parte 3: Vista y datos iniciales (después del segundo DELIMITER ;)
            const secondDelimiterIndex = sqlContent.indexOf('DELIMITER ;', delimiterIndex);
            const part3 = sqlContent.substring(secondDelimiterIndex + 'DELIMITER ;'.length).trim();

            console.log('\n📊 Creando vista y datos iniciales...');
            await connection.query(part3);
            console.log('✅ Vista y datos iniciales creados');

        } else {
            // Si no hay DELIMITER, ejecutar todo el script
            console.log('\n🔨 Creando nueva estructura de base de datos (db_proyecto_titulacion)...');
            await connection.query(sqlContent);
            console.log('✅ Nueva estructura creada exitosamente');
        }

        // Verificar las tablas creadas
        const [tables] = await connection.query('SHOW TABLES FROM db_proyecto_titulacion');
        console.log('\n📊 Tablas creadas:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   - ${tableName}`);
        });

        console.log('\n✨ Migración completada exitosamente!');
        console.log('\n⚠️  IMPORTANTE: Actualiza el archivo .env con la nueva URL de base de datos:');
        console.log('   DATABASE_URL="mysql://root:root@localhost:3306/db_proyecto_titulacion?ssl-mode=REQUIRED"');

    } catch (error) {
        console.error('\n❌ Error durante la migración:', error.message);
        console.error('\nDetalles del error:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

// Ejecutar migración
migrateDatabase();
