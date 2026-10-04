// Generates simple brand placeholder PNG icons (solid charcoal with a lighter
// rounded square "chip") without external deps, using a minimal PNG encoder.
import { deflateSync } from "node:zlib"
import { writeFileSync, mkdirSync } from "node:fs"
import { Buffer } from "node:buffer"

mkdirSync(new URL("../public/icons/", import.meta.url), { recursive: true })

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii")
  const body = Buffer.concat([typeBuf, data])
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function png(size, draw) {
  const bytesPerPixel = 4
  const stride = size * bytesPerPixel
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter type: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y, size)
      const o = y * (stride + 1) + 1 + x * bytesPerPixel
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
      raw[o + 3] = a
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const idat = deflateSync(raw)
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

// charcoal bg, muted-indigo rounded chip in the middle
const BG = [10, 10, 10, 255]
const CHIP = [99, 102, 241, 255]

function draw(x, y, size) {
  const m = size * 0.26
  const inset = x >= m && x <= size - m && y >= m && y <= size - m
  // rounded corners of the chip
  if (inset) {
    const r = size * 0.08
    const cx = Math.min(Math.max(x, m + r), size - m - r)
    const cy = Math.min(Math.max(y, m + r), size - m - r)
    const d = Math.hypot(x - cx, y - cy)
    if (d <= r) return CHIP
    return BG
  }
  return BG
}

for (const size of [192, 512]) {
  const buf = png(size, draw)
  writeFileSync(new URL(`../public/icons/icon-${size}.png`, import.meta.url), buf)
}
// maskable: same art with more padding is fine for a placeholder
writeFileSync(
  new URL("../public/icons/icon-maskable-512.png", import.meta.url),
  png(512, draw)
)
console.log("Generated placeholder PWA icons in public/icons/")
