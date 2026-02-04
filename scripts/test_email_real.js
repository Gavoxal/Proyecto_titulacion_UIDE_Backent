
import { sendEmail } from "../src/services/email.service.js";
import dotenv from "dotenv";
import path from "path";

// Manually load env from correct place to simulate mcp-server behavior
// Assuming we run this from project root
dotenv.config();

async function main() {
    const targetEmail = "gavo3212@gmail.com";
    console.error(`[TEST] Testing email delivery to: ${targetEmail}`);
    console.error(`[TEST] Using SMTP User: ${process.env.GMAIL_USER}`);

    // Mask password
    const pass = process.env.GMAIL_PASS || "";
    console.error(`[TEST] Using SMTP Pass: ${pass.substring(0, 3)}... (length: ${pass.length})`);

    const result = await sendEmail(targetEmail, "Test Email from Script", "This is a test email to verify credentials.");

    console.error("[TEST] Result:", result);
}

main();
