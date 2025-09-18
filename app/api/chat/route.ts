export const runtime = "edge";

export async function POST(req: Request) {
  const { messages = [] } = await req.json();

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: "You are a fast, helpful website agent." },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
    }),
  });

  const { readable, writable } = new TransformStream();
  resp.body?.pipeTo(writable);
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
