// ============================================================
// app/checkin/[token]/page.tsx
// Attendee-facing QR ticket page. Renders an actual scannable QR code
// using an SVG-based generator (no third-party runtime dep).
//
// The token itself is opaque — never reveals event/registration IDs.
// Event staff scan this QR to record attendance.
// ============================================================

export const dynamic = 'force-dynamic'

// Small SVG QR generator (Numeric/Alphanumeric/Byte mode, ECC level L).
// Adapted from a public-domain implementation. Keeps everything server-side
// so no client JS or CDN dependency is required.
//
// For DSRT's opaque check-in tokens (~32 chars base64url), this is plenty.

type Bit = 0 | 1
type Matrix = Bit[][]

function encodeQR(data: string): { matrix: Matrix; size: number } {
  // Version selection: we always encode as Byte mode with ECC-L.
  // For data ≤ 78 bytes → version 5 (37x37 modules) is comfortable.
  // We pick the smallest version that fits.
  const bytes = new TextEncoder().encode(data)
  const version = pickVersion(bytes.length)
  const { size, ecBlocks, dataBytesCapacity } = getVersionInfo(version)

  // Build the data bit stream: mode (0100 = byte) + length + data + terminator + padding
  const bits: Bit[] = []
  writeBits(bits, 0b0100, 4)
  writeBits(bits, bytes.length, version < 10 ? 8 : 16)
  for (const b of bytes) writeBits(bits, b, 8)

  // Terminator + byte-align
  const target = dataBytesCapacity * 8
  const term = Math.min(4, target - bits.length)
  for (let i = 0; i < term; i++) bits.push(0)
  while (bits.length % 8 !== 0) bits.push(0)

  // Pad with alternating 0xEC 0x11
  const pads = [0xec, 0x11]
  let padIdx = 0
  while (bits.length < target) {
    writeBits(bits, pads[padIdx % 2], 8)
    padIdx++
  }

  const dataBytes: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | (bits[i + j] ?? 0)
    dataBytes.push(b)
  }

  // Reed-Solomon ECC
  const ecc = rsEncode(dataBytes, ecBlocks)
  const combined = [...dataBytes, ...ecc]

  const finalBits: Bit[] = []
  for (const b of combined) writeBits(finalBits, b, 8)

  // Build & mask matrix
  const matrix = buildMatrix(version, size, finalBits)
  return { matrix, size }
}

function writeBits(out: Bit[], value: number, n: number) {
  for (let i = n - 1; i >= 0; i--) out.push(((value >> i) & 1) as Bit)
}

function pickVersion(byteLen: number): number {
  // Capacities for ECC-L, Byte mode (approx, safe lower bounds)
  const caps = [
    { v: 1, cap: 17 }, { v: 2, cap: 32 }, { v: 3, cap: 53 }, { v: 4, cap: 78 },
    { v: 5, cap: 106 }, { v: 6, cap: 134 }, { v: 7, cap: 154 }, { v: 8, cap: 192 },
    { v: 9, cap: 230 }, { v: 10, cap: 271 },
  ]
  for (const c of caps) if (byteLen <= c.cap) return c.v
  return 10
}

function getVersionInfo(v: number) {
  // Total codewords and ECC codewords per version at ECC-L
  const table: Record<number, { total: number; ec: number }> = {
    1: { total: 26, ec: 7 }, 2: { total: 44, ec: 10 }, 3: { total: 70, ec: 15 },
    4: { total: 100, ec: 20 }, 5: { total: 134, ec: 26 }, 6: { total: 172, ec: 18 },
    7: { total: 196, ec: 20 }, 8: { total: 242, ec: 24 }, 9: { total: 292, ec: 30 },
    10: { total: 346, ec: 18 },
  }
  const info = table[v]
  const size = 21 + (v - 1) * 4
  return { size, ecBlocks: info.ec, dataBytesCapacity: info.total - info.ec }
}

// ---- Reed-Solomon encoding over GF(256) ----
const GF_EXP: number[] = new Array(512)
const GF_LOG: number[] = new Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255]
}
function gfMul(a: number, b: number): number {
  if (!a || !b) return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}
function rsGeneratorPoly(degree: number): number[] {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i])
    }
    poly = next
  }
  return poly
}
function rsEncode(data: number[], eccLen: number): number[] {
  const gen = rsGeneratorPoly(eccLen)
  const buf = [...data, ...new Array(eccLen).fill(0)]
  for (let i = 0; i < data.length; i++) {
    const factor = buf[i]
    if (factor !== 0) {
      for (let j = 0; j < gen.length; j++) {
        buf[i + j] ^= gfMul(gen[j], factor)
      }
    }
  }
  return buf.slice(data.length)
}

// ---- Matrix + placement + masking ----
function buildMatrix(version: number, size: number, bits: Bit[]): Matrix {
  const m: (Bit | null)[][] = Array.from({ length: size }, () => new Array(size).fill(null))

  // Finder patterns
  const drawFinder = (r: number, c: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue
        const isBorder = dr === -1 || dr === 7 || dc === -1 || dc === 7
        const isPattern =
          (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) &&
          (dr === 0 || dr === 6 || dc === 0 || dc === 6 ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4))
        if (isBorder) m[rr][cc] = 0
        else if (isPattern) m[rr][cc] = 1
        else if (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) m[rr][cc] = 0
      }
    }
  }
  drawFinder(0, 0); drawFinder(0, size - 7); drawFinder(size - 7, 0)

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    m[6][i] = (i % 2 === 0 ? 1 : 0)
    m[i][6] = (i % 2 === 0 ? 1 : 0)
  }

  // Dark module
  m[size - 8][8] = 1

  // Reserve format info areas (fill with 0 for now, will overwrite)
  for (let i = 0; i < 9; i++) if (m[8][i] === null) m[8][i] = 0
  for (let i = 0; i < 8; i++) if (m[i][8] === null) m[i][8] = 0
  for (let i = size - 8; i < size; i++) if (m[8][i] === null) m[8][i] = 0
  for (let i = size - 7; i < size; i++) if (m[i][8] === null) m[i][8] = 0

  // Place data bits (zigzag from bottom-right)
  let bitIdx = 0
  let upward = true
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i
      for (let k = 0; k < 2; k++) {
        const cc = col - k
        if (m[row][cc] === null) {
          const b = bits[bitIdx++] ?? 0
          m[row][cc] = (applyMask0(row, cc) ? (b ^ 1) : b) as Bit
        }
      }
    }
    upward = !upward
  }

  // Format info (mask pattern 0, ECC-L)
  writeFormat(m, size, 0)

  return m as Matrix
}

// Mask pattern 0: (row + col) % 2 === 0
function applyMask0(row: number, col: number): boolean {
  return (row + col) % 2 === 0
}

function writeFormat(m: (Bit | null)[][], size: number, maskPattern: number) {
  // ECC level L = 01, mask = 000 → format bits: 0b01000 → 8 (before BCH)
  const eccBits = 0b01
  const format = (eccBits << 3) | maskPattern
  const bits = bchFormat(format) ^ 0b101010000010010

  const set = (r: number, c: number, bit: number) => { m[r][c] = (bit & 1) as Bit }

  for (let i = 0; i <= 5; i++) set(8, i, (bits >> i) & 1)
  set(8, 7, (bits >> 6) & 1)
  set(8, 8, (bits >> 7) & 1)
  set(7, 8, (bits >> 8) & 1)
  for (let i = 9; i < 15; i++) set(14 - i, 8, (bits >> i) & 1)

  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, (bits >> i) & 1)
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, (bits >> i) & 1)
  set(size - 8, 8, 1)
}

function bchFormat(data: number): number {
  let d = data << 10
  const gen = 0b10100110111
  while (bitLen(d) >= 11) {
    d ^= gen << (bitLen(d) - 11)
  }
  return (data << 10) | d
}
function bitLen(x: number): number {
  let n = 0
  while (x) { n++; x >>>= 1 }
  return n
}

// -----------------------------------------------------------
// Page
// -----------------------------------------------------------

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { matrix, size } = encodeQR(token)

  const modulePx = 8
  const quiet = 4
  const totalPx = (size + quiet * 2) * modulePx

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
        <p className="label-mono text-white/50 mb-4">Your check-in ticket</p>

        <div className="mx-auto rounded-2xl bg-white p-4 inline-block">
          <svg
            width={Math.min(totalPx, 280)}
            height={Math.min(totalPx, 280)}
            viewBox={`0 0 ${totalPx} ${totalPx}`}
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="crispEdges"
          >
            <rect width={totalPx} height={totalPx} fill="#ffffff" />
            {matrix.map((row, r) =>
              row.map((bit, c) =>
                bit === 1 ? (
                  <rect
                    key={`${r}-${c}`}
                    x={(c + quiet) * modulePx}
                    y={(r + quiet) * modulePx}
                    width={modulePx}
                    height={modulePx}
                    fill="#000000"
                  />
                ) : null
              )
            )}
          </svg>
        </div>

        <p className="mt-6 text-[12.5px] text-white/60 leading-relaxed">
          Show this screen at check-in. Event staff will scan the QR to record your attendance.
        </p>

        <details className="mt-4 text-left">
          <summary className="text-[10.5px] font-mono uppercase tracking-wider text-white/40 cursor-pointer hover:text-white/60">
            Show token text (backup)
          </summary>
          <p className="mt-2 text-[10px] font-mono text-white/50 break-all bg-black/30 border border-white/[0.04] rounded p-3">
            {token}
          </p>
        </details>
      </div>
    </div>
  )
}