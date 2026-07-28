import { Text } from '@react-email/components'

const unsubscribeText = { fontSize: '12px', color: '#999999', margin: '12px 0 0' }
const unsubscribeLink = { color: '#999999', textDecoration: 'underline' }

export function UnsubscribeFooter({ url }: { url?: string }) {
  if (!url) return null
  return (
    <Text style={unsubscribeText}>
      <a href={url} style={unsubscribeLink}>Unsubscribe</a> from these emails.
    </Text>
  )
}
