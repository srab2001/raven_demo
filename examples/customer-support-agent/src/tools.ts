import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export type VerificationStatus = "verified" | "unverified";

interface Customer {
  customerId: string;
  name: string;
  email: string;
  verificationStatus: VerificationStatus;
}

interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  orderId: string;
  customerId: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  orderDate: string;
  items: OrderItem[];
  total: number;
  amountRefunded: number;
}

// In-memory mock data store standing in for a real CRM / order management system.
const customers: Customer[] = [
  {
    customerId: "CUST-1001",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    verificationStatus: "verified",
  },
  {
    customerId: "CUST-1002",
    name: "Alex Kim",
    email: "alex.kim@example.com",
    verificationStatus: "unverified",
  },
];

const orders: Order[] = [
  {
    orderId: "ORD-5001",
    customerId: "CUST-1001",
    status: "delivered",
    orderDate: "2026-07-30",
    items: [{ sku: "SKU-100", name: "Wireless Mouse", quantity: 1, unitPrice: 29.99 }],
    total: 29.99,
    amountRefunded: 0,
  },
  {
    orderId: "ORD-5002",
    customerId: "CUST-1002",
    status: "shipped",
    orderDate: "2026-08-10",
    items: [
      { sku: "SKU-200", name: "Mechanical Keyboard", quantity: 1, unitPrice: 89.0 },
      { sku: "SKU-201", name: "Wrist Rest", quantity: 1, unitPrice: 15.5 },
    ],
    total: 104.5,
    amountRefunded: 0,
  },
];

let refundSequence = 1;

function findCustomer(identifier: string): Customer | undefined {
  const needle = identifier.trim().toLowerCase();
  return customers.find(
    (c) => c.customerId.toLowerCase() === needle || c.email.toLowerCase() === needle
  );
}

function findOrder(orderId: string): Order | undefined {
  return orders.find((o) => o.orderId.toLowerCase() === orderId.trim().toLowerCase());
}

export function getCustomer(input: { identifier: string }): object {
  const customer = findCustomer(input.identifier);
  if (!customer) {
    return { error: `No customer found matching "${input.identifier}".` };
  }
  return {
    customer_id: customer.customerId,
    verification_status: customer.verificationStatus,
  };
}

export function lookupOrder(input: { order_id: string }): object {
  const order = findOrder(input.order_id);
  if (!order) {
    return { error: `No order found with ID "${input.order_id}".` };
  }
  return {
    order_id: order.orderId,
    customer_id: order.customerId,
    status: order.status,
    order_date: order.orderDate,
    items: order.items,
    total: order.total,
    amount_refunded: order.amountRefunded,
    refundable_amount: Math.round((order.total - order.amountRefunded) * 100) / 100,
  };
}

export function processRefund(input: {
  order_id: string;
  amount: number;
  reason?: string;
}): object {
  const order = findOrder(input.order_id);
  if (!order) {
    return { error: `No order found with ID "${input.order_id}".` };
  }

  const customer = customers.find((c) => c.customerId === order.customerId);
  if (!customer || customer.verificationStatus !== "verified") {
    return {
      error:
        "Refund blocked: the customer on this order has not passed identity verification. Call get_customer to verify before retrying.",
    };
  }

  if (input.amount <= 0) {
    return { error: "Refund amount must be greater than zero." };
  }

  const refundable = Math.round((order.total - order.amountRefunded) * 100) / 100;
  if (input.amount > refundable) {
    return {
      error: `Refund amount ${input.amount} exceeds the refundable balance of ${refundable} on order ${order.orderId}.`,
    };
  }

  order.amountRefunded = Math.round((order.amountRefunded + input.amount) * 100) / 100;
  const refundId = `REF-${String(refundSequence++).padStart(4, "0")}`;

  return {
    refund_id: refundId,
    order_id: order.orderId,
    amount: input.amount,
    reason: input.reason ?? null,
    status: "completed",
    remaining_refundable: Math.round((order.total - order.amountRefunded) * 100) / 100,
  };
}

export const toolDefinitions: Tool[] = [
  {
    name: "get_customer",
    description:
      "Look up a customer by customer ID or email address. Returns the customer ID and identity verification status. Always verify a customer's identity before processing a refund.",
    input_schema: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description: "The customer's ID (e.g. CUST-1001) or email address.",
        },
      },
      required: ["identifier"],
    },
  },
  {
    name: "lookup_order",
    description:
      "Look up an order by order ID. Returns the order status, items, total, and how much of it has already been refunded.",
    input_schema: {
      type: "object",
      properties: {
        order_id: {
          type: "string",
          description: "The order ID to look up (e.g. ORD-5001).",
        },
      },
      required: ["order_id"],
    },
  },
  {
    name: "process_refund",
    description:
      "Process a refund for a given order and amount. Fails if the customer is not identity-verified, the order does not exist, or the amount exceeds the order's remaining refundable balance.",
    input_schema: {
      type: "object",
      properties: {
        order_id: {
          type: "string",
          description: "The order ID to refund (e.g. ORD-5001).",
        },
        amount: {
          type: "number",
          description: "The dollar amount to refund.",
        },
        reason: {
          type: "string",
          description: "Optional reason for the refund.",
        },
      },
      required: ["order_id", "amount"],
    },
  },
];

export function runTool(name: string, input: Record<string, unknown>): object {
  switch (name) {
    case "get_customer":
      return getCustomer(input as { identifier: string });
    case "lookup_order":
      return lookupOrder(input as { order_id: string });
    case "process_refund":
      return processRefund(input as { order_id: string; amount: number; reason?: string });
    default:
      return { error: `Unknown tool "${name}".` };
  }
}
