import { describe, expect, it, vi } from 'vitest';

import {
  buildOfficialIconUrl,
  fetchItemIconCatalog,
  lookupItemIcon,
} from './item-icon-catalog.js';

describe('item-icon-catalog', () => {
  it('组装带 contentHash 的官方 CDN URL', () => {
    expect(
      buildOfficialIconUrl(
        '/Lotus/Interface/Icons/StoreIcons/Weapons/PrimaryWeapons/Weapons/DeraVandal.png',
        '00_abc',
      ),
    ).toBe(
      'https://content.warframe.com/PublicExport/Lotus/Interface/Icons/StoreIcons/Weapons/PrimaryWeapons/Weapons/DeraVandal.png!00_abc',
    );
  });

  it('缺 contentHash 时仍指向官方 CDN', () => {
    expect(buildOfficialIconUrl('/Lotus/Interface/Icons/x.png')).toBe(
      'https://content.warframe.com/PublicExport/Lotus/Interface/Icons/x.png',
    );
  });

  it('从 Export 分册合并目录并解析图标', async () => {
    const fetchImpl = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.endsWith('ExportImages.json')) {
        return new Response(
          JSON.stringify({
            '/Lotus/Interface/Icons/StoreIcons/Resources/CraftingComponents/GenericGunStock.png':
              { contentHash: '00_hash' },
          }),
        );
      }
      if (url.endsWith('ExportResources.json')) {
        return new Response(
          JSON.stringify({
            '/Lotus/Types/Recipes/Weapons/WeaponParts/DeraVandalStock': {
              icon: '/Lotus/Interface/Icons/StoreIcons/Resources/CraftingComponents/GenericGunStock.png',
            },
          }),
        );
      }
      // 其余分册空表
      return new Response(JSON.stringify({}));
    });

    const catalog = await fetchItemIconCatalog({
      baseUrl: 'https://example.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const hit = lookupItemIcon(
      catalog,
      '/Lotus/Types/Recipes/Weapons/WeaponParts/DeraVandalStock',
    );
    expect(hit?.iconPath).toContain('GenericGunStock.png');
    expect(hit?.iconUrl).toContain('content.warframe.com/PublicExport');
    expect(hit?.iconUrl).toContain('!00_hash');

    const viaStore = lookupItemIcon(
      catalog,
      '/Lotus/StoreItems/Types/Recipes/Weapons/WeaponParts/DeraVandalStock',
    );
    expect(viaStore?.iconUrl).toBe(hit?.iconUrl);
  });
});
