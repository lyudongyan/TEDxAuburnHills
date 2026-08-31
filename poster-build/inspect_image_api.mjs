import fs from "node:fs/promises";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";
const deck = await PresentationFile.importPptx(await FileBlob.load("C:/Users/Lyuwen Yan/Documents/TEDxAuburnHills/poster-build/template-starter.pptx"));
const bytes = await fs.readFile("C:/Users/Lyuwen Yan/Documents/TEDxAuburnHills/website/assets/images/flow-background.jpg");
const image = deck.slides.items[0].images.add({blob:bytes, contentType:"image/jpeg", position:{left:0,top:0,width:100,height:100}});
let p = image;
const levels=[];
while (p) {
  levels.push(Object.getOwnPropertyNames(p));
  p=Object.getPrototypeOf(p);
}
console.log(JSON.stringify({keys:Object.keys(image),levels,proto:image.toProto?.()},null,2));
