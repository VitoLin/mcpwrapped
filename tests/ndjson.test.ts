import { parseNdjsonChunk } from "../src/lib/ndjson";

describe("parseNdjsonChunk", () => {
  test("parses JSON lines and returns parsed msg", () => {
    const { buffer, records } = parseNdjsonChunk("", '{"a":1}\n');
    expect(buffer).toBe("");
    expect(records).toHaveLength(1);
    expect(records[0].line).toBe('{"a":1}');
    expect(records[0].msg).toEqual({ a: 1 });
  });

  test("returns msg undefined for non-JSON line", () => {
    const { buffer, records } = parseNdjsonChunk("", "hello\n");
    expect(buffer).toBe("");
    expect(records).toHaveLength(1);
    expect(records[0].line).toBe("hello");
    expect(records[0].msg).toBeUndefined();
  });

  test("handles blank lines (msg should be undefined)", () => {
    const { buffer, records } = parseNdjsonChunk("", "\n");
    expect(buffer).toBe("");
    expect(records).toHaveLength(1);
    expect(records[0].line).toBe("");
    expect(records[0].msg).toBeUndefined();
  });

  test("keeps incomplete tail in buffer when chunk doesn't end with newline", () => {
    const { buffer, records } = parseNdjsonChunk("", '{"a":1}\n{"b":2}');
    // only the first complete line should be parsed
    expect(records).toHaveLength(1);
    expect(records[0].line).toBe('{"a":1}');
    expect(records[0].msg).toEqual({ a: 1 });
    // the second JSON is incomplete (no trailing newline) and should be preserved in buffer
    expect(buffer).toBe('{"b":2}');
  });

  test("combines existing buffer with chunk to form a complete JSON line", () => {
    // simulate a JSON object split across two chunks
    const initial = '{"a":';
    const { buffer, records } = parseNdjsonChunk(initial, "1}\n");
    expect(records).toHaveLength(1);
    expect(records[0].line).toBe('{"a":1}');
    expect(records[0].msg).toEqual({ a: 1 });
    expect(buffer).toBe("");
  });

  test("mixed lines: JSON, non-JSON, blank, and incomplete tail", () => {
    const chunk = '{"x":10}\nnot-json\n\n{"y":20}\npartial-start';
    const { buffer, records } = parseNdjsonChunk("", chunk);
    // records should contain 4 entries (last 'partial-start' is kept in buffer)
    expect(records).toHaveLength(4);
    expect(records[0].msg).toEqual({ x: 10 });
    expect(records[1].msg).toBeUndefined();
    expect(records[1].line).toBe("not-json");
    expect(records[2].line).toBe("");
    expect(records[2].msg).toBeUndefined();
    expect(records[3].msg).toEqual({ y: 20 });
    expect(buffer).toBe("partial-start");
  });
});
