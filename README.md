# @adamjen/pi-one-subagent-at-a-time

**Enforces sequential subagent execution — prevents concurrent subagent spawns.**

---

## Why This Exists

This extension was born from a real hardware constraint.

I'm running a **Qwen3.6-27B orchestrator** on an **RTX 3090** (24GB VRAM) using **llama-swap** for model swapping between agents. The orchestrator would naturally want to spawn multiple subagents simultaneously — but each subagent spawn triggers a model swap, which means:

1. **Unload current model from VRAM**
2. **Load new model into VRAM** (takes seconds per swap)
3. **Reload full context** (adds more overhead)

With 3-4 agents spawning concurrently, this meant constant swapping — models loading and unloading in rapid succession. The time overhead was massive: what should take 10 seconds of actual work would take 60+ seconds just waiting for model swaps to complete.

The solution? **Force subagents to run one at a time.** No concurrent spawns, no model swapping chaos, no unnecessary context reloads. Just clean sequential execution.

If you're running local models on a single-GPU setup and experiencing similar slowdowns from agent spawning, this extension solves that problem.

---

## What It Does

Blocks concurrent `subagent()` tool calls. When one subagent is already running, subsequent spawn attempts are blocked with a clear message until the first completes.

**Before:** Orchestrator spawns 3 agents simultaneously → model swapping chaos → 60+ second delays  
**After:** Agents run sequentially → no swapping overhead → clean execution flow

---

## Install

```bash
pi install npm:@adamjen/pi-one-subagent-at-a-time
```

Or try without installing:

```bash
pi -e npm:@adamjen/pi-one-subagent-at-a-time
```

For local development:

```bash
pi install ~/projects/pi-one-subagent-at-a-time
```

---

## How It Works

The extension hooks into three pi lifecycle events:

1. **`session_start`** — Shows status indicator ("🔒 agent-gate active")
2. **`tool_call`** — Intercepts `subagent` calls; blocks if one is already pending
3. **`agent_end`** — Decrements the pending counter when an agent finishes

```typescript
// Simplified logic
let pending = 0;

pi.on("tool_call", async (event, ctx) => {
  if (event.toolName === "subagent") {
    if (pending >= 1) {
      return { block: true, reason: "BLOCKED: subagent already running. Wait for steer-back." };
    }
    pending++;
  }
});

pi.on("agent_end", async () => {
  if (pending > 0) pending--;
});
```

---

## Target Audience

This extension is ideal for users who:

- **Run local models** on single-GPU hardware (RTX 3090, 4090, etc.)
- **Use model swapping** (llama-swap or similar) between agents
- **Experience slowdowns** from concurrent agent spawns causing context reloads
- **Want predictable sequential execution** rather than parallel chaos

If you have multiple GPUs or cloud models with no swap overhead, this extension is optional — but it still enforces cleaner execution patterns.

---

## Configuration

No configuration needed — works out of the box with a hard limit of **1 concurrent subagent**.

The status indicator shows in the pi TUI:
- `🔒 agent-gate active` — extension loaded, no agents running
- `🔒 1 running` — one subagent is currently executing

---

## Browse All Packages

**[pi.dev/packages/@adamjen/pi-one-subagent-at-a-time?name=adamjen](https://pi.dev/packages/@adamjen/pi-one-subagent-at-a-time?name=adamjen)** — browse all my pi extensions.

## License

MIT
