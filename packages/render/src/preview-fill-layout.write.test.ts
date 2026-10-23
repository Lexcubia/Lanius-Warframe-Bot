/**
 * 单列铺满布局预览：每个改动 CardKind 至少一张 light PNG。
 * 默认写 agent store `media/qq-cards-fill-layout`；可设 `LANIUS_FILL_LAYOUT_PREVIEW_DIR`。
 */
import { EMPTY_WORLDSTATE_MISSION_SLICES, type WorldstateDto } from '@lanius/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import {
  renderAlertsCard,
  renderArbitrationCard,
  renderArchimedeaCard,
  renderArchonCard,
  renderBountiesCard,
  renderCircuitCard,
  renderSortieCard,
  renderWorldstateCard,
} from './render-worldstate.js';

/** 1×1 透明 PNG data URL */
const TINY_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/**
 * 预览输出目录。
 *
 * @returns 绝对路径
 */
function resolvePreviewDir(): string {
  const fromEnv = process.env.LANIUS_FILL_LAYOUT_PREVIEW_DIR?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }
  const storeMedia =
    '/cursor/stores/bc-4d7c66be-70a8-44c1-8457-760a78beb7ee/media/qq-cards-fill-layout';
  try {
    mkdirSync(storeMedia, { recursive: true });
    return storeMedia;
  } catch {
    return resolve(dirname(fileURLToPath(import.meta.url)), '../tmp/qq-cards-fill-layout');
  }
}

const outDir = resolvePreviewDir();

/**
 * 空切片基底 worldstate。
 *
 * @returns 基底 DTO 字段
 */
function baseWs(): Omit<
  WorldstateDto,
  'sortie' | 'archon' | 'arbitration' | 'alerts' | 'circuit' | 'archimedea' | 'bounties' | 'cycles'
> & {
  cycles: WorldstateDto['cycles'];
  fissures: WorldstateDto['fissures'];
  invasions: WorldstateDto['invasions'];
  nightwave: WorldstateDto['nightwave'];
} {
  return {
    realm: 'international',
    fetchedAt: new Date().toISOString(),
    ...EMPTY_WORLDSTATE_MISSION_SLICES,
    fissures: [],
    cycles: [],
    invasions: [],
    nightwave: null,
  };
}

describe('fill-layout QQ card previews (light)', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('writes light PNGs for single-column CardKinds', async () => {
    mkdirSync(outDir, { recursive: true });

    const sortieWs: WorldstateDto = {
      ...baseWs(),
      ...EMPTY_WORLDSTATE_MISSION_SLICES,
      sortie: {
        id: 'sortie-1',
        bossKey: 'SORTIE_BOSS_CORRUPTED_VOR',
        boss: { zh: '堕落的 Vor', en: 'Corrupted Vor' },
        expiry: new Date(Date.now() + 8 * 3_600_000).toISOString(),
        missions: [
          {
            missionTypeKey: 'MT_EXTERMINATION',
            missionType: { zh: '歼灭', en: 'Extermination' },
            modifier: { zh: '敌人物理强化（切割）', en: 'Slash Enhancement' },
            node: { zh: 'Ukko（虚空）', en: 'Ukko (Void)' },
          },
          {
            missionTypeKey: 'MT_TERRITORY',
            missionType: { zh: '拦截', en: 'Interception' },
            modifier: { zh: '卓越者大本营', en: 'Eximus Stronghold' },
            node: { zh: 'Oxomoco（虚空）', en: 'Oxomoco (Void)' },
          },
          {
            missionTypeKey: 'MT_MOBILE_DEFENSE',
            missionType: { zh: '移动防御', en: 'Mobile Defense' },
            modifier: { zh: '能量削减', en: 'Energy Reduction' },
            node: { zh: 'Teshub（虚空）', en: 'Teshub (Void)' },
          },
        ],
      },
      archon: {
        id: 'archon-1',
        bossKey: 'SORTIE_BOSS_AMAR',
        boss: { zh: '欺谋狼主', en: 'Archon Amar' },
        expiry: new Date(Date.now() + 3 * 86_400_000).toISOString(),
        missions: [
          {
            missionTypeKey: 'MT_RESCUE',
            missionType: { zh: '救援', en: 'Rescue' },
            node: { zh: 'Tessera（金星）', en: 'Tessera (Venus)' },
          },
          {
            missionTypeKey: 'MT_TERRITORY',
            missionType: { zh: '拦截', en: 'Interception' },
            node: { zh: 'Vesper（金星）', en: 'Vesper (Venus)' },
          },
          {
            missionTypeKey: 'MT_ASSASSINATION',
            missionType: { zh: '刺杀', en: 'Assassination' },
            node: { zh: 'Huvas（金星）', en: 'Huvas (Venus)' },
          },
        ],
      },
    };

    const jobs: Array<{ name: string; png: Buffer }> = [
      {
        name: 'sortie-light.png',
        png: await renderSortieCard({ locale: 'zh', worldstate: sortieWs, skin: 'light' }),
      },
      {
        name: 'archon-light.png',
        png: await renderArchonCard({ locale: 'zh', worldstate: sortieWs, skin: 'light' }),
      },
      {
        name: 'arbitration-light.png',
        png: await renderArbitrationCard({
          locale: 'zh',
          skin: 'light',
          worldstate: {
            ...baseWs(),
            ...EMPTY_WORLDSTATE_MISSION_SLICES,
            arbitration: {
              nodeKey: 'SolNode64',
              node: { zh: 'Tessera（金星）', en: 'Tessera (Venus)' },
              missionTypeKey: 'Defense',
              missionType: { zh: '防御', en: 'Defense' },
              enemyKey: 'Corpus',
              enemy: { zh: 'Corpus', en: 'Corpus' },
              activation: new Date(Date.now() - 600_000).toISOString(),
              expiry: new Date(Date.now() + 2_400_000).toISOString(),
              source: 'warframestat',
            },
          },
        }),
      },
      {
        name: 'alerts-light.png',
        png: await renderAlertsCard({
          locale: 'zh',
          skin: 'light',
          worldstate: {
            ...baseWs(),
            ...EMPTY_WORLDSTATE_MISSION_SLICES,
            alerts: [
              {
                id: 'fixture-fill',
                tag: 'RoadToTauEvent',
                node: { zh: 'Galatea（海王星）', en: 'Galatea (Neptune)' },
                missionType: { zh: '移动防御', en: 'Mobile Defense' },
                faction: { zh: 'Infested', en: 'Infested' },
                credits: 17000,
                expiry: new Date(Date.now() + 3_600_000).toISOString(),
                rewards: [
                  {
                    uniqueName: '/Lotus/Types/Items/MiscItems/TauResource',
                    name: { zh: '通往 Tau 资源', en: 'Road to Tau Resource' },
                    iconUrl: TINY_ICON,
                    quantity: 50,
                  },
                ],
              },
            ],
          },
        }),
      },
      {
        name: 'circuit-light.png',
        png: await renderCircuitCard({
          locale: 'zh',
          skin: 'light',
          worldstate: {
            ...baseWs(),
            ...EMPTY_WORLDSTATE_MISSION_SLICES,
            circuit: {
              activation: '2026-10-19T00:00:00.000Z',
              expiry: new Date(Date.now() + 4 * 24 * 3600_000).toISOString(),
              normalChoices: [
                { key: 'Hydroid', name: { zh: '水刑天', en: 'Hydroid' } },
                { key: 'Mirage', name: { zh: '幻影', en: 'Mirage' } },
                { key: 'Limbo', name: { zh: '灵薄狱', en: 'Limbo' } },
              ],
              hardChoices: [
                { key: 'Dera', name: { zh: '德拉', en: 'Dera' } },
                { key: 'Cestra', name: { zh: '锡斯特', en: 'Cestra' } },
                { key: 'Okina', name: { zh: '奥金刀', en: 'Okina' } },
                { key: 'Sybaris', name: { zh: '席芭莉丝', en: 'Sybaris' } },
                { key: 'Sicarus', name: { zh: '席卡鲁斯', en: 'Sicarus' } },
              ],
            },
          },
        }),
      },
      {
        name: 'archimedea-light.png',
        png: await renderArchimedeaCard({
          locale: 'zh',
          skin: 'light',
          worldstate: {
            ...baseWs(),
            ...EMPTY_WORLDSTATE_MISSION_SLICES,
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
                          riskKeys: ['AcceleratedEnemies'],
                          risks: [{ zh: '加速敌军', en: 'Accelerated Enemies' }],
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
                          riskKeys: ['Deflectors'],
                          risks: [{ zh: '偏转护盾', en: 'Deflectors' }],
                        },
                      ],
                    },
                  ],
                  variableKeys: ['NoPets'],
                  variables: [{ zh: '禁用同伴', en: 'No Pets Allowed' }],
                },
              ],
            },
          },
        }),
      },
      {
        name: 'bounties-light.png',
        png: await renderBountiesCard({
          locale: 'zh',
          skin: 'light',
          worldstate: {
            ...baseWs(),
            ...EMPTY_WORLDSTATE_MISSION_SLICES,
            bounties: [
              {
                tag: 'CetusSyndicate',
                name: { zh: '希图斯平原', en: 'Cetus Plains' },
                activation: new Date(Date.now() - 3_600_000).toISOString(),
                expiry: new Date(Date.now() + 5_400_000).toISOString(),
                jobs: [
                  {
                    jobType: '/Lotus/Types/Gameplay/Eidolon/Jobs/SabotageBountySab',
                    title: { zh: '破坏赏金', en: 'Sabotage Bounty' },
                    minEnemyLevel: 5,
                    maxEnemyLevel: 15,
                    rewards: [
                      {
                        uniqueName: '/Lotus/Types/Items/MiscItems/OrokinCatalyst',
                        name: { zh: 'Orokin 催化剂', en: 'Orokin Catalyst' },
                        iconUrl: TINY_ICON,
                        quantity: 1,
                      },
                    ],
                  },
                  {
                    jobType: '/Lotus/Types/Gameplay/Eidolon/Jobs/AttritionBountySab',
                    title: { zh: '消耗赏金', en: 'Attrition Bounty' },
                    minEnemyLevel: 10,
                    maxEnemyLevel: 30,
                    rewards: [
                      {
                        uniqueName: '/Lotus/Types/Items/MiscItems/NanoSpores',
                        name: { zh: '纳米孢子', en: 'Nano Spores' },
                        iconUrl: TINY_ICON,
                        quantity: 1500,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }),
      },
      {
        name: 'cycles-light.png',
        png: await renderWorldstateCard({
          locale: 'zh',
          skin: 'light',
          worldstate: {
            ...baseWs(),
            ...EMPTY_WORLDSTATE_MISSION_SLICES,
            cycles: [
              {
                id: 'earth',
                name: { zh: '地球', en: 'Earth' },
                state: 'day',
                stateLabel: { zh: '白昼', en: 'Day' },
                expiry: new Date(Date.now() + 21 * 60_000).toISOString(),
                remainingMs: 21 * 60_000 + 43_000,
                progress: 0.55,
              },
              {
                id: 'cetus',
                name: { zh: '希图斯（平原）', en: 'Cetus' },
                state: 'day',
                stateLabel: { zh: '白昼', en: 'Day' },
                expiry: new Date(Date.now() + 21 * 60_000).toISOString(),
                remainingMs: 21 * 60_000 + 43_000,
                progress: 0.55,
              },
              {
                id: 'cambion',
                name: { zh: '魔胎之境', en: 'Cambion' },
                state: 'fass',
                stateLabel: { zh: 'Fass', en: 'Fass' },
                expiry: new Date(Date.now() + 21 * 60_000).toISOString(),
                remainingMs: 21 * 60_000 + 43_000,
                progress: 0.55,
              },
              {
                id: 'vallis',
                name: { zh: '奥布山谷', en: 'Vallis' },
                state: 'cold',
                stateLabel: { zh: '寒冷', en: 'Cold' },
                expiry: new Date(Date.now() + 4 * 60_000).toISOString(),
                remainingMs: 4 * 60_000 + 2_000,
                progress: 0.7,
              },
              {
                id: 'duviri',
                name: { zh: '双衍王境', en: 'Duviri' },
                state: 'anger',
                stateLabel: { zh: '愤怒', en: 'Anger' },
                expiry: new Date(Date.now() + 58 * 60_000).toISOString(),
                remainingMs: 58 * 60_000 + 6_000,
                progress: 0.35,
              },
              {
                id: 'zariman',
                name: { zh: '扎里曼', en: 'Zariman' },
                state: 'corpus',
                stateLabel: { zh: 'Corpus', en: 'Corpus' },
                expiry: new Date(Date.now() + 71 * 60_000).toISOString(),
                remainingMs: 71 * 60_000,
                progress: 0.45,
              },
            ],
          },
        }),
      },
    ];

    for (const job of jobs) {
      writeFileSync(resolve(outDir, job.name), job.png);
      expect(job.png.length).toBeGreaterThan(1000);
    }
  }, 180_000);
});
