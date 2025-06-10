import { stderrSpy, exitSpy, clearSpies, spy, isMonitored } from './utils.ts'
import { afterEach, beforeEach } from 'bun:test'

beforeEach(() => {
  spy()
})

afterEach(() => {
  if (isMonitored || (stderrSpy?.mock.calls?.length ?? 0) < 1) return
  console.log('=== STDERR OUTPUT ===')
  console.log(stderrSpy!.mock.calls.map(call => call[0].toString()).join(''))
  console.log('=== END STDERR OUTPUT ===')
  clearSpies()
  stderrSpy?.mockClear()
  exitSpy?.mockClear()
})
