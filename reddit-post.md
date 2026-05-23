**Title:** Built a one-agent-at-a-time extension for pi — saves my RTX 3090 from melting

**Body:**

Hey everyone,

I run Qwen3.6-27B locally on a single RTX 3090 via llama-swap. Great setup until pi's orchestrator spawns two subagents at once — llama-swap tries to load models for both simultaneously and the whole thing grinds to a halt.

So I wrote a tiny extension that blocks any second `subagent()` call while one is already running. You get a clean `"BLOCKED: subagent already running"` message instead of silently failing or OOM-crashing.

Published it as an npm package if anyone on a single-GPU setup wants it:

- **GitHub:** https://github.com/adamjen/pi-one-subagent-at-a-time
- **npm:** https://www.npmjs.com/package/@adamjen/pi-one-subagent-at-a-time

Install with: `pi install npm:@adamjen/pi-one-subagent-at-a-time`

- **pi Gallery:** [pi.dev/packages/@adamjen/pi-one-subagent-at-a-time?name=adamjen](https://pi.dev/packages/@adamjen/pi-one-subagent-at-a-time?name=adamjen)

Happy to take questions or PRs.
