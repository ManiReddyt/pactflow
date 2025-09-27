import { promises as fs } from "fs";
import * as path from "path";
import {
    encryptString as litEncryptString,
    decryptToString as litDecryptToString,
    encryptUint8Array as litEncryptUint8Array,
    decryptToUint8Array as litDecryptToUint8Array,
} from "@lit-protocol/encryption";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";
import { Uploader } from "@irys/upload";
import { Ethereum } from "@irys/upload-ethereum";
import { LitAccessControlConditionResource, createSiweMessageWithRecaps, generateAuthSig } from "@lit-protocol/auth-helpers";
import type { SessionSigsMap } from "@lit-protocol/types";
import { LIT_ABILITY } from "@lit-protocol/constants";

// ---------- Types ----------
export interface AccessControlCondition {
    contractAddress: string;
    standardContractType: string;
    chain: string; // e.g. "ethereum"
    method: string;
    parameters: string[];
    returnValueTest: {
        comparator: string; // e.g. "="
        value: string; // e.g. wallet address
    };
}

export interface EncryptedPayload {
    cipherText: string;
    dataToEncryptHash: string;
    accessControlConditions: AccessControlCondition[];
    fileName?: string | undefined;
    contentType?: string | undefined;
}

// ---------- Constants ----------
const LIT_NETWORK = "datil-dev" as const;
const DEFAULT_CHAIN = "ethereum" as const;
const IRYS_GATEWAY = "https://gateway.irys.xyz/" as const;

// ---------- Internal singletons ----------
let litClientSingleton: LitNodeClient | null = null;

async function getLitNodeClient(): Promise<LitNodeClient> {
    if (litClientSingleton) return litClientSingleton;
    const client = new LitNodeClient({ litNetwork: LIT_NETWORK });
    await client.connect();
    litClientSingleton = client;
    return client;
}

function requirePrivateKey(override?: string): string {
    const rawIn = override || process.env.PRIVATE_KEY;
    if (!rawIn) throw new Error("Missing PRIVATE_KEY in environment or function argument");
    const raw = rawIn.trim().replace(/^['"]|['"]$/g, "");
    if (/^0x[0-9a-fA-F]{64}$/.test(raw)) return raw;
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return `0x${raw}`;
    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length >= 12 && words.length <= 24) {
        try {
            const walletFromMnemonic = ethers.Wallet.fromMnemonic(raw);
            return walletFromMnemonic.privateKey;
        } catch { }
    }
    throw new Error(
        "PRIVATE_KEY must be a 64-hex string (with or without 0x) or a valid BIP39 mnemonic."
    );
}

// ---------- Session signatures (Node, SIWE) ----------
async function getSessionSigs(litNodeClient: LitNodeClient, walletPrivateKey?: string): Promise<SessionSigsMap> {
    const privateKey = requirePrivateKey(walletPrivateKey);
    const wallet = new ethers.Wallet(privateKey);
    const walletAddress = await wallet.getAddress();

    const sessionSigs = await litNodeClient.getSessionSigs({
        chain: DEFAULT_CHAIN,
        resourceAbilityRequests: [
            {
                resource: new LitAccessControlConditionResource("*"),
                ability: LIT_ABILITY.AccessControlConditionDecryption,
            },
        ],
        authNeededCallback: async (params: any) => {
            const toSign = await createSiweMessageWithRecaps({
                uri: params.uri,
                expiration: params.expiration,
                resources: params.resourceAbilityRequests,
                walletAddress,
                nonce: await litNodeClient.getLatestBlockhash(),
                litNodeClient,
            });
            return await generateAuthSig({ signer: wallet, toSign });
        },
    });

    return sessionSigs;
}

// ---------- Encryption ----------
export async function encryptStringWithLit(
    data: string,
    accessControlConditions: AccessControlCondition[],
    opts?: { walletPrivateKey?: string; }
): Promise<{ ciphertext: string; dataToEncryptHash: string; }> {
    const litNodeClient = await getLitNodeClient();
    const sessionSigs = await getSessionSigs(litNodeClient, opts?.walletPrivateKey);

    const { ciphertext, dataToEncryptHash } = await litEncryptString(
        {
            accessControlConditions,
            dataToEncrypt: data,
        },
        litNodeClient
    );

    return { ciphertext, dataToEncryptHash };
}

export async function encryptFileAtPath(
    filePath: string,
    accessControlConditions: AccessControlCondition[],
    opts?: { walletPrivateKey?: string; encoding?: BufferEncoding; }
): Promise<{ ciphertext: string; dataToEncryptHash: string; }> {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    const fileBytes = await fs.readFile(absolutePath);
    const litNodeClient = await getLitNodeClient();
    await getSessionSigs(litNodeClient, opts?.walletPrivateKey); // establish session (not strictly needed for encryptUint8Array)
    const { ciphertext, dataToEncryptHash } = await litEncryptUint8Array(
        {
            accessControlConditions,
            dataToEncrypt: new Uint8Array(fileBytes.buffer, fileBytes.byteOffset, fileBytes.byteLength),
        },
        litNodeClient
    );
    return { ciphertext, dataToEncryptHash };
}

// ---------- Irys helpers ----------
async function getIrysUploader(walletPrivateKey?: string) {
    const privateKey = requirePrivateKey(walletPrivateKey);
    // The uploader will infer network configuration from the connected wallet
    const uploader = await (Uploader as any)(Ethereum).withWallet(privateKey);
    return uploader;
}

export async function storeOnIrys(
    cipherText: string,
    dataToEncryptHash: string,
    accessControlConditions: AccessControlCondition[],
    opts?: { walletPrivateKey?: string; fileName?: string; contentType?: string; }
): Promise<string> {
    const uploader = await getIrysUploader(opts?.walletPrivateKey);

    const dataToUpload: EncryptedPayload = {
        cipherText,
        dataToEncryptHash,
        accessControlConditions,
        fileName: opts?.fileName,
        contentType: opts?.contentType,
    };

    const tags = [
        { name: "Content-Type", value: "application/json" },
        ...(opts?.fileName ? [{ name: "X-File-Name", value: opts.fileName }] : []),
        ...(opts?.contentType ? [{ name: "X-Content-Type", value: opts.contentType }] : []),
    ];
    const receipt = await uploader.upload(JSON.stringify(dataToUpload), { tags });
    return receipt?.id || "";
}

export function toIrysGatewayUrl(id: string): string {
    return `${IRYS_GATEWAY}${id}`;
}

export async function retrieveFromIrys(id: string): Promise<EncryptedPayload> {
    const url = toIrysGatewayUrl(id);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to retrieve data for ID: ${id}`);
    const data = (await response.json()) as EncryptedPayload;
    return data;
}

// ---------- Decryption ----------
export async function decryptData(
    ciphertext: string,
    dataToEncryptHash: string,
    accessControlConditions: AccessControlCondition[],
    opts?: { walletPrivateKey?: string; }
): Promise<string> {
    const litNodeClient = await getLitNodeClient();
    const sessionSigs = await getSessionSigs(litNodeClient, opts?.walletPrivateKey);

    const decryptedString: string = await litDecryptToString(
        {
            accessControlConditions,
            chain: DEFAULT_CHAIN,
            ciphertext,
            dataToEncryptHash,
            sessionSigs,
        },
        litNodeClient
    );

    return decryptedString;
}

// Return full binary of a previously encrypted file (Uint8Array)
export async function decryptFileBytes(
    ciphertext: string,
    dataToEncryptHash: string,
    accessControlConditions: AccessControlCondition[],
    opts?: { walletPrivateKey?: string; }
): Promise<Uint8Array> {
    const litNodeClient = await getLitNodeClient();
    const sessionSigs = await getSessionSigs(litNodeClient, opts?.walletPrivateKey);
    const bytes = await litDecryptToUint8Array(
        {
            accessControlConditions,
            chain: DEFAULT_CHAIN,
            ciphertext,
            dataToEncryptHash,
            sessionSigs,
        },
        litNodeClient
    );
    return bytes;
}

// ---------- Orchestration convenience helpers ----------
export async function encryptAndUploadString(
    data: string,
    accessControlConditions: AccessControlCondition[],
    opts?: { walletPrivateKey?: string; }
): Promise<{ id: string; url: string; ciphertext: string; dataToEncryptHash: string; }> {
    const { ciphertext, dataToEncryptHash } = await encryptStringWithLit(data, accessControlConditions, opts);
    const id = await storeOnIrys(ciphertext, dataToEncryptHash, accessControlConditions, opts);
    return { id, url: toIrysGatewayUrl(id), ciphertext, dataToEncryptHash };
}

export async function encryptAndUploadFile(
    filePath: string,
    accessControlConditions: AccessControlCondition[],
    opts?: { walletPrivateKey?: string; encoding?: BufferEncoding; }
): Promise<{ id: string; url: string; ciphertext: string; dataToEncryptHash: string; }> {
    const { ciphertext, dataToEncryptHash } = await encryptFileAtPath(filePath, accessControlConditions, opts);
    const fileName = path.basename(filePath);
    // naive content-type guess by extension; callers can override by passing opts.contentType when we add it
    const ext = path.extname(fileName).toLowerCase();
    const defaultType = ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "application/octet-stream";
    const id = await storeOnIrys(ciphertext, dataToEncryptHash, accessControlConditions, { ...opts, fileName, contentType: defaultType });
    return { id, url: toIrysGatewayUrl(id), ciphertext, dataToEncryptHash };
}

export async function downloadAndDecryptById(
    id: string,
    opts?: { walletPrivateKey?: string; }
): Promise<string> {
    const { cipherText, dataToEncryptHash, accessControlConditions } = await retrieveFromIrys(id);
    return decryptData(cipherText, dataToEncryptHash, accessControlConditions, opts);
}

export async function downloadAndDecryptFileBytesById(
    id: string,
    opts?: { walletPrivateKey?: string; }
): Promise<Uint8Array> {
    const { cipherText, dataToEncryptHash, accessControlConditions } = await retrieveFromIrys(id);
    return decryptFileBytes(cipherText, dataToEncryptHash, accessControlConditions, opts);
}

// ---------- Example ACC helper ----------
export function accForSingleAddress(address: string): AccessControlCondition[] {
    return [
        {
            contractAddress: "",
            standardContractType: "",
            chain: DEFAULT_CHAIN,
            method: "",
            parameters: [":userAddress"],
            returnValueTest: { comparator: "=", value: address },
        },
    ];
}

// ---------- Shutdown helper ----------
export async function shutdownLit(): Promise<void> {
    if (litClientSingleton) {
        try {
            await litClientSingleton.disconnect?.();
        } catch { }
        litClientSingleton = null;
    }
}


