# Usage

install with

```
npm install -g mcpwrapped
```

```
npx @modelcontextprotocol/inspector --config ./test.json
```

`test.json` for wrapped PythonMCP server:

```
{
  "mcpServers": {
    "wrapped": {
      "command": "mcpwrapped",
      "args": [
        "python", # command
        "-m",
        "args", # args for mcp server
      ],
      "env": {
        "PYTHONPATH": "<python-path>"
      }
    }
  }
}

```

## Custom Flags (e.g., visible_tools)

To pass a custom flag like `--visible_tools` to your wrapped command, add it to the `args` array in your `test.json`:

```json
"args": [
  "<path-to-workspace>/mcpwrapped/build/mcp-proxy.js",
  "python",
  "-m",
  "args",
  "--visible_tools=foo,bar"
]
```
