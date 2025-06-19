import { stderrSpy, exitSpy, clearSpies, spy, isMonitored } from './utils.ts'
import { afterEach, beforeEach } from 'bun:test'

beforeEach(() => {
  spy()
})

afterEach(() => {
  const calls = stderrSpy?.mock.calls.map(call => call[0].toString())
  // remove warnings
  if (calls) {
    for (let i = 0; i < calls.length; i++) {
      if (calls[i].startsWith('[warning]:')) {
        calls.splice(i - 3, 3 + 1)
        i -= 3
      }
    }
  }
  if (isMonitored || !calls || calls.length === 0) return
  console.log('=== STDERR OUTPUT ===')
  console.log(calls.join(''))
  console.log('=== END STDERR OUTPUT ===')
  clearSpies()
  stderrSpy?.mockClear()
  exitSpy?.mockClear()
})
