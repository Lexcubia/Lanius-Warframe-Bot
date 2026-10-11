/**
 * 轮换表常用武器英文名 → PublicExport uniqueName。
 *
 * 键为社区/配置侧英文展示名；值为 ExportWeapons 目录键（非 StoreItems）。
 * 用于补齐图标与 languageString 译名；未列入时仍回退 labels.weapons。
 */
export const WEAPON_UNIQUE_NAMES: Readonly<Record<string, string>> = {
  // Ergo Glast 信条近战 / speargun
  'Tenet Agendus':
    '/Lotus/Weapons/Corpus/Melee/ShieldAndSword/CrpHammerShield/CrpHammerShield',
  'Tenet Exec': '/Lotus/Weapons/Tenno/Melee/Swords/CrpBigSlash/CrpBigSlash',
  'Tenet Livia':
    '/Lotus/Weapons/Corpus/Melee/CrpBriefcase2HKatana/CrpBriefcase2HKatana',
  'Tenet Grigori':
    '/Lotus/Weapons/Corpus/Melee/CrpBriefcaseScythe/CrpBriefcaseScythe',
  'Tenet Ferrox':
    '/Lotus/Weapons/Corpus/BoardExec/Primary/CrpBEFerrox/CrpBEFerrox',
  // Sisters 信条（旧表兼容）
  'Tenet Arca Plasmor':
    '/Lotus/Weapons/Corpus/BoardExec/Primary/CrpBEArcaPlasmor/CrpBEArcaPlasmor',
  'Tenet Envoy':
    '/Lotus/Weapons/Corpus/LongGuns/CrpBriefcaseLauncher/CrpBriefcaseLauncher',
  'Tenet Tetra':
    '/Lotus/Weapons/Corpus/BoardExec/Primary/CrpBETetra/CrpBETetra',
  'Tenet Cycron':
    '/Lotus/Weapons/Corpus/BoardExec/Secondary/CrpBECycron/CrpBECycron',
  'Tenet Detron':
    '/Lotus/Weapons/Corpus/BoardExec/Secondary/CrpBEDetron/CrpBEDetron',
  'Tenet Diplos':
    '/Lotus/Weapons/Corpus/Pistols/CrpBriefcaseAkimbo/CrpBriefcaseAkimboPistol',
  'Tenet Flux Rifle':
    '/Lotus/Weapons/Corpus/BoardExec/Primary/CrpBEFluxRifle/CrpBEFluxRifle',
  'Tenet Spirex':
    '/Lotus/Weapons/Corpus/Pistols/CrpIgniterPistol/CrpIgniterPistol',
  // Eleanor 终幕 Batch A / B
  'Coda Hema': '/Lotus/Weapons/Infested/InfestedLich/LongGuns/CodaHema',
  'Coda Sporothrix':
    '/Lotus/Weapons/Infested/InfestedLich/LongGuns/CodaSporothrix',
  'Coda Synapse': '/Lotus/Weapons/Infested/InfestedLich/LongGuns/CodaSynapse',
  'Coda Catabolyst':
    '/Lotus/Weapons/Infested/InfestedLich/Pistols/CodaCatabolyst',
  'Coda Dual Torxica':
    '/Lotus/Weapons/Infested/InfestedLich/Pistols/1999InfSporePistol/1999InfSporePistolWeapon',
  'Dual Coda Torxica':
    '/Lotus/Weapons/Infested/InfestedLich/Pistols/1999InfSporePistol/1999InfSporePistolWeapon',
  'Coda Pox': '/Lotus/Weapons/Infested/InfestedLich/Pistols/CodaPox',
  'Coda Mire': '/Lotus/Weapons/Infested/InfestedLich/Melee/CodaMire',
  'Coda Motovore':
    '/Lotus/Weapons/Infested/InfestedLich/Melee/InfestedHammer/InfLichHammerWeapon',
  'Coda Bubonico':
    '/Lotus/Weapons/Infested/InfestedLich/LongGuns/CodaBubonico/CodaBubonicoCannon',
  'Coda Tysis': '/Lotus/Weapons/Infested/InfestedLich/Pistols/CodaTysis',
  'Coda Hirudo': '/Lotus/Weapons/Infested/InfestedLich/Melee/CodaHirudo',
  'Coda Pathocyst':
    '/Lotus/Weapons/Infested/InfestedLich/Melee/CodaPathocyst/CodaPathocyst',
  'Coda Caustacyst':
    '/Lotus/Weapons/Infested/InfestedLich/Melee/CodaCaustacyst/CodaCaustacyst',
  'Coda Bassocyst':
    '/Lotus/Weapons/Infested/InfestedLich/LongGuns/1999InfShotgun/1999InfShotgunWeapon',
};

/**
 * 按英文武器名查找 uniqueName。
 *
 * @param weaponName - 轮换表中的英文名（大小写敏感优先，再试 trim）
 * @returns uniqueName，或 `undefined`
 */
export function lookupWeaponUniqueName(weaponName: string): string | undefined {
  const trimmed = weaponName.trim();
  return WEAPON_UNIQUE_NAMES[trimmed] ?? WEAPON_UNIQUE_NAMES[weaponName];
}
