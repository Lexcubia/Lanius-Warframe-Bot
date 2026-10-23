/**
 * Vue SFC / 静态资源模块声明，供 `tsc` 解析 `vue-cards/*.vue` 与 PNG 导入。
 * 对齐 `@lanius/ui` 的 `shims-vue.d.ts`；截图宿主由 Vite 实际编译。
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module '*.png' {
  const src: string;
  export default src;
}
