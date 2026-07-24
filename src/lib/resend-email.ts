const RESEND_API_URL = 'https://api.resend.com/emails'
const SITE_URL = 'https://seaandcityrentals.com'

export class ResendAPIError extends Error {
  readonly status: number
  readonly retryAfterSeconds: number | null

  constructor(status: number, message: string, retryAfterSeconds: number | null) {
    super(message)
    this.name = 'ResendAPIError'
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }

  get retryable() {
    return this.status === 429 || (this.status >= 500 && this.status < 600)
  }
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null
  const parsed = Number(header)
  if (!Number.isNaN(parsed)) return parsed
  const date = new Date(header)
  if (!Number.isNaN(date.getTime())) {
    return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000))
  }
  return null
}

interface SendResendEmailPayload {
  to: string
  from: string
  subject: string
  html: string
  text: string
  reply_to?: string
  unsubscribe_token?: string
  message_id?: string
  idempotency_key?: string
}

interface SendResendEmailOptions {
  apiKey: string
}

// Drop-in-shaped replacement for @lovable.dev/email-js's sendLovableEmail —
// same call shape, throws the same status-bearing error shape so the
// existing isRateLimited/isForbidden checks in the queue processor keep working.
export async function sendResendEmail(
  payload: SendResendEmailPayload,
  options: SendResendEmailOptions,
): Promise<{ success: boolean; message_id?: string }> {
  const { apiKey } = options
  if (!apiKey) {
    throw new Error('Missing Resend API key')
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
  const idempotencyKey = payload.idempotency_key ?? payload.message_id
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const emailHeaders: Record<string, string> = {}
  if (payload.unsubscribe_token) {
    const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${encodeURIComponent(payload.unsubscribe_token)}`
    emailHeaders['List-Unsubscribe'] = `<${unsubscribeUrl}>`
    emailHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }

  const body: Record<string, unknown> = {
    from: payload.from,
    to: [payload.to],
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  }
  if (payload.reply_to) body.reply_to = payload.reply_to
  if (Object.keys(emailHeaders).length > 0) body.headers = emailHeaders

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    const safeErrorText = errorText.length > 500 ? `${errorText.slice(0, 500)}...` : errorText
    throw new ResendAPIError(
      response.status,
      `Resend API error: ${response.status} ${safeErrorText}`,
      parseRetryAfter(response.headers.get('Retry-After')),
    )
  }

  const data = (await response.json()) as { id?: string }
  return { success: true, message_id: data.id }
}
