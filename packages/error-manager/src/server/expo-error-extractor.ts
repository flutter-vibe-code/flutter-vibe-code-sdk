/**
 * Extracts error messages from Expo error pages (HTML responses).
 * Handles both _expo-static-error JSON and "Server Error" HTML pages.
 */

/**
 * Extract a comprehensive error message from an Expo error page HTML response.
 * Returns null if no error is detected.
 */
export function extractExpoError(html: string): string | null {
  let error: string | null = null

  // Strategy A: Parse the _expo-static-error JSON script tag
  if (html.includes('_expo-static-error')) {
    error = extractFromStaticErrorJson(html)
  }

  // Strategy B: Strip HTML and look for error patterns in raw text
  if (!error) {
    error = extractFromStrippedHtml(html)
  }

  // Strategy C: Detect "Server Error" pages with common JS error types
  if (!error && html.includes('Server Error')) {
    error = extractFromServerErrorPage(html)
  }

  return error
}

/**
 * Check if an HTML response is an Expo error page
 */
export function isExpoErrorPage(html: string): boolean {
  return html.includes('_expo-static-error') || (
    html.includes('Server Error') &&
    /(SyntaxError|TypeError|ReferenceError|RangeError)/.test(html)
  )
}

/**
 * Parse the _expo-static-error JSON and build a full error message
 * with error name, file location, code frame, and stack trace.
 */
function extractFromStaticErrorJson(html: string): string | null {
  try {
    const scriptMatch = html.match(/<script id="_expo-static-error"[^>]*>([\s\S]*?)<\/script>/)
    if (!scriptMatch?.[1]) return null

    const errorData = JSON.parse(scriptMatch[1])
    const parts: string[] = []

    for (const log of (errorData?.logs || [])) {
      const msg = log?.message

      // Extract the main error message
      if (typeof msg === 'string') {
        parts.push(msg)
      } else if (msg && typeof msg === 'object') {
        // Build error header: "SyntaxError: message text"
        const name = msg.name || ''
        const message = msg.message || ''
        if (message) {
          const header = name && !message.startsWith(name) ? `${name}: ${message}` : message
          parts.push(header)
        }

        // Include file location if available
        if (msg.fileName || msg.loc) {
          const file = msg.fileName || ''
          const loc = msg.loc ? `:${msg.loc.line}:${msg.loc.column}` : ''
          if (file) parts.push(`File: ${file}${loc}`)
        }

        // Include code frame / source context if available
        if (msg.codeFrame) {
          parts.push(msg.codeFrame)
        }

        // Include stack trace if available
        if (msg.stack && typeof msg.stack === 'string') {
          parts.push(msg.stack)
        }
      }

      // Also check symbolicated stack
      if (log?.symbolicated?.stack?.error) {
        const stackErr = log.symbolicated.stack.error
        if (stackErr.message && !parts.some(p => p.includes(stackErr.message))) {
          parts.push(stackErr.message)
        }
        if (stackErr.stack) {
          parts.push(stackErr.stack)
        }
      }
    }

    return parts.length > 0 ? parts.join('\n\n') : null
  } catch {
    return null
  }
}

/**
 * Strip HTML tags and decode entities, then search for error patterns.
 */
function extractFromStrippedHtml(html: string): string | null {
  const stripped = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')

  const match = stripped.match(/(SyntaxError|TypeError|ReferenceError|RangeError)[:\s][\s\S]{10,2000}/)
  return match ? match[0].trim() : null
}

/**
 * Extract error from a "Server Error" page by stripping tags and searching.
 */
function extractFromServerErrorPage(html: string): string | null {
  const stripped = html
    .replace(/<[^>]+>/g, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const match = stripped.match(/(SyntaxError|TypeError|ReferenceError|RangeError)[:\s][\s\S]{10,2000}/)
  return match ? match[0].trim() : null
}
