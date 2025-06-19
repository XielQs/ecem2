import { FILE_EXTENSION } from './constants.ts'
import type { Token } from './parser/token.ts'
import { execSync } from 'node:child_process'
import fs from 'node:fs'

export function readFile(file_path: string, retry: boolean): string {
  try {
    return fs.readFileSync(file_path, 'utf8')
  } catch (error) {
    if (retry && !file_path.endsWith(FILE_EXTENSION)) {
      return readFile(file_path + FILE_EXTENSION, false)
    }
    console.error(`Error: Could not read file ${file_path}`)
    process.exit(1)
  }
}

export function commandPath(command: string | undefined): string | null {
  if (!command) return null
  try {
    return execSync(`command -v ${command}`, { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

export function isDigit(char: string): boolean {
  return char >= '0' && char <= '9'
}

export function isAlpha(char: string): boolean {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_'
}

export function handleError(
  message: string,
  token: Token,
  source: string,
  file_name: string,
  type: 'panic' | 'error' | 'warning' = 'panic',
  custom_mark: { spaces?: number; carets?: number } = {}
): void {
  const lines = source.split('\n')

  const line = lines[token.line]
  const caretCount = token.literal.length || 1
  const spaceCount = custom_mark.spaces ?? token.column - 1
  const spaces = ' '.repeat(spaceCount < 0 ? 0 : spaceCount)

  if (custom_mark.carets === Infinity) custom_mark.carets = line.length - spaces.length

  if (custom_mark.carets && custom_mark.carets < 0) custom_mark.carets = 0

  const carets = '^'.repeat(custom_mark.carets ?? caretCount)

  process.stderr.write(
    `${file_name}:${token.line + 1}${token.column > 0 ? ':' + token.column : ''}\n`
  )
  process.stderr.write(line + '\n')
  process.stderr.write(spaces + carets + '\n')
  process.stderr.write(`[${type}]: ${message}\n`)

  if (type !== 'warning') process.exit(1)
}
