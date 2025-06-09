import ArgumentParser from './argument-parser.ts'
import CodeGenerator from './generator.ts'
import { writeFileSync } from 'node:fs'
import { readFile } from './common.ts'
import { resolve } from 'node:path'
import Parser from './parser.ts'
import Lexer from './lexer.ts'

const args = new ArgumentParser(process.argv.slice(2))
args.parseArguments()

if (!args.getArgument('files')) {
  console.error('[panic]: No file provided')
  args.showHelp()
}

const file_name = (args.getArgument('files') as string[])[0]

const code = readFile(file_name, true)

const lexer = new Lexer(code, resolve(file_name))

const parser = new Parser(lexer)

const program = parser.parseProgram()

console.log(JSON.stringify(program, null, 2))

console.log(parser.identifiers)

const generator = new CodeGenerator()

const c_code = generator.generate(program)

const out_file = (args.getArgument('output') as string) || 'a.c'

writeFileSync(out_file, c_code)
