/**
 * Renders schema.org structured data as a JSON-LD script tag.
 *
 * Server component — the payload is serialised at render time, so nothing
 * is shipped to the client beyond the final <script> markup.
 *
 * `<` is escaped so a product description containing "</script>" can never
 * break out of the tag.
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
