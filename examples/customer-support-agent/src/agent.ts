import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { runTool, toolDefinitions } from "./tools.js";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

const SYSTEM_PROMPT = `You are a customer support agent for an e-commerce company.

You have three tools:
- get_customer: look up a customer's ID and identity verification status.
- lookup_order: look up an order's status, items, and refundable balance.
- process_refund: issue a refund for an order.

Rules:
- Always verify the customer's identity with get_customer before discussing order details or processing a refund. If verification_status is "unverified", explain that you cannot proceed until identity is verified and do not process a refund.
- Look up the order with lookup_order before issuing a refund, and never refund more than the order's refundable_amount.
- Be concise, empathetic, and confirm the outcome (refund ID and amount) back to the customer.
- If a tool returns an error, explain it to the customer in plain language and suggest a next step rather than retrying blindly.`;

const client = new Anthropic();

export async function runAgentTurn(history: MessageParam[]): Promise<MessageParam[]> {
  const messages = [...history];

  while (true) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) {
        console.log(`\nAgent: ${block.text.trim()}`);
      }
    }

    if (response.stop_reason !== "tool_use") {
      return messages;
    }

    const toolResults = response.content
      .filter((block) => block.type === "tool_use")
      .map((block) => {
        const input = block.input as Record<string, unknown>;
        console.log(`\n[tool] ${block.name}(${JSON.stringify(input)})`);
        const result = runTool(block.name, input);
        console.log(`[tool result] ${JSON.stringify(result)}`);
        return {
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: JSON.stringify(result),
        };
      });

    messages.push({ role: "user", content: toolResults });
  }
}
