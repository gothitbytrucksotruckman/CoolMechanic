// Writes contract/schema.json for teammates building the edge hub and agent (npm run contract:schema).
import { writeFileSync } from 'node:fs'
import { z } from 'zod'
import { ALL_SCHEMAS } from './schemas.ts'

const out = Object.fromEntries(Object.entries(ALL_SCHEMAS).map(([name, s]) => [name, z.toJSONSchema(s, { unrepresentable: 'any' })]))
writeFileSync(new URL('./schema.json', import.meta.url), JSON.stringify(out, null, 2) + '\n')
console.log(`wrote contract/schema.json (${Object.keys(out).length} schemas)`)
