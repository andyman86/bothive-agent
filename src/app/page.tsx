"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [log, setLog] = useState("");

  async function send() {
    setLog("");
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: input || "Say hi quickly" }] })
    });
    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n"); buffer = parts.pop() || "";
      for (const p of parts) {
        if (!p.startsWith("data:")) continue;
        const json = p.slice(5).trim();
        if (!json) continue;
        try {
          const evt = JSON.parse(json);
          if (evt.type === "text") setLog(prev => prev + evt.delta);
          if (evt.type === "final" && evt.text) setLog(evt.text);
        } catch {}
      }
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>BotHive  Local Chat</h1>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask something..."
               style={{ flex:1, padding:10, borderRadius:8, border:"1px solid #ddd" }}/>
        <button onClick={send} style={{ padding:"10px 16px", borderRadius:8 }}>Send</button>
      </div>
      <pre style={{ whiteSpace:"pre-wrap", background:"#fafafa", padding:12, borderRadius:8, marginTop:16 }}>
        {log || " type and press Send"}
      </pre>
    </main>
  );
}
