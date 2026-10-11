import { describe, expect, it } from 'vitest';

import { resolveNightwaveChallengeKind } from './nightwave-kind.js';

describe('resolveNightwaveChallengeKind', () => {
  it('Daily 布尔优先', () => {
    expect(
      resolveNightwaveChallengeKind(
        '/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyFoo',
        true,
      ),
    ).toBe('daily');
    expect(
      resolveNightwaveChallengeKind(
        '/Lotus/Types/Challenges/Seasons/Daily/SeasonDailyFoo',
        false,
      ),
    ).toBe('weekly');
  });

  it('从路径识别每日 / 每周', () => {
    expect(
      resolveNightwaveChallengeKind(
        '/Lotus/Types/Challenges/Seasons/Daily/SeasonDailyKillEnemiesWithPrimary',
      ),
    ).toBe('daily');
    expect(
      resolveNightwaveChallengeKind(
        '/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyCompleteMissions',
      ),
    ).toBe('weekly');
  });

  it('无法识别时为 other', () => {
    expect(resolveNightwaveChallengeKind(undefined)).toBe('other');
    expect(resolveNightwaveChallengeKind('/Lotus/Types/Misc/Foo')).toBe('other');
  });
});
