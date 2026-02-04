
import { spawn } from "child_process";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const MCP_SERVER_PATH = "src/mcp-server.js";
const TEST_EMAIL = "usuario_test@uide.edu.ec"; // We will replace this if we find a better one
// Valid user email is required for the flow to work fully (db check). 
// The check_users script helps us find one.

async function runTest(emailToUse) {
    console.log(`[TEST] Starting MCP Integration Test with email: ${emailToUse}`);

    const mcpProcess = spawn("node", [MCP_SERVER_PATH], {
        stdio: ["pipe", "pipe", "inherit"], // inherit stderr to see logs
        cwd: process.cwd()
    });

    let step = 0;
    let authCode = "";
    let authToken = "";

    mcpProcess.stdout.on("data", async (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
            if (!line.trim()) continue;
            console.log(`[MCP OUT] ${line}`);

            try {
                const msg = JSON.parse(line);

                // Response to solicit_codigo
                if (step === 1 && msg.result) {
                    console.log("[TEST] Solicitar codigo OK. Fetching code from DB...");
                    // Wait a bit for DB insert
                    await new Promise(r => setTimeout(r, 2000));

                    const connection = await mysql.createConnection(process.env.DATABASE_URL);
                    const [rows] = await connection.execute(
                        "SELECT codigo FROM mcp_auth WHERE email = ? ORDER BY created_at DESC LIMIT 1",
                        [emailToUse]
                    );
                    await connection.end();

                    if (rows.length > 0) {
                        authCode = rows[0].codigo;
                        console.log(`[TEST] Code found in DB: ${authCode}`);

                        // Send verify request
                        step = 2;
                        const verifyReq = {
                            jsonrpc: "2.0",
                            id: 2,
                            method: "tools/call",
                            params: {
                                name: "verificar_codigo",
                                arguments: {
                                    email: emailToUse,
                                    codigo: authCode
                                }
                            }
                        };
                        mcpProcess.stdin.write(JSON.stringify(verifyReq) + "\n");
                    } else {
                        console.error("[TEST] Code NOT found in DB!");
                        mcpProcess.kill();
                    }
                }

                // Response to verificar_codigo
                else if (step === 2 && msg.result) {
                    const content = msg.result.content[0].text;
                    const match = content.match(/TOKEN es: ([a-f0-9]+)/);
                    if (match) {
                        authToken = match[1];
                        console.log(`[TEST] Token obtained: ${authToken}`);

                        // Send dashboard request
                        step = 3;
                        const dashReq = {
                            jsonrpc: "2.0",
                            id: 3,
                            method: "tools/call",
                            params: {
                                name: "ver_mi_dashboard",
                                arguments: {
                                    auth_token: authToken
                                }
                            }
                        };
                        mcpProcess.stdin.write(JSON.stringify(dashReq) + "\n");
                    } else {
                        console.error("[TEST] Could not extract token from response:", content);
                        mcpProcess.kill();
                    }
                }

                // Response to ver_mi_dashboard
                else if (step === 3 && msg.result) {
                    console.log("[TEST] Dashboard accessed successfully!");
                    console.log(msg.result.content[0].text.substring(0, 200) + "...");
                    console.log("[TEST] PASSED");
                    mcpProcess.kill();
                    process.exit(0);
                }

            } catch (e) {
                // Ignore parse errors for non-JSON lines
            }
        }
    });

    // 1. Initial Handshake
    console.log("[TEST] Sending Initialize...");
    const initReq = {
        jsonrpc: "2.0",
        id: 0,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05", // Latest known or 0.1.0
            capabilities: {},
            clientInfo: { name: "test-script", version: "1.0" }
        }
    };
    mcpProcess.stdin.write(JSON.stringify(initReq) + "\n");

    // After init, we should send notifications_initialized but usually tool calls work directly after or we wait for response.
    // Let's wait for init response then call tool.

    // Easier hack: just wait a second and send the first tool call.
    setTimeout(() => {
        step = 1;
        const req = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: "solicitar_codigo",
                arguments: { email: emailToUse }
            }
        };
        mcpProcess.stdin.write(JSON.stringify(req) + "\n");
    }, 1000);
}

// Get email from args or check_users output logic (manual for now)
const argEmail = process.argv[2];
if (argEmail) {
    runTest(argEmail);
} else {
    // If no arg, fetch from DB
    (async () => {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        const [rows] = await connection.execute("SELECT correo_institucional FROM usuarios LIMIT 1");
        await connection.end();
        if (rows.length > 0) {
            runTest(rows[0].correo_institucional);
        } else {
            console.error("No users found in DB to test with.");
        }
    })();
}
