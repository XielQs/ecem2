import { type Mock, spyOn, expect } from 'bun:test'

export let stderrSpy: Mock<typeof process.stderr.write> | null = null
export let exitSpy: Mock<typeof process.exit> | null = null
export let isMonitored = false

export function spy() {
  if (!stderrSpy) {
    stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true)
  }
  if (!exitSpy) {
    exitSpy = spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit')
    })
  }
}

export function clearSpies() {
  stderrSpy?.mockClear()
  exitSpy?.mockClear()
  isMonitored = false
}

export function setupExpectations(actual: () => void) {
  spy()
  clearSpies()
  isMonitored = true

  expect(actual).toThrow('exit')
  expect(stderrSpy).toHaveBeenCalled()
  expect(exitSpy).toHaveBeenCalledWith(1)

  return stderrSpy!.mock.calls.map(call => call[0].toString())
}

export function expectPanic(actual: () => void, expectedError: string) {
  const errorMessages = setupExpectations(actual)
    .filter(msg => msg.includes('[panic]:') || msg.includes('[error]:'))
    .join('\n')

  expect(errorMessages).toContain(expectedError)

  clearSpies()
}
