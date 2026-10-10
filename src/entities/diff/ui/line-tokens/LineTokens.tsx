import type { CSSProperties } from 'react'
import { useLineTokens } from '../../lib/useLineTokens'

export interface LineTokensProps {
  content: string
  lang: string
}

export function LineTokens({ content, lang }: LineTokensProps) {
  const tokens = useLineTokens(content, lang)

  return (
    <span className="flex-1 whitespace-pre">
      {tokens.length === 0 ? (
        <span>{'\u200B'}</span>
      ) : (
        tokens.map((token, index) => (
          <span
            key={index}
            style={
              token.color
                ? ({ color: token.color } as CSSProperties)
                : undefined
            }
          >
            {token.content}
          </span>
        ))
      )}
    </span>
  )
}

export default LineTokens
