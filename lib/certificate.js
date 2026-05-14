import path from 'path';
import sharp from 'sharp';

const CERT_PATH = path.join(process.cwd(), 'Cert-Original.jpg');

// Image is 1594 x 1230 px
const W = 1594;
const H = 1230;

export async function generateCertificate({ name, hours, date }) {
  const hoursText = hours === 0 ? '0' : Number.isInteger(hours) ? `${hours}` : `${hours}`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="${W / 2}" y="637" text-anchor="middle"
        font-family="Noto Serif, DejaVu Serif, serif"
        font-size="46" font-style="italic" fill="#1a1a6e">${escapeXml(name)}</text>
      <text x="618" y="763" text-anchor="middle"
        font-family="Noto Serif, DejaVu Serif, serif"
        font-size="30" font-weight="bold" fill="#1a1a2e">${escapeXml(hoursText)}</text>
      <text x="1080" y="1054" text-anchor="middle"
        font-family="Noto Serif, DejaVu Serif, serif"
        font-size="26" fill="#1a1a2e">${escapeXml(date)}</text>
    </svg>`;

  return sharp(CERT_PATH)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
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
