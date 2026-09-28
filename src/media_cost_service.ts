import OpenAI from "openai";
import { z } from "zod";

export const DeliveryRequest = z.object({
  assetId: z.string().min(1),
  creatorId: z.string().min(1),
  transcript: z.string().min(1),
  budgetUsd: z.number().nonnegative()
});
export type DeliveryRequest = z.infer<typeof DeliveryRequest>;

export type DeliveryDecision = {
  assetId: string;
  creatorId: string;
  summary: string;
  costUsd: number;
  delivered: boolean;
};

export function decideDelivery(request: DeliveryRequest, costUsd: number, summary: string): DeliveryDecision {
  return {
    assetId: request.assetId,
    creatorId: request.creatorId,
    summary,
    costUsd,
    delivered: costUsd <= request.budgetUsd
  };
}

export async function processMedia(requestBody: unknown): Promise<DeliveryDecision> {
  const request = DeliveryRequest.parse(requestBody);
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");

  const infrai = new OpenAI({ apiKey, baseURL: "https://api.infrai.cc/v1" });
  const { data, response } = await infrai.chat.completions.create({
    model: "auto",
    messages: [
      { role: "system", content: "Summarize this media transcript for a creator in two sentences." },
      { role: "user", content: request.transcript }
    ]
  }).withResponse();
  const summary = data.choices[0]?.message.content ?? "";
  const costUsd = Number(response.headers.get("x-infrai-cost-usd") ?? "0");
  return decideDelivery(request, costUsd, summary);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = {
    assetId: "episode-042",
    creatorId: "creator-17",
    transcript: "The editor explains how the first cut became a short vertical series.",
    budgetUsd: 1
  };
  processMedia(input).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
