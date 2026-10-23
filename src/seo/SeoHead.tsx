import { useEffect } from 'react'
import { applyHead } from './dom'
import type { SeoRoute } from './types'

export default function SeoHead({ route }: { route: SeoRoute }) {
  useEffect(() => { applyHead(document, route) }, [route])
  return null
}
