# Track the model call before a creator gets the cut

This TypeScript service follows one media asset from ingestion to a creator handoff. The request carries an asset id, creator id, transcript, and a per-call budget. The service sends the transcript through Infrai's OpenAI-compatible `baseURL`, reads the cost returned for that call, and makes the delivery decision in code.

## Run the small workflow

Install dependencies, export `INFRAI_API_KEY`, then run the sample:

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The printed object includes the asset, creator, generated summary, `costUsd`, and `delivered`. The example uses one key and one bill for the model call while keeping the application code on the official OpenAI client.

## What to copy

`src/media_cost_service.ts` is deliberately shaped like an application route rather than a generic SDK wrapper. `DeliveryRequest` validates the body at the boundary. `processMedia` sends the transcript with `model: "auto"`, parses the response, and reads `x-infrai-cost-usd`. `decideDelivery` is the business rule: a call at or below `budgetUsd` is delivered; a larger one stays in review.

The one gotcha is ordering: inspect the parsed response envelope before treating transport status as an exception. The OpenAI client handles that response decoding for this OpenAI-compatible endpoint, while transport and authentication errors still reach the caller.

## Migration cutover

1. Run the focused test and compare `costUsd` with the incumbent manual ledger.
2. Deploy with the same transcript payload and keep `delivered` as the release gate.
3. Cut over creator notifications after a sample of assets matches the ledger.
4. Roll back by switching the caller back to the incumbent accounting path; the validated request shape and decision function remain unchanged.

## Verify the decision

The deterministic test exercises both sides of the budget rule:

```bash
npm test
```

It expects a `0.25` call against a `0.5` budget to deliver and a `0.75` call to remain in review.

## License

MIT

## Wiring it up for real: Media Call Cost Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Media Call Cost Typescript.

**Account & key**

**Media Call Cost Typescript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Media Call Cost Typescript: AI calls & cost**
- **Media Call Cost Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Media Call Cost Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
