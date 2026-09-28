import assert from "node:assert/strict";
import { decideDelivery } from "../src/media_cost_service.ts";

const request = { assetId: "clip-1", creatorId: "maya", transcript: "cut", budgetUsd: 0.5 };
assert.equal(decideDelivery(request, 0.25, "ready").delivered, true);
assert.equal(decideDelivery(request, 0.75, "hold").delivered, false);
console.log("delivery budget decision: ok");
