import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const CERT_PATH = path.join(process.cwd(), 'Cert-Original.jpg');
const FONT_PATH = path.join(process.cwd(), 'cert-font.ttf');

// Image is 1594 x 1230 px
const W = 1594;
const H = 1230;

let fontBase64 = null;
function getFont() {
  if (!fontBase64) fontBase64 = fs.readFileSync(FONT_PATH).toString('base64');
  return fontBase64;
}

function textSvg(text, x, y, fontSize, fontStyle = 'normal') {
  const font = getFont();
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>@font-face { font-family: 'CF'; src: url('data:font/truetype;base64,${font}'); }</style>
  </defs>
  <text x="${x}" y="${y}" text-anchor="middle" font-family="CF" font-size="${fontSize}" font-style="${fontStyle}" fill="#1a1a2e">${escapeXml(text)}</text>
</svg>`);
}

export async function generateCertificate({ name, hours, date }) {
  const hoursText = String(Number.isInteger(hours) ? hours : hours);

  return sharp(CERT_PATH)
    .composite([
      { input: textSvg(name, W / 2, 637, 46, 'italic'), top: 0, left: 0 },
      { input: textSvg(hoursText, 618, 763, 30), top: 0, left: 0 },
      { input: textSvg(date, 1080, 1054, 26), top: 0, left: 0 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
