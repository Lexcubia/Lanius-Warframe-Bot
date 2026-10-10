import { pickLocalized, type HelpDto, type Locale } from '@lanius/core';

/**
 * 将帮助 DTO 格式化为 QQ 文本（含用法与参数）。
 *
 * @param help - `GET /v1/help` 数据
 * @param locale - 回复 locale
 * @param options - 可选未知命令提示
 * @returns 多行纯文本
 */
export function formatHelpText(
  help: HelpDto,
  locale: Locale,
  options: { unknownRaw?: string } = {},
): string {
  const lines: string[] = [];
  if (options.unknownRaw) {
    lines.push(
      locale === 'en'
        ? `Unknown command: ${options.unknownRaw}`
        : `未知命令：${options.unknownRaw}`,
    );
    lines.push('');
  }

  lines.push(pickLocalized(help.title, locale));
  lines.push(pickLocalized(help.intro, locale));
  lines.push('');

  for (const entry of help.lines) {
    lines.push(`· ${pickLocalized(entry.usage, locale)}`);
    lines.push(`  ${pickLocalized(entry.summary, locale)}`);
    if (entry.aliases.length > 0) {
      lines.push(
        locale === 'en'
          ? `  aliases: ${entry.aliases.join(', ')}`
          : `  别名：${entry.aliases.join('、')}`,
      );
    }
    for (const param of entry.params) {
      const req =
        param.required
          ? locale === 'en'
            ? 'required'
            : '必填'
          : locale === 'en'
            ? 'optional'
            : '可选';
      const choices =
        param.choices && param.choices.length > 0
          ? ` [${param.choices.join('|')}]`
          : '';
      lines.push(
        `  - ${param.name} (${req})${choices}: ${pickLocalized(param.description, locale)}`,
      );
    }
    if (entry.examples.length > 0) {
      lines.push(
        locale === 'en'
          ? `  e.g. ${entry.examples.slice(0, 2).join(' · ')}`
          : `  例：${entry.examples.slice(0, 2).join(' · ')}`,
      );
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}
