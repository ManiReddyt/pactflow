import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { accForSingleAddress, encryptAndUploadFile, shutdownLit } from "../fileEncryption.js";

dotenv.config();

async function main() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const args = process.argv.slice(2);
    const [inputFile, recipient] = args;
    if (!inputFile || !recipient) {
        console.error("Usage: npm run upload:file -- <absolute-or-relative-file-path> <recipientAddress>");
        process.exit(1);
    }
    if (!process.env.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY env var is required");
    }

    const resolved = path.isAbsolute(inputFile) ? inputFile : path.resolve(process.cwd(), inputFile);
    const acc = accForSingleAddress(recipient);

    console.log("Encrypting and uploading:", resolved);
    const { id, url } = await encryptAndUploadFile(resolved, acc, { walletPrivateKey: process.env.PRIVATE_KEY });
    console.log("Irys ID:", id);
    console.log("Gateway URL:", url);
    await shutdownLit();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
