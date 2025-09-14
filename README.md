# BlueSea - Chrome 划词翻译扩展

> 一个现代化的Chrome划词翻译扩展，完全兼容最新版Chrome (139+)，支持PDF，即点即译，拥有完整的字典功能、单词本和记忆曲线复习功能。

![](https://img.shields.io/badge/Language-JavaScript-orange.svg)
![](https://img.shields.io/badge/Manifest-V3-green.svg)
![](https://img.shields.io/badge/Chrome-139%2B-blue.svg)
![](https://img.shields.io/badge/license-MIT-000000.svg)

## 🎉 最新版本 v1.0.0

**完全兼容 Chrome 139+ 的 Manifest V3 版本！**

### ✨ 主要特性

- 🔍 **智能划词翻译**：选中单词即时显示翻译，支持智能过滤
- 📖 **完整字典功能**：音标、发音、词性、详细释义
- 🌐 **多重翻译引擎**：Google Translate + Free Dictionary API + 本地字典
- 🎯 **智能识别**：自动过滤特殊符号、日志、JSON等无效内容
- 📚 **单词本管理**：收藏重要单词，支持导入导出
- 🎬 **弹幕复习**：单词以弹幕形式在页面上复习
- 📊 **记忆曲线**：基于艾宾浩斯遗忘曲线的科学复习
- 🎨 **现代UI**：简洁美观的Material Design界面

### 🔧 技术亮点

- **Manifest V3**：完全兼容最新Chrome扩展标准
- **Service Worker**：高性能的后台处理
- **智能缓存**：翻译结果本地缓存，提升响应速度
- **多层降级**：本地字典 → API翻译 → 缓存，确保可用性
- **React Components**：使用HTM构建的现代化组件

## 📦 安装使用

### 从源码安装

1. 下载本项目代码
   ```bash
   git clone https://github.com/your-username/BlueSea.git
   cd BlueSea
   ```

2. 打开Chrome浏览器，进入扩展管理页面
   ```
   chrome://extensions/
   ```

3. 开启"开发者模式"（右上角开关）

4. 点击"加载已解压的扩展程序"，选择项目文件夹

5. 安装完成后即可使用

### 使用方法

1. **划词翻译**：在任意网页选中英文单词，自动显示翻译弹窗
2. **单词收藏**：点击翻译弹窗中的"收藏"按钮
3. **单词本管理**：点击扩展图标进入单词本管理页面
4. **弹幕复习**：在设置中开启弹幕功能，单词会以弹幕形式出现

## 🎯 智能过滤功能

- ✅ 必须包含连续3个及以上字母才触发翻译
- ✅ 过滤包含特殊符号的非纯净单词
- ✅ 过滤超长字符串（日志、JSON、代码等）
- ✅ 智能识别句子与单词，避免误触发
- ✅ 排除代码块和特殊标签内的内容

## 🌐 支持的翻译源

1. **本地字典**：50+常用单词，即时响应
2. **Free Dictionary API**：提供音标、发音、词性、释义
3. **Google Translate**：高质量中英翻译
4. **Microsoft Translator**：备用翻译服务
5. **智能缓存**：自动缓存翻译结果

## 📁 项目结构

```
BlueSea/
├── manifest.json                   # Manifest V3 配置文件
├── background/
│   └── service-worker-unified.js   # Service Worker (统一翻译引擎)
├── content_scripts/
│   ├── selection.js                # 选择和过滤逻辑
│   ├── tip.js                      # 翻译弹窗组件
│   ├── highlighter.js              # 单词高亮
│   └── bullet-screens.js           # 弹幕功能
├── popup/
│   ├── popup.html                  # 弹窗页面
│   ├── app.js                      # 主应用逻辑
│   └── page-*.js                   # 各功能页面
├── lib/                            # 第三方库
├── images/                         # 功能演示图片
└── logic.js                       # 核心业务逻辑
```

## 🔄 版本历史

查看 [CHANGELOG.md](CHANGELOG.md) 了解详细的版本更新记录。

### 主要更新

- **v1.0.0 (2024-12-19)**：Manifest V3 完全升级，全新翻译引擎
- **v0.0.1 (2020-12-24)**：初始版本，基础功能

## 🛠️ 开发

### 开发环境

- Node.js (可选，用于开发工具)
- Chrome 浏览器 88+

### 开发调试

1. 修改代码后，在 `chrome://extensions/` 页面点击"重新加载"
2. 打开网页，按F12查看控制台输出
3. Service Worker调试：在扩展详情页点击"Service Worker"

### 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/new-feature`)
3. 提交更改 (`git commit -am 'Add new feature'`)
4. 推送到分支 (`git push origin feature/new-feature`)
5. 创建 Pull Request

## 📝 许可证

MIT License - 查看 [LICENSE](LICENSE) 了解详情

## 🙏 致谢

- [Free Dictionary API](https://dictionaryapi.dev/) - 提供英文词典数据
- [Google Translate](https://translate.google.com/) - 翻译服务
- 原项目的所有贡献者

## 📞 支持

如有问题或建议，请：

1. 查看 [Issues](https://github.com/your-username/BlueSea/issues)
2. 创建新的 Issue
3. 查看项目文档

---

**Made with ❤️ for English learners**
