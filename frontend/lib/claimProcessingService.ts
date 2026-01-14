/**
 * Background claim processing service
 * Continues polling even when user navigates away from the page
 */

import { API_ENDPOINTS } from "./config";

const STORAGE_KEY = "active_claim_processing";
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 75; // 5 minutes at 4s intervals (75 * 4 = 300 seconds = 5 minutes)

interface ActiveClaim {
  claimId: string;
  token: string;
  startTime: number;
  attempt: number;
}

interface ClaimProcessingCallbacks {
  onStageUpdate?: (stage: string | null) => void;
  onComplete?: (verdict: any) => void;
  onError?: (error: string) => void;
  onAgentsUpdate?: (agents: any[]) => void;
}

class ClaimProcessingService {
  private activePolling: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Map<string, ClaimProcessingCallbacks> = new Map();

  async startPolling(
    claimId: string,
    token: string,
    callbacks: ClaimProcessingCallbacks
  ): Promise<void> {
    // Stop any existing polling for this claim
    this.stopPolling(claimId);

    // Store in localStorage
    const activeClaim: ActiveClaim = {
      claimId,
      token,
      startTime: Date.now(),
      attempt: 0,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeClaim));

    // Store callbacks
    this.callbacks.set(claimId, callbacks);

    // Start polling
    await this.poll(claimId, token, 0);
  }

  private async poll(
    claimId: string,
    token: string,
    attempt: number
  ): Promise<void> {
    if (attempt >= MAX_POLL_ATTEMPTS) {
      const callbacks = this.callbacks.get(claimId);
      callbacks?.onError?.("Analysis timed out after 5 minutes. Please try again.");
      this.stopPolling(claimId);
      return;
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.CLAIMS.VERDICT(claimId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch verdict");
      }

      const data = await response.json();

      const callbacks = this.callbacks.get(claimId);
      if (!callbacks) {
        this.stopPolling(claimId);
        return;
      }

      if (data.status === "processing") {
        callbacks.onStageUpdate?.(data.processing_stage ?? "Processing...");
        
        // Update localStorage
        const activeClaim: ActiveClaim = {
          claimId,
          token,
          startTime: Date.now(),
          attempt: attempt + 1,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeClaim));

        // Schedule next poll
        const timeoutId = setTimeout(() => {
          this.poll(claimId, token, attempt + 1);
        }, POLL_INTERVAL_MS);
        this.activePolling.set(claimId, timeoutId);
        return;
      }

      if (data.status === "completed") {
        callbacks.onStageUpdate?.(null);
        callbacks.onComplete?.(data);
        
        // Fetch agents
        try {
          const agentsResponse = await fetch(
            API_ENDPOINTS.CLAIMS.AGENTS(claimId),
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (agentsResponse.ok) {
            const agentsData = await agentsResponse.json();
            callbacks.onAgentsUpdate?.(agentsData.agents || []);
          }
        } catch (err) {
          console.error("Failed to fetch agents:", err);
        }

        this.stopPolling(claimId);
        return;
      }

      if (data.status === "failed") {
        callbacks.onStageUpdate?.(data.processing_stage ?? "Failed");
        callbacks.onError?.(data.error?.message || "Analysis failed. Try again.");
        this.stopPolling(claimId);
        return;
      }

      // Unknown status, continue polling
      const timeoutId = setTimeout(() => {
        this.poll(claimId, token, attempt + 1);
      }, POLL_INTERVAL_MS);
      this.activePolling.set(claimId, timeoutId);
    } catch (error) {
      const callbacks = this.callbacks.get(claimId);
      callbacks?.onError?.(error instanceof Error ? error.message : "Polling error");
      this.stopPolling(claimId);
    }
  }

  stopPolling(claimId: string): void {
    const timeoutId = this.activePolling.get(claimId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activePolling.delete(claimId);
    }
    this.callbacks.delete(claimId);
    
    // Clear from localStorage if this is the active claim
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const activeClaim: ActiveClaim = JSON.parse(stored);
        if (activeClaim.claimId === claimId) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error("Failed to clear localStorage:", err);
    }
  }

  getActiveClaim(): ActiveClaim | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  resumePolling(callbacks: ClaimProcessingCallbacks): void {
    const activeClaim = this.getActiveClaim();
    if (!activeClaim) return;

    // Resume from where we left off
    this.callbacks.set(activeClaim.claimId, callbacks);
    this.poll(activeClaim.claimId, activeClaim.token, activeClaim.attempt);
  }
}

export const claimProcessingService = new ClaimProcessingService();

