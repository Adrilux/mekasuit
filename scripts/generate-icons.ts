/**
 * Generates PWA icons (192x192 and 512x512) as PNG files
 * Uses a blue rounded square with a white "G" wrench symbol via SVG → sharp
 */
import sharp from "sharp"
import { mkdirSync } from "fs"

const ICON_SVG = (size: number) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#1e40af"/>
  <text
    x="${size / 2}"
    y="${size * 0.72}"
    font-family="Arial, sans-serif"
    font-size="${size * 0.55}"
    font-weight="900"
    fill="white"
    text-anchor="middle"
  >G</text>
</svg>
`

async function generate() {
  mkdirSync("public/icons", { recursive: true })

  for (const size of [192, 512]) {
    await sharp(Buffer.from(ICON_SVG(size)))
      .png()
      .toFile(`public/icons/icon-${size}.png`)
    console.log(`✓ public/icons/icon-${size}.png`)
  }

  // Maskable (with safe zone padding ~10%)
  const MASKABLE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1e40af"/>
  <text
    x="256"
    y="346"
    font-family="Arial, sans-serif"
    font-size="260"
    font-weight="900"
    fill="white"
    text-anchor="middle"
  >G</text>
</svg>
`
  await sharp(Buffer.from(MASKABLE_SVG))
    .png()
    .toFile("public/icons/icon-512-maskable.png")
  console.log("✓ public/icons/icon-512-maskable.png")
}

generate().catch(console.error)
