
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const email = 'gavo3212@gmail.com';
    console.log(`Checking database for user: ${email}`);

    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);

        // Check Usuario
        const [users] = await connection.execute(
            "SELECT id, correo_institucional, rol FROM usuarios WHERE correo_institucional = ?",
            [email]
        );
        console.log("User search result:", users);

        // Check Permissions (try to insert to mcp_auth as if we interpreted the logic)
        // actually we can't easily check 'mcp_agent' logic from here without full setup,
        // but we can check if the user exists which is the first step.

        await connection.end();
    } catch (e) {
        console.error("DB Error:", e);
    }
}

main();
