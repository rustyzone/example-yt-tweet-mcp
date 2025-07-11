import axios from "axios";

export interface TypefullyDraft {
  content: string;
  threadify?: boolean;
  schedule?: string; // ISO 8601 format
  share?: boolean;
}

export interface TypefullyDraftResponse {
  id: string;
  content: string;
  status: string;
  created_at: string;
  scheduled_at?: string;
  share_url?: string;
}

export class TypefullyService {
  private apiKey: string;
  private baseUrl = "https://api.typefully.com/v1";

  constructor() {
    this.apiKey = process.env.TYPEFULLY_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("TYPEFULLY_API_KEY environment variable is required");
    }
  }

  /**
   * Create a draft in Typefully
   */
  async createDraft(
    content: string,
    options: {
      threadify?: boolean;
      scheduleDate?: string;
      share?: boolean;
      autoRetweetEnabled?: boolean;
      autoPlugEnabled?: boolean;
    } = {}
  ): Promise<TypefullyDraftResponse> {
    try {
      const payload: any = {
        content: content,
      };

      // Add optional parameters only if they're provided
      if (options.threadify !== undefined)
        payload.threadify = options.threadify;
      if (options.share !== undefined) payload.share = options.share;
      if (options.scheduleDate) payload["schedule-date"] = options.scheduleDate;
      if (options.autoRetweetEnabled !== undefined)
        payload.auto_retweet_enabled = options.autoRetweetEnabled;
      if (options.autoPlugEnabled !== undefined)
        payload.auto_plug_enabled = options.autoPlugEnabled;

      const response = await axios.post(`${this.baseUrl}/drafts/`, payload, {
        headers: {
          "X-API-KEY": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Typefully API error: ${error.response?.status} - ${
            error.response?.data?.error || error.message
          }`
        );
      }
      throw error;
    }
  }
}
