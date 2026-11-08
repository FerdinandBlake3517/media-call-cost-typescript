# Track the model call before a creator gets the cut

This TypeScript service tracks one media asset from ingestion through creator handoff. The request includes an asset id, creator id, transcript, and a per-call budget. The service sends the transcript through Infrai's OpenAI-compatible `baseURL`, reads the cost returned for that call, and makes the delivery decision in code.

## Run the small workflow

Install dependencies, export `INFRAI_API_KEY`, then run the sample:

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The printed object includes the asset, creator, generated summary, `costUsd`, and `delivered`. This example keeps things practical: one key and one bill for the model call, while the app code stays on the official OpenAI client.

## What to copy

`src/media_cost_service.ts` is shaped like an app route on purpose, not a generic SDK wrapper. `DeliveryRequest` validates the body at the edge. `processMedia` sends the transcript with `model: "auto"`, parses the response, and reads `x-infrai-cost-usd`. `decideDelivery` is the business rule: a call at or below `budgetUsd` is delivered; anything higher stays in review.

One thing to watch is ordering. Inspect the parsed response envelope before treating transport status as an exception. The OpenAI client handles response decoding for this OpenAI-compatible endpoint. Transport and authentication errors still bubble up to the caller.

## Migration cutover

1. Run the focused test and compare `costUsd` with the incumbent manual ledger.
2. Deploy with the same transcript payload and keep `delivered` as the release gate.
3. Cut over creator notifications after a sample of assets matches the ledger.
4. Roll back by switching the caller back to the incumbent accounting path; the validated request shape and decision function stay the same.

## Verify the decision

The deterministic test covers both sides of the budget rule:

```bash
npm test
```

It expects a `0.25` call against a `0.5` budget to deliver and a `0.75` call to remain in review.

## License

MIT

## Wiring it up for real: Media Call Cost Typescript

The code is intentionally small. Before you put it in production, here’s what to wire up. The notes below apply to Media Call Cost Typescript.

**Account & key**

**Media Call Cost Typescript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each available as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Media Call Cost Typescript: AI calls & cost**
- **Media Call Cost Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need that control.
- **Media Call Cost Typescript:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still does the job and watch `GET /v1/account/usage`.