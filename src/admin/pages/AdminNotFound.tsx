import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminNotFound() {
  return <div className="admin-not-found"><span>404</span><h2>Admin page not found</h2><p>This administration page does not exist.</p><Link className="admin-button" to="/admin"><ArrowLeft size={14} />Return to overview</Link></div>
}