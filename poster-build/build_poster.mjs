import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "C:/Users/Lyuwen Yan/Documents/TEDxAuburnHills";
const BUILD = path.join(ROOT, "poster-build");
const SOURCE = path.join(BUILD, "template-starter.pptx");
const FINAL = path.join(ROOT, "TEDxAuburnHills Poster.pptx");

const RED = "#EB0028";
const RED_DEEP = "#B0001E";
const RED_DARK = "#650013";
const PAPER = "#F3EBEB";
const RED_PALE = "#FFF0EE";
const WHITE = "#FFFFFF";
const INK = "#171717";
const MUTED = "#646060";
const DISPLAY = "Inter";
const BODY = "EB Garamond";

async function readBytes(filePath) {
  const bytes = await fs.readFile(filePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function writeBlob(filePath, blob) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

const deck = await PresentationFile.importPptx(await FileBlob.load(SOURCE));
const slide = deck.slides.items[0];
const byId = new Map(slide.shapes.items.map((item) => [String(item.toProto().id), item]));

function shape(id) {
  const found = byId.get(String(id));
  if (!found) throw new Error(`Missing inherited shape id ${id}`);
  return found;
}

function setFill(id, fill, line = undefined) {
  const item = shape(id);
  item.fill = fill;
  if (line !== undefined) item.line = line;
  return item;
}

function setPosition(id, position) {
  shape(id).position = position;
  return shape(id);
}

function setText(id, text, style = {}) {
  const item = shape(id);
  item.text = text;
  item.text.style = {
    typeface: DISPLAY,
    color: INK,
    bold: false,
    alignment: "left",
    verticalAlignment: "middle",
    autoFit: "shrinkText",
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    ...style,
  };
  return item;
}

function clearShape(id) {
  const item = shape(id);
  item.fill = "none";
  item.line = { style: "solid", fill: "none", width: 0 };
  if (item.text) item.text = "";
}

function setBulletText(id, items, style = {}) {
  const item = shape(id);
  item.text.set(items.map((entry) => ({
    bulletCharacter: "•",
    marginLeft: 27,
    indent: -17,
    spaceAfter: 15,
    runs: Array.isArray(entry) ? entry : [entry],
  })));
  item.text.style = {
    typeface: BODY,
    fontSize: 34,
    color: INK,
    bold: false,
    alignment: "left",
    verticalAlignment: "top",
    autoFit: "shrinkText",
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    ...style,
  };
}

async function setImageFill(id, filePath, contentType, srcRect = undefined, alphaModFix = undefined) {
  const temp = slide.images.add({
    blob: await readBytes(filePath),
    contentType,
    alt: "Embedded source for inherited image frame",
    position: { left: 0, top: 0, width: 32, height: 32 },
  });
  shape(id).fill = {
    type: "image",
    imageReference: { id: temp.imageReferenceId },
    ...(srcRect ? { srcRect } : {}),
    ...(alphaModFix !== undefined ? { alphaModFix } : {}),
    stretchFillRect: { l: 0, t: 0, r: 0, b: 0 },
  };
  temp.delete();
}

// Website photography and top-right artwork retained inside the template's two primary image fields.
await setImageFill(4, path.join(ROOT, "website/assets/images/flow-background.jpg"), "image/jpeg", { l: 0, t: 28000, r: 0, b: 28000 });
await setImageFill(2, path.join(ROOT, "website/assets/images/rochester-hills-spencer-park.jpg"), "image/jpeg", { l: 12000, t: 0, r: 26000, b: 0 }, 19000);
const photoFrame = shape(2);
photoFrame.position = { left: 0, top: 656.5, width: 2246.83, height: 2309.09 };
photoFrame.data.shape.fill.pictureEffects = [{ type: 1, alphaModFix: 19000 }];

// A long fade joins the black masthead to the generated website artwork.
setPosition(6, { left: 0, top: 0, width: 1510, height: 656.5 });
setFill(6, "linear(90deg, #171717 0%, #171717 70%, #171717/96 80%, #171717/58 92%, #171717/0 100%)", { style: "solid", fill: "none", width: 0 });
setFill(8, "linear(90deg, #EB0028 0%, #EB0028 48%, #B0001E 100%)", { style: "solid", fill: "none", width: 0 });

// Masthead.
setFill(10, RED_DARK, { style: "solid", fill: "none", width: 0 });
setFill(12, RED, { style: "solid", fill: "none", width: 0 });
setText(13, "FREE PUBLIC EVENT", { fontSize: 32, bold: true, color: WHITE, alignment: "center", letterSpacing: 1.2 });
setFill(15, "none", { style: "solid", fill: "none", width: 0 });
setText(16, "Retooling", { fontSize: 154, bold: true, color: WHITE, verticalAlignment: "middle", letterSpacing: -2.5 });
setFill(18, "none", { style: "solid", fill: "none", width: 0 });
setText(19, "TEDxAuburnHills  •  OCTOBER 10, 2026", { fontSize: 34, bold: true, color: RED, letterSpacing: 0.4 });

// Date and time use the website's glass-panel language instead of a floating white label.
setPosition(21, { left: 1430, top: 455, width: 690, height: 154 });
setFill(21, "linear(90deg, #650013 0%, #EB0028 100%)", { style: "solid", fill: "none", width: 0 });
shape(21).shadow = "shadow-md";
setPosition(23, { left: 1418, top: 443, width: 690, height: 154 });
setFill(23, "linear(135deg, #FFFFFF/97 0%, #FFF0EE/93 100%)", { style: "solid", fill: "#FFFFFF/70", width: 1.5 });
setPosition(24, { left: 1448, top: 456, width: 630, height: 128 });
const dateBox = shape(24);
dateBox.text.set([
  [{ run: "SATURDAY  ·  OCT 10  ·  2026", textStyle: { typeface: DISPLAY, fontSize: "39px", bold: true, color: RED_DEEP } }],
  [{ run: "11:00 a.m.–3:00 p.m.  ·  Eastern", textStyle: { typeface: BODY, fontSize: "31px", color: INK } }],
]);
dateBox.text.style = {
  alignment: "center",
  verticalAlignment: "middle",
  autoFit: "shrinkText",
  insets: { top: 5, right: 6, bottom: 5, left: 6 },
};

const tagline = shape(148);
tagline.text.set([
  [{ run: "Same hands, different tools.", textStyle: { typeface: BODY, fontSize: "59px", bold: true, color: WHITE } }],
  [{ run: "Ideas shaped here.", textStyle: { typeface: DISPLAY, fontSize: "34px", bold: true, color: "#FFFFFF/86" } }],
]);
tagline.text.style = {
  alignment: "left",
  verticalAlignment: "middle",
  autoFit: "shrinkText",
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

// Website wordmark treatment, rendered as editable text.
setPosition(139, { left: 1570, top: 35, width: 640, height: 128 });
setFill(139, "linear(135deg, #FFFFFF/96 0%, #FFF0EE/88 100%)", { style: "solid", fill: "#FFFFFF/72", width: 1 });
shape(139).shadow = "shadow-sm";
clearShape(141);
const logo = shape(140);
logo.position = { left: 1582, top: 31, width: 616, height: 132 };
logo.text.set([
  {
    runs: [
      { run: "TEDx", textStyle: { typeface: DISPLAY, fontSize: "48px", bold: true, color: RED } },
      { run: "AuburnHills", textStyle: { typeface: DISPLAY, fontSize: "43px", color: INK } },
    ],
    spaceAfter: 4,
  },
  {
    runs: [
      { run: "x = independently organized TED event", textStyle: { typeface: DISPLAY, fontSize: "15px", color: MUTED } },
    ],
  },
]);
logo.text.style = {
  alignment: "center",
  verticalAlignment: "middle",
  autoFit: "shrinkText",
  insets: { top: 8, right: 12, bottom: 8, left: 12 },
};

// Shared section styling.
for (const id of [27, 59, 88, 101, 108, 124]) setFill(id, RED, { style: "solid", fill: "none", width: 0 });
for (const id of [32, 64, 83, 106, 113, 122]) setFill(id, "#EB0028/24", { style: "solid", fill: "none", width: 0 });
for (const id of [29, 61, 85, 103, 110, 119]) setFill(id, "none", { style: "solid", fill: "none", width: 0 });

// Upper information row: compact event details on the left and theme context on the right.
for (const [id, position] of [
  [108, { left: 83.08, top: 710.99, width: 14.14, height: 59.42 }],
  [110, { left: 119.86, top: 702.5, width: 712.9, height: 82.06 }],
  [111, { left: 119.86, top: 701.75, width: 712.9, height: 82.81 }],
  [113, { left: 119.86, top: 778.91, width: 712.9, height: 4.24 }],
]) setPosition(id, position);
setText(111, "What to expect", { fontSize: 54, bold: true, color: RED_DEEP, letterSpacing: -0.8 });
setPosition(147, { left: 83.08, top: 812, width: 350, height: 270 });
setPosition(145, { left: 458, top: 812, width: 374.76, height: 270 });
setBulletText(147, [
  "Eight live talks",
  "Live performances",
  "100 in-person guests",
  "Intermission refreshments",
], { fontSize: 28, color: INK, verticalAlignment: "top" });
setBulletText(145, [
  "Live captions",
  "Free livestream",
  "Community networking",
  "Two speakers still to come",
], { fontSize: 28, color: INK, verticalAlignment: "top" });

setText(104, "About the theme", { fontSize: 54, bold: true, color: RED_DEEP, letterSpacing: -0.8 });
setText(
  146,
  "Retooling begins with a simple recognition: the people doing the work may remain the same even when the methods around them must change. Tools can be physical, technical, social, or cultural. Join voices across disciplines to ask what deserves to be kept, what needs to be rebuilt, and what communities can create next.",
  { typeface: BODY, fontSize: 35, color: INK, verticalAlignment: "top" },
);

// Speaker feature panel. The former timeline surface becomes the dark field behind the portrait grid.
setPosition(59, { left: 877.31, top: 1123.52, width: 14.14, height: 59.42 });
setPosition(61, { left: 914.1, top: 1115.03, width: 1287.54, height: 82.06 });
setPosition(62, { left: 914.1, top: 1114.29, width: 1287.54, height: 82.81 });
setPosition(64, { left: 914.1, top: 1191.44, width: 1287.54, height: 4.24 });
setText(62, "Meet the speakers", { fontSize: 56, bold: true, color: RED_DEEP, letterSpacing: -1 });
setPosition(34, { left: 877.31, top: 1215, width: 1297.61, height: 950 });
setFill(34, "linear(145deg, #171717/98 0%, #252222/97 58%, #650013/96 100%)", { style: "solid", fill: "#EB0028/30", width: 2 });
shape(34).shadow = "shadow-lg";

const speakers = [
  [65, 66, "Kefei Duan, DDS", "Dentistry, trust, and\ncompassionate care.", "kefei-duan-official.jpg", 0, 0],
  [67, 68, "Janilla Lee, PhD", "Health advocacy, engineering,\nand community service.", "janilla-lee-official.jpg", 1, 0],
  [69, 70, "Shelly Propson Lennon", "Inclusive art, disability,\nand community possibility.", "shelly-propson-lennon-official.jpg", 0, 1],
  [71, 72, "Amartya Sen, PhD", "Cybersecurity, secure systems,\nand connected devices.", "amartya-sen-official.jpg", 1, 1],
  [73, 74, "Ahmad Tafti, PhD", "Explainable artificial intelligence\nand health decisions.", "ahmad-tafti-official.jpg", 0, 2],
  [75, 76, "Kaiqi Zhao, PhD", "Efficient AI, model compression,\nand edge computing.", "kaiqi-zhao-official.jpg", 1, 2],
];
const speakerImageX = [918, 1564];
const speakerTextX = [1114, 1760];
const speakerTextWidth = [400, 375];
const speakerRowY = [1255, 1550, 1845];
for (const [nameId, descId, name, desc, filename, col, row] of speakers) {
  const y = speakerRowY[row];
  setPosition(nameId, { left: speakerTextX[col], top: y + 10, width: speakerTextWidth[col], height: 80 });
  setPosition(descId, { left: speakerTextX[col], top: y + 92, width: speakerTextWidth[col], height: 135 });
  setText(nameId, name, { fontSize: 34, bold: true, color: WHITE, verticalAlignment: "bottom", letterSpacing: -0.4 });
  setText(descId, desc, { typeface: BODY, fontSize: 28, color: PAPER, verticalAlignment: "top" });
  slide.images.add({
    blob: await readBytes(path.join(ROOT, "website/assets/images", filename)),
    contentType: "image/jpeg",
    alt: `${name}, announced TEDxAuburnHills speaker`,
    fit: "cover",
    geometry: "roundRect",
    borderRadius: "rounded-2xl",
    position: { left: speakerImageX[col], top: y, width: 172, height: 242 },
  });
}

// Event timeline, opened up on the paper field with generous vertical spacing.
setPosition(27, { left: 83.08, top: 1123.52, width: 14.14, height: 59.42 });
setPosition(29, { left: 119.86, top: 1115.03, width: 625.38, height: 82.06 });
setPosition(30, { left: 119.86, top: 1114.29, width: 625.38, height: 82.81 });
setPosition(32, { left: 119.86, top: 1191.44, width: 625.38, height: 4.24 });
setText(30, "Event timeline", { fontSize: 54, bold: true, color: RED_DEEP, letterSpacing: -0.8 });
setPosition(36, { left: 147.15, top: 1274, width: 6.41, height: 744 });
setFill(36, RED, { style: "solid", fill: "none", width: 0 });
const timeline = [
  [38, 47, 48, "10:45 a.m.", "Check-in begins"],
  [40, 49, 50, "11:00 a.m.", "Welcome and performance"],
  [42, 51, 52, "11:10 a.m.", "Speaker session one"],
  [44, 53, 54, "1:00 p.m.", "Speaker session two"],
  [46, 55, 56, "2:10 p.m.", "Community networking and photos"],
];
const timelineY = [1248, 1412, 1576, 1740, 1904];
for (let i = 0; i < timeline.length; i += 1) {
  const [dotId, timeId, labelId, time, label] = timeline[i];
  const y = timelineY[i];
  setPosition(dotId, { left: 124.73, top: y + 13, width: 51.26, height: 45.28 });
  setFill(dotId, WHITE, { style: "solid", fill: RED, width: 4 });
  setPosition(timeId, { left: 204.82, top: y, width: 570.27, height: 52 });
  setPosition(labelId, { left: 204.82, top: y + 55, width: 570.27, height: 64 });
  setText(timeId, time, { fontSize: 34, bold: true, color: RED, verticalAlignment: "bottom" });
  setText(labelId, label, { typeface: BODY, fontSize: 32, color: INK, verticalAlignment: "top" });
}

// QR panel. The two supplied codes use the template's inherited image frames.
setFill(80, "linear(145deg, #171717 0%, #252222 58%, #650013 100%)", { style: "solid", fill: "#EB0028/28", width: 2 });
shape(80).shadow = "shadow-md";
setFill(81, "none", { style: "solid", fill: "none", width: 0 });
setFill(83, RED, { style: "solid", fill: "none", width: 0 });
setFill(85, "none", { style: "solid", fill: "none", width: 0 });
setText(86, "Scan to join", { fontSize: 56, bold: true, color: WHITE, letterSpacing: -0.8 });
setFill(90, "none", { style: "solid", fill: "none", width: 0 });
setFill(93, "none", { style: "solid", fill: "none", width: 0 });
setText(91, "EVENT\nWEBSITE", { fontSize: 36, bold: true, color: WHITE, alignment: "center" });
setText(94, "FREE\nREGISTRATION", { fontSize: 34, bold: true, color: WHITE, alignment: "center" });
for (const id of [142, 143, 144]) clearShape(id);
await setImageFill(142, path.join(ROOT, "httpslyudongyan.github.ioTEDxAuburnHills QR CODE.png"), "image/png");
await setImageFill(143, path.join(ROOT, "httpswww.signupgenius.comgo10C0444AAAA2FA1FDC25-64827609-attendee QR CODE.png"), "image/png");

// Attendance callout.
setText(120, "Attend in person", { fontSize: 56, bold: true, color: RED_DEEP, letterSpacing: -1 });
setFill(126, "linear(145deg, #FFF0EE/96 0%, #F3EBEB/92 72%, #FFFFFF/88 100%)", { style: "solid", fill: "#EB0028/22", width: 2 });
shape(126).shadow = "shadow-sm";
setFill(128, RED, { style: "solid", fill: "none", width: 0 });
setFill(115, RED_DARK, { style: "solid", fill: "none", width: 0 });
setFill(130, "none", { style: "solid", fill: "none", width: 0 });
setFill(133, "none", { style: "solid", fill: "none", width: 0 });
setText(131, "FREE\nADMISSION", { fontSize: 37, bold: true, color: WHITE, alignment: "center" });
const seats = shape(134);
seats.position = { left: 905.61, top: 2512, width: 299.95, height: 200 };
seats.text.set([
  [{ run: "100", textStyle: { typeface: DISPLAY, fontSize: "82px", bold: true, color: WHITE } }],
  [{ run: "SEATS", textStyle: { typeface: DISPLAY, fontSize: "34px", bold: true, color: WHITE } }],
]);
seats.text.style = {
  alignment: "center",
  verticalAlignment: "middle",
  autoFit: "shrinkText",
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};
setText(116, "", { fontSize: 1, color: WHITE, alignment: "center" });
setBulletText(135, [
  [{ run: "Admission:", textStyle: { typeface: DISPLAY, bold: true } }, " free, registration required"],
  [{ run: "Capacity:", textStyle: { typeface: DISPLAY, bold: true } }, " up to 100 in-person guests"],
  [{ run: "Check-in:", textStyle: { typeface: DISPLAY, bold: true } }, " 10:45 a.m."],
  [{ run: "Venue:", textStyle: { typeface: DISPLAY, bold: true } }, " location to be announced"],
  [{ run: "Food and drinks:", textStyle: { typeface: DISPLAY, bold: true } }, " available for purchase"],
  [{ run: "Access:", textStyle: { typeface: DISPLAY, bold: true } }, " live captions and free livestream"],
], { fontSize: 32, verticalAlignment: "top" });
setText(136, "", { fontSize: 1, color: INK });

// Keep the banner boundary and leave the footer blank, as requested.
setFill(78, RED, { style: "solid", fill: "none", width: 0 });
for (const id of [96, 97, 98, 99]) clearShape(id);
setText(150, "", { fontSize: 1, color: WHITE });
setText(151, "", { fontSize: 1, color: WHITE });

slide.speakerNotes.textFrame.setText(
  "[Sources]\n" +
  "- Template: C:/Users/Lyuwen Yan/Documents/TEDxAuburnHills/Example Poster.pptx\n" +
  "- Event theme, date, time, speakers, and public-event details: website/index.html, website/about.html, website/attend.html, website/schedule.html\n" +
  "- Website typography, palette, and wordmark treatment: website/static/css/index.css and website/static/js/index.js\n" +
  "- Body photo: website/assets/images/rochester-hills-spencer-park.jpg\n" +
  "- Speaker portraits: website/assets/images/*-official.jpg (six announced speakers)\n" +
  "- Top-right artwork: website/assets/images/flow-background.jpg\n" +
  "- QR codes: user-supplied PNG files in the workspace root\n" +
  "[/Sources]",
);

await fs.mkdir(path.join(BUILD, "final-render"), { recursive: true });
await writeBlob(path.join(BUILD, "final-render", "slide-01.png"), await deck.export({ slide, format: "png", scale: 1 }));
await fs.writeFile(path.join(BUILD, "final-render", "slide-01.layout.json"), await (await slide.export({ format: "layout" })).text());
await writeBlob(path.join(BUILD, "final-render", "montage.webp"), await deck.export({ format: "webp", montage: true, scale: 1 }));

const inspect = await deck.inspect({
  kind: "slide,textbox,shape,image,notes,layout",
  maxChars: 200000,
});
await fs.writeFile(path.join(BUILD, "final-render", "final-inspect.ndjson"), inspect.ndjson ?? "", "utf8");

const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(FINAL);
console.log(FINAL);
