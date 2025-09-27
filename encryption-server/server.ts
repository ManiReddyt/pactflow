import { createApp, eventHandler, toNodeListener, readBody, setHeader, H3Event } from "h3";
import { createServer } from "http";
import dotenv from "dotenv";
import { storeOnIrys, toIrysGatewayUrl } from "./fileEncryption.js";

dotenv.config();

function setCors(event: H3Event) {
    setHeader(event, "Access-Control-Allow-Origin", "*");
    setHeader(event, "Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    setHeader(event, "Access-Control-Allow-Headers", "Content-Type,Authorization");
}

const app = createApp();

app.use(
    "/api/health",
    eventHandler(async (event) => {
        setCors(event);
        return { ok: true };
    })
);

app.use(
    "/api/irys/upload",
    eventHandler(async (event) => {
        setCors(event);
        if (event.method === "OPTIONS") {
            return "ok";
        }
        if (event.method !== "POST") {
            event.node.res.statusCode = 405;
            return { error: "Method not allowed" };
        }

        const body = await readBody<{
            cipherText: string;
            dataToEncryptHash: string;
            accessControlConditions: any[];
            fileName?: string;
            contentType?: string;
        }>(event);

        if (!body || !body.cipherText || !body.dataToEncryptHash || !Array.isArray(body.accessControlConditions)) {
            event.node.res.statusCode = 400;
            return { error: "Invalid payload. Required: cipherText, dataToEncryptHash, accessControlConditions" };
        }
        if (!process.env.PRIVATE_KEY) {
            event.node.res.statusCode = 500;
            return { error: "Server misconfigured: missing PRIVATE_KEY" };
        }

        try {
            const id = await storeOnIrys(
                body.cipherText,
                body.dataToEncryptHash,
                body.accessControlConditions,
                {
                    walletPrivateKey: process.env.PRIVATE_KEY,
                    fileName: body.fileName,
                    contentType: body.contentType,
                }
            );
            const url = toIrysGatewayUrl(id);
            return { id, url };
        } catch (e: any) {
            event.node.res.statusCode = 500;
            return { error: e?.message || "Upload failed" };
        }
    })
);

const server = createServer(toNodeListener(app));
const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server paid uploader listening on http://localhost:${PORT}`);
});
