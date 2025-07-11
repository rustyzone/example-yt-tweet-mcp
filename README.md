# Example MCP for converting youtube videos into tweets

A Model Context Protocol (MCP) server that transforms YouTube videos into engaging social media content! This system fetches transcripts, generates tweets using Claude AI, and creates content drafts - all through Claude Desktop.

## 🚀 Quick Start

1. **Clone & Install**: `git clone` → `npm install` → `npm run build`
2. **Configure**: Add API keys to `.env` file
3. **Connect**: Add server path to Claude Desktop config
4. **Create**: Use tools in Claude to generate tweets from YouTube videos!

### Services

- **YouTubeService**: Handles video ID extraction and transcript fetching
- **TweetGenerationService**: Creates context and instructions for LLM tweet generation
- **TypefullyService**: Real integration with Typefully API for draft creation

### MCP Tools Available

1. `get_youtube_transcript` - Fetch transcript from YouTube video
2. `generate_tweets_from_transcript` - Generate tweet context from any transcript text
3. `create_typefully_draft` - Create drafts directly in Typefully

## 🔧 Installation & Setup

### Prerequisites

- **Node.js**
- **Claude Desktop** (latest version)
- **Typefully Account** (for draft creation)
- **Supadata API Key** (for YouTube transcript access)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/mcp-youtube-video-to-tweet.git
cd mcp-youtube-video-to-tweet
npm install
```

### 2. Configure Environment Variables

#### Option 1: Using .env file (Recommended)

Create a `.env` file:

```env
SUPADATA_API_KEY=your_supadata_api_key
TYPEFULLY_API_KEY=your_typefully_api_key
```

#### Option 2: Inline in Claude Desktop Config

You can also set environment variables directly in your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "youtube-video-to-tweet": {
      "command": "node",
      "args": ["/path/to/project/dist/mcp-server.js"],
      "env": {
        "SUPADATA_API_KEY": "your_supadata_api_key",
        "TYPEFULLY_API_KEY": "your_typefully_api_key"
      }
    }
  }
}
```

**Benefits of each approach:**

- **`.env` file**: Better for development, keeps secrets out of config files
- **Inline config**: Simpler setup, everything in one place, good for sharing team configs

### 3. Build the Project

```bash
npm run build
```

### 4. Test the Setup

Test the integration:

```bash
# Verify server starts correctly
node dist/mcp-server.js
```

If the server starts without errors and you see no output (this is correct!), it's ready for Claude Desktop.

**⚠️ Important**: After testing, stop the server with `Ctrl+C` (or `Cmd+C` on Mac) before configuring Claude Desktop. Claude Desktop needs to start the server itself.

### 5. Configure Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "youtube-video-to-tweet": {
      "command": "node",
      "args": ["/Users/name/path-to-folder/dist/mcp-server.js"],
      "env": {
        "key": "value"
      }
    }
  }
}
```

**Claude Desktop Config Location:**

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Note**: Replace `/absolute/path/to/mcp-youtube-video-to-tweet/` with your actual project path. The server automatically loads environment variables from your `.env` file.

## 🔍 Troubleshooting

### Common Issues

#### ❌ "Server disconnected" in Claude Desktop

**Solutions:**

1. Check that the path in `claude_desktop_config.json` points to `/dist/mcp-server.js` (not `/build/`)
2. Ensure the absolute path is correct for your system
3. Restart Claude Desktop after making config changes
4. Verify the server builds successfully with `npm run build`

#### ❌ Missing Environment Variables

The server automatically loads from `.env`, but ensure your file contains:

```env
SUPADATA_API_KEY=your_supadata_api_key
TYPEFULLY_API_KEY=your_typefully_api_key
```

## 🙏 Acknowledgments

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Typefully](https://typefully.com/)
- [Supadata](https://supadata.ai/)

---
