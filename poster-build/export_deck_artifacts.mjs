import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const [input, outputDir] = process.argv.slice(2);
if (!input || !outputDir) throw new Error("Usage: node export_deck_artifacts.mjs <input.pptx> <output-dir>");

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

await fs.mkdir(outputDir, { recursive: true });
const deck = await PresentationFile.importPptx(await FileBlob.load(input));
for (let index = 0; index < deck.slides.items.length; index += 1) {
  const slide = deck.slides.items[index];
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  await writeBlob(path.join(outputDir, `${stem}.png`), await deck.export({ slide, format: "png", scale: 1 }));
  await fs.writeFile(path.join(outputDir, `${stem}.layout.json`), await (await slide.export({ format: "layout" })).text());
}
const inspect = await deck.inspect({ kind: "slide,textbox,shape,image,notes,layout", maxChars: 200000 });
await fs.writeFile(path.join(outputDir, "inspect.ndjson"), inspect.ndjson ?? "", "utf8");
