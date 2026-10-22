import type { HTMLAttributes } from 'react'

type SectionProps = HTMLAttributes<HTMLElement>

export default function Section({ className = '', ...props }: SectionProps) {
  return <section className={`page-section ${className}`.trim()} {...props} />
}