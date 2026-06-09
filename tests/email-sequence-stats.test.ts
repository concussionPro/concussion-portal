/**
 * email-sequence-stats — audit_key → sequence mapping used by
 * /api/admin/email-stats to source SENDS from email_audit_log (the
 * reliable send record: rows roll back on failed sends).
 */
import { describe, it, expect } from 'vitest'
import {
  sequenceFromAuditKey,
  sequenceFromAuditKeySql,
  isTestAuditKey,
  AUDIT_KEY_SEQUENCE_PREFIXES,
} from '@/lib/email-sequence-stats'

describe('sequenceFromAuditKey', () => {
  it('maps every nurture-cron audit key shape to its webhook sequence tag', () => {
    // Shapes written by app/api/cron/send-nurture-emails/route.ts
    expect(sequenceFromAuditKey('scat_day0_user123')).toBe('scat-mastery')
    expect(sequenceFromAuditKey('scat_day7_reengagement_user123')).toBe('scat-mastery')
    expect(sequenceFromAuditKey('scat_day10_engagement_user123')).toBe('scat-mastery')
    expect(sequenceFromAuditKey('scat_day42_user123')).toBe('scat-mastery')
    expect(sequenceFromAuditKey('onboard_day3_user123')).toBe('post-purchase')
    expect(sequenceFromAuditKey('onboard_day3_activation_user123')).toBe('post-purchase')
    expect(sequenceFromAuditKey('workshop_reservation_user123')).toBe('workshop-reservation')
    expect(sequenceFromAuditKey('workshop_logistics_user123')).toBe('workshop-logistics')
    expect(sequenceFromAuditKey('pre_workshop_7_user123')).toBe('pre-workshop')
    expect(sequenceFromAuditKey('workshop_momentum_d5_user123')).toBe('workshop-momentum')
    expect(sequenceFromAuditKey('upgrade_day14_user123')).toBe('online-upgrade')
    expect(sequenceFromAuditKey('reengagement_user123')).toBe('reengagement')
    expect(sequenceFromAuditKey('almost_done_user123')).toBe('almost-done')
    expect(sequenceFromAuditKey('free_almost_done_user123')).toBe('free-almost-done')
    expect(sequenceFromAuditKey('scat_completion_upsell_user123')).toBe('scat-completion-upsell')
    expect(sequenceFromAuditKey('ref_upgrade_day7_user123')).toBe('reference-upgrade')
    expect(sequenceFromAuditKey('ai_checklist_day3_user123')).toBe('ai-safety-checklist')
  })

  it('distinguishes free_almost_done from almost_done (prefix-order trap)', () => {
    expect(sequenceFromAuditKey('free_almost_done_x')).toBe('free-almost-done')
    expect(sequenceFromAuditKey('almost_done_x')).toBe('almost-done')
  })

  it('buckets unknown keys into (other) instead of crashing', () => {
    expect(sequenceFromAuditKey('certificate_issue_x')).toBe('(other)')
    expect(sequenceFromAuditKey('')).toBe('(other)')
  })
})

describe('isTestAuditKey', () => {
  it('flags test/preview markers in both prospect and nurture conventions', () => {
    expect(isTestAuditKey('outreach:some-clinic:initial:test:1700000000')).toBe(true)
    expect(isTestAuditKey('blast_test_user1')).toBe(true)
    expect(isTestAuditKey('test:preview-send')).toBe(true)
  })

  it('does not flag production keys', () => {
    expect(isTestAuditKey('outreach:some-clinic:initial:prod')).toBe(false)
    expect(isTestAuditKey('outreach:some-clinic:followup:cron:1700000000')).toBe(false)
    expect(isTestAuditKey('scat_day7_user123')).toBe(false)
    // 'latest_' contains 'test' as a substring but not the marker
    expect(isTestAuditKey('scat_day7_latest_user')).toBe(false)
  })
})

describe('sequenceFromAuditKeySql', () => {
  it('emits one WHEN branch per prefix, in declaration order, with an ELSE fallback', () => {
    const sqlCase = sequenceFromAuditKeySql('audit_key')
    for (const [prefix, sequence] of AUDIT_KEY_SEQUENCE_PREFIXES) {
      expect(sqlCase).toContain(`WHEN audit_key LIKE '${prefix}%' THEN '${sequence}'`)
    }
    expect(sqlCase).toContain(`ELSE '(other)'`)
    // free_almost_done branch must appear BEFORE almost_done so the SQL
    // CASE (first-match-wins) agrees with the TS helper.
    expect(sqlCase.indexOf(`'free_almost_done_%'`)).toBeLessThan(sqlCase.indexOf(`'almost_done_%'`))
  })

  it('TS helper and SQL CASE agree on representative keys', () => {
    // Sanity: the SQL is generated from the same table the TS helper walks,
    // so any key the TS helper maps must have a matching LIKE branch.
    const sqlCase = sequenceFromAuditKeySql()
    const samples = ['scat_day3_u1', 'onboard_day1_u1', 'ai_checklist_day14_u1', 'workshop_momentum_d10_u1']
    for (const key of samples) {
      const seq = sequenceFromAuditKey(key)
      expect(seq).not.toBe('(other)')
      expect(sqlCase).toContain(`'${seq}'`)
    }
  })
})
