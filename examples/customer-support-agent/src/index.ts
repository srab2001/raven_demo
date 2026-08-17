import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { runAgentTurn } from "./agent.js";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Set ANTHROPIC_API_KEY before running this example.");
    process.exit(1);
  }

  console.log("Customer support agent ready. Try things like:");
  console.log('  "I\'m jane.doe@example.com, I want to refund order ORD-5001"');
  console.log('  "I\'m alex.kim@example.com, refund ORD-5002"  (unverified customer)');
  console.log('Type "exit" to quit.\n');

  const rl = createInterface({ input: stdin, output: stdout });
  let history: MessageParam[] = [];

  while (true) {
    const userInput = await rl.question("You: ");
    if (userInput.trim().toLowerCase() === "exit") break;

    history.push({ role: "user", content: userInput });
    history = await runAgentTurn(history);
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
