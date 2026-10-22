import { Clock3 } from 'lucide-react'
import type { LeadActivity } from '../types'

export default function ActivityTimeline({ items }: { items: LeadActivity[] }) {
  if (items.length === 0) return <div className="admin-empty"><Clock3 size={19} /><strong>No activity yet</strong><span>Updates, notes, and follow-ups will appear here.</span></div>
  return <div className="admin-timeline">{items.map((item) => (
    <div className="admin-timeline-item" key={item.id}>
      <span className="admin-timeline-point" />
      <div><p>{item.description}</p><small>{item.user_name} · {new Date(item.created_at).toLocaleString()}</small></div>
    </div>
  ))}</div>
}