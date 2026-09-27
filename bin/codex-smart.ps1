# No execution-policy changes; direct Node invocation is also supported.
$router = Join-Path $PSScriptRoot '../skills/codex-smart-router/scripts/router.mjs'
& node $router @args
exit $LASTEXITCODE
