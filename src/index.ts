import ArgumentParser from './argument-parser.ts'
import CodeGenerator from './generator/index.ts'
import type { Token } from './parser/token.ts'
import { writeFileSync } from 'node:fs'
import { readFile } from './common.ts'
import Parser from './parser/index.ts'
import { resolve } from 'node:path'
import Lexer from './lexer.ts'

const args = new ArgumentParser(process.argv.slice(2))
args.parseArguments()

if (!args.getArgument('files')) {
  console.error('[panic]: No file provided')
  args.showHelp()
}

if ((args.parsed_arguments.files as string[]).length > 1) {
  console.error('[panic]: Only one file can be processed at a time')
  process.exit(1)
}

const file_name = (args.getArgument('files') as string[])[0]

const code = readFile(file_name, true)

const lexer = new Lexer(code, resolve(file_name))

if (args.getArgument('no_parse')) {
  let token: Token | null = null
  while ((token = lexer.nextToken())) {
    console.log(token)
    if (token.type === 'EOF') break
  }
  process.exit(0)
}

const parser = new Parser(lexer)

const program = parser.parseProgram()

console.log(JSON.stringify(program, null, 2))

console.log(parser.identifiers)

const generator = new CodeGenerator(parser)

const c_code = generator.generate(program)

const out_file = (args.getArgument('output') as string) || 'a.c'

writeFileSync(out_file, c_code)
