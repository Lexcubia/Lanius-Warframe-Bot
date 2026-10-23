/**
 * 回廊 / Circuit 上游 `Choices` 短名 → PublicExport uniqueName。
 *
 * `EndlessXpSchedule` 使用展示向短名（如 `Hydroid`、`DualToxocyst`），
 * 与 Export 路径尾段往往不一致（如 Hydroid → `Pirate/Pirate`），故需显式表。
 * 未列入时 mapper 回退为可读英文短名 + labels 覆盖。
 */
export const CIRCUIT_CHOICE_UNIQUE_NAMES: Readonly<Record<string, string>> = {
  // —— EXC_NORMAL 战甲（含常见周轮换）——
  Excalibur: '/Lotus/Powersuits/Excalibur/Excalibur',
  Trinity: '/Lotus/Powersuits/Trinity/Trinity',
  Ember: '/Lotus/Powersuits/Ember/Ember',
  Loki: '/Lotus/Powersuits/Loki/Loki',
  Mag: '/Lotus/Powersuits/Mag/Mag',
  Rhino: '/Lotus/Powersuits/Rhino/Rhino',
  Ash: '/Lotus/Powersuits/Ninja/Ninja',
  Frost: '/Lotus/Powersuits/Frost/Frost',
  Nyx: '/Lotus/Powersuits/Jade/Jade',
  Saryn: '/Lotus/Powersuits/Saryn/Saryn',
  Vauban: '/Lotus/Powersuits/Trapper/Trapper',
  Nova: '/Lotus/Powersuits/AntiMatter/Anti',
  Nekros: '/Lotus/Powersuits/Necro/Necro',
  Valkyr: '/Lotus/Powersuits/Berserker/Berserker',
  Oberon: '/Lotus/Powersuits/Paladin/Paladin',
  Hydroid: '/Lotus/Powersuits/Pirate/Pirate',
  Mirage: '/Lotus/Powersuits/Harlequin/Harlequin',
  Limbo: '/Lotus/Powersuits/Magician/Magician',
  Mesa: '/Lotus/Powersuits/Cowgirl/Cowgirl',
  Chroma: '/Lotus/Powersuits/Dragon/Dragon',
  Equinox: '/Lotus/Powersuits/YinYang/YinYang',
  Atlas: '/Lotus/Powersuits/Brawler/Brawler',
  Wukong: '/Lotus/Powersuits/MonkeyKing/MonkeyKing',
  Ivara: '/Lotus/Powersuits/Ranger/Ranger',
  Nezha: '/Lotus/Powersuits/Nezha/Nezha',
  Inaros: '/Lotus/Powersuits/Sandman/Sandman',
  Titania: '/Lotus/Powersuits/Fairy/Fairy',
  Nidus: '/Lotus/Powersuits/Infestation/Infestation',
  Octavia: '/Lotus/Powersuits/Bard/Bard',
  Gara: '/Lotus/Powersuits/Glass/Glass',
  Khora: '/Lotus/Powersuits/Khora/Khora',
  Revenant: '/Lotus/Powersuits/Revenant/Revenant',
  Garuda: '/Lotus/Powersuits/Garuda/Garuda',
  Baruuk: '/Lotus/Powersuits/Pacifist/Pacifist',
  Hildryn: '/Lotus/Powersuits/IronFrame/IronFrame',
  Wisp: '/Lotus/Powersuits/Wisp/Wisp',
  Gauss: '/Lotus/Powersuits/Runner/Runner',
  Protea: '/Lotus/Powersuits/Odalisk/Odalisk',
  Lavos: '/Lotus/Powersuits/Alchemist/Alchemist',
  Yareli: '/Lotus/Powersuits/Yareli/Yareli',
  Gyre: '/Lotus/Powersuits/Gyre/Gyre',
  Koumei: '/Lotus/Powersuits/Koumei/Koumei',

  // —— EXC_HARD 钢路 Incarnon 武器适配器 ——
  Braton: '/Lotus/Weapons/Tenno/Rifle/Rifle',
  Skana: '/Lotus/Weapons/Tenno/Melee/LongSword/LongSword',
  Paris: '/Lotus/Weapons/Tenno/Bows/HuntingBow',
  Kunai: '/Lotus/Weapons/Tenno/ThrowingWeapons/Kunai',
  Bo: '/Lotus/Weapons/Tenno/Melee/Staff/Staff',
  Furis: '/Lotus/Weapons/Tenno/Pistol/AutoPistol',
  Furax: '/Lotus/Weapons/Tenno/Melee/Fist/Fist',
  Strun: '/Lotus/Weapons/Tenno/Shotgun/Shotgun',
  Boltor: '/Lotus/Weapons/Tenno/Rifle/BoltoRifle',
  Lex: '/Lotus/Weapons/Tenno/Pistol/HeavyPistol',
  Angstrum: '/Lotus/Weapons/Corpus/Pistols/CrpHandRL/CorpusHandRocketLauncher',
  Gorgon: '/Lotus/Weapons/Tenno/Rifle/HeavyRifle',
  Anku: '/Lotus/Weapons/Tenno/Melee/Scythe/ParisScythe/ParisScythe',
  Soma: '/Lotus/Weapons/Tenno/Rifle/TennoAR',
  Vasto: '/Lotus/Weapons/Tenno/Pistol/RevolverPistol',
  DualToxocyst: '/Lotus/Weapons/Infested/Pistols/InfVomitGun/InfVomitGunWep',
  Atomos: '/Lotus/Weapons/Grineer/Pistols/HeatGun/GrnHeatGun',
  NamiSolo: '/Lotus/Weapons/Tenno/Melee/Swords/CutlassAndPoignard/TennoCutlass',
  DualIchor: '/Lotus/Weapons/Tenno/Melee/Axe/DualInfestedAxesWeapon',
  Miter: '/Lotus/Weapons/Grineer/LongGuns/GrineerSawbladeGun/SawBladeGun',
  AckAndBrunt: '/Lotus/Weapons/Grineer/Melee/GrineerTylAxeAndBoar/RegorAxeShield',
  Torid: '/Lotus/Weapons/ClanTech/Bio/BioWeapon',
  DualCleaver: '/Lotus/Weapons/Grineer/Melee/GrineerMachetteAndCleaver/DualCleaverWeapon',
  DualCleavers: '/Lotus/Weapons/Grineer/Melee/GrineerMachetteAndCleaver/DualCleaverWeapon',
  Sicarus: '/Lotus/Weapons/Tenno/Pistol/BurstPistol',
  Cestra: '/Lotus/Weapons/Corpus/Pistols/CorpusMinigun/CorpusMinigun',
  Okina: '/Lotus/Weapons/Tenno/Melee/Swords/TennoSai/TennoSais',
  Sybaris: '/Lotus/Weapons/Tenno/LongGuns/TnoLeverAction/TnoLeverActionRifle',
  Dera: '/Lotus/Weapons/ClanTech/Energy/EnergyRifle',
  Despair: '/Lotus/Weapons/Tenno/ThrowingWeapons/StalkerKunai',
  Hate: '/Lotus/Weapons/Tenno/Melee/Scythe/StalkerScytheWeapon',
  Burston: '/Lotus/Weapons/Tenno/Rifle/BurstRifle',
  Glaive: '/Lotus/Weapons/Tenno/Melee/Glaives/LightGlaive/LightGlaiveWeapon',
  Magnus: '/Lotus/Weapons/Tenno/Pistols/Magnum/Magnum',
  CeramicDagger: '/Lotus/Weapons/Tenno/Melee/Dagger/CeramicDagger',
  DarkDagger: '/Lotus/Weapons/Tenno/Melee/Dagger/DarkDagger',
  Sheev: '/Lotus/Weapons/Grineer/Melee/GrineerCombatKnife/GrineerCombatKnife',
  Sibear: '/Lotus/Weapons/Tenno/Melee/Hammer/IceHammer/IceHammer',
  Boar: '/Lotus/Weapons/Tenno/Shotgun/FullAutoShotgun',
};

/**
 * 按回廊 Choices 短名查找 uniqueName。
 *
 * @param choiceKey - 上游 `Choices[]` 原始字符串（大小写敏感优先）
 * @returns PublicExport uniqueName；未收录时 `undefined`
 */
export function lookupCircuitChoiceUniqueName(choiceKey: string): string | undefined {
  const trimmed = choiceKey.trim();
  if (!trimmed) {
    return undefined;
  }
  return CIRCUIT_CHOICE_UNIQUE_NAMES[trimmed] ?? CIRCUIT_CHOICE_UNIQUE_NAMES[choiceKey];
}
