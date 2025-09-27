import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { downloadAndDecryptFileBytesById, retrieveFromIrys, shutdownLit } from "../fileEncryption.js";
import { promises as fs } from "fs";

dotenv.config();

async function main() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const args = process.argv.slice(2);
    const [irysId, outDir] = args;
    if (!irysId) {
        console.error("Usage: npm run download:file -- <irysId> [outDir]");
        process.exit(1);
    }
    if (!process.env.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY env var is required");
    }

    const payload = await retrieveFromIrys(irysId);
    const fileName = payload.fileName || `${irysId}.bin`;
    const contentType = payload.contentType || "application/octet-stream";

    const bytes = await downloadAndDecryptFileBytesById(irysId, { walletPrivateKey: process.env.PRIVATE_KEY });
    const targetDir = outDir ? (path.isAbsolute(outDir) ? outDir : path.resolve(process.cwd(), outDir)) : process.cwd();
    const targetPath = path.join(targetDir, fileName);

    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetPath, Buffer.from(bytes));

    console.log("Wrote:", targetPath);
    console.log("Content-Type:", contentType);
    await shutdownLit();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
