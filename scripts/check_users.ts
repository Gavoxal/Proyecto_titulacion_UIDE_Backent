
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const [rows] = await connection.execute("SELECT id, correo_institucional, rol FROM usuarios LIMIT 5");
    console.log("Usuarios encontrados:", rows);
    await connection.end();
}

main();
