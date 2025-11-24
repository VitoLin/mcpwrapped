#!/usr/bin/env node
import { spawn } from "child_process";
import * as readline from "readline";

import { parseFlags } from "./lib/parseFlags";

// Extract args for our proxy
const args = process.argv.slice(2);

// Extract known flags
const knownFlags = { visible_tools: "" };
const { flags, filteredArgs } = parseFlags(args, knownFlags);
const allowedTools = flags.visible_tools;

// Start the wrapped MCP Server
const realCommand = filteredArgs[0];
const realArgs = filteredArgs.slice(1);

const child = spawnWrappedMCPServer();

console.error(`args: ${args}`);
console.error(`filteredArgs: ${filteredArgs}`);
console.error(`realCommand: ${realCommand}`);
console.error(`visible_tools: ${allowedTools}`);

// Keep stdin the same
const clientIn = readline.createInterface({ input: process.stdin });
clientIn.on("line", (line) => {
  console.error(`Client sent: ${line}`);
  child.stdin.write(line + "\n");
});

// Read from the wrapped server
const serverIn = readline.createInterface({ input: child.stdout });
serverIn.on("line", (line) => {
  console.error(`Server sent: ${line}`);
  const msg = safeParse(line);
  if (!msg) return process.stdout.write(line + "\n");

  // Filter tools if allowedTools is set and response contains a tools array
  if (allowedTools && msg && msg.result && Array.isArray(msg.result.tools)) {
    const allowed = allowedTools.split(",").map((t) => t.trim());
    msg.result.tools = msg.result.tools.filter((tool: any) =>
      allowed.includes(tool.name)
    );
    return process.stdout.write(JSON.stringify(msg) + "\n");
  }

  process.stdout.write(line + "\n");
});

function spawnWrappedMCPServer() {
  if (!realCommand) {
    console.error("Usage: node mcp-proxy.js <real-command> <real-args...>");
    process.exit(1);
  }

  const child = spawn(realCommand, realArgs, {
    stdio: ["pipe", "pipe", "inherit"],
    env: process.env,
  });
  return child;
}

function safeParse(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
