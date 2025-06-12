import { commandPath, readFile } from './common.ts'
import ArgumentParser from './argument-parser.ts'
import CodeGenerator from './generator/index.ts'
import { writeFileSync, rmSync } from 'node:fs'
import type { Token } from './parser/token.ts'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import Parser from './parser/index.ts'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'
import Lexer from './lexer.ts'

const args = new ArgumentParser(process.argv.slice(2))
args.parseArguments()

if (!args.getArgument('files')) {
  console.error('[error]: No file provided')
  args.showHelp()
}

if ((args.parsed_arguments.files as string[]).length > 1) {
  console.error('[error]: Only one file can be processed at a time')
  process.exit(1)
}

if (args.getArgument('no_compile') && args.getArgument('compile')) {
  console.error('[error]: Cannot use --no-compile and --compile at the same time')
  process.exit(1)
}

if (args.getArgument('run') && (args.getArgument('compile') || args.getArgument('no_compile'))) {
  console.error('[error]: Cannot use --run with --compile or --no-compile')
  process.exit(1)
}

function verbose(message: any): void {
  if (args.getArgument('verbose')) {
    console.log('[verbose]:', message)
  }
}

const file_name = (args.getArgument('files') as string[])[0]

const start_time = performance.now()

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

verbose(JSON.stringify(program, null, 2))

verbose(parser.identifiers)

const generator = new CodeGenerator(parser)

const generated_code = generator.generate(program)

const out_extension = args.getArgument('compile')
  ? 'o'
  : args.getArgument('no_compile')
  ? 'cpp'
  : 'out'

let out_file = resolve((args.getArgument('output') as string) || 'a.' + out_extension)
const tmp_file = resolve(tmpdir(), randomBytes(16).toString('hex') + '.cpp')

writeFileSync(args.getArgument('no_compile') ? out_file : tmp_file, generated_code)

if (!args.getArgument('no_compile')) {
  const compiler_path =
    (process.env.CXX && commandPath(process.env.CXX)) ||
    commandPath('clang++') ||
    commandPath('g++')

  if (!compiler_path) {
    console.error(
      '[error]: No C++ compiler found. Please set the CXX environment variable or install clang++ or g++'
    )
    rmSync(tmp_file)
    process.exit(1)
  }

  if (args.getArgument('run')) {
    out_file = resolve(tmpdir(), randomBytes(16).toString('hex') + '.out')
  }

  const compiler_args = ['-std=c++17', '-Wall', '-Wextra']

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

  compiler_args.push('-o')
  compiler_args.push(out_file)
  compiler_args.push(tmp_file)

  const proc = spawn(compiler_path, compiler_args, {
    stdio: 'inherit'
  })

  proc.on('error', err => {
    console.error(`[error]: Failed to start compiler: ${err.message}`)
    try {
      rmSync(tmp_file)
    } catch {}
    process.exit(1)
  })

  proc.on('exit', code => {
    try {
      rmSync(tmp_file)
    } catch {}
    if (code !== 0) {
      console.error(`[error]: Compiler exited with code ${code}`)
      process.exit(code)
    }
    const elapsed_time = performance.now() - start_time
    const extra_info = args.getArgument('production')
      ? 'stripped + optimized'
      : 'notstripped + debuginfo'
    const build_type = args.getArgument('production') ? 'production' : 'development'
    console.log(
      `[info]: Compiled ${build_type} build [${extra_info}] in ${(elapsed_time / 1000).toFixed(2)}s`
    )
    if (args.getArgument('run')) {
      const run_proc = spawn(out_file, [], {
        stdio: 'inherit',
        shell: true
      })

      run_proc.on('error', err => {
        console.error(`[error]: Failed to run compiled code: ${err.message}`)
        try {
          rmSync(out_file)
        } catch {}
        process.exit(1)
      })

      run_proc.on('exit', exit_code => {
        try {
          rmSync(out_file)
        } catch {}
        if (exit_code !== 0) {
          console.error(`[error]: Compiled code exited with code ${exit_code}`)
          process.exit(exit_code)
        }
      })
    }
  })
}
