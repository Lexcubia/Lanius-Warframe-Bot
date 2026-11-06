import { describe, expect, it } from 'vitest';

import {
  UNIFIED_DISPOSITION,
  analyzeRivenStats,
  parseRivenAnalysisText,
  resolveRivenWeaponClass,
  statRange,
} from './analysis.js';

describe('riven analysis', () => {
  it('uses unified disposition 1.2', () => {
    expect(UNIFIED_DISPOSITION).toBe(1.2);
  });

  it('maps secondary group to pistol class', () => {
    expect(resolveRivenWeaponClass('shotgun', 'secondary')).toBe('pistol');
  });

  it('computes rifle crit_chance 3+1 range around base×D×factor', () => {
    const range = statRange('crit_chance', 'rifle', 1.2, 3, 1, false);
    expect(range).not.toBeNull();
    const [lo, hi] = range!;
    // 149.99 × 1.2 × 0.9375 × [0.9, 1.1]
    expect(lo).toBeGreaterThan(140);
    expect(hi).toBeLessThan(200);
  });

  it('parses free-text weapon + stats', () => {
    const parsed = parseRivenAnalysisText('绝路 暴击几率 180 暴击伤害 100 -射速 40');
    expect(parsed.weaponQuery).toContain('绝路');
    expect(parsed.stats.length).toBeGreaterThanOrEqual(2);
    expect(parsed.stats.some((s) => s.positive && s.id === 'crit_chance')).toBe(true);
  });

  it('analyzes deviation for in-range roll', () => {
    const rows = analyzeRivenStats({
      cls: 'rifle',
      disposition: 1.2,
      stats: [
        { id: 'crit_chance', value: 160, positive: true },
        { id: 'crit_damage', value: 100, positive: true },
        { id: 'multishot', value: 90, positive: true },
        { id: 'reload_speed', value: 40, positive: false },
      ],
    });
    expect(rows).toHaveLength(4);
    expect(rows[0]?.lo).toBeLessThan(rows[0]!.hi);
  });
});
