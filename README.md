# ecem2

**ecem2** is a simple, Python-inspired programming language and compiler written in TypeScript. It’s designed for learning, experimentation, and fun, not for production use! The project demonstrates how to build a basic language, parser, and code generator targeting C++.

---

## Features

- **Variables**: `let` statements for variable declaration
- **Primitive Types**: Integers, strings, booleans
- **Expressions**: Arithmetic, logical, and string operations
- **Function Calls**: Call built-in functions (for now :3)
- **Imports**: Import standard modules (e.g., IO)
- **Error Reporting**: Helpful error messages with code locations

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/) with [tsx](https://github.com/privatenumber/tsx)
- A C++17 compiler (`clang++` or `g++`)

### Installation

```sh
git clone https://github.com/XielQs/ecem2
cd ecem2
bun install
```

---

## Usage

### Compile and Run a Program

```sh
bun . <file>.ecem
# you can also use:
bun . <file>.ecem --run
```

Or, with tsx:

```sh
tsx . <file>.ecem
```

### Command-Line Options

| Option             | Description                        |
| ------------------ | ---------------------------------- |
| `-o, --out <file>` | Specify output file                |
| `--no-parse`       | Only tokenize the input file       |
| `--no-compile`     | Only generate code, do not compile |
| `--compile`        | Compile only, do not link          |
| `--run`            | Run the compiled code              |
| `--production`     | Optimize the generated code        |
| `-V, --verbose`    | Enable verbose output              |
| `-h, --help`       | Show help message                  |
| `-v, --version`    | Show compiler version              |

---

## Language Reference

### Basic Hello World

```ecem
import <io>

print("Hello, world!")
```

### Variables

```ecem
let x = 42
let name = "ecem2"
let flag = true
```

### Expressions

```ecem
let sum = 1 + 2 * 3
let message = "Hello, " + "world!"
let valid = true && false
```

### Function Calls

```ecem
import <io>

let x = "Hi!"

print("Hello, world!")
print(x)
```

### Imports

```ecem
import <io>
```

### Comments

```ecem
// This is a single-line comment
// Multi-line comments are not supported yet, maybe in the future!!
```

---

## Error Handling

ecem2 provides clear error messages with code locations for:

- Unexpected tokens
- Duplicate variable declarations
- Unknown identifiers
- Type mismatches
- Unterminated strings

---

## Why is it called ecem2?

![ecem2](https://i.imgur.com/oxph8jJ.png)

> \- I'm gonna make a programming language, suggest me a name  
> \+ ecem (her name)

The original version was in C++, but I decided to rewrite it in TypeScript for better maintainability and ease of use.
Ecem is actually a friend of mine so I asked her to suggest a name for the project, and she said "ecem" (her name) so that's why I named it ecem2, the second version of the original C++ project.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
