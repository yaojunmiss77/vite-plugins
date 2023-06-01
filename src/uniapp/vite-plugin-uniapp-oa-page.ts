import { createFilter } from '@rollup/pluginutils';
import { parse } from '@vue/compiler-sfc';
import fs from 'fs';
import { FilterPattern } from 'vite';
const Promise = require('bluebird');

const readFile = Promise.promisify(fs.readFile);

/**
 * 用于给小程序页面添加 <oa-page> 标签, 以便于在小程序中使用vconsole
 * @param exclude 排除的文件
 * @returns
 */
export function vitePluginUniappOaPage(exclude: FilterPattern = 'src/pages/mock/index.vue') {
  const filter = createFilter('src/pages/**/index.vue', exclude);

  return {
    name: 'vite-plugin-uniapp-oa-page', // 必须的，将会显示在警告和错误中
    async load(id: string) {
      if (!filter(id)) {
        return;
      }
      const code = await readFile(id, 'utf-8');
      const parsed = parse(code);
      const templateBlock = parsed.descriptor.template;
      if (templateBlock) {
        const originalContent = templateBlock.content;
        const wrappedContent = `<oa-page>${originalContent}</oa-page>`;
        const start = templateBlock.loc.start.offset;
        const end = templateBlock.loc.end.offset;
        const before = code.slice(0, start);
        const after = code.slice(end);
        return before + wrappedContent + after;
      }
    },
  };
}
