import { PinataSDK, UploadResponse } from "@pinata/sdk";

class IPFSService {
  private pinata: PinataSDK | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializePinata();
  }

  private initializePinata(): void {
    const jwt = process.env.PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjYWJiNDY4NC00N2U5LTRmN2ItYThiNi1kZWRjZTIyZmEwZjkiLCJlbWFpbCI6InNhaWFkaXRoeWFrYW5jaGFybGFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjVmZWNlODA5ZjM1MDE4ZjFhOWU0Iiwic2NvcGVkS2V5U2VjcmV0IjoiMWNhN2Y4ZjAyNmZhYzczMGQwYmVjMTZmNzQ0MDBhYTM5YzY4M2E2OGFlYTViMjQ2NDEzMDM2MzNmNDhhZGJkNSIsImV4cCI6MTc4OTE5MzAzOX0.NFw9EA5NVwV5Uaq5Isv2bQ4JMNKXHvs9nvzTGmv47eY';
    const pinataGateway = process.env.PINATA_GATEWAY || 'olive-efficient-platypus-311.mypinata.cloud'

    if (!jwt || !pinataGateway) {
      console.warn('Pinata credentials not found. IPFS uploads will be disabled.');
      this.isConfigured = false;
      return;
    }

    try {
      this.pinata = new PinataSDK({
        pinataJwt: jwt,
        pinataGateway: pinataGateway,
      });
      this.isConfigured = true;
      console.log('Pinata IPFS service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Pinata:', error);
      this.isConfigured = false;
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<UploadResponse> {
    if (!this.isConfigured || !this.pinata) {
      throw new Error('Pinata IPFS service is not configured. Please set PINATA_JWT and PINATA_GATEWAY environment variables.');
    }

    try {
      // Create a File object from the buffer
      const file = new File([fileBuffer], fileName, { 
        type: 'application/octet-stream' 
      });
      
      const result = await this.pinata.upload.public.file(file);
      return result;
    } catch (error) {
      console.error('Error uploading file to Pinata IPFS:', error);
      throw new Error('Failed to upload file to IPFS via Pinata');
    }
  }

  async getFile(cid: string): Promise<Buffer> {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error retrieving file from IPFS:', error);
      throw new Error('Failed to retrieve file from IPFS');
    }
  }

  getGatewayUrl(cid: string): string {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.pinata) {
      return false;
    }

    try {
      await this.pinata.testAuthentication();
      return true;
    } catch (error) {
      console.error('Pinata connection test failed:', error);
      return false;
    }
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

export default new IPFSService();
