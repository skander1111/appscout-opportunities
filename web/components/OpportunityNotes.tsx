"use client";

import { useEffect, useState } from "react";

interface Note {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function OpportunityNotes({ opportunityId }: { opportunityId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("appscout.notes-author");
      if (saved) setAuthor(saved);
    } catch {}
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    try {
      const res = await fetch(`/api/notes?opportunityId=${encodeURIComponent(opportunityId)}`);
      const data = await res.json();
      setNotes((data.notes || []).reverse());
    } catch {}
  }

  async function post() {
    if (text.trim().length < 2) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId, author: author || "anonymous", text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      try { window.localStorage.setItem("appscout.notes-author", author); } catch {}
      setText("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="bg-[#070709] border border-white/5 rounded-lg p-3 space-y-2.5">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">Operator notes ({notes.length})</p>

      {notes.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {notes.map((n) => (
            <div key={n.id} className="bg-[#0a0a10] rounded-md p-2.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold text-neon/80">{n.author}</span>
                <span className="text-[10px] text-zinc-600">{timeAgo(n.createdAt)} ago</span>
              </div>
              <p className="text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed">{n.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-zinc-600">No operator notes yet. Be the first.</p>
      )}

      <div className="space-y-1.5 pt-2 border-t border-white/5">
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <input
            type="text"
            placeholder="your handle"
            maxLength={40}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="bg-[#0a0a10] border border-[#1a1a26] rounded-md px-2 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:border-neon/40 focus:outline-none"
          />
          <textarea
            placeholder="e.g. emailed dev — no reply after 5d, will retry in 2 weeks"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={600}
            className="bg-[#0a0a10] border border-[#1a1a26] rounded-md px-2 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:border-neon/40 focus:outline-none resize-none"
          />
        </div>
        {error && <p className="text-[10px] text-red-400">{error}</p>}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-zinc-600 font-mono">{text.length}/600</span>
          <button
            onClick={post}
            disabled={posting || text.trim().length < 2}
            className="text-[11px] font-semibold text-black px-3 py-1 rounded-md disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
          >
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
