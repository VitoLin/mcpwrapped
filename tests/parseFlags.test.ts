import { parseFlags } from "../src/lib/parseFlags";

describe("parseFlags", () => {
  test("extracts known flags and filters them out of args", () => {
    const known = { foo: "", bar: "default" };
    const args = [
      "--foo=1",
      "positional",
      "--baz=3",
      "--bar=override",
      "--keep",
    ];
    const { flags, filteredArgs } = parseFlags(args, known);

    // returned flags updated
    expect(flags.foo).toBe("1");
    expect(flags.bar).toBe("override");

    // unknown flag (--baz=3) and non-flag items remain
    expect(filteredArgs).toEqual(["positional", "--baz=3", "--keep"]);

    // original known object should not be mutated
    expect(known).toEqual({ foo: "", bar: "default" });
  });

  test("returns clone of knownFlags when args empty", () => {
    const known = { a: "1" };
    const { flags, filteredArgs } = parseFlags([], known);

    expect(filteredArgs).toEqual([]);
    // flags should equal known but be a different object
    expect(flags).toEqual(known);
    expect(flags).not.toBe(known);
  });

  test("preserves unknown flags that include '=' in filteredArgs", () => {
    const known = { x: "" };
    const args = ["--unknown=val", "--x=42"];
    const { flags, filteredArgs } = parseFlags(args, known);

    expect(flags.x).toBe("42");
    expect(filteredArgs).toEqual(["--unknown=val"]);
  });

  test("values may contain additional '=' characters", () => {
    const known = { opt: "" };
    const args = ["--opt=a=b=c"];
    const { flags, filteredArgs } = parseFlags(args, known);

    expect(flags.opt).toBe("a=b=c");
    expect(filteredArgs).toEqual([]);
  });

  test("arguments without '=' or not starting with '--' are left untouched", () => {
    const known = { flag: "" };
    const args = ["--flag", "-s=1", "normal", "--flag=ok"];
    const { flags, filteredArgs } = parseFlags(args, known);

    // only the --flag=ok form should be consumed
    expect(flags.flag).toBe("ok");
    expect(filteredArgs).toEqual(["--flag", "-s=1", "normal"]);
  });
});
