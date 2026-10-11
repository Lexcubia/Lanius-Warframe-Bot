import { describe, expect, it } from 'vitest';

import { canonicalizeItemPath } from './canonicalize-item-path.js';

describe('canonicalizeItemPath', () => {
  it('去掉 StoreItems 前缀以便对齐 Export 分册键', () => {
    expect(
      canonicalizeItemPath(
        '/Lotus/StoreItems/Types/Items/MiscItems/OrokinCatalyst',
      ),
    ).toBe('/Lotus/Types/Items/MiscItems/OrokinCatalyst');
    expect(
      canonicalizeItemPath(
        '/Lotus/StoreItems/Weapons/Infested/InfestedLich/LongGuns/CodaHema',
      ),
    ).toBe('/Lotus/Weapons/Infested/InfestedLich/LongGuns/CodaHema');
  });

  it('非 StoreItems 路径原样返回', () => {
    expect(
      canonicalizeItemPath('/Lotus/Types/Items/MiscItems/OrokinCatalyst'),
    ).toBe('/Lotus/Types/Items/MiscItems/OrokinCatalyst');
  });
});
