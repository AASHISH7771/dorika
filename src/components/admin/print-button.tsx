"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary btn-sm print:hidden">
      Print / Save PDF
    </button>
  );
}
