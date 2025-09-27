import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { encryptUint8Array, decryptToUint8Array } from "@lit-protocol/encryption";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { LitAccessControlConditionResource, createSiweMessageWithRecaps, generateAuthSig, ResourceAbilityRequestBuilder } from "@lit-protocol/auth-helpers";
import type { SessionSigsMap, LitResourceAbilityRequest } from "@lit-protocol/types";

export interface AccessControlCondition {
    contractAddress: string;
    standardContractType: string;
    chain: string;
    method: string;
    parameters: string[];
    returnValueTest: { comparator: string; value: string; };
}

export interface EncryptedPayload {
    cipherText: string;
    dataToEncryptHash: string;
    accessControlConditions: AccessControlCondition[];
    fileName?: string | undefined;
    contentType?: string | undefined;
}

let litClientSingleton: LitNodeClient | null = null;

async function getLitNodeClient(): Promise<LitNodeClient> {
    if (litClientSingleton) return litClientSingleton;
    const client = new LitNodeClient({ litNetwork: LIT_NETWORK.DatilDev });
    await client.connect();
    litClientSingleton = client;
    return client;
}

// Intentionally removed wallet/session dependency for encryption-only flow.

export async function encryptFileWithLit(file: File, acc: AccessControlCondition[]) {
    console.log("🔐 Starting file encryption with Lit Protocol");
    console.log("📄 File details:", {
        name: file.name,
        size: file.size,
        type: file.type
    });
    console.log("🔑 Access Control Conditions:", acc);

    const litClient = await getLitNodeClient();
    console.log("✅ Lit client connected successfully");

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    console.log("📊 File converted to bytes:", fileBytes.length, "bytes");

    const { ciphertext, dataToEncryptHash } = await encryptUint8Array({
        accessControlConditions: acc,
        dataToEncrypt: fileBytes,
    }, litClient);

    console.log("🔒 File encrypted successfully!");
    console.log("📝 Encryption details:", {
        ciphertextLength: ciphertext.length,
        dataToEncryptHash: dataToEncryptHash,
    });

    return { ciphertext, dataToEncryptHash };
}

// Irys upload functionality removed - now using IPFS via existing API endpoint

export function accForSingleAddress(address: string): AccessControlCondition[] {
    return [
        {
            contractAddress: "",
            standardContractType: "",
            chain: "ethereum",
            method: "",
            parameters: [":userAddress"],
            returnValueTest: { comparator: "=", value: address },
        },
    ];
}

export async function shutdownLit(): Promise<void> {
    if (!litClientSingleton) return;
    try {
        // Disconnect is optional in browser client
        await (litClientSingleton as unknown as { disconnect?: () => Promise<void>; }).disconnect?.();
    } catch {
        // no-op
    }
    litClientSingleton = null;
}


// ============== Decryption Helpers ==============

async function getSessionSigsWithSigner(
    walletAddress: string,
    signMessageFn: (message: string) => Promise<string>,
    resourceId?: string
): Promise<SessionSigsMap> {
    console.log("🚀 ~ getSessionSigsWithSigner ~ resourceId:", resourceId);
    const litClient = await getLitNodeClient();

    const builder = new ResourceAbilityRequestBuilder();
    const reqBuilder = builder.addAccessControlConditionDecryptionRequest(resourceId || "*");
    const requests: LitResourceAbilityRequest[] = reqBuilder.build();

    // LitNodeClient type doesn't expose getSessionSigs in our local types; cast to unknown then to the minimal shape
    const clientWithSessions = litClient as unknown as {
        getSessionSigs: (args: {
            chain: string;
            resourceAbilityRequests: LitResourceAbilityRequest[];
            authNeededCallback: (params: {
                uri: string;
                expiration: string;
                resourceAbilityRequests: LitResourceAbilityRequest[];
                nonce: string;
            }) => Promise<import("@lit-protocol/types").AuthSig>;
        }) => Promise<SessionSigsMap>;
    };

    const sessionSigs: SessionSigsMap = await clientWithSessions.getSessionSigs({
        chain: "ethereum",
        resourceAbilityRequests: requests,
        authNeededCallback: async (params: { uri: string; expiration: string; resourceAbilityRequests: LitResourceAbilityRequest[]; nonce: string; }) => {
            const { uri, expiration, resourceAbilityRequests, nonce } = params;
            if (!uri || !expiration || !resourceAbilityRequests) {
                throw new Error("Missing SIWE params for Lit session");
            }

            const toSign = await createSiweMessageWithRecaps({
                uri,
                expiration,
                resources: resourceAbilityRequests,
                walletAddress,
                nonce,
                litNodeClient: litClient,
            });

            const signer = {
                async getAddress() { return walletAddress; },
                async signMessage(message: string | Uint8Array) {
                    const msg = typeof message === "string" ? message : new TextDecoder().decode(message);
                    console.log("ℹ️ signMessage using address:", walletAddress);
                    return await signMessageFn(msg);
                },
            } as unknown as import("ethers").Signer;

            const authSig = await generateAuthSig({ signer, toSign });
            return authSig;
        },
    }).catch(async (e: unknown) => {
        console.error("❌ getSessionSigs failed:", e);
        throw e;
    });

    console.log("🚀 ~ getSessionSigsWithSigner ~ sessionSigs:", sessionSigs);
    return sessionSigs;
}

export async function decryptPayloadWithLit(
    payload: EncryptedPayload,
    walletAddress: string,
    signMessageFn: (message: string) => Promise<string>
): Promise<Uint8Array> {
    console.log("🚀 ~ decryptPayloadWithLit ~ walletAddress:", walletAddress);
    const litClient = await getLitNodeClient();
    const resourceString = await LitAccessControlConditionResource.generateResourceString(
        payload.accessControlConditions as unknown as import("@lit-protocol/types").AccessControlConditions,
        payload.dataToEncryptHash
    );
    console.log("🚀 ~ decryptPayloadWithLit ~ resourceString:", resourceString);
    const sessionSigs = await getSessionSigsWithSigner(walletAddress, signMessageFn, resourceString);
    console.log("🚀 ~ decryptPayloadWithLit ~ sessionSigs:", sessionSigs);

    const decrypted = await decryptToUint8Array({
        accessControlConditions: payload.accessControlConditions,
        ciphertext: payload.cipherText,
        dataToEncryptHash: payload.dataToEncryptHash,
        chain: "ethereum",
        sessionSigs,
    }, litClient).catch((e: unknown) => {
        console.error("❌ decryptToUint8Array failed:", e);
        throw e;
    });
    console.log("🚀 ~ decryptPayloadWithLit ~ decrypted:", decrypted);

    return decrypted;
}

export async function decryptFromCid(
    cid: string,
    walletAddress: string,
    signMessageFn: (message: string) => Promise<string>
): Promise<{ bytes: Uint8Array; fileName?: string; contentType?: string; }> {
    const gatewayUrl = `https://ipfs.io/ipfs/${cid}`;
    const res = await fetch(gatewayUrl).catch((e: unknown) => {
        console.error("❌ Fetch IPFS JSON failed:", e);
        throw e;
    });
    console.log("🚀 ~ decryptFromCid ~ res:", res);
    if (!res.ok) {
        throw new Error(`Failed to fetch encrypted payload from IPFS: ${res.status} ${res.statusText}`);
    }
    const payload = await res.json() as EncryptedPayload;
    console.log("🚀 ~ decryptFromCid ~ payload:", payload);
    const bytes = await decryptPayloadWithLit(payload, walletAddress, signMessageFn);
    console.log("🚀 ~ decryptFromCid ~ bytes:", bytes);
    return { bytes, fileName: payload.fileName, contentType: payload.contentType };
}


