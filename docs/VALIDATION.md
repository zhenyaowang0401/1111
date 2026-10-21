# Supermo v6 验证记录

验证日期：2026-10-22（Asia/Shanghai）。对象是当前源码与 `dist/Supermo.html`，不是 GitHub Pages 部署。

环境：Python 3.12.14、Playwright 1.62.0、Chromium 154.0.8037.57、Node.js v24.19.0（仅开发检查）。

## 实际执行

| 检查 | 结果 | 范围 |
| --- | --- | --- |
| `python scripts/build_standalone.py` | 通过 | CSS、七个 JS、新 MP3 内嵌；重复生成内容一致 |
| 七个源码 JS 的 `node --check` | 通过 | JavaScript 语法 |
| `node tests/test_rewards.js` | 通过 | 阈值、跨轮等价、零头、Demo、Break 与稳定事件 |
| `python tests/test_entry.py` | 通过 | 受限 iframe、按钮/Enter、中文名称、History 限制和无耳朵像素 |
| `python tests/test_site.py` | 通过 | 眨眼、抚摸/跳跃/禁摸、叠穿、Study/Work、跨午夜、音频、报告和响应式 |
| `python tests/test_world.py` | 通过 | 创建/颜色、编辑、进度保留、四时段、时区与示例同伴 |
| `python tests/test_journey.py` | 通过 | 部分结算、刷新去重、Demo、家园、旧数据迁移、日终确认、断网单文件和双音节波形 |
| `python tests/test_supermo.py` | 通过 | 品牌、宝箱命中与手持副本、刷新、困倦/睡眠边界、真实呼吸/鼻涕泡像素、唤醒、暂停区分、新歌时长、六种实际地层、手机宝箱和编辑 |
| 音频及兼容副本 | 通过 | 上传原件、资源和 base64 解码字节一致；旧入口与新入口内容完全相同 |

五个浏览器脚本均实际执行断言并以退出码 0 结束。时钟加速验证程序行为，不验证现实中的专注。

## 下载文件

```text
主入口: dist/Supermo.html
兼容入口: dist/LOOP_PET.html
字节数: 5960449
SHA-256: 72623d79ef65188d96c775b8dc7a751b6a332a3d0013868e3255b09534e94357
MP3: Warm Focus (3).mp3, 194.520 秒
```

旧入口供替换同一路径文件时使用；界面均为 Supermo。同一浏览器同一站点沿用原存储键；不同文件地址/文件夹的本地存储是否共享仍由浏览器决定，没有云同步。

## 验证边界

离线测试先由本地 HTTP 载入单文件，再断开网络，确认音乐与页面仍可使用。当前受管理 Chromium 禁止 file:// 导航，因此没有声称在此环境验证双击文件。没有部署或验证公网 Pages、实体手机全机型、所有浏览器，也没有真人联机。
