export interface TweetGenerationContext {
  transcript: string;
  prompt: string;
  format: "thread" | "single";
  style: "conversational" | "informative" | "engaging" | "professional";
  maxTweets?: number;
  includeEmojis: boolean;
  includeCallToAction: boolean;
  systemPrompt: string;
  instructions: string;
}

export interface TweetDraft {
  content: string;
  threadPosition?: number;
}

export interface TweetGenerationOptions {
  maxTweets?: number;
  includeCallToAction?: boolean;
  style?: "conversational" | "informative" | "engaging" | "professional";
  includeEmojis?: boolean;
  format?: "thread" | "single";
}

export class TweetGenerationService {
  /**
   * Generate context and instructions for LLM to create tweets
   * Returns structured context that the LLM can use to generate actual tweet content
   */
  generateTweetContext(
    transcript: string,
    prompt: string,
    options: TweetGenerationOptions = {}
  ): TweetGenerationContext {
    const {
      maxTweets = 5,
      includeCallToAction = true,
      style = "engaging",
      includeEmojis = true,
      format = "thread",
    } = options;

    // Clean and prepare the transcript
    const cleanTranscript = this.cleanTranscript(transcript);

    // Generate system prompt and instructions for the LLM
    const { systemPrompt, instructions } = this.generatePromptAndInstructions(
      format,
      style,
      maxTweets,
      prompt,
      includeEmojis,
      includeCallToAction
    );

    return {
      transcript: cleanTranscript,
      prompt,
      format,
      style,
      maxTweets: format === "single" ? 1 : maxTweets,
      includeEmojis,
      includeCallToAction,
      systemPrompt,
      instructions,
    };
  }

  /**
   * Generate both system prompt and instructions for the LLM
   */
  private generatePromptAndInstructions(
    format: string,
    style: string,
    maxTweets: number,
    userPrompt: string,
    includeEmojis: boolean,
    includeCallToAction: boolean
  ): { systemPrompt: string; instructions: string } {
    // Generate system prompt
    const basePrompt = `You are an expert social media content creator specializing in creating ${style} tweets that start conversations and drive engagement.`;

    const styleGuidelines = {
      engaging:
        "Create tweets that are exciting, thought-provoking, and designed to spark discussion. Use dynamic language and compelling hooks.",
      professional:
        "Create tweets that are authoritative, informative, and suitable for a business audience. Maintain a polished tone while being accessible.",
      conversational:
        "Create tweets that feel like natural conversation starters. Use casual language and relatable scenarios.",
      informative:
        "Create tweets that focus on educating and sharing valuable insights. Prioritize clarity and usefulness.",
    };

    const formatGuidelines =
      format === "single"
        ? "You will create ONE single tweet that must stay within 280 characters including all text, emojis, and spacing."
        : "You will create a tweet thread. Each tweet in the thread must stay within 280 characters.";

    const emojiGuideline = includeEmojis
      ? "Include relevant emojis to enhance engagement and visual appeal, but use them strategically."
      : "Do not include any emojis in the tweets.";

    const ctaGuideline = includeCallToAction
      ? "Include calls-to-action that encourage replies, engagement, and discussion."
      : "Focus on delivering value without explicit calls-to-action.";

    const systemPrompt = `${basePrompt}

STYLE: ${styleGuidelines[style as keyof typeof styleGuidelines]}

FORMAT: ${formatGuidelines}

EMOJIS: ${emojiGuideline}

ENGAGEMENT: ${ctaGuideline}

IMPORTANT: Every tweet must be under 280 characters. Count characters carefully including spaces and emojis.`;

    // Generate instructions
    const formatInstructions =
      format === "single"
        ? `Create ONE compelling tweet that captures the essence of the content. The tweet must:
- Stay within 280 characters (this is critical)
- Be self-contained and impactful
- Include the most important insight or takeaway
- End with a question or statement that encourages engagement`
        : `Create a tweet thread with ${maxTweets} tweets maximum. The thread should:
- Start with an engaging hook tweet that introduces the topic
- Break down key insights across subsequent tweets
- End with a call-to-action that encourages discussion
- Each tweet must stay within 280 characters
- Use (1/n), (2/n) format to indicate thread position`;

    const instructions = `${userPrompt}

${formatInstructions}

Base your tweets on the provided transcript content. Extract the most valuable insights and present them in a way that will start conversations and provide value to readers.

Remember: Character count is critical. Each tweet MUST be under 280 characters.`;

    return { systemPrompt, instructions };
  }

  /**
   * Clean and normalize transcript text
   */
  private cleanTranscript(transcript: string): string {
    return transcript
      .replace(/\s+/g, " ")
      .replace(/[^\w\s.,!?-]/g, "")
      .trim();
  }
}
