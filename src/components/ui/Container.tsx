import type { HTMLAttributes } from 'react'

type ContainerProps = HTMLAttributes<HTMLDivElement>

export default function Container({ className = '', ...props }: ContainerProps) {
  return <div className={`container-shell block ${className}`.trim()} {...props} />
}
