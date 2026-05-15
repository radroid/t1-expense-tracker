// Browser-download seam — the Blob + anchor + revoke dance that was previously
// duplicated across ExportButton, BackupExport, and RecurringExport. Pull it
// here so:
//   1. The three call sites collapse to one line.
//   2. We can fix the Safari/Firefox race where a synchronous
//      URL.revokeObjectURL fires before the browser has actually started the
//      download. The fix is to defer the revoke to the next macro-task (the
//      `scheduleRevoke` seam below).
//   3. Tests no longer need to re-stub the same anchor/URL dance per file —
//      they can inject a fake `document` + `url` and assert on the seam.

export interface DownloadFileArgs {
  filename: string
  // e.g. 'text/csv', 'application/json'. Used as the Blob `type` when `body`
  // is a string; ignored when `body` is already a Blob (the Blob's own type
  // wins, matching how `new Blob([blob])` behaves).
  mime: string
  body: string | Blob
}

interface UrlLike {
  createObjectURL: (b: Blob) => string
  revokeObjectURL: (u: string) => void
}

export interface DownloadFileEnv {
  // Defaults to globalThis.document.
  document?: Document
  // Defaults to globalThis.URL.
  url?: UrlLike
  // Defaults to a 0-tick setTimeout. Tests can pass a synchronous version
  // ((fn) => fn()) for deterministic assertions, or capture the callbacks
  // ((fn) => scheduled.push(fn)) to verify the revoke is actually deferred.
  scheduleRevoke?: (fn: () => void) => void
}

/**
 * Materialises a Blob (if `body` is a string), then triggers a browser
 * "save as" via a hidden anchor: appendChild → click → remove, plus a
 * deferred URL.revokeObjectURL so Safari + Firefox don't race the
 * synchronous revoke against the still-pending download.
 *
 * Throws if `document` or `URL` is unavailable (SSR / DOM-less env).
 */
export function downloadFile(
  args: DownloadFileArgs,
  env: DownloadFileEnv = {},
): void {
  const doc = env.document ?? globalThis.document
  const url = env.url ?? globalThis.URL
  const scheduleRevoke =
    env.scheduleRevoke ?? ((fn: () => void) => setTimeout(fn, 0))

  if (!doc || !url) {
    throw new Error(
      'downloadFile requires a DOM (document + URL). No-op in non-browser envs.',
    )
  }

  const blob =
    args.body instanceof Blob
      ? args.body
      : new Blob([args.body], { type: args.mime })
  const objectUrl = url.createObjectURL(blob)

  const a = doc.createElement('a') as HTMLAnchorElement
  a.href = objectUrl
  a.download = args.filename
  a.hidden = true
  doc.body.appendChild(a)
  a.click()
  a.remove()

  // Defer the revoke — see header comment for the Safari race rationale.
  scheduleRevoke(() => {
    url.revokeObjectURL(objectUrl)
  })
}
