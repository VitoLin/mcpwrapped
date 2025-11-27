import { PassThrough } from "stream";
import { EventEmitter } from "events";

describe("mcpwrapped (CLI wrapper)", () => {
  const originalArgv = process.argv.slice();

  //
  // Build a realistic fake child_process.spawn result.
  //
  function makeFakeChild() {
    const child = new EventEmitter() as any;

    child.stdout = new PassThrough();
    child.stdin = new PassThrough();

    // Prevent backing up stdio forever
    child.stdin.write = jest.fn();

    // Emit exit/close after stdout ends
    child.stdout.on("end", () => {
      if (!child.__closed) {
        child.__closed = true;
        child.emit("exit", 0);
        child.emit("close", 0);
      }
    });

    // Allow manual termination
    child.kill = () => {
      child.stdout.end();
      child.stdin.end();
      if (!child.__closed) {
        child.__closed = true;
        child.emit("exit", 0);
        child.emit("close", 0);
      }
    };

    return child;
  }

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
    jest.resetModules();
    process.argv = originalArgv.slice();
  });

  test("exits with usage when no real command provided", () => {
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(((
      code?: number,
    ) => {
      throw new Error("exited:" + (code ?? 0));
    }) as any);

    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { run } = require("../src/mcpwrapped");
    expect(() => {
      run([], new PassThrough(), new PassThrough());
    }).toThrow("exited:1");

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errSpy).toHaveBeenCalledWith(
      "Usage: mcpwrapped --visible_tools=a,b realCmd realArgs...",
    );
  });

  test("forwards non-JSON stdout lines unchanged", async () => {
    const cp = require("child_process");
    const child = makeFakeChild();

    jest.spyOn(cp, "spawn").mockImplementation(() => child);

    const { run } = require("../src/mcpwrapped");
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const stdoutWrite = jest.fn();
    stdout.write = stdoutWrite;

    run(["--visible_tools=", "cmd"], stdin, stdout);

    // Trigger message + child exit
    child.stdout.end("hello\n");

    // allow event loop to flush
    await new Promise((resolve) => setImmediate(resolve));

    expect(stdoutWrite).toHaveBeenCalledWith("hello\n");
  });

  test("filters capabilities.tools according to --visible_tools", async () => {
    const cp = require("child_process");
    const child = makeFakeChild();
    jest.spyOn(cp, "spawn").mockImplementation(() => child);

    const { run } = require("../src/mcpwrapped");
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const stdoutWrite = jest.fn();
    stdout.write = stdoutWrite;

    run(["--visible_tools=a", "cmd"], stdin, stdout);

    const msg = {
      result: {
        capabilities: {
          tools: {
            a: { description: "allowed" },
            b: { description: "blocked" },
          },
        },
      },
    };

    child.stdout.end(JSON.stringify(msg) + "\n");

    await new Promise((resolve) => setImmediate(resolve));

    expect(stdoutWrite).toHaveBeenCalledTimes(1);
    const raw = stdoutWrite.mock.calls[0][0];
    const str =
      typeof raw === "string" ? raw : Buffer.from(raw as Uint8Array).toString();
    const parsed = JSON.parse(str);
    expect(parsed.result.capabilities.tools).toHaveProperty("a");
    expect(parsed.result.capabilities.tools).not.toHaveProperty("b");
  });

  test("filters legacy msg.result.tools[] by name", async () => {
    const cp = require("child_process");
    const child = makeFakeChild();
    jest.spyOn(cp, "spawn").mockImplementation(() => child);

    const { run } = require("../src/mcpwrapped");
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const stdoutWrite = jest.fn();
    stdout.write = stdoutWrite;

    run(["--visible_tools=a", "cmd"], stdin, stdout);

    const msg = {
      result: {
        tools: [
          { name: "a", info: 1 },
          { name: "b", info: 2 },
        ],
      },
    };

    child.stdout.end(JSON.stringify(msg) + "\n");

    await new Promise((resolve) => setImmediate(resolve));

    expect(stdoutWrite).toHaveBeenCalledTimes(1);

    const raw = stdoutWrite.mock.calls[0][0];
    const str =
      typeof raw === "string" ? raw : Buffer.from(raw as Uint8Array).toString();
    const parsed = JSON.parse(str);
    expect(parsed.result.tools).toHaveLength(1);
    expect(parsed.result.tools[0].name).toBe("a");
  });
});
