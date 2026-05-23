/**
 * @file index.ts
 * @module agent-gate
 * @description pi-package extension that enforces a maximum of 1 concurrent
 *   subagent by intercepting `tool_call` events and blocking `subagent` spawns
 *   when one is already pending.
 *
 * @author Adam
 * @version 1.0.0
 *
 * ## How It Works
 *
 * 1. On `session_start`, registers itself and shows status in the UI.
 * 2. On every `tool_call`, checks if the tool being called is `subagent`.
 * 3. If a subagent is already pending (`pending >= 1`), blocks the spawn
 *    and returns `{ block: true, reason: "..." }`.
 * 4. If no subagent is running, increments the counter and allows the spawn.
 * 5. On `agent_end`, decrements the counter, freeing the gate.
 * 6. On `tool_call_error`, if a subagent spawn failed, decrements the counter
 *    to prevent the gate from being permanently stuck.
 *
 * ## Usage
 *
 * Add this extension to your pi config to enforce single-subagent mode.
 *
 * @example
 * ```ts
 * // pi config
 * extensions: [
 *   { name: "agent-gate", path: "./extensions/index.ts" }
 * ]
 * ```
 */

/**
 * Agent-gate extension factory.
 *
 * Enforces max 1 concurrent subagent by intercepting tool_call events.
 *
 * @param pi - The pi extension API instance
 * @returns void
 *
 * @example
 * ```ts
 * export default function (pi) {
 *   // extension auto-registers via export default
 * }
 * ```
 */
export default function (pi: any): void {
  let pending = 0;

  // ------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------

  /**
   * Fired when a new session starts.
   * Announces agent-gate as active via the UI status bar.
   */
  pi.on("session_start", async (_event: any, ctx: any) => {
    if (ctx.ui) {
      ctx.ui.setStatus("agent-gate", "🔒 agent-gate active");
    }
  });

  // ------------------------------------------------------------------
  // Subagent gate
  // ------------------------------------------------------------------

  /**
   * Fired when an agent finishes (steer-back received).
   * Decrements the running counter so the next subagent can spawn.
   */
  pi.on("agent_end", async () => {
    if (pending > 0) {
      pending--;
    }
  });

  /**
   * Fired on every tool call in the session.
   * Intercepts `subagent` calls and blocks if one is already running.
   *
   * @param event - The tool_call event with `toolName` property
   * @param ctx - Context object with optional `ui` for status display
   * @returns `{ block: true, reason: string }` if blocked, `undefined` to allow
   */
  pi.on("tool_call", async (event: any, ctx: any) => {
    if (event.toolName === "subagent") {
      if (pending >= 1) {
        return {
          block: true,
          reason:
            "BLOCKED: subagent already running. Wait for steer-back.",
        };
      }
      pending++;
      if (ctx.ui) {
        ctx.ui.setStatus("agent-gate", "🔒 1 running");
      }
    }
    return undefined;
  });

  // ------------------------------------------------------------------
  // Failure recovery
  // ------------------------------------------------------------------

  /**
   * Fired when a tool call fails.
   * If a subagent spawn failed, decrement the counter to release the gate.
   */
  pi.on("tool_call_error", async (event: any) => {
    if (event.toolName === "subagent" && pending > 0) {
      pending--;
    }
  });
}
