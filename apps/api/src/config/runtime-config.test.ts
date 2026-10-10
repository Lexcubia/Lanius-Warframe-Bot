import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { deepMerge, loadLabelsConfig, loadSiteConfig } from './runtime-config.js';

describe('runtime-config', () => {
  it('deepMerges nested records and replaces arrays', () => {
    const merged = deepMerge(
      { a: 1, nest: { x: 1, y: 2 }, list: [1] },
      { nest: { y: 9 }, list: [2, 3] },
    );
    expect(merged).toEqual({ a: 1, nest: { x: 1, y: 9 }, list: [2, 3] });
  });

  it('merges default and local site/labels with fallback', () => {
    const root = mkdtempSync(join(tmpdir(), 'lanius-runtime-'));
    mkdirSync(join(root, 'default'), { recursive: true });
    mkdirSync(join(root, 'local'), { recursive: true });
    writeFileSync(
      join(root, 'default', 'site.yaml'),
      'footer:\n  copyright: Default\n  lines: []\n',
      'utf8',
    );
    writeFileSync(
      join(root, 'local', 'site.yaml'),
      "footer:\n  lines:\n    - text: '粤ICP备测试号'\n      href: 'https://beian.miit.gov.cn/'\n",
      'utf8',
    );
    writeFileSync(
      join(root, 'default', 'labels.yaml'),
      'factions:\n  FC_GRINEER:\n    zh: 格林尼尔\nnodes: {}\npaths: {}\n',
      'utf8',
    );
    writeFileSync(
      join(root, 'local', 'labels.yaml'),
      'factions:\n  FC_GRINEER:\n    zh: 自定义格\n',
      'utf8',
    );

    const site = loadSiteConfig(root);
    expect(site.footer.copyright).toBe('Default');
    expect(site.footer.lines[0]?.text).toContain('ICP');

    const labels = loadLabelsConfig(root);
    expect(labels.factions.FC_GRINEER?.zh).toBe('自定义格');
  });
});
