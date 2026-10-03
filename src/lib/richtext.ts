import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'

/** Texto plano de un campo richText (para meta descriptions), recortado a `maxLength`. */
export const toPlainText = (data: unknown, maxLength = 160): string => {
  if (!data || typeof data !== 'object' || !('root' in data)) return ''
  const text = convertLexicalToPlaintext({ data: data as SerializedEditorState })
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, '')}…`
}
