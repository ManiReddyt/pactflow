// import * as path from "path";
// import { fileURLToPath } from "url";
// import dotenv from "dotenv";
// import { accForSingleAddress, encryptAndUploadFile, downloadAndDecryptById, shutdownLit } from "../fileEncryption.js";

// // Load env from server/.env first, then fallback to repo root .env if needed
// dotenv.config();
// if (!process.env.PRIVATE_KEY) {
//     dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
// }

// async function main() {
//     const recipient = process.env.RECIPIENT_ADDRESS || "0x29FB8276DdA3Fe8a841552CA6BF7518D0Fa9eE25";
//     if (!process.env.PRIVATE_KEY) {
//         throw new Error("PRIVATE_KEY env var is required to run this script");
//     }

//     const __filename = fileURLToPath(import.meta.url);
//     const __dirname = path.dirname(__filename);
//     const rootReadme = path.resolve(process.cwd(), "./tsconfig.json");
//     const acc = accForSingleAddress(recipient);

//     console.log("Encrypting and uploading:", rootReadme);
//     const { id, url } = await encryptAndUploadFile(rootReadme, acc, { walletPrivateKey: process.env.PRIVATE_KEY });
//     console.log("Irys ID:", id);
//     console.log("Gateway URL:", url);

//     console.log("Downloading and attempting to decrypt...");
//     const decrypted = await downloadAndDecryptById(id, { walletPrivateKey: process.env.PRIVATE_KEY });
//     console.log("Decrypted content:\n" + decrypted);
//     await shutdownLit();
// }

// main().catch((err) => {
//     console.error(err);
//     process.exit(1);
// });


