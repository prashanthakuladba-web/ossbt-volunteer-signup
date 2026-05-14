import path from 'path';
import sharp from 'sharp';

const CERT_PATH = path.join(process.cwd(), 'Cert-Original.jpg');

// Image is 1594 x 1230 px
const W = 1594;
const H = 1230;

export async function generateCertificate({ name, hours, date }) {
  const hoursDisplay = Number.isInteger(hours) ? `${hours}` : `${hours}`;

  const svg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .name  { font-family: Georgia, serif; font-size: 46px; font-style: italic; fill: #1a1a6e; }
        .hours { font-family: Georgia, serif; font-size: 30px; font-weight: bold; fill: #1a1a2e; }
        .date  { font-family: Georgia, serif; font-size: 26px; fill: #1a1a2e; }
      </style>
      <!-- Name: centered below "This Certificate is Presented to" -->
      <text x="${W / 2}" y="462" text-anchor="middle" class="name">${escapeXml(name)}</text>
      <!-- Hours: replaces the blank in "In recognition of ___ hours" -->
      <text x="618" y="763" text-anchor="middle" class="hours">${escapeXml(hoursDisplay)}</text>
      <!-- Date: above the DATE label bottom right -->
      <text x="1155" y="1080" text-anchor="middle" class="date">${escapeXml(date)}</text>
    </svg>
  `;

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
