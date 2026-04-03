export function InlineBold({ text, as: Tag = 'span' }: { text: string; as?: 'span' | 'p' }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <Tag className={Tag === 'p' ? 'bb-eq-narr__p' : undefined}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="bb-eq-narr__em">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </Tag>
  )
}
