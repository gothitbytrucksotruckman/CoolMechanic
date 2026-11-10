// Small seeded PRNG so every rehearsal and test sees the same data.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// One independent stream per (seed, machine, minute): a reading never depends on what ran before it.
export function rngFor(seed: number, machineIndex: number, minute: number): () => number {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(machineIndex + 1, 0xc2b2ae35) ^ Math.imul(minute, 0x27d4eb2f)
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  return mulberry32(h ^ (h >>> 13))
}
