# 语言入口调研与待确认预览

本轮只制作独立预览，未改线上语言入口。建议用地球图标＋当前语言＋下拉箭头；展开为 English / 简体中文，✓ 表示当前选项。语言名称始终显示其自身文字，不用国旗表示语言。选中后关闭，点外部或 Escape 关闭，支持键盘。

## 依据

- [W3C：Using select to Link to Localized Content](https://www.w3.org/International/questions/qa-navigation-select)：建议明确的入口、目标语言使用自身名称、使用 UTF-8、保留手动语言入口。原文讨论长列表下拉选择，只有两种语言的 Eumo 采用短展开列表是本项目的设计判断。
- [Lucide Languages](https://lucide.dev/icons/languages)：文字组合型语言/翻译图标。
- [Lucide Globe](https://lucide.dev/icons/globe)：地球图标。配上当前语言可减少被理解为网络或地区设置的歧义。

2026-11-04 官方网站在本执行环境连接受限，读取了上述项目的公开源码：
[W3C 原文](https://github.com/w3c/i18n-drafts/blob/gh-pages/questions/qa-navigation-select.en.html)、[Languages SVG](https://github.com/lucide-icons/lucide/blob/main/icons/languages.svg)、[Globe SVG](https://github.com/lucide-icons/lucide/blob/main/icons/globe.svg)。这些资料能支持图标与文案选择，不能证明某图标在所有软件中的使用比例。

[交互预览](previews/language-picker.html)：A 地球＋当前语言（推荐）；B 文/A＋当前语言。两者的菜单与选中状态一致。图形为本项目绘制的简化 SVG。
