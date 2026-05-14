import nodePath from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { parse } from 'opentype.js';

const CERT_PATH = nodePath.join(process.cwd(), 'Cert-Original.jpg');
const FONT_PATH = nodePath.join(process.cwd(), 'cert-font.ttf');

// Image is 1594 x 1230 px
const W = 1594;
const H = 1230;

let otFont = null;
function getFont() {
  if (!otFont) {
    const buf = fs.readFileSync(FONT_PATH);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    otFont = parse(ab);
  }
  return otFont;
}

function makeTextOverlay(text, centerX, baselineY, fontSize, fillColor) {
  const font = getFont();
  const advWidth = font.getAdvanceWidth(text, fontSize);
  const startX = centerX - advWidth / 2;
  const pathObj = font.getPath(text, startX, baselineY, fontSize);
  pathObj.fill = fillColor;
  const pathSvg = pathObj.toSVG(2);
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${pathSvg}</svg>`);
}

export async function generateCertificate({ name, hours, date }) {
  const hoursText = String(Number.isInteger(hours) ? hours : hours);

  return sharp(CERT_PATH)
    .composite([
      { input: makeTextOverlay(name, W / 2, 637, 46, '#1a1a6e'), top: 0, left: 0 },
      { input: makeTextOverlay(hoursText, 618, 763, 30, '#1a1a2e'), top: 0, left: 0 },
      { input: makeTextOverlay(date, 1080, 1054, 26, '#1a1a2e'), top: 0, left: 0 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}
