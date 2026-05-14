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
      <!-- Name: centered below "This Certificate is Presented to" -->
      <text x="${W / 2}" y="692" text-anchor="middle"
        font-family="DejaVu Serif, Liberation Serif, serif"
        font-size="46" font-style="italic" fill="#1a1a6e">${escapeXml(name)}</text>
      <!-- Hours: replaces the blank in "In recognition of ___ hours" -->
      <text x="618" y="763" text-anchor="middle"
        font-family="DejaVu Serif, Liberation Serif, serif"
        font-size="30" font-weight="bold" fill="#1a1a2e">${escapeXml(hoursText)}</text>
      <!-- Date: above the DATE label bottom right -->
      <text x="1155" y="1054" text-anchor="middle"
        font-family="DejaVu Serif, Liberation Serif, serif"
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
