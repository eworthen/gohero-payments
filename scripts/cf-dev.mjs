import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const vite = resolve('node_modules/vite/bin/vite.js')
const wrangler = resolve('node_modules/wrangler/bin/wrangler.js')
const prerender = resolve('scripts/prerender.mjs')
const localEnvironment = { ...process.env, NODE_ENV: 'development', VITE_DEV_AUTH_ENABLED: 'true' }

const build = spawn(process.execPath, [vite, 'build', '--mode', 'development'], {
  env: localEnvironment,
  stdio: 'inherit',
})

build.on('exit', (code) => {
  if (code !== 0) {
    process.exitCode = code ?? 1
    return
  }

  const artifacts = spawn(process.execPath, [prerender], {
    env: localEnvironment,
    stdio: 'inherit',
  })
  artifacts.on('exit', (artifactCode) => {
    if (artifactCode !== 0) {
      process.exitCode = artifactCode ?? 1
      return
    }
    const worker = spawn(process.execPath, [wrangler, 'dev', '--env', 'development', ...process.argv.slice(2)], {
      stdio: 'inherit',
    })
    worker.on('exit', (workerCode) => { process.exitCode = workerCode ?? 1 })
  })
})