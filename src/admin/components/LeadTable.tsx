import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import LeadStatusBadge from './LeadStatusBadge'
import type { Lead, PageResult } from '../types'

interface LeadTableProps {
  result: PageResult<Lead> | null
  page: number
  onPageChange: (page: number) => void
  sort: 'created' | 'updated'
  onSortChange: (sort: 'created' | 'updated') => void
}

export default function LeadTable({ result, page, onPageChange, sort, onSortChange }: LeadTableProps) {
  const total = result?.pagination.total ?? 0
  const limit = result?.pagination.limit ?? 25
  const pages = Math.max(1, Math.ceil(total / limit))
  const SortIcon = sort === 'created' ? ArrowDown : sort === 'updated' ? ArrowUp : ArrowUpDown
  return (
    <div className="admin-panel">
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>Business / Contact</th><th>Service</th><th>Status</th><th>Owner</th>
            <th><button className="admin-sort-button" type="button" onClick={() => onSortChange(sort === 'created' ? 'updated' : 'created')}>{sort === 'created' ? 'Created' : 'Updated'} <SortIcon size={12} /></button></th>
          </tr></thead>
          <tbody>
            {result?.data.map((lead) => (
              <tr key={lead.id}>
                <td><Link className="admin-table-primary" to={`/admin/leads/${lead.id}`}>{lead.business_name}</Link><span className="admin-table-secondary">{lead.contact_name} · {lead.email}</span></td>
                <td><span className={`lead-type-dot ${lead.lead_type === 'business_funding' ? 'lead-type-funding' : ''}`} />{lead.lead_type === 'merchant_processing' ? 'Processing' : 'Funding'}</td>
                <td><LeadStatusBadge status={lead.status} /></td>
                <td>{lead.assigned_user_name ?? <span className="admin-unassigned">Unassigned</span>}</td>
                <td>{new Date(sort === 'created' ? lead.created_at : lead.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {result?.data.length === 0 && <div className="admin-empty-state"><strong>No leads found</strong><span>Try changing the filters or search terms.</span></div>}
        {!result && <div className="admin-loading">Loading leads</div>}
      </div>
      <div className="admin-pagination">
        <span>{total === 0 ? 'No records' : `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total}`}</span>
        <div className="admin-pagination-actions">
          <button className="admin-icon-control" type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={15} /></button>
          <span className="admin-pagination-page">Page {page} of {pages}</span>
          <button className="admin-icon-control" type="button" aria-label="Next page" disabled={page >= pages} onClick={() => onPageChange(page + 1)}><ChevronRight size={15} /></button>
        </div>
      </div>
    </div>
  )
}