import { TokenType, type Token } from './parser/token.ts'
import { commandPath, readFile } from './common.ts'
import ArgumentParser from './argument-parser.ts'
import CodeGenerator from './generator/index.ts'
import { writeFileSync, rmSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import Parser from './parser/index.ts'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'
import Lexer from './lexer.ts'

const args = new ArgumentParser(process.argv.slice(2))
args.parseArguments()

const files = args.getArgument('files') as string[] | undefined

if (!files || files.length !== 1) {
  console.error('[error]: You must provide exactly one file.')
  args.showHelp()
  process.exit(1) // unreachable, stupid typescript...
}

const file_name = resolve(files[0])

const conflicting_args = [
  ['no_compile', 'compile'],
  ['run', 'compile'],
  ['run', 'no_compile']
]

for (const [a, b] of conflicting_args) {
  if (args.getArgument(a) && args.getArgument(b)) {
    console.error(`[error]: Cannot use --${a} with --${b}`)
    process.exit(1)
  }
}

function verbose(...message: unknown[]): void {
  if (args.getArgument('verbose')) console.log('[verbose]:', ...message)
}

const code = readFile(file_name, true)
const lexer = new Lexer(code, file_name)

if (args.getArgument('no_parse')) {
  let token: Token | null = null
  while ((token = lexer.nextToken())) {
    console.log(token)
    if (token.type === TokenType.END_OF_FILE) break
  }
  process.exit(0)
}

const parser = new Parser(lexer)
const program = parser.parseProgram()

verbose('[verbose]: AST', JSON.stringify(program, null, 2))
verbose('[verbose]: Identifiers', [...parser.scopes.identifiers.currentScope.values()])
verbose('[verbose]: Functions', [...parser.scopes.functions.currentScope.values()])

const generator = new CodeGenerator(parser)
const generated_code = generator.generate(program)

const should_compile = !args.getArgument('no_compile')
const out_ext = args.getArgument('compile') ? 'o' : !should_compile ? 'cpp' : 'out'

let out_path = resolve((args.getArgument('output') as string) || `a.${out_ext}`)
const tmp_cpp_path = resolve(tmpdir(), `${randomBytes(16).toString('hex')}.cpp`)

if (args.getArgument('run')) {
  out_path = resolve(tmpdir(), `${randomBytes(16).toString('hex')}.out`)
}

writeFileSync(!should_compile ? out_path : tmp_cpp_path, generated_code)

if (!should_compile) {
  console.log(`[info]: Generated code written to ${out_path}`)
  process.exit(0)
}

const compiler = commandPath(process.env.CXX) ?? commandPath('clang++') ?? commandPath('g++')

if (!compiler) {
  console.error('[error]: No C++ compiler found (CXX env, clang++, g++ tried)')
  rmSync(tmp_cpp_path)
  process.exit(1)
}

const start_time = performance.now()

const compiler_args = ['-std=c++17', '-Wall', '-Wextra', '-Wno-unused-variable']

if (args.getArgument('production')) {
  compiler_args.push('-O3')
  compiler_args.push('-s')
} else {
  compiler_args.push('-g3')
  compiler_args.push('-O0')
  compiler_args.push('-ggdb3')
}

if (args.getArgument('compile')) {
  compiler_args.push('-c') // compile only, do not link
}

// add stdlib
compiler_args.push('-I', resolve(import.meta.dirname, '../stdlib'))

compiler_args.push('-o')
compiler_args.push(out_path)
compiler_args.push(tmp_cpp_path)

const proc = spawn(compiler, compiler_args, { stdio: 'inherit' })

proc.on('error', err => {
  console.error(`[error]: Failed to start compiler: ${err.message}`)
  try {
    rmSync(tmp_cpp_path)
  } catch {}
  process.exit(1)
})

proc.on('exit', code => {
  try {
    rmSync(tmp_cpp_path)
  } catch {}
  if (code !== 0) {
    console.error(`[error]: Compiler exited with code ${code}`)
    process.exit(code)
  }

  const elapsed = (performance.now() - start_time) / 1000
  const info = args.getArgument('production') ? 'stripped + optimized' : 'notstripped + debuginfo'
  const build_type = args.getArgument('production') ? 'production' : 'development'
  console.log(`[info]: Compiled ${build_type} build [${info}] in ${elapsed.toFixed(2)}s`)

  if (args.getArgument('run')) {
    console.log(`[info]: Running compiled code`)
    const run_proc = spawn(out_path, [], { stdio: 'inherit', shell: true })

    run_proc.on('error', err => {
      console.error(`[error]: Failed to run compiled code: ${err.message}`)
      try {
        rmSync(out_path)
      } catch {}
      process.exit(1)
    })

    run_proc.on('exit', exit_code => {
      try {
        rmSync(out_path)
      } catch {}
      if (exit_code !== 0) {
        console.error(`[error]: Compiled code exited with code ${exit_code}`)
        process.exit(exit_code)
      }
    })
  }
})
