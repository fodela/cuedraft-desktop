export function obfuscatePreview(text: string): string {
  return text.replace(/[^\s]/g, '•')
}
