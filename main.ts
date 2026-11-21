// gta6-clipper-01 entry for @boskong
// Hands in the YouTube address: reads VIDEO.json from the bot
// directory as raw text, sanity-checks its url field, then writes
// the original bytes unchanged into the output directory.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";

function fail(message: string): never {
  console.error(`gta6-clipper: ${message}`);
  exit(1);
}

async function run(): Promise<void> {
  const botDir: string = process.env.MAKEFUN_BOT_DIR ?? "/bot";
  const outputDir: string = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

  const sourcePath: string = join(botDir, "VIDEO.json");
  const targetPath: string = join(outputDir, "VIDEO.json");

  let rawText: string;
  try {
    rawText = await readFile(sourcePath, "utf8");
  } catch {
    fail(`could not read VIDEO.json from ${sourcePath}`);
  }

  let parsed: { url?: unknown };
  try {
    parsed = JSON.parse(rawText) as { url?: unknown };
  } catch {
    fail("VIDEO.json is not valid JSON");
  }

  if (!("url" in parsed) || parsed.url === undefined) {
    fail('VIDEO.json is missing its "url" field — add {"url": "https://..."}');
  }
  if (typeof parsed.url !== "string" || parsed.url.trim().length === 0) {
    fail('VIDEO.json "url" must be a non-empty string');
  }
  if (!parsed.url.startsWith("https://")) {
    fail(`VIDEO.json "url" should be an https link, got: ${parsed.url}`);
  }

  try {
    await mkdir(outputDir, { recursive: true });
    // Preserve the source file exactly as authored, byte for byte.
    await writeFile(targetPath, rawText, "utf8");
  } catch {
    fail(`could not write VIDEO.json to ${targetPath}`);
  }

  console.log(`copied VIDEO.json -> ${targetPath}`);
}

run().catch((err: unknown) => {
  const detail: string = err instanceof Error ? err.message : String(err);
  fail(detail);
});
