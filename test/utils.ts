import { type Mock, spyOn, expect } from 'bun:test'

let stderrSpy: Mock<typeof process.stderr.write> | null = null
let exitSpy: Mock<typeof process.exit> | null = null

function spy() {
  if (!stderrSpy) {
    stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true)
  }
  if (!exitSpy) {
    exitSpy = spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit')
    })
  }
}

function clearSpies() {
  stderrSpy?.mockClear()
  exitSpy?.mockClear()
}

function expectPanic(actual: () => void, expectedError: string) {
  spy()
  clearSpies()

  expect(actual).toThrow('exit')
  expect(stderrSpy).toHaveBeenCalled()
  expect(exitSpy).toHaveBeenCalledWith(1)

  const errorMessages = stderrSpy!.mock.calls
    .map(call => call[0] as string)
    .filter(msg => msg.includes('[panic]:'))
    .join('\n')

  expect(errorMessages).toContain(`[panic]: ${expectedError}`)

  clearSpies()
}

export { stderrSpy, exitSpy, expectPanic }
