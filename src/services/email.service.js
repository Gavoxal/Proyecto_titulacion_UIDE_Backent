import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Cargar .env desde la raíz del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(rootDir, ".env") });

console.error("[EMAIL] Loading credentials...");
console.error(`[EMAIL] GMAIL_USER: ${process.env.GMAIL_USER ? process.env.GMAIL_USER.substring(0, 5) + '***' : 'UNDEFINED'}`);
console.error(`[EMAIL] GMAIL_PASS: ${process.env.GMAIL_PASS ? '***' + process.env.GMAIL_PASS.substring(process.env.GMAIL_PASS.length - 4) : 'UNDEFINED'}`);

//configuracion transportador - crear de forma lazy
let transport = null;

function getTransport() {
    if (!transport) {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
            throw new Error("GMAIL_USER y GMAIL_PASS deben estar configurados en el archivo .env");
        }

        transport = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });
        console.error("[EMAIL] Transporter created successfully");
    }
    return transport;
}

//funcion de envio 

export const sendEmail = async (to, subject, text) => {
    try {
        console.error("Enviando correo a: ", to);

        const transporter = getTransport();

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: to,
            subject: subject,
            text: text
        }

        const info = await transporter.sendMail(mailOptions);
        console.error("Correo enviado: ", info.response);
        return {
            success: true,
            message: "Correo enviado correctamente",
            id: info.messageId
        }
    } catch (error) {
        console.error("Error al enviar correo: ", error);
        if (error.response) console.error("SMTP Response:", error.response);
        if (error.code) console.error("Error Code:", error.code);

        // Debug credentials presence (masked)
        const user = process.env.GMAIL_USER || "UNDEFINED";
        console.error(`Using GMAIL_USER: ${user.substring(0, 3)}***`);

        return {
            success: false,
            message: "Error al enviar correo: " + (error.message || "Unknown error"),
            error: error
        }
    }
}