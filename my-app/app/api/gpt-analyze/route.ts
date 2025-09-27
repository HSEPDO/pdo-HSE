import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const body = await req.json();

  const prompt = `
You are an HSE (Health, Safety, Environment) advisor.
Here is workplace risk data:

${JSON.stringify(body, null, 2)}

Tasks:
1. Predict risk level (Low, Medium, High).
2. Explain key reasons for this risk.
3. Recommend preventive actions to reduce or avoid it.
`;

  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini", // or gpt-3.5-turbo
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream", // 👈 event-stream, not html
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    }
  );
}
