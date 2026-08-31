import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const deck = await PresentationFile.importPptx(
  await FileBlob.load("C:/Users/Lyuwen Yan/Documents/TEDxAuburnHills/Example Poster.pptx"),
);

for (const id of [
  "sh/547294r6",
  "sh/7qp4be9c",
  "sh/ts7md4r2",
  "sh/vmdcj2xw",
  "sh/ml0v2xcn",
  "sh/vupgzmpc",
  "sh/wvyh8rqx",
]) {
  const item = deck.resolve(id);
  const out = {
    id,
    ctor: item?.constructor?.name,
    keys: item ? Object.keys(item) : [],
    position: item?.position,
    fill: item?.fill,
    line: item?.line,
    text: item?.text?.toString?.(),
    proto: item?.toProto?.(),
  };
  console.log(JSON.stringify(out, null, 2));
}
