import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { YouTubeService } from "./services/youtube-service.js";
import { TweetGenerationService } from "./services/tweet-generation-service.js";
import { TypefullyService } from "./services/typefully-service.js";
import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables once at startup, suppressing any output
const originalWrite = process.stdout.write;
process.stdout.write = () => true; // Temporarily suppress stdout
try {
  // Try to load .env from the project root (same directory when running from dist)
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
} catch (e) {
  // Ignore any errors
} finally {
  process.stdout.write = originalWrite; // Restore stdout
}

// Initialize services
const youtubeService = new YouTubeService();
const tweetGenerationService = new TweetGenerationService();
const typeFullyService = new TypefullyService();

// Initialize MCP server
const server = new Server({
  name: "youtube-video-to-tweet",
  version: "1.0.0",
});

// Validation schemas
const YouTubeTranscriptSchema = z.object({
  videoUrl: z.string().min(1),
});

const GenerateTweetsSchema = z.object({
  transcript: z.string().min(1),
  prompt: z.string().min(1),
  maxTweets: z.number().min(1).max(10).optional(),
  style: z
    .enum(["conversational", "informative", "engaging", "professional"])
    .optional(),
  format: z.enum(["thread", "single"]).optional(),
});

const SendTweetsSchema = z.object({
  tweets: z.array(
    z.object({
      content: z.string(),
      threadPosition: z.number().optional(),
    })
  ),
});

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_youtube_transcript",
        description:
          "Fetch the transcript from a YouTube video using the video URL or ID",
        inputSchema: {
          type: "object",
          properties: {
            videoUrl: {
              type: "string",
              description: "YouTube video URL or video ID",
            },
          },
          required: ["videoUrl"],
        },
      },

      {
        name: "generate_tweets_from_transcript",
        description:
          "Generate engaging tweets from a transcript using intelligent content analysis",
        inputSchema: {
          type: "object",
          properties: {
            transcript: {
              type: "string",
              description: "The full transcript text to generate tweets from",
            },
            prompt: {
              type: "string",
              description:
                "Custom prompt for tweet generation style and approach",
            },
            maxTweets: {
              type: "number",
              description: "Maximum number of tweets to generate (1-10)",
              minimum: 1,
              maximum: 10,
            },
            style: {
              type: "string",
              enum: [
                "conversational",
                "informative",
                "engaging",
                "professional",
              ],
              description: "Style of tweets to generate",
            },
            format: {
              type: "string",
              enum: ["thread", "single"],
              description:
                "Format: 'thread' for multiple tweets or 'single' for one tweet under 280 chars",
            },
          },
          required: ["transcript", "prompt"],
        },
      },
      {
        name: "create_typefully_draft",
        description: "Create a draft in Typefully for later publishing",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The tweet content or thread to create as a draft",
            },
            threadify: {
              type: "boolean",
              description:
                "Whether to automatically split content into a thread",
              default: false,
            },
            scheduleDate: {
              type: "string",
              description:
                "Optional schedule time in ISO 8601 format or 'next-free-slot'",
            },
            share: {
              type: "boolean",
              description: "Whether to generate a shareable link for the draft",
              default: false,
            },
          },
          required: ["content"],
        },
      },
    ],
  };
});

// Tool handler - YouTube content creation and web search tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_youtube_transcript": {
        const { videoUrl } = YouTubeTranscriptSchema.parse(args);

        // Extract video ID from URL
        const videoId = youtubeService.extractVideoId(videoUrl);

        // Fetch transcript
        const transcript = await youtubeService.getTranscript(videoId);
        const readableText = youtubeService.transcriptToText(transcript);

        return {
          content: [
            {
              type: "text",
              text:
                `🎥 **YouTube Transcript Fetched Successfully!**\n\n` +
                `📺 **Video ID:** ${videoId}\n` +
                `🌍 **Language:** ${transcript.lang}\n` +
                `⏱️ **Total Segments:** ${transcript.content.length}\n\n` +
                `📝 **Full Transcript:**\n\n` +
                `${readableText}\n\n` +
                `💡 **Ready to generate content!** You can now use this transcript to:\n` +
                `• Generate tweets with "generate_tweets_from_transcript"\n` +
                `• Create social media content\n` +
                `• Extract key insights`,
            },
          ],
        };
      }

      case "generate_tweets_from_transcript": {
        const { transcript, prompt, maxTweets, style, format } =
          GenerateTweetsSchema.parse(args);

        // Generate tweet context for LLM
        const context = tweetGenerationService.generateTweetContext(
          transcript,
          prompt,
          {
            maxTweets,
            style,
            format,
            includeCallToAction: true,
            includeEmojis: true,
          }
        );

        const formatDescription =
          format === "single" ? "Single Tweet (280 chars max)" : "Tweet Thread";

        return {
          content: [
            {
              type: "text",
              text:
                `🐦 **Tweet Generation Context Prepared**\n\n` +
                `💭 **User Prompt:** ${prompt}\n` +
                `🎨 **Style:** ${context.style}\n` +
                `📊 **Format:** ${formatDescription}\n` +
                `� **Max Tweets:** ${
                  context.maxTweets || "auto-determined"
                }\n\n` +
                `🤖 **System Instructions:**\n` +
                `${context.systemPrompt}\n\n` +
                `� **Generation Guidelines:**\n` +
                `${context.instructions}\n\n` +
                `✨ **Please create the ${formatDescription.toLowerCase()} based on this context!**`,
            },
          ],
        };
      }
      case "create_typefully_draft": {
        const CreateDraftSchema = z.object({
          content: z.string(),
          threadify: z.boolean().optional(),
          scheduleDate: z.string().optional(),
          share: z.boolean().optional(),
        });

        const { content, threadify, scheduleDate, share } =
          CreateDraftSchema.parse(args);

        try {
          const draft = await typeFullyService.createDraft(content, {
            threadify,
            scheduleDate,
            share,
          });

          return {
            content: [
              {
                type: "text",
                text:
                  `📤 **Typefully Draft Created!**\n\n` +
                  `✅ **Draft ID:** ${draft.id}\n` +
                  `📅 **Created:** ${new Date(
                    draft.created_at
                  ).toLocaleString()}\n` +
                  `📊 **Status:** ${draft.status}\n` +
                  `🧵 **Threadified:** ${threadify ? "Yes" : "No"}\n` +
                  `🔗 **Share URL:** ${draft.share_url || "Not shared"}\n`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `❌ **Error:** ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
              },
            ],
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // Ensure error messages don't contain characters that could break JSON
    const sanitizedError =
      error instanceof Error
        ? error.message.replace(/[\r\n\t]/g, " ").trim()
        : "Unknown error occurred";

    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${sanitizedError}`,
        },
      ],
      isError: true,
    };
  }
});

// Cleanup on exit
// process.on("SIGINT", async () => {
// e.g close browser or perform other cleanup tasks
//   await webSearchService.closeBrowser();
//   process.exit(0);
// });

// process.on("SIGTERM", async () => {
// e.g close browser or perform other cleanup tasks
//   await webSearchService.closeBrowser();
//   process.exit(0);
// });

// Start the MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // MCP servers should run silently on stdio
}

main().catch((error) => {
  // Log errors to stderr only in development
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Failed to start Video to Tweet MCP server:", error);
  }
  process.exit(1);
});
