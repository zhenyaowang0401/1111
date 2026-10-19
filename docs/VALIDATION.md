# 本次验证记录

验证日期：2026-10-20（Asia/Shanghai）。对象为整理后的当前源码与重新生成的 `dist/LOOP_PET.html`，不是 GitHub Pages 上的部署。

## 环境

- Python 3.12.14
- Playwright 1.62.0
- Chromium 154.0.8037.57，Debian Linux
- JavaScript 语法检查使用 Node.js v24.19.0；Node.js 不是游戏运行依赖

## 实际执行结果

| 检查 | 结果 | 证据范围 |
| --- | --- | --- |
| `python scripts/build_standalone.py` | 通过 | 再次构建得到同一 SHA-256，输出 101,023 字节 |
| 四个源码 JS 的 `node --check` | 通过 | JavaScript 语法有效 |
| `python tests/test_entry.py` | 通过 | 两种禁止表单的 iframe，中文名称、按钮/箭头/Enter、受限 History API、可用计时和报告、各场景耳朵区域像素检查 |
| `python tests/test_site.py` | 通过 | 抚摸、眨眼、计时、叠穿、刷新、Study 报告和跨午夜、声音、迁移；20 个游戏页/宽度组合 |
| `python tests/test_world.py` | 通过 | 创建/取消/保存、实际配色、四个时段、清晨边界、手机时区、同伴展开；24 个页面/宽度组合 |
| 单文件浏览器运行检查 | 通过 | 创建后进入 Focus、切换 Companions、四张卡片可见；只请求一个 HTML，无额外资源请求或脚本错误 |

页面/宽度组合是响应式断言覆盖量，不是独立单元测试计数。三个脚本均完成了实际浏览器断言，不是零用例运行。

## 单文件校验

```text
文件: dist/LOOP_PET.html
字节数: 101023
SHA-256: 70d5ed5c5c75f3352885f3b131efd07fc40e0dbed0d6f76aaa5b67c73bbbd20a
```

## 未在本次验证中声称完成的能力

- 没有启用或验证 GitHub Pages 公网部署。
- 同伴仍为示例数据，没有真实账号或在线同步。
- 自动化使用桌面 Chromium 的视口和移动设备/时区模拟，不等于测试了每款实体手机或所有浏览器。
- 单文件运行检查通过本地 HTTP 服务进行；各电脑浏览器对直接文件地址的存储规则可能不同。
