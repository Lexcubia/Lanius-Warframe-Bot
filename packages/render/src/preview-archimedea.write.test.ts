import { EMPTY_WORLDSTATE_MISSION_SLICES, type WorldstateDto } from '@lanius/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import { renderArchimedeaCard } from './render-worldstate.js';
import type { CardSkinId } from './vue-cards/skins.js';

/**
 * 科研预览输出目录。
 * 默认写 agent store `media/ws-archimedea`；CI 可设 `LANIUS_QQ_CARD_PREVIEW_DIR`。
 *
 * @returns 绝对路径
 */
function resolvePreviewDir(): string {
  const fromEnv = process.env.LANIUS_QQ_CARD_PREVIEW_DIR?.trim();
  if (fromEnv) {
    return resolve(fromEnv, 'ws-archimedea');
  }
  const storeMedia = '/cursor/stores/bc-4d7c66be-70a8-44c1-8457-760a78beb7ee/media/ws-archimedea';
  try {
    mkdirSync(storeMedia, { recursive: true });
    return storeMedia;
  } catch {
    return resolve(dirname(fileURLToPath(import.meta.url)), '../tmp/ws-archimedea');
  }
}

const outDir = resolvePreviewDir();

/**
 * 科研卡片预览夹具（双季）。
 */
const sampleWorldstate: WorldstateDto = {
  realm: 'international',
  fetchedAt: '2026-10-23T12:00:00.000Z',
  ...EMPTY_WORLDSTATE_MISSION_SLICES,
  cycles: [],
  fissures: [],
  invasions: [],
  nightwave: null,
  archimedea: {
    seasons: [
      {
        kind: 'lab',
        activation: '2026-10-20T00:00:00.000Z',
        expiry: '2026-10-27T00:00:00.000Z',
        missions: [
          {
            missionTypeKey: 'MT_EXTERMINATION',
            missionType: { zh: '歼灭', en: 'Extermination' },
            factionKey: 'FC_MITW',
            faction: { zh: '墙中人', en: 'Man in the Wall' },
            difficulties: [
              {
                typeKey: 'CD_HARD',
                deviationKey: 'FortifiedFoes',
                deviation: { zh: '坚不可摧', en: 'Fortified Foes' },
                riskKeys: ['AcceleratedEnemies', 'EMPBlackHole'],
                risks: [
                  { zh: '加速敌军', en: 'Accelerated Enemies' },
                  { zh: 'EMP 黑洞', en: 'EMP Black Hole' },
                ],
              },
            ],
          },
          {
            missionTypeKey: 'MT_SURVIVAL',
            missionType: { zh: '生存', en: 'Survival' },
            factionKey: 'FC_MITW',
            faction: { zh: '墙中人', en: 'Man in the Wall' },
            difficulties: [
              {
                typeKey: 'CD_HARD',
                deviationKey: 'NecramechActivation',
                deviation: { zh: '殁世机甲激活', en: 'Necramech Activation' },
                riskKeys: ['Deflectors', 'Voidburst'],
                risks: [
                  { zh: '偏转护盾', en: 'Deflectors' },
                  { zh: '虚空爆发', en: 'Voidburst' },
                ],
              },
            ],
          },
          {
            missionTypeKey: 'MT_ARTIFACT',
            missionType: { zh: '中断', en: 'Disruption' },
            factionKey: 'FC_MITW',
            faction: { zh: '墙中人', en: 'Man in the Wall' },
            difficulties: [
              {
                typeKey: 'CD_HARD',
                deviationKey: 'FragileNodes',
                deviation: { zh: '脆弱节点', en: 'Fragile Nodes' },
                riskKeys: ['Quicksand', 'AntiMaterialWeapons'],
                risks: [
                  { zh: '流沙', en: 'Quicksand' },
                  { zh: '反器材武器', en: 'Anti-Material Weapons' },
                ],
              },
            ],
          },
        ],
        variableKeys: ['NoPets', 'DullBlades', 'AntiGuard', 'ContactDamage'],
        variables: [
          { zh: '禁用同伴', en: 'No Pets Allowed' },
          { zh: '钝重兵刃', en: 'Dull Blades' },
          { zh: '超宏衰减', en: 'Dropped Guard' },
          { zh: '二次伤害', en: 'Secondary Wounds' },
        ],
      },
      {
        kind: 'hex',
        activation: '2026-10-20T00:00:00.000Z',
        expiry: '2026-10-27T00:00:00.000Z',
        missions: [
          {
            missionTypeKey: 'MT_SURVIVAL',
            missionType: { zh: '生存', en: 'Survival' },
            factionKey: 'FC_SCALDRA',
            faction: { zh: '炽蛇军', en: 'Scaldra' },
            difficulties: [
              {
                typeKey: 'CD_HARD',
                deviationKey: 'TechrotConjunction',
                deviation: { zh: '科腐联结', en: 'Techrot Conjunction' },
                riskKeys: ['InfectedTechrot', 'PointBlank'],
                risks: [
                  { zh: '感染科腐', en: 'Infected Techrot' },
                  { zh: '近距射击', en: 'Point Blank' },
                ],
              },
            ],
          },
          {
            missionTypeKey: 'MT_DEFENSE',
            missionType: { zh: '防御', en: 'Defense' },
            factionKey: 'FC_SCALDRA',
            faction: { zh: '炽蛇军', en: 'Scaldra' },
            difficulties: [
              {
                typeKey: 'CD_HARD',
                deviationKey: 'ExplosiveEnergy',
                deviation: { zh: '爆炸能量', en: 'Explosive Energy' },
                riskKeys: ['MiasmiteHive', 'ShieldedFoes'],
                risks: [
                  { zh: '自爆虫群', en: 'Miasmite Hive' },
                  { zh: '护盾敌军', en: 'Shielded Foes' },
                ],
              },
            ],
          },
          {
            missionTypeKey: 'MT_ASSASSINATION',
            missionType: { zh: '刺杀', en: 'Assassination' },
            factionKey: 'FC_SCALDRA',
            faction: { zh: '炽蛇军', en: 'Scaldra' },
            difficulties: [
              {
                typeKey: 'CD_HARD',
                deviationKey: 'TankReinforcements',
                deviation: { zh: '坦克增援', en: 'Tank Reinforcements' },
                riskKeys: ['HeavyWarfare', 'CompetitionSpillover'],
                risks: [
                  { zh: '重装作战', en: 'Heavy Warfare' },
                  { zh: '竞争外溢', en: 'Competition Spillover' },
                ],
              },
            ],
          },
        ],
        variableKeys: ['RangeDebuff', 'NoPets', 'AnemicShields', 'DullBlades'],
        variables: [
          { zh: '射程减益', en: 'Range Debuff' },
          { zh: '禁用同伴', en: 'No Pets Allowed' },
          { zh: '贫血护盾', en: 'Anemic Shields' },
          { zh: '钝重兵刃', en: 'Dull Blades' },
        ],
      },
    ],
  },
};

describe('archimedea QQ card previews', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('writes overview / lab / hex PNGs for light and dark', async () => {
    mkdirSync(outDir, { recursive: true });
    const skins: CardSkinId[] = ['light', 'dark'];

    for (const skin of skins) {
      const both = await renderArchimedeaCard({
        locale: 'zh',
        worldstate: sampleWorldstate,
        skin,
      });
      const lab = await renderArchimedeaCard({
        locale: 'zh',
        worldstate: sampleWorldstate,
        skin,
        kind: 'lab',
      });
      const hex = await renderArchimedeaCard({
        locale: 'zh',
        worldstate: sampleWorldstate,
        skin,
        kind: 'hex',
      });

      writeFileSync(resolve(outDir, `archimedea-both-${skin}.png`), both);
      writeFileSync(resolve(outDir, `archimedea-lab-${skin}.png`), lab);
      writeFileSync(resolve(outDir, `archimedea-hex-${skin}.png`), hex);

      expect(both.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(lab.length).toBeGreaterThan(1000);
      expect(hex.length).toBeGreaterThan(1000);
    }
  }, 240_000);
});
