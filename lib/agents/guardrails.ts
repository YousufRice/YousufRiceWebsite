import { generateText, Output } from "ai";
import { z } from "zod";
import type { LanguageModelV3Middleware } from "@ai-sdk/provider";
import { openrouter } from "./openrouter";

// ─── Guardrail 1: Relevance ───────────────────────────────────────────────────

async function checkRelevance(userMessage: string) {
  console.log("[Guardrail] Checking relevance...");
  try {
    const result = await generateText({
      model: openrouter("inclusionai/ring-2.6-1t:free"), // using the requested model
      output: Output.object({
        schema: z.object({
          isRelevant: z.boolean(),
          reasoning: z.string(),
        })
      }),
    prompt: `Check if the user input is relevant to Yousuf Rice business.

Relevant topics include:
- Rice products (Sella, Steam Basmati, etc.)
- Prices and discounts
- Placing or tracking orders
- Delivery information (Karachi only)
- Company information and policies
- Customer service inquiries
- General greetings (Hello, Hi, Salam)

Irrelevant topics include:
- Math homework or general extensive calculations
- Coding or programming questions
- Creative writing (poems, stories) unrelated to rice
- General knowledge questions not related to rice/cooking/Pakistan
- Politics or sensitive topics

User input: "${userMessage}"

Return isRelevant: true for relevant topics, false otherwise.`,
    });
    console.log("[Guardrail] Relevance check complete:", result.output);
    return result.output;
  } catch (err: any) {
    console.error("[Guardrail] Relevance check failed:", err.message);
    // If it fails, default to allowing it to not break the chat
    return { isRelevant: true, reasoning: "Error checking relevance" };
  }
}

// ─── Guardrail 2: Special Deal 5kg ───────────────────────────────────────────

async function checkSpecialDeal(userMessage: string) {
  console.log("[Guardrail] Checking special deal...");
  try {
    const result = await generateText({
      model: openrouter("inclusionai/ring-2.6-1t:free"),
      output: Output.object({
        schema: z.object({
          isValid: z.boolean(),
          reasoning: z.string(),
        })
      }),
    prompt: `Check if the user is trying to order 5kg for special deals or bulk deals.
Special deals and bulk deals ONLY come in 25kg bags - there is NO 5kg option for special deals.

Check if the user input contains:
- Mentions of "special deal", "bulk deal", "hotel", "restaurant" AND
- Mentions of 5kg quantity

If the user is asking for 5kg in the context of special deals/bulk deals/hotels/restaurants, return isValid: false.
Otherwise, return isValid: true.

Examples:
- "I want 5kg special deal" → isValid: false
- "I want 5kg for my restaurant" → isValid: false  
- "I want 25kg special deal" → isValid: true
- "I want 5kg basmati rice" → isValid: true (regular product, not special deal)

User input: "${userMessage}"`,
    });
    console.log("[Guardrail] Special deal check complete:", result.output);
    return result.output;
  } catch (err: any) {
    console.error("[Guardrail] Special deal check failed:", err.message);
    return { isValid: true, reasoning: "Error checking special deal" };
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export const guardrailMiddleware: LanguageModelV3Middleware = {
  specificationVersion: "v3",
  async wrapGenerate({ doGenerate, params }) {
    const userMessage = extractLastUserMessage(params);

    if (userMessage) {
      // Run both guardrails in sequence (or could be Promise.all for parallel)
      const relevance = await checkRelevance(userMessage);

      if (!relevance.isRelevant) {
        return buildBlockedResponse(
          "Maaf karein, main sirf Yousuf Rice se mutaliq sawalaat ka jawab de sakta hu. Kya aap humare chawal ya order ke bare mein kuch janna chahte hain?"
        );
      }

      const specialDeal = await checkSpecialDeal(userMessage);

      if (!specialDeal.isValid) {
        return buildBlockedResponse(
          "Special deal aur bulk deal sirf 25kg bags mein aate hain. 5kg ka option special deals mein available nahi hai. Kya aap 25kg ka order dena chahenge?"
        );
      }
    }

    return doGenerate();
  },

  async wrapStream({ doStream, params }) {
    const userMessage = extractLastUserMessage(params);

    if (userMessage) {
      const relevance = await checkRelevance(userMessage);

      if (!relevance.isRelevant) {
        return buildBlockedStream(
          "Maaf karein, main sirf Yousuf Rice se mutaliq sawalaat ka jawab de sakta hu. Kya aap humare chawal ya order ke bare mein kuch janna chahte hain?"
        );
      }

      const specialDeal = await checkSpecialDeal(userMessage);

      if (!specialDeal.isValid) {
        return buildBlockedStream(
          "Special deal aur bulk deal sirf 25kg bags mein aate hain. 5kg ka option special deals mein available nahi hai. Kya aap 25kg ka order dena chahenge?"
        );
      }
    }

    return doStream();
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractLastUserMessage(params: any): string | null {
  const messages = params.prompt ?? [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "user") {
      if (typeof msg.content === "string") return msg.content;
      if (Array.isArray(msg.content)) {
        const text = msg.content
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join(" ");
        return text || null;
      }
    }
  }
  return null;
}

function buildBlockedResponse(text: string): any {
  return {
    text,
    finishReason: "stop",
    usage: { promptTokens: 0, completionTokens: 0 },
    rawCall: { rawPrompt: null, rawSettings: {} },
  };
}

function buildBlockedStream(text: string): any {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue({
        type: "text-delta",
        textDelta: text,
      });
      controller.enqueue({
        type: "finish",
        finishReason: "stop",
        usage: { promptTokens: 0, completionTokens: 0 },
      });
      controller.close();
    },
  });
  return {
    stream,
    rawCall: { rawPrompt: null, rawSettings: {} },
  };
}
