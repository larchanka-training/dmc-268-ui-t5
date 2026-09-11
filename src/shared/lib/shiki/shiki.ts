import { createHighlighter, type Highlighter } from 'shiki'

export const SHIKI_LANGS = [
  'typescript',
  'javascript',
  'json',
  'bash',
] as const

export const SHIKI_LIGHT_THEME = 'github-light'
export const SHIKI_DARK_THEME = 'github-dark'

export type ShikiTheme = typeof SHIKI_LIGHT_THEME | typeof SHIKI_DARK_THEME

let highlighterPromise: Promise<Highlighter> | null = null

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [SHIKI_LIGHT_THEME, SHIKI_DARK_THEME],
      langs: [...SHIKI_LANGS],
    })
  }
  return highlighterPromise
}

export function resolveShikiTheme(theme: 'light' | 'dark'): ShikiTheme {
  return theme === 'dark' ? SHIKI_DARK_THEME : SHIKI_LIGHT_THEME
}
