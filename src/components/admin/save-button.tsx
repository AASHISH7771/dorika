"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button that reports its own state. A form action that takes a moment
 * on a free-tier host otherwise looks frozen, and "nothing happened" reads as
 * "the button is broken".
 */
export function SaveButton({ label = "Save settings" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn-primary btn-lg disabled:cursor-progress disabled:opacity-70"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
