# CoolMechanic API (target for P6)

The dashboard reads data through `DataSource` (`app/src/data/types.ts`). Today only the in-browser simulator implements it (ADR-004). In P6 an `httpSource` will call these endpoints, which the edge hub / Nexent agent / openGauss backend must serve. Bodies are JSON in the shapes of `contract/schemas.ts` (JSON Schema: `contract/schema.json`, examples: `contract/examples/`). Times are ISO-8601 UTC.

| Method + path | Response |
|---|---|
| `GET /sites` | `Site[]` |
| `GET /machines` | `Machine[]` |
| `GET /machines/{id}/readings?from=<utc>&to=<utc>` | `Reading[]`, oldest first |
| `GET /machines/{id}/normal-bands` | `NormalBand[]` |
| `GET /cases?machine_id=<id>` | `Case[]` (filter optional) |
| `GET /cases/{id}` | `{ case: Case, events: CaseEvent[], dispatch?: Dispatch }`, 404 if unknown |
| `GET /case-events?limit=<n>` | `CaseEvent[]`, newest first, across cases |
| `GET /safety-rules` | `SafetyRule[]` |
| `GET /global-rules` | `GlobalRule[]` |
| `GET /dispatches` | `Dispatch[]` |
| `GET /stream` | live events: `reading`, `alert`, `case`, `case_event`, `dispatch` (transport for /stream decided in P6: SSE or polling) |

Rules the producer must follow:
- Every `Reading` carries `provenance` (`SIMULATED` | `LAB-RIG` | `FIELD`). A missing probe value is `null` with its `sensor_health` flag `false`.
- Deny rules have `steps: []` and `verify_rule: null`. Unknown faults are deny.
- `Dispatch.message_text` is shown verbatim; unknown work-order lines are omitted, never invented (ADR-008).
