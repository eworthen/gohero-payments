/** Public content paths only; never permit private routes or URL aliases. */
export function isPublicContentPath(path: string): boolean {
  return path === '/' || (
    /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(path)
    && !/^\/(?:admin|api|404)(?:\/|$)/.test(path)
  )
}
