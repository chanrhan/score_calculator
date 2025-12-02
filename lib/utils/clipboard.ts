export function scoresToClipboardText(scores: Array<string | number>): string {
  if (!scores || scores.length === 0) return ''
  return scores.map(s => String(s)).join('\r\n')
}


