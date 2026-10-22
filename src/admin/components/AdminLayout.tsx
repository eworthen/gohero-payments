import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ArrowRight, KeyRound, ShieldAlert } from 'lucide-react'
import AdminHeader from './AdminHeader'
import AdminSidebar from './AdminSidebar'
import { ApiError, adminApi, setLocalIdentity } from '../services/api'
import type { AdminUser } from '../types'
import '../admin.css'

type AuthState = 'loading' | 'ready' | 'denied' | 'error'
const localAuthEnabled = import.meta.env.DEV || import.meta.env.VITE_DEV_AUTH_ENABLED === 'true'

export default function AdminLayout() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [state, setState] = useState<AuthState>('loading')
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    adminApi.get<{ data: AdminUser }>('/me')
      .then(({ data }) => { if (active) { setUser(data); setState('ready') } })
      .catch((error: unknown) => {
        if (!active) return
        setState(error instanceof ApiError && error.status === 401 ? 'denied' : 'error')
        setMessage(error instanceof Error ? error.message : 'Access could not be verified.')
      })
    return () => { active = false }
  }, [attempt])

  function chooseLocalIdentity(identity: 'admin' | 'sales') {
    setLocalIdentity(identity)
    setState('loading')
    setAttempt((value) => value + 1)
  }

  function clearLocalIdentity() {
    setLocalIdentity(null)
    setUser(null)
    setState('denied')
  }

  if (state === 'loading') return <div className="admin-auth-screen" role="status">Verifying workspace access…</div>
  if (!user || state !== 'ready') {
    return (
      <main className="admin-auth-screen">
        <section className="admin-auth-panel">
          <span className="admin-auth-icon"><ShieldAlert size={21} /></span>
          <p className="admin-eyebrow">SECURE WORKSPACE</p>
          <h1>{state === 'denied' ? 'Access required' : 'Workspace unavailable'}</h1>
          <p>{state === 'denied' ? 'Sign in through your organization’s Cloudflare Access policy to continue.' : message}</p>
          {localAuthEnabled && (
            <div className="admin-dev-identities">
              <span><KeyRound size={15} /> Local development identities</span>
              <button type="button" onClick={() => chooseLocalIdentity('admin')}>Use local administrator <ArrowRight size={15} /></button>
              <button type="button" onClick={() => chooseLocalIdentity('sales')}>Use sales representative <ArrowRight size={15} /></button>
            </div>
          )}
        </section>
      </main>
    )
  }

  return <div className="admin-shell"><AdminSidebar user={user} onSignOut={clearLocalIdentity} /><div className="admin-main"><AdminHeader /><main className="admin-content"><Outlet context={{ user }} /></main></div></div>
}