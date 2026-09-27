<!-- BEGIN codex-smart-router default -->
默认使用全局 `codex-smart-router` skill；新任务或聊天中任务难度明显变化时重新评估模型与推理强度。仅在切换会明显影响质量或成本时，简短建议档位和原因，不重复提醒。尊重用户指定的模型或停用要求。

普通聊天不额外调用路由模型或 Jev。桌面聊天无法由 skill 自动切换模型；可提示使用模型选择器、`/model` 或 `/reasoning`，继续完成任务。当前模型未知时不猜测。新 CLI 任务用 `codex-smart`；仅查询用 `--route`。不为路由创建聊天或子代理。Jev credit 耗尽时说明未完成工作；无余额后台监控。
<!-- END codex-smart-router default -->
