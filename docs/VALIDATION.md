# Eumo v2 · 可读性与每日返地面验证记录

验证日期：2026-10-22（Asia/Shanghai）。对象是当前源码与 `dist/Eumo.html`，不是 GitHub Pages 部署。

环境：Python 3.12.14、Playwright 1.62.0、Chromium 154.0.8037.57、Node.js v24.19.0（仅开发检查）。

## 实际执行

| 检查 | 结果 | 范围 |
| --- | --- | --- |
| `python scripts/build_standalone.py` | 通过 | CSS、九个 JS、原 MP3 与 Pixelify Sans 字体/许可内嵌；重复生成内容一致 |
| 九个源码 JS 的 `node --check` | 通过 | JavaScript 语法 |
| `node tests/test_rewards.js` | 通过 | 阈值、跨轮等价、零头、Demo、Break 与稳定事件 |
| `python tests/test_entry.py` | 通过 | 受限 iframe、按钮/Enter、中文名称、History 限制和无耳朵像素 |
| `python tests/test_site.py` | 通过 | 眨眼、抚摸/跳跃/禁摸、叠穿、Study/Work、跨午夜、音频、报告和响应式 |
| `python tests/test_world.py` | 通过 | 创建/颜色、编辑、进度保留、四时段、时区与示例同伴 |
| `python tests/test_journey.py` | 通过 | 部分结算、刷新去重、Demo、家园、旧数据迁移、日终确认、断网单文件和双音节波形 |
| `python tests/test_supermo.py` | 通过 | 品牌、宝箱命中与头顶副本、刷新、困倦/睡眠边界、真实呼吸/鼻涕泡像素、唤醒、暂停区分、新歌时长、七种实际地层、手机宝箱和编辑 |
| `python tests/test_eumo.py` | 通过 | 7/5/5/6 件服装逐件价格与购买、分类互斥、旧配饰、家园专属头顶像素、木箱格子、6 工具逐件购买和实际动画像素、免费复用与默认工具、Demo 奖励和报告隔离、手机与矮屏、实际滚轮/拖动滚动条且左侧位置不变、眼镜实际像素、最小字号、离线字体 |
| `python tests/test_daily.py` | 通过 | 大屏与手机布局、常规计时文字、Mole 文案、移除 Export、大 Finish、取消/查看不重置、返地面及刷新、成果保留、次日/跨午夜、三时区分钟与 DST、真实较小眼睛、七种脚下材质、1480px 中等宽度；隐藏动画且 RAF 暂停后完成总结，真实 Canvas 立即返地面，恢复显示和刷新保存；断网单文件同样验证 |
| 音频及兼容副本 | 通过 | MP3 上传原件、资源和 base64 解码字节一致；TTF 与内嵌字体字节一致，完整 OFL 许可在单文件内；三个入口内容相同 |

七个浏览器脚本均实际执行断言并以退出码 0 结束。时钟加速验证程序行为，不验证现实中的专注。

## 下载文件

```text
主入口: dist/Eumo.html
兼容入口: dist/Supermo.html、dist/LOOP_PET.html
字节数: 6102849
SHA-256: a3938780c7e947cb28bcafc6caedcabde6319ab69695f4de437468c7484611ab
MP3: Warm Focus (3).mp3, 194.520 秒
Logo 字体: Pixelify Sans variable TTF, 79160 字节, SIL OFL 1.1
```

旧入口供替换同一路径文件时使用；界面均为 Eumo v2。同一浏览器同一站点沿用原存储键；不同文件地址/文件夹的本地存储是否共享仍由浏览器决定，没有云同步。

## 验证边界

离线测试先由本地 HTTP 载入单文件，再断开网络，确认音乐与页面仍可使用。当前受管理 Chromium 禁止 file:// 导航，因此没有声称在此环境验证双击文件。没有部署或验证公网 Pages、实体手机全机型、所有浏览器，也没有真人联机。
