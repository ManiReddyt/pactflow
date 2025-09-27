import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { encryptUint8Array } from "@lit-protocol/encryption";
import { LIT_ABILITY, LIT_NETWORK } from "@lit-protocol/constants";
import { LitAccessControlConditionResource, createSiweMessageWithRecaps, generateAuthSig } from "@lit-protocol/auth-helpers";
import type { SessionSigsMap } from "@lit-protocol/types";
import type { LitResourceAbilityRequest } from "@lit-protocol/types";
import { Uploader } from "@irys/upload";
import { Ethereum } from "@irys/upload-ethereum";
import type { WalletClient } from "viem";

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

const IRYS_GATEWAY = "https://gateway.irys.xyz/" as const;

let litClientSingleton: LitJsSdk.LitNodeClient | null = null;

async function getLitNodeClient(): Promise<LitJsSdk.LitNodeClient> {
    if (litClientSingleton) return litClientSingleton;
    const client = new LitJsSdk.LitNodeClient({ litNetwork: LIT_NETWORK.DatilDev });
    await client.connect();
    litClientSingleton = client;
    return client;
}

async function getSessionSigsWithWalletClient(litNodeClient: LitJsSdk.LitNodeClient, walletClient: WalletClient): Promise<SessionSigsMap> {
    const account = walletClient.account;
    if (!account) throw new Error("Wallet account not found");

    const latestBlockhash = await litNodeClient.getLatestBlockhash();
    const walletAddress = account.address;

    const authNeededCallback = async (params: import("@lit-protocol/types").AuthCallbackParams) => {
        if (!params.uri || !params.expiration || !params.resourceAbilityRequests) {
            throw new Error("Missing SIWE params");
        }

        const toSign = await createSiweMessageWithRecaps({
            uri: params.uri,
            expiration: params.expiration!,
            resources: params.resourceAbilityRequests,
            walletAddress,
            nonce: latestBlockhash,
            litNodeClient,
        });

        const signer: { getAddress: () => Promise<string>; signMessage: (message: string | Uint8Array) => Promise<string>; } = {
            async getAddress() { return walletAddress; },
            async signMessage(message) {
                const msg = typeof message === "string" ? message : new TextDecoder().decode(message);
                const signature = await walletClient.signMessage({ account, message: msg });
                return signature as string;
            }
        };

        const authSig = await generateAuthSig({ signer: signer as unknown as import("ethers").Signer, toSign });

        return authSig;
    };

    const requests: LitResourceAbilityRequest[] = [
        { resource: new LitAccessControlConditionResource("*"), ability: LIT_ABILITY.AccessControlConditionDecryption },
    ];
    const sessionSigs: SessionSigsMap = await litNodeClient.getSessionSigs({
        chain: "ethereum",
        resourceAbilityRequests: requests,
        authNeededCallback,
    });

    return sessionSigs;
}

export async function encryptFileWithLit(file: File, acc: AccessControlCondition[], walletClient: WalletClient) {
    const litClient = await getLitNodeClient();
    console.log("🚀 ~ encryptFileWithLit ~ litClient:", litClient);
    await getSessionSigsWithWalletClient(litClient, walletClient);

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const { ciphertext, dataToEncryptHash } = await encryptUint8Array({
        accessControlConditions: acc,
        dataToEncrypt: fileBytes,
    }, litClient);

    return { ciphertext, dataToEncryptHash };
}

type IrysUploader = { upload: (data: string, opts: { tags: { name: string; value: string; }[]; }) => Promise<{ id: string; } | undefined>; };
type IrysBuilder = (t: unknown) => { withWallet: (w: unknown) => Promise<IrysUploader>; };

async function getIrysUploaderWithWallet(walletClient: WalletClient): Promise<IrysUploader> {
    // @irys/upload currently expects a wallet-like signer. For browser, we pass a wrapper that exposes signMessage and getAddress.
    const account = walletClient.account;
    if (!account) throw new Error("Wallet account not found");
    const signer: { getAddress: () => Promise<string>; signMessage: (message: string) => Promise<string>; } = {
        getAddress: async () => account.address,
        signMessage: async (message: string) => walletClient.signMessage({ account, message }) as unknown as string,
    };
    const uploaderBuilder = (Uploader as unknown as IrysBuilder)(Ethereum);
    const uploader = await uploaderBuilder.withWallet(signer as unknown);
    return uploader;
}

export async function uploadEncryptedToIrys(
    payload: EncryptedPayload,
    walletClient: WalletClient
): Promise<{ id: string; url: string; }> {
    const uploader = await getIrysUploaderWithWallet(walletClient);
    const tags = [
        { name: "Content-Type", value: "application/json" },
        ...(payload.fileName ? [{ name: "X-File-Name", value: payload.fileName }] : []),
        ...(payload.contentType ? [{ name: "X-Content-Type", value: payload.contentType }] : []),
    ];
    const receipt = await uploader.upload(JSON.stringify(payload), { tags });
    const id = receipt?.id || "";
    return { id, url: `${IRYS_GATEWAY}${id}` };
}

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
