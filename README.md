# vite-plugin-collection

一套精心设计的 Vite 插件集合，用于增强 uni-app 开发体验。

## 功能特性

### vite-plugin-uniapp-oa-page

为小程序页面自动添加 `<oa-page>` 组件包裹，支持 vconsole 调试。

**核心优势：**
- 🎯 **智能检测**：自动检测是否已包含 `<oa-page>`，避免重复包裹
- 📝 **配置灵活**：支持从 `pages.json` 读取页面列表，自动处理
- 🔄 **向后兼容**：完全兼容现有代码，无需修改
- 🎨 **自定义前缀**：支持自定义路径前缀，适配各种项目结构

## 安装

```bash
npm install vite-plugin-collection
# 或
yarn add vite-plugin-collection
# 或
pnpm add vite-plugin-collection
```

## 使用方法

### 基础用法

在 `vite.config.ts` 中配置：

```typescript
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { vitePluginUniappOaPage } from 'vite-plugin-collection'

export default defineConfig({
  plugins: [
    uni(),
    vitePluginUniappOaPage(),
  ]
})
```

### 高级配置

#### 从 pages.json 读取页面

当项目中有 `pages.json` 文件时，插件会自动从中读取页面列表，无需额外配置：

```typescript
vitePluginUniappOaPage({ prefix: 'src/' })
```

**pages.json 示例：**
```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页"
      }
    },
    {
      "path": "pages/mock/index",
      "style": {
        "navigationBarTitleText": "登录"
      }
    }
  ]
}
```

对应的页面文件会自动处理：
- `src/pages/index/index.vue` ✓
- `src/pages/mock/index.vue` ✓

#### 自定义路径前缀

如果你的项目结构不同，可以自定义前缀：

```typescript
// 项目根目录直接有 pages 文件夹
vitePluginUniappOaPage({ prefix: '' })

// 或其他自定义结构
vitePluginUniappOaPage({ prefix: 'myapp/src/' })
```

#### 排除特定页面（兼容用法）

保留原有的 exclude 参数以排除特定页面：

```typescript
// 旧方式
vitePluginUniappOaPage('src/pages/mock/index.vue')

// 新方式结合 exclude
vitePluginUniappOaPage({
  prefix: 'src/',
  exclude: 'src/pages/mock/index.vue'
})

// pages.json 模式下也可以使用 exclude
vitePluginUniappOaPage({
  prefix: 'src/',
  exclude: 'src/pages/mock/index.vue'
})
// 此时 pages.json 中的页面列表和 exclude 都会生效
// 结果：处理 pages.json 中的页面，但排除匹配 exclude 的页面
```

## 工作原理

### 处理流程

1. **配置阶段**（configResolved）
   - 读取项目根目录的 `pages.json` 文件
   - 解析 pages 数组，提取所有页面路径
   - 构建文件匹配列表：`${prefix}${page.path}.vue`
   - 创建文件过滤器用于后续处理

2. **编译阶段**（load hook）
   - 对每个 Vue 文件进行检查
   - 若文件在处理列表中，执行模板包裹
   - 检查是否已包含 `<oa-page>` 标签，避免重复包裹
   - 返回修改后的代码

### 自动降级机制

- 当 `pages.json` 不存在或格式无效时，插件自动降级到原有的 glob 模式
- 保证现有项目无缝升级，无任何破坏性改动

## 配置选项

```typescript
interface VitePluginUniappOaPageOptions {
  /**
   * 路径前缀，默认为 'src/'
   * 用户需包含斜杠（如果需要）
   *
   * @example
   * prefix: 'src/'        // src/pages/index/index.vue
   * prefix: ''            // pages/index/index.vue
   * prefix: 'myapp/src/'  // myapp/src/pages/index/index.vue
   */
  prefix?: string

  /**
   * 排除的文件模式，默认排除 'src/pages/mock/index.vue'
   * 在 pages.json 模式和降级模式下都有效
   *
   * @example
   * exclude: 'src/pages/mock/index.vue'
   * exclude: ['src/pages/mock/**', 'src/pages/test/**']
   */
  exclude?: FilterPattern
}
```

## 常见问题

### Q: 插件如何决定是否使用 pages.json？

A: 插件按以下优先级处理：
1. 首先尝试读取项目根目录的 `pages.json`
2. 如果成功读取且包含有效的 pages 数组，使用 pages.json 模式
3. 若失败，自动降级到原有的 glob 模式（`src/pages/**/index.vue`）

### Q: 我的页面没有被正确处理，怎么办？

A: 请检查以下几点：
1. **pages.json 配置**：确保 pages 字段存在且为数组
2. **page.path 格式**：path 应该是相对路径，不需要 `.vue` 后缀
3. **prefix 设置**：检查 prefix 是否与实际文件结构匹配
4. **文件存在**：对应的 `.vue` 文件是否真的存在

### Q: 为什么某些页面没有被包裹 oa-page？

A: 检查以下可能的原因：
1. 页面不在 pages.json 的 pages 数组中
2. page.path 配置错误（可能包含了 `.vue` 后缀）
3. 文件已经包含了 `<oa-page>` 标签（插件会检测并跳过）

### Q: 可以不使用 pages.json 吗？

A: 完全可以。只需要不配置 pages.json 或将其删除，插件会自动使用原有的 glob 模式处理 `src/pages/**/index.vue`。

### Q: exclude 参数有什么作用？

A: exclude 参数用于排除特定的页面，使其不被添加 `<oa-page>` 标签。它在两种模式下都有效：

- **降级模式**（没有 pages.json）：排除匹配 glob 模式的文件
  ```typescript
  vitePluginUniappOaPage('src/pages/mock/index.vue')
  // 处理 src/pages 下的所有 index.vue，除了 mock
  ```

- **pages.json 模式**：从 pages.json 的页面列表中排除匹配的文件
  ```typescript
  vitePluginUniappOaPage({
    prefix: 'src/',
    exclude: 'src/pages/mock/index.vue'
  })
  // 处理 pages.json 中的页面，除了 mock
  ```

默认值是 `'src/pages/mock/index.vue'`，即默认排除 mock 页面。

### Q: prefix 必须包含斜杠吗？

A: 是的，prefix 由用户包含斜杠。这样的设计更灵活：
- `'src/'` 会被拼接为 `src/pages/index/index.vue`
- `''` 会被拼接为 `pages/index/index.vue`
- `'myapp/src/'` 会被拼接为 `myapp/src/pages/index/index.vue`

## 完整示例

### 项目结构

```
project/
├── pages.json
├── src/
│   ├── pages/
│   │   ├── index/
│   │   │   └── index.vue
│   │   └── mock/
│   │       └── index.vue
│   └── ...
├── vite.config.ts
└── package.json
```

### pages.json

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页"
      }
    },
    {
      "path": "pages/mock/index",
      "style": {
        "navigationBarTitleText": "登录"
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "模版",
    "navigationBarBackgroundColor": "#ffffff"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { vitePluginUniappOaPage } from 'vite-plugin-collection'

export default defineConfig({
  plugins: [
    uni(),
    vitePluginUniappOaPage({ prefix: 'src/' })
  ]
})
```

### 处理结果

插件会自动为以下文件添加 `<oa-page>` 包裹：
- ✓ `src/pages/index/index.vue`
- ✓ `src/pages/mock/index.vue`

## 更新日志

### 1.0.5
- ✨ 新增 pages.json 配置支持
- ✨ 新增自定义路径前缀功能
- 🔄 改进参数解析，支持向后兼容
- 🐛 优化降级机制

## 许可证

ISC

## 相关资源

- [uni-app 文档](https://uniapp.dcloud.net.cn/)
- [Vite 插件开发文档](https://vitejs.dev/guide/api-plugin.html)
- [pages.json 配置说明](https://uniapp.dcloud.net.cn/collocation/pages.html)
