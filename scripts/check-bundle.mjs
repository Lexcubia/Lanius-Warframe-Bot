import { readFileSync } from 'node:fs';

const api = readFileSync('apps/api/dist/index.js', 'utf8');
console.log('api bytes', api.length);
console.log('api imports @lanius/core', api.includes('from "@lanius/core"') || api.includes("from '@lanius/core'"));
console.log('api imports warframe-worldstate-data', api.includes('warframe-worldstate-data'));

const bot = readFileSync('apps/bot/dist/index.js', 'utf8');
console.log('bot bytes', bot.length);
console.log('bot imports @lanius/', /from ["']@lanius\//.test(bot));
console.log('bot imports @resvg', bot.includes('@resvg'));
