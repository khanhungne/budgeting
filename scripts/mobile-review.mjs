import { writeFile } from 'node:fs/promises'
import WebSocket from 'ws'

const port = process.argv[2] ?? '9223'
const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) =>
  response.json(),
)
const target = targets.find((item) => item.type === 'page')
if (!target) throw new Error('Không tìm thấy Chrome page target.')

const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.once('open', resolve)
  socket.once('error', reject)
})

let callId = 0
const pending = new Map()
const runtimeErrors = []
const loadedScripts = new Set()
socket.on('message', (raw) => {
  const message = JSON.parse(raw.toString())
  if (message.method === 'Runtime.exceptionThrown') {
    runtimeErrors.push(message.params.exceptionDetails.text)
  }
  if (
    message.method === 'Log.entryAdded' &&
    message.params.entry.level === 'error'
  ) {
    runtimeErrors.push(message.params.entry.text)
  }
  if (
    message.method === 'Network.responseReceived' &&
    message.params.type === 'Script'
  ) {
    loadedScripts.add(new URL(message.params.response.url).pathname)
  }
  if (!message.id || !pending.has(message.id)) return
  const { resolve, reject } = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) reject(new Error(message.error.message))
  else resolve(message.result)
})

const call = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++callId
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })

const pause = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

await call('Page.enable')
await call('Runtime.enable')
await call('Log.enable')
await call('Network.enable')
await call('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
})
await call('Emulation.setUserAgentOverride', {
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36',
})
await call('Page.reload', { ignoreCache: true })
await pause(1200)

const tabs = [
  ['home', 'Tổng quan'],
  ['lottery', 'Lô đề'],
  ['statistics', 'Thống kê'],
  ['account', 'Tài khoản'],
]
const results = []

for (const [slug, label] of tabs) {
  if (slug !== 'home') {
    await call('Runtime.evaluate', {
      expression: `([...document.querySelectorAll('nav button')].find((button) => button.textContent.includes(${JSON.stringify(label)})))?.click()`,
    })
    await pause(350)
  }

  const evaluated = await call('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const width = document.documentElement.clientWidth
      const overflowing = [...document.body.querySelectorAll('*')]
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ element, rect }) =>
          rect.width > 0 &&
          getComputedStyle(element).position !== 'fixed' &&
          (rect.left < -1 || rect.right > width + 1)
        )
        .slice(0, 8)
        .map(({ element, rect }) => ({
          tag: element.tagName.toLowerCase(),
          className: String(element.className).slice(0, 100),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        }))
      return {
        tab: ${JSON.stringify(slug)},
        innerWidth,
        clientWidth: width,
        scrollWidth: document.documentElement.scrollWidth,
        overflowing,
        runtimeErrors: ${JSON.stringify(runtimeErrors)},
      }
    })()`,
  })
  results.push(evaluated.result.value)

  const screenshot = await call('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
  })
  await writeFile(`mobile-${slug}.png`, Buffer.from(screenshot.data, 'base64'))
}

socket.close()
results.push({ loadedScripts: [...loadedScripts].sort() })
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)
