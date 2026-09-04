# MerchantAI

MerchantAI is an AI Growth and Agentic Commerce platform for Razorpay merchants. It helps a
customer discover products through natural language, creates explainable upsell and cross-sell
offers, and completes a policy-gated Razorpay test-mode checkout.

Repository: https://github.com/Teja-123-byte/merchant_ai

## Hackathon Track

**Track 01: AI Growth & Agentic Commerce**

The product addresses the track by making a merchant's catalog searchable by an AI shopping agent
and turning recommendations into a bounded, auditable commerce flow.

## The Problem

Merchants want AI to increase revenue, but they need control over what the agent can sell, how much
discount it can offer, and which transactions require human approval. Customers want a faster way to
find relevant products without losing pricing transparency or checkout confidence.

MerchantAI connects both sides:

- Merchants add and manage their own catalog.
- Customers describe what they need in plain language.
- The agent finds matching products and proposes relevant attachments.
- A deterministic policy engine evaluates every money action.
- Razorpay Test Mode handles the approved checkout.
- The merchant dashboard shows revenue, orders, approvals, and the complete decision trail.

## Key Features

### Conversational checkout

Customers can ask for products using natural language, including category, budget, use case, and
features. For example:

> Wireless earbuds under ₹2,500 for the gym

The intent agent extracts structured constraints before the catalog is searched.

### Agent-readable merchant catalog

The catalog starts empty. Merchants add product name, price, cost, stock, category, tags, and a short
description from the merchant workspace. The AI only recommends products present in that catalog and
does not invent unavailable inventory.

### Upsell and cross-sell agent

The growth agent selects a primary product and looks for compatible accessories or related products
inside the customer's budget. It can produce:

- Upsells when budget headroom exists
- Cross-sells for compatible products
- Bundles with a bounded discount

### Explainable and bounded money actions

Every checkout is evaluated by a deterministic policy engine. The current controls include:

- Maximum autonomous transaction amount: ₹50,000 by default
- Maximum discount percentage
- Minimum margin percentage
- Out-of-stock blocking
- Maximum item count per order

The agent can propose an action, but it cannot override these merchant rules.

### Approval queue

Transactions outside the autonomous amount or discount limit are marked `REQUIRES_APPROVAL` and
appear in the merchant approval queue. The merchant can approve or reject them before a payment order
is created.

### Razorpay Test Mode checkout

Approved transactions create a Razorpay Test Mode order on the server. The browser then opens the
Razorpay Checkout experience using the public test key. The payment response is sent through a
server-side HMAC signature verification step before the order is marked as paid.

No real money is charged by this demo.

### Post-payment bill

After a verified payment, the customer sees a receipt containing:

- Purchased items and quantities
- Subtotal
- Bundle discount
- Total paid
- Razorpay order ID
- Razorpay payment ID
- Payment timestamp

### Merchant operations dashboard

The merchant workspace provides:

- Catalog management
- Revenue and AI-attributed revenue metrics
- Average order value and cross-sell conversion
- Agent policy controls
- Approval queue
- Agent order history
- Decision and audit trail

### Graceful failure handling

The demo includes a payment failure mode. Failed or dismissed payments are marked as failed, are
shown in the audit trail, and do not falsely appear as successful revenue. The customer can retry
with a fresh checkout attempt.

## End-to-End Demo Flow

1. Start the app and open the customer or merchant login page.
2. Create a merchant account and open the merchant workspace.
3. Add products with prices, costs, stock, categories, tags, and descriptions.
4. Open the customer workspace in another tab or browser window.
5. Ask the assistant for a product with a budget and use case.
6. Review the matching product and recommended bundle.
7. Review the policy decision shown before checkout.
8. Accept the offer and complete the Razorpay test-mode payment.
9. Confirm the receipt appears for the customer.
10. Switch to the merchant workspace and see the paid order, revenue metrics, and audit events.
11. Turn on **Force payment failure** to demonstrate graceful failure handling.

## Architecture

```text
Customer request
	|
	v
Intent Agent -> Catalog Agent -> Growth Agent -> Policy Engine
							   |
				 +-------------------+-------------------+
				 |                                       |
			 Approval queue                         Razorpay Order API
											 |
											 v
									  Razorpay Test Checkout
											 |
											 v
								    Server signature verification
											 |
											 v
								Paid order + receipt + audit event
```

### Main modules

- `src/components/commerce/ChatAssistant.tsx`: customer conversation, offer, checkout, and receipt
- `src/lib/commerce/agents.ts`: intent extraction, catalog search, growth planning
- `src/lib/commerce/policy.ts`: deterministic authorization and policy checks
- `src/lib/commerce/store.ts`: shared browser state and cross-tab synchronization
- `src/lib/commerce/razorpay.ts`: server order creation and browser checkout loader
- `src/lib/commerce/razorpay-server.ts`: server-side payment signature verification
- `src/routes/merchant.tsx`: merchant dashboard and catalog management
- `src/routes/assistant.tsx`: customer shopping workspace
- `src/components/commerce/AuditTrail.tsx`: explainability and event history

## Tech Stack

- React 19
- TypeScript
- Vite
- TanStack Start and TanStack Router
- React Query
- Tailwind CSS
- Lucide icons
- Recharts
- Razorpay Test Mode APIs and Checkout

## Local Setup

Requirements: Node.js 18+ and npm.

```sh
git clone https://github.com/Teja-123-byte/merchant_ai.git
cd merchant_ai/merchant-hub-pro
npm install
```

Create `.env.local` in `merchant-hub-pro`:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

Keep `.env.local` private. Never commit the Razorpay secret or expose it in client-side code.

Run the development server:

```sh
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:8080`.

Validate a production build:

```sh
npm run build
```

## Security and Demo Scope

- Razorpay credentials are loaded from environment variables.
- The secret key is used only by server-side order creation and signature verification.
- Payment status is not accepted from an unverified browser callback.
- This prototype stores accounts and commerce state in browser `localStorage`; it is not a production
  authentication or database implementation.
- Catalog and order synchronization currently works across tabs in the same browser profile.
- Use Razorpay Test Mode credentials and test payment details only.

## Hackathon Bar

MerchantAI demonstrates the core requirements for Track 01:

- Conversational in-app checkout
- Agent-readable catalog
- Upsell and cross-sell recommendations
- Merchant-configured autonomy bounds
- Human approval for sensitive actions
- Explainable decisions and audit trail
- Razorpay Test Mode order creation
- Server-side payment signature verification
- A visible successful receipt
- A graceful payment failure path

## Team Submission

Project: MerchantAI

Track: AI Growth & Agentic Commerce

Repository: https://github.com/Teja-123-byte/merchant_ai
