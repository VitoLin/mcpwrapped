#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const child_process_1 = require("child_process");
const parseFlags_1 = require("./lib/parseFlags");
const ndjson_1 = require("./lib/ndjson");
function run(args, stdin = process.stdin, stdout = process.stdout) {
    var _a;
    // Extract proxy flags
    const knownFlags = { visible_tools: "" };
    const { flags, filteredArgs } = (0, parseFlags_1.parseFlags)(args, knownFlags);
    const allowedTools = flags.visible_tools;
    const realCommand = filteredArgs[0];
    const realArgs = filteredArgs.slice(1);
    if (!realCommand) {
        console.error("Usage: mcpwrapped --visible_tools=a,b realCmd realArgs...");
        process.exit(1);
    }
    // Start wrapped server
    const child = (0, child_process_1.spawn)(realCommand, realArgs, {
        stdio: ["pipe", "pipe", "inherit"],
        env: process.env,
    });
    if (require.main === module) {
        // When run directly from the CLI, exit the process when the child exits.
        child.on("exit", (code) => process.exit(code !== null && code !== void 0 ? code : 0));
    }
    else {
        // When this module is required (e.g. in tests), do not call process.exit to avoid
        // terminating the hosting process.
        child.on("exit", () => { });
    }
    // RAW FORWARD: client → server
    stdin.on("data", (chunk) => {
        var _a;
        (_a = child.stdin) === null || _a === void 0 ? void 0 : _a.write(chunk);
    });
    // BUFFERING FOR SERVER OUTPUT: server → client
    let buffer = "";
    /**
     * Parse incoming stdout chunks as NDJSON while preserving trailing buffer.
     * parseNdjsonChunk returns the updated buffer and an array of records:
     *   { line, msg } where msg is the parsed JSON object or undefined for non-JSON/blank lines.
     */
    (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on("data", (chunk) => {
        var _a;
        const result = (0, ndjson_1.parseNdjsonChunk)(buffer, chunk);
        buffer = result.buffer;
        for (const { line, msg } of result.records) {
            // Non-JSON or blank lines — pass through unchanged (blank lines are skipped)
            if (msg === undefined) {
                if (line.trim())
                    stdout.write(line + "\n");
                continue;
            }
            // === FILTER TOOL ===
            if (allowedTools && (msg === null || msg === void 0 ? void 0 : msg.result)) {
                const allowed = allowedTools.split(",").map((t) => t.trim());
                if ((_a = msg.result.capabilities) === null || _a === void 0 ? void 0 : _a.tools) {
                    const filtered = {};
                    for (const [name, def] of Object.entries(msg.result.capabilities.tools)) {
                        if (allowed.includes(name)) {
                            filtered[name] = def;
                        }
                    }
                    msg.result.capabilities.tools = filtered;
                }
                // Legacy array form
                if (Array.isArray(msg.result.tools)) {
                    msg.result.tools = msg.result.tools.filter((t) => allowed.includes(t.name));
                }
                stdout.write(JSON.stringify(msg) + "\n");
                continue;
            }
            // Forward everything else
            stdout.write(line + "\n");
        }
    });
    return child;
}
if (require.main === module) {
    run(process.argv.slice(2));
}
