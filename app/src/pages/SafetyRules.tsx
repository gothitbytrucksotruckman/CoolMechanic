import type { SafetyStatus } from '../../../contract/schemas'
import { Card } from '../components/Card'
import { ErrorCard } from '../components/ErrorCard'
import { JudgeNote } from '../components/JudgeNote'
import { StatusChip } from '../components/StatusChip'
import type { StatusKey } from '../data/status'
import { useSourceData } from '../data/useSourceData'
import { useT } from '../i18n/i18n'
import { SIGNAL } from '../i18n/labels'

const GROUPS: SafetyStatus[] = ['allow', 'observe', 'deny']
const CHIP: Record<SafetyStatus, StatusKey> = { allow: 'waspada', observe: 'waspada', deny: 'bahaya' }

// Read-only. Shows exactly what is stored; the UI never generates steps (PRD rules 4 and 6).
export function SafetyRules() {
  const { t, lang } = useT()
  const { data, error } = useSourceData(async (ds) => ({ rules: await ds.listSafetyRules(), global: await ds.listGlobalRules() }), [])
  const tx = (o: { text_id: string; text_en: string }) => (lang === 'id' ? o.text_id : o.text_en)

  if (error) return <ErrorCard error={error} />
  if (!data) return <h1 className="text-2xl font-bold">{t('page.rules')}</h1>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('page.rules')}</h1>
      <p className="max-w-3xl text-muted">{t('rules.intro')}</p>

      <Card title={t('rules.global')}>
        <ol className="list-decimal space-y-1 pl-6">
          {data.global.map((g) => <li key={g.order} data-testid="global-rule">{tx(g)}</li>)}
        </ol>
      </Card>

      <JudgeNote d="D2">{t('rules.judge_d2')}</JudgeNote>

      {GROUPS.map((status) => {
        const rules = data.rules.filter((r) => r.status === status)
        return (
          <Card key={status} title={<StatusChip status={CHIP[status]} label={t(`safety.${status}`)} />}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th scope="col" className="py-2 pr-3">{t('rules.fault')}</th>
                    <th scope="col" className="py-2 pr-3">{t('rules.steps')}</th>
                    <th scope="col" className="py-2 pr-3">{t('rules.verify')}</th>
                    <th scope="col" className="py-2">{t('rules.escalate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.fault_code} data-testid="rule-row" className="border-b border-line align-top last:border-0">
                      <th scope="row" className="py-3 pr-3 font-semibold">{lang === 'id' ? r.fault_name_id : r.fault_name_en}</th>
                      <td className="py-3 pr-3">
                        {r.steps.length === 0 ? <span className="font-semibold" style={{ color: 'var(--bahaya-fg)' }}>— {t('rules.to_technician')}</span> : (
                          <ol className="list-decimal space-y-1 pl-5">{r.steps.map((s) => <li key={s.order}>{tx(s)}</li>)}</ol>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {r.verify_rule ? <>{SIGNAL[r.verify_rule.signal][lang]}<br /><span className="num text-muted">{t('rules.wait', { n: r.verify_rule.wait_minutes })}</span></> : <span className="text-muted">—</span>}
                      </td>
                      <td className="py-3">{tx(r.escalate_when)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
