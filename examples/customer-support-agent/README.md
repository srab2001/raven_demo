# Customer Support Agent (example)

A standalone example of a customer support agent built on the Anthropic
Messages API with three tools:

- `get_customer` — looks up a customer by ID or email, returns their
  customer ID and identity verification status.
- `lookup_order` — looks up an order by ID, returns its status, items,
  total, and remaining refundable balance.
- `process_refund` — issues a refund for an order and amount. Refuses to
  run if the customer isn't identity-verified or the amount exceeds what's
  left to refund on the order.

The agent's system prompt (`src/agent.ts`) instructs it to verify identity
with `get_customer` before discussing order details or issuing a refund,
and to never refund more than an order's `refundable_amount`.

Customer and order data is an in-memory mock store (`src/tools.ts`) — there's
no real database or payment processor behind this. It's meant to be read as
a template for wiring up an agent's tool-use loop, not a production
integration.

This directory is standalone (its own `package.json`) and is not part of
the repo's root Vercel build.

## Setup

```bash
cd examples/customer-support-agent
npm install
export ANTHROPIC_API_KEY=sk-ant-...
npm start
```

Optionally set `ANTHROPIC_MODEL` to override the default model.

## Try it

Two seeded customers/orders:

| Customer | Email | Verification | Order | Total |
|---|---|---|---|---|
| Jane Doe | jane.doe@example.com | verified | ORD-5001 | $29.99 |
| Alex Kim | alex.kim@example.com | unverified | ORD-5002 | $104.50 |

- "I'm jane.doe@example.com, I'd like a refund on ORD-5001" → agent verifies
  identity, looks up the order, and processes the refund.
- "I'm alex.kim@example.com, refund ORD-5002" → agent finds the customer is
  unverified and declines to process the refund.
