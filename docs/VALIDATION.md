# 本次验证记录

验证日期：2026-10-22（Asia/Shanghai）。对象为 v5 源码与重新生成的 `dist/LOOP_PET.html`，不代表 GitHub Pages 已部署。

## 环境

Python 3.12.14、Playwright 1.62.0、Chromium 154.0.8037.57（Debian Linux）；Node.js v24.19.0 用于语法和纯奖励规则检查，不是游戏运行依赖。

## 实际结果

| 检查 | 结果 | 范围 |
| --- | --- | --- |
| `python scripts/build_standalone.py` | 通过 | 六个脚本、CSS 与完整 MP3 内嵌；重复生成字节相同 |
| 六个源码 JS 的 `node --check` | 通过 | 语法检查 |
| `node tests/test_rewards.js` | 通过 | 阈值、连续与拆轮等价、零头、无封顶、Demo、Break、事件唯一与刷新稳定 |
| `python tests/test_entry.py` | 通过 | 两种禁止表单的 iframe、中文与 Enter、受限 History、无耳朵像素回归 |
| `python tests/test_site.py` | 通过 | 眨眼、抚摸/跳跃/禁摸、叠穿、提前结束、Study/Work、跨午夜、图表与日历、MP3 与音量、迁移、24 个响应式游戏视图 |
| `python tests/test_world.py` | 通过 | 创建、颜色与名字、编辑保存/取消、四时段、手机时区、示例同伴、24 个响应式视图 |
| `python tests/test_journey.py` | 通过 | 部分任务与跨轮奖励、刷新去重、路径拾取、Demo 连续领奖、休息排除、日终确认、家具购买和持久摆放、暂停布置、简洁视图、旧运行中存档/Work/音量迁移、断网单文件播放、两段叫声波形、唤醒和手机编辑布局 |
| MP3 校验 | 通过 | 资源文件与上传的 Warm Focus (1).mp3 字节一致；单文件中解码的 base64 也一致 |
| `git diff --check` | 通过 | 无补丁空白错误 |

浏览器脚本均实际完成断言并返回退出码 0；视图组合不是独立测试用例计数。时钟加速验证逻辑，不证明用户真正学习。

## 单文件校验

```text
文件: dist/LOOP_PET.html
字节数: 5004759
SHA-256: 0b7820d04b20c7222137273d09df9f219f19e09707751d81bc6326918f9e4b85
```

## 边界

- 单文件测试先通过本地 HTTP 读取生成的 HTML，再断开网络；内嵌音乐继续播放、家园导航正常，无需外部资源。
- 当前受管理 Chromium 拒绝 `file://` 导航，返回 `ERR_BLOCKED_BY_ADMINISTRATOR`，因此未宣称在本环境通过双击文件测试。普通电脑的文件存储规则仍取决于浏览器。
- 没有启用或验证 GitHub Pages 公网部署，也没有真实联机。
- 未测试所有实体手机、Safari 或所有浏览器。开发者 Demo 按用户要求仍可刷测试资源。
