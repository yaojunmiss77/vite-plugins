import { createFilter } from '@rollup/pluginutils';
import { parse } from '@vue/compiler-sfc';
import fs from 'fs';
import path from 'path';
import { FilterPattern } from 'vite';
const Promise = require('bluebird');

const readFile = Promise.promisify(fs.readFile);

interface VitePluginUniappOaPageOptions {
  prefix?: string;
  exclude?: FilterPattern;
}

/**
 * 用于给小程序页面添加 <oa-page> 标签, 以便于在小程序中使用vconsole
 * 支持从 pages.json 中读取页面列表，自动添加 oa-page 标签
 * @param options 配置项，或排除的文件（向后兼容）
 *   - prefix: 路径前缀，默认为 'src/'，用户需包含斜杠
 *   - exclude: 排除的文件模式，默认排除 'src/pages/mock/index.vue'
 * @returns
 */
export function vitePluginUniappOaPage(
  options?: string | VitePluginUniappOaPageOptions
) {
  // 参数解析，支持向后兼容
  let opts: VitePluginUniappOaPageOptions = { prefix: 'src/', exclude: 'src/pages/mock/index.vue' };

  if (typeof options === 'string') {
    // 旧方式调用：exclude 作为第一个参数
    opts.exclude = options;
  } else if (options && typeof options === 'object') {
    // 新方式调用：options 对象
    opts = { ...opts, ...options };
  }

  // 闭包变量，不依赖 this
  let cachedFilter: any = null;

  return {
    name: 'vite-plugin-uniapp-oa-page', // 必须的，将会显示在警告和错误中

    configResolved(resolvedConfig: any) {
      // 尝试从 pages.json 读取页面配置
      try {
        const pagesPath = path.resolve(resolvedConfig.root, 'src/pages.json');
        const content = fs.readFileSync(pagesPath, 'utf-8');
        const config = JSON.parse(content);

        // 检查 pages 字段是否存在且为数组
        if (Array.isArray(config.pages) && config.pages.length > 0) {
          // 构建 patterns 列表
          const patterns = config.pages
            .filter((p: any) => p && typeof p.path === 'string')
            .map((p: any) => `${opts.prefix}${p.path}.vue`);

          // 只有当有效的 patterns 时才使用 pages.json 模式
          if (patterns.length > 0) {
            cachedFilter = createFilter(patterns, opts.exclude);
            return;
          }
        }
      } catch (e) {
        // pages.json 读取或解析失败，降级到原有逻辑
      }

      // 降级到原有的 glob 模式
      cachedFilter = createFilter('src/pages/**/index.vue', opts.exclude);
    },

    async load(id: string) {
      if (!cachedFilter(id)) {
        return;
      }
      const code = await readFile(id, 'utf-8');
      const parsed = parse(code);
      const templateBlock = parsed.descriptor.template;
      if (templateBlock) {
        const originalContent = templateBlock.content;
        // 检查 originalContent 是否已经包含了 <oa-page> 标签
        if (originalContent.includes('<oa-page>')) {
          return;
        }
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
