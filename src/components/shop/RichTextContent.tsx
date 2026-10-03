import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { cn } from '@/lib/utils'

/** Renderiza un campo richText de Payload con la tipografía de la tienda. */
export function RichTextContent({ data, className }: { data: unknown; className?: string }) {
  if (!data || typeof data !== 'object' || !('root' in data)) return null

  return (
    <RichText
      data={data as SerializedEditorState}
      className={cn(
        'space-y-4 leading-relaxed text-foreground/85',
        '[&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-2xl [&_h3]:text-xl [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc',
        className,
      )}
    />
  )
}
