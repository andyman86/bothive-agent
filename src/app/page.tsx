"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("Say hello");
  const [out, setOut] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOut("…thinking…");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: input }] }),
      });
      const data = await res.json();
      setOut(data?.message?.content ?? JSON.stringify(data));
    } catch (err: any) {
      setOut(err?.message ?? "Request failed");
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>BotHive test</h1>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something…"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Send</button>
      </form>
      <pre style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{out}</pre>
    </main>
  );
}
