// Post-export fix-up: Next's static export writes RSC prefetch payloads as
// `__next.<segment>/__PAGE__.txt`, but the client requests the flattened name
// `__next.<segment>.__PAGE__.txt`. Copy each nested payload to the flattened
// path so client-side navigation works on any static file host.
import { copyFileSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = "out";
let copied = 0;

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("__next.")) {
      flatten(dir, full, entry.name);
    }
    walk(full);
  }
}

function flatten(parent, dir, prefix) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      flatten(parent, full, `${prefix}.${entry.name}`);
    } else {
      copyFileSync(full, join(parent, `${prefix}.${entry.name}`));
      copied++;
    }
  }
}

walk(ROOT);
console.log(`postexport: flattened ${copied} RSC payload file(s)`);
