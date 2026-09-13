/** Absolute URL for an in-app path, honouring the Vite base path (GitHub Pages sub-folder). */
export function appUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${window.location.origin}${base}${path.startsWith('/') ? path : `/${path}`}`
}
