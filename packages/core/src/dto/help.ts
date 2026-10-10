import { z } from 'zod';

import { LocalizedNameSchema } from './worldstate.js';

/**
 * 帮助条目中的单个参数说明。
 */
export const HelpParamSchema = z.object({
  name: z.string().min(1),
  required: z.boolean().default(false),
  description: LocalizedNameSchema,
  choices: z.array(z.string()).optional(),
});

/**
 * 帮助参数 DTO。
 */
export type HelpParam = z.infer<typeof HelpParamSchema>;

/**
 * `GET /v1/help` 返回的单条指令帮助。
 */
export const HelpLineSchema = z.object({
  id: z.string().min(1),
  command: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  summary: LocalizedNameSchema,
  usage: LocalizedNameSchema,
  params: z.array(HelpParamSchema).default([]),
  examples: z.array(z.string()).default([]),
});

/**
 * 帮助行 DTO。
 */
export type HelpLine = z.infer<typeof HelpLineSchema>;

/**
 * 供 bot/web 展示的命令帮助载荷。
 */
export const HelpDtoSchema = z.object({
  title: LocalizedNameSchema,
  intro: LocalizedNameSchema,
  lines: z.array(HelpLineSchema),
});

/**
 * 规范化帮助 DTO。
 */
export type HelpDto = z.infer<typeof HelpDtoSchema>;
