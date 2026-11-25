/**
 * Support widget answering engine — pure functions, no DOM, no network.
 *
 * Answers only from the knowledge base it is given. If nothing scores above
 * the threshold it reports a miss and the UI offers a human, which is the
 * honest behaviour for a shop this size and keeps hosting at zero.
 *
 * To upgrade to a model later, replace the body of `answer()`. Nothing else
 * needs to change: the widget only consumes `SupportAnswer`.
 */

export interface SupportEntry {
  id: string;
  q: string;
  a: string;
  /** Single, stemmed-ish words. Matched against tokens, prefix-tolerant. */
  keywords?: string[];
  /** Multi-word strings, matched against the normalised question. */
  phrases?: string[];
  /** Loose grouping; also searchable. */
  tags?: string[];
  /** Ids of follow-up questions to offer. "human" opens the handoff card. */
  chips?: string[];
}

export interface Chip {
  label: string;
  id: string;
}

export interface SupportAnswer {
  text: string;
  chips: Chip[];
  id?: string;
  escalate?: boolean;
  miss?: boolean;
}

export const HUMAN_ID = "human";

const STOP = new Set(
  (
    "a an the is are am was were do does did i my me you your it its of to in on for " +
    "with and or if can could would should how what when where who why this that " +
    "these those there their have has had will just please want need any get got " +
    "about tell know let"
  ).split(" ")
);

const SMALL_TALK: { re: RegExp; a: string }[] = [
  {
    re: /^(hi|hey|hello|yo|salaam|namaste|namaskar)\b/,
    a: "Namaste. Ask me anything about custom art, pricing, delivery or an order.",
  },
  {
    re: /^(thanks|thank you|thankyou|thx|dhanyabad)\b/,
    a: "Happy to help. If anything else comes up, a human is one tap away.",
  },
  { re: /^(bye|goodbye|see you)\b/, a: "Take care. We're here whenever you need us." },
  { re: /^(ok|okay|cool|got it|alright)\s*$/, a: "Anything else you'd like to check?" },
];

const HUMAN_RE =
  /\b(human|agent|person|real|someone|call|phone|whatsapp|viber|email|contact|talk|speak|owner|proprietor)\b/;

export function normalise(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Crude stemmer: enough to make deliver / delivery / delivered one term. */
function stem(w: string): string {
  if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + "y";
  if (w.length > 4 && /(ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) w = w.slice(0, -1);
  if (w.length > 5 && /ing$/.test(w)) w = w.slice(0, -3);
  if (w.length > 4 && /ed$/.test(w)) w = w.slice(0, -2);
  return w;
}

function tokens(s: string): string[] {
  const out: string[] = [];
  normalise(s)
    .split(" ")
    .forEach((w) => {
      if (!w || STOP.has(w)) return;
      const st = stem(w);
      if (st.length > 1) out.push(st);
    });
  return out;
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const seen = new Set(a);
  let inter = 0;
  b.forEach((w) => {
    if (seen.has(w)) inter += 1;
  });
  const union = seen.size + b.length - inter;
  return union ? inter / union : 0;
}

export interface Engine {
  answer: (question: string) => SupportAnswer;
  entryById: (id: string) => SupportEntry | null;
  ranked: (question: string) => { id: string; score: number }[];
}

export function createEngine(opts: {
  kb: SupportEntry[];
  threshold?: number;
  openers?: Chip[];
}): Engine {
  const { kb } = opts;
  const threshold = opts.threshold ?? 3.0;
  const openers = opts.openers ?? [];

  const index = kb.map((entry) => {
    const qTokens = tokens(entry.q);
    const keyStems = (entry.keywords ?? []).map(stem);
    return {
      entry,
      qTokens,
      keyStems,
      terms: new Set<string>([...qTokens, ...keyStems, ...(entry.tags ?? []).map(stem)]),
      phrases: (entry.phrases ?? []).map(normalise),
    };
  });

  function score(idx: (typeof index)[number], question: string): number {
    const nq = normalise(question);
    const qTokens = tokens(question);
    let s = 0;

    idx.phrases.forEach((p) => {
      if (p && nq.indexOf(p) !== -1) s += 6;
    });

    let hits = 0;
    qTokens.forEach((t) => {
      if (idx.terms.has(t)) {
        hits += 1;
        return;
      }
      for (let i = 0; i < idx.keyStems.length; i++) {
        const k = idx.keyStems[i];
        if (k.length > 3 && (k.indexOf(t) === 0 || t.indexOf(k) === 0)) {
          hits += 0.6;
          return;
        }
      }
    });
    if (hits > 0) s += hits * 2.2 + 1.0;

    s += jaccard(qTokens, idx.qTokens) * 4;
    return s;
  }

  function entryById(id: string): SupportEntry | null {
    for (const entry of kb) if (entry.id === id) return entry;
    return null;
  }

  function chipsFor(entry: SupportEntry): Chip[] {
    const out: Chip[] = [];
    (entry.chips ?? []).forEach((id) => {
      if (id === HUMAN_ID) {
        out.push({ label: "Ask a human", id: HUMAN_ID });
        return;
      }
      const linked = entryById(id);
      if (linked) out.push({ label: linked.q, id: linked.id });
    });
    return out;
  }

  function answer(question: string): SupportAnswer {
    const nq = normalise(question);
    if (!nq) return { text: "Type a question and I'll do my best.", chips: [] };

    for (const st of SMALL_TALK) {
      if (st.re.test(nq)) return { text: st.a, chips: openers.slice(0, 3) };
    }

    if (HUMAN_RE.test(nq)) return { escalate: true, text: "", chips: [] };

    const ranked = index
      .map((idx) => ({ idx, s: score(idx, question) }))
      .sort((a, b) => b.s - a.s);

    const best = ranked[0];
    if (!best || best.s < threshold) return { miss: true, text: "", chips: [] };

    const chips: Chip[] = [];
    const second = ranked[1];
    if (second && second.s >= threshold && best.s - second.s < 0.6) {
      chips.push({ label: second.idx.entry.q, id: second.idx.entry.id });
    }
    chips.push(...chipsFor(best.idx.entry));

    return {
      text: best.idx.entry.a,
      chips: chips.slice(0, 3),
      id: best.idx.entry.id,
    };
  }

  function ranked(question: string) {
    return index
      .map((idx) => ({ id: idx.entry.id, score: Number(score(idx, question).toFixed(2)) }))
      .sort((a, b) => b.score - a.score);
  }

  return { answer, entryById, ranked };
}
