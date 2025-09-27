/**
 * AI Chat Service for Contract Lock Confidential AI Chat API
 * Handles session-scoped confidential AI chat interactions
 */

interface StartSessionResponse {
  session_id: string;
  document_uri: string;
}

interface PollResponse {
  active: boolean;
  has_document: boolean;
}

interface MessageResponse {
  reply: string;
}

interface EndSessionResponse {
  ended: boolean;
}

interface ApiError {
  detail: string;
}

interface MessageRequest {
  session_id: string;
  prompt: string;
}

interface EndSessionRequest {
  session_id: string;
}

class AiChatService {
  private readonly baseUrl = 'https://ai-client.abdulsahil.me'; // --- IGNORE ---

  /**
   * Start a confidential chat session and upload contract
   * @param document - The encrypted contract file as a File or Blob
   * @returns Promise with session details
   */
  async startSession(document: File | Blob): Promise<StartSessionResponse> {
    const formData = new FormData();
    
    // Always ensure we have a proper File object with explicit PDF MIME type
    let file: File;
    if (document instanceof File) {
      // If it's already a File, ensure it has the right MIME type and .pdf extension
      const filename = document.name || 'contract.pdf';
      const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      
      if (document.type !== 'application/pdf') {
        // Create a new File with the correct MIME type
        file = new File([document], pdfFilename, { type: 'application/pdf' });
      } else {
        // Update filename to ensure .pdf extension
        file = new File([document], pdfFilename, { type: 'application/pdf' });
      }
    } else {
      // For Blob, create a File object with explicit MIME type and .pdf extension
      file = new File([document], 'contract.pdf', { type: 'application/pdf' });
    }
    
    // Log for debugging
    console.log('Uploading file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    formData.append('document', file);

    const response = await fetch(`${this.baseUrl}/sessions/start`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || `Failed to start session: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Poll to keep the session alive and check readiness
   * @param sessionId - The session ID to poll
   * @returns Promise with session status
   */
  async pollSession(sessionId: string): Promise<PollResponse> {
    const url = new URL(`${this.baseUrl}/sessions/poll`);
    url.searchParams.append('session_id', sessionId);

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || `Failed to poll session: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Send a prompt to the AI within a session
   * @param sessionId - The session ID
   * @param prompt - The message/prompt to send to the AI
   * @returns Promise with AI reply
   */
  async sendMessage(sessionId: string, prompt: string): Promise<MessageResponse> {
    const messageRequest: MessageRequest = {
      session_id: sessionId,
      prompt,
    };

    const response = await fetch(`${this.baseUrl}/sessions/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageRequest),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      if (response.status === 410) {
        throw new Error('Session is invalid or expired');
      }
      throw new Error(error.detail || `Failed to send message: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * End and purge a session
   * @param sessionId - The session ID to end
   * @returns Promise confirming session termination
   */
  async endSession(sessionId: string): Promise<EndSessionResponse> {
    const endRequest: EndSessionRequest = {
      session_id: sessionId,
    };

    const response = await fetch(`${this.baseUrl}/sessions/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(endRequest),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || `Failed to end session: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Check if the AI chat server is available
   * @returns Promise<boolean> - true if server is reachable
   */
  async isServerAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const aiChatService = new AiChatService();
export default aiChatService;

// Export types for use in components
export type {
  StartSessionResponse,
  PollResponse,
  MessageResponse,
  EndSessionResponse,
  ApiError,
};