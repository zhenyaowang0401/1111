# 鼹鼠 AI：云端接入

当前代码已具备可部署的云端聊天接口。**本次没有可用的云端 API Key，因此尚未完成真实模型首聊或验证线上可用性。** 游戏、音乐、计时和本地换装反馈不依赖这个 Key。

默认选型：开源权重 **Qwen3-8B**，通过硅基流动的 OpenAI 兼容接口托管推理。角色、上下文和示例由本仓库控制，不依赖第三方宠物聊天服务；更换服务商不必重做前端。

## Vercel 最后一步

1. 在[硅基流动控制台](https://cloud.siliconflow.cn/)创建 API Key，确认账号可使用 `Qwen/Qwen3-8B`；模型是否可用及费用以控制台为准。
2. 打开 Vercel 中这个项目 → Settings → Environment Variables，给 Production 添加以下配置：

| 名称 | 值 |
| --- | --- |
| `AI_API_KEY` | 你自己创建的服务商 Key，**不要发到聊天或写进 GitHub** |
| `AI_BASE_URL` | `https://api.siliconflow.cn/v1` |
| `AI_MODEL` | `Qwen/Qwen3-8B` |
| `AI_DISABLE_THINKING` | `true`，此 Qwen3 使用非思考聊天模式 |

3. 部署仓库最新 `main`；若代码已经部署，添加变量后需要 Redeploy。Vercel 的 Framework Preset 使用 Other，根目录为本仓库，静态入口 `index.html`；`api/chat.js` 是 Node 22 Serverless Function。不要把整个项目当作仅输出 `dist` 的静态构建，否则没有 API。
4. 打开网站，在 Mole chat 发“你好”；点击标题栏方框可打开完整对话。成功时显示模型回复；未配置时明确提示聊天服务尚未连接，不用本地台词伪装模型回答。

已有其他服务商时，把 `AI_BASE_URL` 改为其 HTTPS OpenAI 兼容 `/v1` 基址、`AI_MODEL` 改为其真实模型 ID，并使用该平台 Key。不能把平台 A 的 Key 用于平台 B。某些平台不接受 `enable_thinking` 字段，此时设 `AI_DISABLE_THINKING=false`。Qwen3 Instruct-2507 本身不输出思考段，可优先选择服务商提供的该版本；模型 ID 必须以服务商当前列表为准。

开源模型权重不等于云端推理免费。本次没有核实实时价格、免费额度或账号地区可用性，不承诺永久免费。

## 本地开发云端接口

静态游戏仍可用 Python 服务。测试 AI 接口需 Node 22+，无需 npm 安装依赖：

```sh
cp .env.example .env
# 仅在自己的编辑器中填写 .env 的 AI_API_KEY
npm run dev
```

Windows 可复制 `.env.example` 并重命名为 `.env`。然后打开 `http://localhost:8000/`。`.env` 已被 Git 忽略；开发服务不提供隐藏文件、Git 目录或服务端提示词目录。

同一服务器提供的 `dist/Eumo.html` 也可访问 `/api/chat`。直接双击 `file://` 文件或 GitHub Pages 纯静态托管不能运行 Node 接口；仍能玩离线游戏，聊天会明确提示需要网站/本地服务。游戏本身不需要服务器 Key 或 Node 运行时。

## 角色能看到什么

每次主动发送，浏览器提供一份小型快照：鼹鼠名字、设备本地日期和时间、今日 Study/Work 秒数、当前任务与运行状态、今日最近四条任务/成果、所穿戴物品 ID、最近五个游戏事件。服务器用真实服装目录将 ID 转换为名称，过滤未知角色与未知事件；不发送整个存档、全年日志或所有统计。

Break、暂停和 Demo 不会算入正式时长；跨午夜任务只取当天的记录。用户可在完整聊天窗口关闭 **Share task & focus summary**，后续请求不再附带任务、时间统计、装备或事件。先前已经发出的聊天内容不会被这一开关撤回。

消息和启用共享的摘要会发送给所配置的模型服务商。最近 24 条聊天与最近五个游戏事件只在当前浏览器保存，没有云端聊天数据库；每次传给模型的聊天节选限制为最近 12 条、合计 6000 字符。Clear conversation 清除聊天与事件，不清除游戏进度。

## 主动聊天与本地陪伴

- 你发送消息才调用 AI：可闲聊、讲小故事、学科答疑、规划学习或温和的训练安排。
- 新购衣服/眼镜、开始学习、结束一轮和完成今日总结，先触发写好的游戏台词，迅速反馈，不暗中调用收费模型。
- 模型下次收到消息时能读到这些真实事件，因此能具体回应新眼镜或刚完成的一轮。
- 角色不自动修改任务、日历、星星、装备或奖励；规划仅是建议。换装没有效率加成，聊天也不会暂停你的计时。

## 测试、调校与“训练”的边界

```sh
npm run test:ai
python tests/test_chat.py
python tests/test_viewport.py
npm run export:sft
```

这些检查使用受控测试服务，验证传输、上下文、时长口径、错误恢复、界面和密钥隔离，**不是模型效果评分**。

实际使用的角色规则位于 [persona.cjs](../ai/persona.cjs)，可直接复制的版本为 [完整提示词](../ai/prompt-system.zh-CN.txt)。目前有 [20 条双语示范](../ai/examples.json)，运行时按意图/语言选两条；[training-seed.jsonl](../ai/training-seed.jsonl) 是导出的 SFT 种子数据。

这是提示词与 few-shot 示例设计。**没有下载权重、运行 LoRA/SFT、训练出新模型，或取得真实模型质量分数。** 20 条示例不足以证明稳定的生产效果。以后若做微调，应先收集经授权、去隐私、覆盖不同用户状态的对话并单独留出评测集。

配置真正 Key 后，可以先只跑一个评测场景：

```sh
npm run eval:ai -- new-glasses
# 再运行完整 16 个独立场景，会产生服务商调用费用
npm run eval:ai
```

结果写入被 Git 忽略的 `test-results/ai-live-evaluation.json`。脚本只检查有限的格式/关键词，语气、事实、解题准确性和计划总时长仍需按每条 rubric 人工验收；不会把关键词命中冒充模型“训练成功”。缺 Key 时脚本直接失败，不能生成假的评测结果。

## 发布时的实际限制

接口只接受同站 JSON POST，输入最多 2000 字符，请求体最多 48KB；角色规则在服务端，客户端不能选择上游地址、模型或注入 system 角色。响应限制 400 或 900 tokens，上游超时 40 秒；错误不返回 Key 或上游原始错误内容。所有回复按纯文本绘制。

默认限流为每 IP 每函数实例一分钟 8 次，可用 `AI_RATE_LIMIT` 调整。Serverless 实例之间不共享内存，**这不是全局成本上限或完整账户防滥用系统**。公开推广前，应同时在服务商设置支出/额度限制，并按实际流量增加共享限流或账号机制。当前不保存服务端聊天日志。
