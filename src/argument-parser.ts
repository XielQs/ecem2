import { VERSION } from './constants.ts'

export default class ArgumentParser {
  private readonly args: string[]
  public parsed_arguments: Record<string, string | string[]> = {}

  constructor(args: string[]) {
    this.args = args
  }

  public showHelp(): never {
    console.log('Usage: <file> [-o <file>] [-h|--help] [-v|--version]')
    console.log('Options:')
    console.log('  -o, --out <file>   Specify output file')
    console.log('  -h, --help         Show this help message')
    console.log('  -v, --version      Show compiler version')
    process.exit(0)
  }

  public getArgument(name: string): string | string[] | undefined {
    return this.parsed_arguments[name]
  }

  public parseArguments(): void {
    if (this.args.length < 1) {
      console.error('[panic]: No file provided')
      this.showHelp()
    }

    for (const command of this.args) {
      const nextArg = this.args[this.args.indexOf(command) + 1]
      switch (command) {
        case '-o':
        case '--out':
          if (!nextArg || nextArg.startsWith('--')) {
            console.error(`[panic]: No output file specified for ${command}`)
            process.exit(1)
          }
          this.parsed_arguments.output = nextArg
          this.args.splice(this.args.indexOf(command) + 1, 1) // Remove nextArg from args
          break
        case '-h':
        case '--help':
          this.showHelp()
        case '-v':
        case '--version':
          console.log(`ecem compiler version ${VERSION}`)
          process.exit(0)
        default:
          if (!command.startsWith('--')) {
            if (!this.parsed_arguments.files) this.parsed_arguments.files = []
            ;(this.parsed_arguments.files as string[]).push(command)
            continue
          }

          console.error(`Unknown argument: ${command}`)
          process.exit(1)
      }
    }

    if (this.parsed_arguments.files && this.parsed_arguments.files.length > 1) {
      console.error('[panic]: Only one file can be processed at a time')
      process.exit(1)
    }
  }
}
