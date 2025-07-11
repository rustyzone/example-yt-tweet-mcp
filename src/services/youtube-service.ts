import axios from "axios";

export interface TranscriptSegment {
  text: string;
  duration: number;
  offset: number;
  lang: string;
}

export interface TranscriptResponse {
  lang: string;
  availableLangs: string[];
  content: TranscriptSegment[];
}

export class YouTubeService {
  private apiKey: string;
  private baseUrl = "https://api.supadata.ai/v1/youtube";

  constructor() {
    this.apiKey = process.env.SUPADATA_API_KEY || "";
    if (!this.apiKey) {
      console.warn("⚠️ SUPADATA_API_KEY not found in environment variables");
    }
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  extractVideoId(url: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    throw new Error("Invalid YouTube URL or video ID");
  }

  /**
   * Fetch transcript for a YouTube video
   */
  async getTranscript(videoId: string): Promise<TranscriptResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/transcript`, {
        params: { videoId },
        headers: {
          "x-api-key": this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to fetch transcript: ${
            error.response?.data?.message || error.message
          }`
        );
      }
      throw error;
    }
  }

  /**
   * Convert transcript to readable text
   */
  transcriptToText(transcript: TranscriptResponse): string {
    return transcript.content
      .map((segment) => segment.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
}
