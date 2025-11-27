# mcpwrapped

![coverage](https://github.com/VitoLin/mcpwrapped/blob/main/coverage/badges.svg)
![npm](https://img.shields.io/npm/v/mcpwrapped?style=flat-square)
![downloads](https://img.shields.io/npm/dt/mcpwrapped?style=flat-square)

A lightweight MCP (Model Context Protocol) proxy that sits between an MCP client and server. It allows you to filter available tools, preventing context window clutter by only exposing the tools you explicitly want to use.

## Features

- **Tool Filtering**: Whitelist specific tools using the `--visible_tools` flag.
- **Transparent Proxy**: Forwards all other MCP protocol messages (resources, prompts, etc.) unchanged.
- **Easy Integration**: Works with any MCP client that supports command-based server configuration.

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

### Example: Using with MCP Inspector

If you are using the `@modelcontextprotocol/inspector` to test a server, you can configure it to use `mcpwrapped`.

1. Create a config file (e.g., `inspector-config.json`):

```json
{
  "mcpServers": {
    "my-wrapped-server": {
      "command": "mcpwrapped",
      "args": [
        "--visible_tools=calculate_sum,get_weather",
        "python",
        "-m",
        "my_mcp_server"
      ],
      "env": {
        "PYTHONPATH": "."
      }
    }
  }
}
```

2. Run the inspector:

```bash
npx @modelcontextprotocol/inspector --config ./inspector-config.json
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

| Flag              | Description                                                                                                                                                   | Example                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `--visible_tools` | Comma-separated list of tool names to expose. If omitted, all tools are hidden (or behavior depends on implementation, currently filters if flag is present). | `--visible_tools=read_file,search` |
