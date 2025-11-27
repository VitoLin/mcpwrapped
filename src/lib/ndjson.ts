export interface NdjsonRecord {
  line: string;
  msg?: any; // parsed JSON object when present, undefined when non-JSON or blank
}

export function parseNdjsonChunk(
  buffer: string,
  chunk: Buffer | string,
): { buffer: string; records: NdjsonRecord[] } {
  buffer += chunk.toString();

  // Split into lines (NDJSON)
  const parts = buffer.split(/\r?\n/);
  buffer = parts.pop() ?? ""; // keep last incomplete line

  const records: NdjsonRecord[] = parts.map((line) => {
    if (!line.trim()) {
      return { line, msg: undefined };
    }
    try {
      return { line, msg: JSON.parse(line) };
    } catch {
      // Non-JSON lines are returned with msg === undefined so the caller can pass them through
      return { line, msg: undefined };
    }
  });

  return { buffer, records };
}
