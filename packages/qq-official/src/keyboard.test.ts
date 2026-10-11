import { describe, expect, it } from 'vitest';

import { commandKeyboardButton, toQqKeyboardPayload } from './keyboard.js';

describe('toQqKeyboardPayload', () => {
  it('maps command buttons and bot_appid', () => {
    const payload = toQqKeyboardPayload({
      botAppId: '123456',
      rows: [
        {
          buttons: [
            commandKeyboardButton({
              id: 'f-lith',
              label: '古纪',
              command: '裂隙 古纪',
              enter: true,
            }),
          ],
        },
      ],
    });

    expect(payload.content.bot_appid).toBe(123456);
    expect(payload.content.rows).toHaveLength(1);
    const btn = payload.content.rows[0]?.buttons[0];
    expect(btn).toMatchObject({
      id: 'f-lith',
      render_data: { label: '古纪', visited_label: '古纪', style: 1 },
      action: {
        type: 2,
        permission: { type: 2 },
        data: '裂隙 古纪',
        enter: true,
        reply: false,
      },
    });
    expect(String((btn?.action as { unsupport_tips?: string }).unsupport_tips)).toContain(
      '不支持',
    );
  });
});
