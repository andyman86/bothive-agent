export const runtime = "edge";

function badRequest(msg: string, code = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status: code, headers: { "Content-Type": "application/json" }
  });
}

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return badRequest("Invalid JSON"); }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (!messages.length) return badRequest("messages[] required");

  // simple size guard
  const total = JSON.stringify(messages).length;
  if (total > 20_000) return badRequest("request too large", 413);

  // 30s timeout
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30_000);

  try {
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
      signal: ctrl.signal,
    });

    clearTimeout(t);
    if (!resp.ok || !resp.body) {
      return badRequest(`Upstream error ${resp.status}`, 502);
    }

    const { readable, writable } = new TransformStream();
    resp.body.pipeTo(writable);
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e: any) {
    return badRequest(e?.name === "AbortError" ? "timeout" : "server error", 500);
  }
}
