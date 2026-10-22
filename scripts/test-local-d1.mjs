import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { resolve } from 'node:path'

const root = process.cwd()
const wrangler = resolve(root, 'node_modules/wrangler/bin/wrangler.js')
const localDatabase = 'gohero-payments-local'
const developmentEnv = ['--local', '--env', 'development']

function runWrangler(args) {
  const result = spawnSync(process.execPath, [wrangler, ...args], { cwd: root, encoding: 'utf8', stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`Wrangler command failed: ${args.join(' ')}`)
}

async function unusedPort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Could not select a local port.')
  await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()))
  return address.port
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function main() {
  runWrangler(['d1', 'migrations', 'apply', localDatabase, ...developmentEnv])
  runWrangler(['d1', 'execute', localDatabase, ...developmentEnv, '--file=worker/db/seeds/development.sql'])

  const port = await unusedPort()
  const worker = spawn(process.execPath, [wrangler, 'dev', '--env', 'development', '--port', String(port)], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let startupOutput = ''
  worker.stdout.on('data', (chunk) => {
    startupOutput += chunk.toString()
    process.stdout.write(chunk)
  })
  worker.stderr.on('data', (chunk) => {
    startupOutput += chunk.toString()
    process.stderr.write(chunk)
  })

  try {
    const ready = new Promise((resolveReady, rejectReady) => {
      worker.stdout.on('data', (chunk) => {
        if (chunk.toString().includes('Ready on')) resolveReady()
      })
      worker.once('exit', (code) => rejectReady(new Error(`Wrangler exited (${code}).\n${startupOutput}`)))
    })
    let timeoutId
    try {
      await Promise.race([ready, new Promise((_, reject) => { timeoutId = setTimeout(() => reject(new Error('Wrangler did not become ready.')), 30_000) })])
    } finally {
      clearTimeout(timeoutId)
    }

    const baseUrl = `http://127.0.0.1:${port}`
    const origin = baseUrl
    const adminIdentity = { 'X-Dev-User': 'admin' }
    const salesIdentity = { 'X-Dev-User': 'sales' }
    async function request(path, identity, method = 'GET', body, includeOrigin = true) {
      const headers = { ...identity }
      if (body !== undefined) {
        headers['Content-Type'] = 'application/json'
        if (includeOrigin) headers.Origin = origin
      }
      const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
      const result = response.headers.get('content-type')?.includes('json') ? await response.json() : await response.text()
      return { response, data: result }
    }

    const me = await request('/api/admin/me', adminIdentity)
    assert(me.response.status === 200, 'Local administrator identity should authenticate.')
    const assignedId = '00000000-0000-4000-8000-000000000002'
    const marker = crypto.randomUUID()
    const created = await request('/api/admin/leads', adminIdentity, 'POST', {
      lead_type: 'merchant_processing',
      business_name: `D1 smoke ${marker} 100% Co`,
      contact_name: 'Synthetic Test Contact',
      email: `d1-${marker}@example.test`,
      assigned_user_id: assignedId,
      details: { estimated_monthly_processing_volume_cents: 450000 },
    })
    assert(created.response.status === 201, `Lead creation failed: ${JSON.stringify(created.data)}`)
    const leadId = created.data.data.id

    const unassigned = await request('/api/admin/leads', adminIdentity, 'POST', {
      lead_type: 'business_funding',
      business_name: `D1 unassigned ${marker}`,
      contact_name: 'Synthetic Unassigned Contact',
      email: `unassigned-${marker}@example.test`,
    })
    assert(unassigned.response.status === 201, 'Admin should be able to create an unassigned lead.')

    const wildcardBait = await request('/api/admin/leads', adminIdentity, 'POST', {
      lead_type: 'merchant_processing',
      business_name: `D1 wildcard bait ${marker} 100X Co`,
      contact_name: 'Synthetic Wildcard Contact',
      email: `wildcard-${marker}@example.test`,
      assigned_user_id: assignedId,
    })
    assert(wildcardBait.response.status === 201, 'Admin should be able to create a wildcard search control lead.')

    const scoped = await request(`/api/admin/leads?search=${encodeURIComponent('100% Co')}`, salesIdentity)
    assert(scoped.response.status === 200 && scoped.data.data.some((lead) => lead.id === leadId) && !scoped.data.data.some((lead) => lead.id === wildcardBait.data.data.id), `Sales list must be scoped and search must treat wildcard characters literally. Received ${scoped.response.status}: ${JSON.stringify(scoped.data)}`)
    const hidden = await request(`/api/admin/leads/${unassigned.data.data.id}`, salesIdentity)
    assert(hidden.response.status === 404, 'Sales representative must not retrieve unassigned lead details.')
    assert(hidden.response.headers.get('cache-control') === 'no-store', 'Private API response must not be cached.')

    const note = await request(`/api/admin/leads/${leadId}/notes`, salesIdentity, 'POST', { note: 'Synthetic D1 integration note.' })
    assert(note.response.status === 201, 'Assigned representative should be able to create a note.')
    const status = await request(`/api/admin/leads/${leadId}`, salesIdentity, 'PATCH', { status: 'qualified' })
    assert(status.response.status === 200, 'Assigned representative should be able to update lead status.')
    const followUp = await request('/api/admin/follow-ups', salesIdentity, 'POST', {
      lead_id: leadId,
      title: 'Synthetic follow-up task',
      due_at: new Date(Date.now() + 86_400_000).toISOString(),
    })
    assert(followUp.response.status === 201, 'Assigned representative should be able to create a follow-up.')
    const completed = await request(`/api/admin/follow-ups/${followUp.data.data.id}`, salesIdentity, 'PATCH', { status: 'completed' })
    assert(completed.response.status === 200, 'Assigned representative should be able to complete a follow-up.')

    const dashboard = await request('/api/admin/dashboard', salesIdentity)
    assert(dashboard.response.status === 200 && dashboard.data.data.metrics.total_leads >= 1, 'Dashboard totals must come from scoped D1 aggregates.')
    const reports = await request('/api/admin/reports', adminIdentity)
    assert(reports.response.status === 200, 'Administrator reports should be available.')
    const reportDenied = await request('/api/admin/reports', salesIdentity)
    assert(reportDenied.response.status === 403, 'Global reports must be denied to sales representatives.')
    const users = await request('/api/admin/users', adminIdentity)
    assert(users.response.status === 200 && users.data.data.length === 2, 'Only explicitly seeded users should exist.')
    const userDenied = await request('/api/admin/users', salesIdentity)
    assert(userDenied.response.status === 403, 'Sales representatives must not manage users.')
    const lastAdmin = await request('/api/admin/users/00000000-0000-4000-8000-000000000001', adminIdentity, 'PATCH', { active: false })
    assert(lastAdmin.response.status === 400, 'The last active administrator must not be deactivated.')
    const sensitiveField = await request('/api/admin/leads', adminIdentity, 'POST', {
      lead_type: 'merchant_processing',
      business_name: 'Rejected sensitive-field test',
      contact_name: 'Synthetic Contact',
      email: 'rejected@example.test',
      account_number: 'not-permitted',
    })
    assert(sensitiveField.response.status === 400, 'Lead creation must reject unapproved or sensitive fields.')
    const invalidStatus = await request(`/api/admin/leads/${leadId}`, salesIdentity, 'PATCH', { status: 'approved_automatically' })
    assert(invalidStatus.response.status === 400, 'Lead statuses must come from the centralized allowlist.')
    const audit = await request('/api/admin/audit', adminIdentity)
    assert(audit.response.status === 200 && audit.data.data.length >= 5, 'Significant changes must generate server-side audit rows.')

    const exportResponse = await fetch(`${baseUrl}/api/admin/leads/export`, { headers: adminIdentity })
    const exportCsv = await exportResponse.text()
    assert(exportResponse.status === 200 && exportCsv.includes(`D1 smoke ${marker}`), 'Administrator export should contain its authorized test lead.')
    assert(exportResponse.headers.get('cache-control') === 'no-store', 'Export response must not be cached.')
    const badOrigin = await request('/api/admin/leads', adminIdentity, 'POST', { lead_type: 'merchant_processing', business_name: 'Rejected', contact_name: 'Rejected', email: 'rejected@example.test' }, false)
    assert(badOrigin.response.status === 403, 'Cross-origin mutations must be rejected.')
    const unauthenticated = await fetch(`${baseUrl}/api/admin/me`)
    assert(unauthenticated.status === 401, 'Private API must fail closed without a local identity.')
    const publicPage = await fetch(`${baseUrl}/payment-processing`)
    assert(publicPage.status === 200, 'Public SPA routes must remain available.')

    console.log('Local D1 integration passed: create, details, search, role isolation, notes, status validation, follow-ups, dashboard, reports, user permissions, last-admin protection, audit, export, cache, origin, auth, and public routing.')
  } finally {
    worker.kill('SIGTERM')
    await once(worker, 'exit').catch(() => undefined)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})