<!-- BEGIN codex-smart-router default -->
## 默认模型路由

默认使用全局 `codex-smart-router` skill（`~/.agents/skills/codex-smart-router/SKILL.md`）。每个新任务开始时读取该 skill（同一会话已读取则复用），按任务复杂度、失败成本和用户偏好判断合适的模型与推理强度；用户不必显式点名 skill。用户指定的模型、强度或停用路由的要求优先。

普通任务直接应用路由指导，不为每条消息额外调用分类模型或 Jev，也不反复输出路由过程。只有模型建议会明显影响结果或成本时，简短说明建议。桌面当前聊天无法由该 skill 自动切换模型；不要把建议说成已切换，也不要为等待切换而中断可以继续完成的工作。

用户要求启动新的 CLI 任务时，优先使用 `codex-smart`；仅查询路由时使用 `--route`。不要仅为路由创建聊天或启动子代理。Jev 按 skill 中的适用条件使用；明确遇到 credit 耗尽时提醒用户并说明未完成工作，无后台余额监控。
<!-- END codex-smart-router default -->
