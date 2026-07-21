# SST Trainer — switch billing ON (30 min, no code)

The entire subscription path is built and verified: checkout, webhook plan-flip,
cancellation-reverts-to-trial, billing portal, DB self-heal. The ONLY missing
piece is three Stripe price objects. Until they exist, `/api/sst/subscribe`
returns 503 "That plan is not available yet" and every clinic stays on the free
trial. These steps make it take money.

The three tiers and prices are already decided and shown on `/platform/pricing`:

| Tier (code plan id) | Seats | Monthly price |
|---|---|---|
| Single (`single`) | 1 | **A$49** |
| Small clinic (`clinic`) | 5 | **A$99** |
| Enterprise (`enterprise`) | 15 | **A$149** |

## Step 1 — Stripe: create 3 recurring products (live mode)

For each tier, Stripe Dashboard → Products → Add product:
- Name: "SST Trainer — Single" (then "— Small clinic", "— Enterprise")
- Price: recurring, **monthly**, AUD, the amount above
- Copy the **Price ID** (`price_...`, NOT the product ID `prod_...`)

You end with three `price_...` IDs.

## Step 2 — Vercel: set 3 env vars (Production scope)

Project → Settings → Environment Variables → add:

```
STRIPE_SST_SINGLE_PRICE_ID      = price_...(single)
STRIPE_SST_CLINIC_PRICE_ID      = price_...(clinic)
STRIPE_SST_ENTERPRISE_PRICE_ID  = price_...(enterprise)
```

## Step 3 — Redeploy

Env changes need a fresh deploy to take effect. Trigger one (any push, or
Vercel → Deployments → Redeploy latest).

## Step 4 — Confirm the webhook hears subscription events

The existing Stripe webhook must be subscribed to these three events (the code
handles all three; if they are not enabled, cancellations silently won't
downgrade):
- `checkout.session.completed`  (activates the clinic)
- `customer.subscription.updated`  (past_due / reactivation)
- `customer.subscription.deleted`  (cancellation → reverts to trial)

Stripe → Developers → Webhooks → your portal endpoint → check the event list.

## Step 5 — Test one end to end

1. Sign in as a clinic with clinical access, create a clinic code if needed.
2. Go to `/clinical-testing/subscribe`, pick a plan, complete checkout
   (use a Stripe test price + test card first if you want a dry run).
3. Confirm: the clinic flips to `active` (the 3-patient trial cap lifts —
   check by adding a 4th patient), and `/api/sst/billing-portal` opens the
   Stripe customer portal.

## Done. What this unlocks

- Every founding clinic can convert from free to A$49/99/149.
- New clinics can self-serve subscribe.
- The report routes (`/api/sst/report`, gp-report) already gate on
  `plan === 'active'`, so paid clinics get documents and trial clinics are
  capped — no further wiring.

## Notes / decisions still yours

- **Currency:** these are AUD, which serves the AU + Cliniko market (the
  immediate one). NZ ACC suppliers would want NZD — add a second Stripe price
  in NZD later; do not block the AU launch on it.
- **Founding conversion:** founding clinics were promised "free now, then lock
  this rate for life." When you end the founding period, they convert at these
  same prices — consistent, no separate SKU needed.
- **Per-seat vs flat:** the tiers are flat monthly per seat-band (1/5/15), not
  metered per-seat. That is simpler to sell and simpler to bill. If you want
  true per-seat metering later it is a bigger change — not needed for launch.
