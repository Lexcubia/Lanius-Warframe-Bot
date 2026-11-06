import { describe, expect, it } from 'vitest';

import {
  SDJK_PUSH_EVENT_MAP,
  SubscribableModuleIdSchema,
  WorldstateCycleFilterSchema,
} from './subscription.js';

/**
 * Wave 4：SDJK PUSH_EVENTS → ModuleId 映射完整性。
 */
describe('SDJK_PUSH_EVENT_MAP', () => {
  it('covers all 25 SDJK push event names', () => {
    const names = Object.keys(SDJK_PUSH_EVENT_MAP);
    expect(names).toHaveLength(25);
    expect(names).toEqual(
      expect.arrayContaining([
        '裂隙',
        '夜灵',
        '山谷',
        '魔胎',
        '地球',
        '双衍',
        '奸商',
        '突击',
        '执刑官',
        '仲裁',
        '钢路侵袭',
        '警报',
        '入侵',
        '新闻',
        '每日特惠',
        '活动',
        '1999日历',
        '灵化武器',
        '信条',
        '终幕',
        '钢精兑换',
        '碎银兑换',
        '赏金',
        '阿耶兑换',
        '电波',
      ]),
    );
  });

  it('maps every event to a valid SubscribableModuleId', () => {
    for (const [event, target] of Object.entries(SDJK_PUSH_EVENT_MAP)) {
      const parsed = SubscribableModuleIdSchema.safeParse(target.moduleId);
      expect(parsed.success, `${event} → ${target.moduleId}`).toBe(true);
      if (target.filterArgs) {
        expect(WorldstateCycleFilterSchema.safeParse(target.filterArgs).success).toBe(true);
      }
    }
  });

  it('uses worldstate + cycle filter for open-world plains events', () => {
    expect(SDJK_PUSH_EVENT_MAP.夜灵).toEqual({
      moduleId: 'worldstate',
      filterArgs: 'cetus',
    });
    expect(SDJK_PUSH_EVENT_MAP.山谷).toEqual({
      moduleId: 'worldstate',
      filterArgs: 'vallis',
    });
    expect(SDJK_PUSH_EVENT_MAP.魔胎).toEqual({
      moduleId: 'worldstate',
      filterArgs: 'cambion',
    });
    expect(SDJK_PUSH_EVENT_MAP.地球).toEqual({
      moduleId: 'worldstate',
      filterArgs: 'earth',
    });
    expect(SDJK_PUSH_EVENT_MAP.双衍).toEqual({
      moduleId: 'worldstate',
      filterArgs: 'duviri',
    });
  });
});
