"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFlags = parseFlags;
// Extracts and filters known flags from an argument array.
// Returns an object: { flags, filteredArgs }
function parseFlags(args, knownFlags) {
    const flags = Object.assign({}, knownFlags);
    const filteredArgs = args.filter((arg) => {
        if (arg.startsWith("--") && arg.includes("=")) {
            const [flag, value] = arg.slice(2).split("=", 2);
            if (flag in flags) {
                flags[flag] = value;
                return false;
            }
        }
        return true;
    });
    return { flags, filteredArgs };
}
