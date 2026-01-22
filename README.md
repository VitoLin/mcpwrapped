# mcpwrapped

[![coverage](https://github.com/VitoLin/mcpwrapped/blob/main/coverage/badges.svg)](https://www.npmjs.com/package/mcpwrapped)
[![npm](https://img.shields.io/npm/v/mcpwrapped?style=flat-square)](https://www.npmjs.com/package/mcpwrapped)
[![downloads](https://img.shields.io/npm/dt/mcpwrapped?style=flat-square)](https://www.npmjs.com/package/mcpwrapped)

[mcpwrapped](https://github.com/VitoLin/mcpwrapped) is a lightweight MCP (Model Context Protocol) proxy that sits between an MCP client and server. It allows you to filter available tools, preventing context window clutter by only exposing the tools you explicitly want to use.

## Features

- **Tool Filtering**: Whitelist specific tools using the `--visible_tools` flag
- **Transparent Proxy**: Forwards all other MCP protocol messages (resources, prompts, etc.) unchanged
- **Easy Integration**: Works with any MCP client that supports command-based server configuration

## Installation

```bash
npm install -g mcpwrapped
```

## Usage

`mcpwrapped` wraps your existing MCP server command. You pass the filtering flags first, followed by the actual command to run the server.

### Basic Syntax

```bash
mcpwrapped --visible_tools=tool1,tool2 <actual_command> [actual_args...]
```

### Example: Claude Desktop Configuration

To use it with Claude Desktop, update your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "mcpwrapped",
      "args": [
        "--visible_tools=read_file",
        "npx",
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/username/Desktop"
      ]
    }
  }
}
```

In this example, only the `read_file` tool from the filesystem server would be visible to Claude, hiding `write_file`, `list_directory`, etc.

## Configuration Flags

| Flag                                     | Description                                  | Example                                             |
| ---------------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| <code>&#8209;&#8209;visible_tools</code> | Comma-separated list of tool names to expose | <code>&#8209;&#8209;visible_tools=read,write</code> |

## How It Works

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│ MCP Client  │ ◀──────▶│  mcpwrapped  │ ◀──────▶│ MCP Server  │
│ (Claude)    │         │  (Proxy)     │         │             │
│             │         │              │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              └── Filters tool_list to only include
                                  tools specified in --visible_tools
```

`mcpwrapped` acts as a transparent proxy that:

1. Spawns the actual MCP server with the provided command
2. Intercepts messages from the server
3. Filters the `tools` list in initialization messages to only include allowed tools
4. Passes through all other messages unchanged (resources, prompts, tool calls, etc.)

## License

MIT License - see [LICENSE](./LICENSE) for details.
