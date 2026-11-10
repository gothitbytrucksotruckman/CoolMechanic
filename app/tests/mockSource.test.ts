import { createDataSource } from '../src/data'
import { createMockSource } from '../src/data/mockSource'

test('getCase bundles events and dispatch; unknown id is null', async () => {
  const ds = createMockSource(); ds.demo!.trigger('electrical_part_fault', 'm-04'); ds.demo!.advance(10)
  const [first] = await ds.listCases(); const b = await ds.getCase(first.id)
  expect(b!.events.map(e => e.type)).toContain('dispatched'); expect(b!.dispatch).toBeDefined()
  expect(await ds.getCase('case-9999')).toBeNull()
})

test('listCaseEvents is newest first across cases and respects the limit', async () => {
  const ds = createMockSource(); ds.demo!.trigger('electrical_part_fault', 'm-04'); ds.demo!.advance(3)
  ds.demo!.trigger('unknown_anomaly', 'm-05'); ds.demo!.advance(15)
  const evs = await ds.listCaseEvents(4)
  expect(evs).toHaveLength(4)
  const times = evs.map(e => Date.parse(e.ts_utc))
  expect([...times].sort((a, b) => b - a)).toEqual(times)
  expect(evs[0].case_id).toBe('case-0002')
})

test('listCases filters by machine', async () => {
  const ds = createMockSource(); ds.demo!.trigger('electrical_part_fault', 'm-04'); ds.demo!.advance(10)
  expect(await ds.listCases({ machineId: 'm-01' })).toEqual([])
  expect(await ds.listCases({ machineId: 'm-04' })).toHaveLength(1)
})

test('http source is not available yet', () => expect(() => createDataSource('http')).toThrow('P6'))
