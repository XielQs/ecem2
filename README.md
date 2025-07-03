# ecem2

**ecem2** is a statically-typed, Python-inspired programming language and compiler written in TypeScript. It’s designed for learning, experimentation, and fun, not for production use! The project demonstrates how to build a basic language, parser, and code generator targeting C++.

**NOTE:** Things may change frequently, and this documentation may not always be up to date. So don't forget the best documentation is the source code itself! Have fun while exploring ecem2!!!

---

## Table of Contents

- [ecem2](#ecem2)
  - [Table of Contents](#table-of-contents)
  - [Language Overview](#language-overview)
    - [Key Features](#key-features)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Usage](#usage)
    - [Compile and Run a Program](#compile-and-run-a-program)
    - [Command-Line Options](#command-line-options)
  - [Basic Syntax](#basic-syntax)
    - [Comments](#comments)
    - [Program Structure](#program-structure)
  - [Data Types](#data-types)
    - [Integer (`int`)](#integer-int)
    - [String (`string`)](#string-string)
    - [Boolean (`boolean`)](#boolean-boolean)
    - [Void (`void`)](#void-void)
  - [Variables](#variables)
    - [Variable Declaration](#variable-declaration)
    - [Variable Assignment](#variable-assignment)
    - [Scoping Rules](#scoping-rules)
  - [Operators](#operators)
    - [Arithmetic Operators](#arithmetic-operators)
    - [Comparison Operators](#comparison-operators)
    - [Logical Operators](#logical-operators)
    - [String Operations](#string-operations)
    - [Operator Precedence](#operator-precedence)
  - [Control Flow](#control-flow)
    - [Conditional Statements (`check`)](#conditional-statements-check)
    - [Loops (`during`)](#loops-during)
  - [Functions](#functions)
    - [Function Definition](#function-definition)
    - [Examples](#examples)
    - [Function Calls](#function-calls)
    - [Function Scope](#function-scope)
  - [Standard Library](#standard-library)
    - [IO Module (`<io>`)](#io-module-io)
    - [String Module (`<string>`)](#string-module-string)
    - [String Methods and Properties](#string-methods-and-properties)
    - [Math Module (`<math>`)](#math-module-math)
  - [Modules and Imports](#modules-and-imports)
    - [Available Modules](#available-modules)
    - [Import Syntax](#import-syntax)
    - [Import Rules](#import-rules)
  - [Error Handling](#error-handling)
    - [Type Errors](#type-errors)
    - [Undefined Variables](#undefined-variables)
    - [Function Errors](#function-errors)
    - [Syntax Errors](#syntax-errors)
  - [Code Examples](#code-examples)
  - [Why is it called ecem2?](#why-is-it-called-ecem2)
  - [License](#license)

---

## Language Overview

ecem2 is designed with the following principles:

- **Static typing**: All variables and expressions have known types at compile time
- **Memory safety**: Compiled to modern C++ with proper memory management
- **Clear syntax**: Python-inspired syntax that's easy to read and write
- **Explicit imports**: All external functionality must be explicitly imported

### Key Features

- Static type inference with explicit type annotations for functions
- Compile-time error checking with helpful error messages
- Module system for organizing code
- Built-in standard library for common operations

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

## Basic Syntax

### Comments

```ecem
// This is a single-line comment
// Multi-line comments are not supported yet, maybe in the future :p
```

### Program Structure

Every ecem2 program consists of:

1. Import statements (optional)
2. Function definitions (optional)
3. Top-level statements

```ecem
import <io>        // Import statements first

ft greet(string name) -> void {  // Function definitions
    print("Hello, " + name)
}

let message = "World"  // Top-level statements
greet(message)
```

---

## Data Types

ecem2 supports four primitive types:

### Integer (`int`)

32-bit signed integers

```ecem
let age = 25
let negative = -42 // negative numbers is not supported yet but it will!!
let result = 10 + 5
```

### String (`string`)

UTF-8 encoded text strings (std::string in C++)

```ecem
let name = "Alice"
let greeting = "Hello, " + name
let empty = ""
```

### Boolean (`boolean`)

True or false values

```ecem
let isReady = true
let isComplete = false
let result = age > 18
```

### Void (`void`)

Represents no value (used for function return types)

```ecem
ft doSomething() -> void {
    print("Done")
    return  // Optional explicit return
}
```

---

## Variables

### Variable Declaration

Variables are declared using the `let` keyword with automatic type inference:

```ecem
let name = "Alice"       // string
let age = 30             // int  
let isStudent = false    // boolean
```

### Variable Assignment

Variables can be reassigned if the type matches:

```ecem
let counter = 0
counter = counter + 1    // OK: both are int
counter = "text"         // ERROR: cannot assign string to int
```

### Scoping Rules

- Variables have block scope
- Inner scopes can shadow outer variables
- Variables must be declared before use

```ecem
let x = 10
check x > 5 {
    let x = 20    // Shadows outer x
    print(x)      // Prints 20
}
print(x)          // Prints 10
```

---

## Operators

### Arithmetic Operators

```ecem
let a = 10
let b = 3

let sum = a + b        // 13
let diff = a - b       // 7
let product = a * b    // 30
let quotient = a / b   // 3 (integer division)
```

### Comparison Operators

```ecem
let x = 10
let y = 20

let equal = x == y       // false
let notEqual = x != y    // true
let less = x < y         // true
let lessEqual = x <= y   // true
let greater = x > y      // false
let greaterEqual = x >= y // false
```

### Logical Operators

```ecem
let a = true
let b = false

let andResult = a && b    // false
let orResult = a || b     // true
let notResult = !a        // false

// 'and', 'or' and 'not' keywords are reserved by C++, so let's not use them
```

### String Operations

```ecem
let first = "Hello"
let second = "World"
let combined = first + " " + second  // "Hello World"
```

### Operator Precedence

From highest to lowest:

1. `!` (logical NOT)
2. `*`, `/` (multiplication, division)
3. `+`, `-` (addition, subtraction)
4. `<`, `<=`, `>`, `>=` (comparison)
5. `==`, `!=` (equality)
6. `&&` (logical AND)
7. `||` (logical OR)

---

## Control Flow

### Conditional Statements (`check`)

**NOTE:** do not forget to import `<io>` module to use `print` function.

```ecem
let age = 18

check age >= 18 {
    print("You are an adult")
} fail {
    print("You are a minor")
}
```

Multiple conditions:

```ecem
let score = 85

check score >= 90 {
    print("Grade A")
} fail check score >= 80 {
    print("Grade B") 
} fail check score >= 70 {
    print("Grade C")
} fail {
    print("Grade F")
}
```

### Loops (`during`)

```ecem
let i = 0
during i < 5 {
    print("Count: ", i)
    i = i + 1
} fail {
    print("Loop did not run") // Executes if the loop condition is false initially
}
```

The `fail` block in loops executes when the loop condition is false initially, similar to the `else` block in `check`.

---

## Functions

### Function Definition

```ecem
ft functionName(type param1, type param2) -> returnType {
    // function body
    return value  // if returnType is not void
}
```

### Examples

```ecem
// Function with parameters and return value
ft add(int a, int b) -> int {
    return a + b
}

// Function with no parameters
ft getGreeting() -> string {
    return "Hello!"
}

// Function with no return value
ft printMessage(string msg) -> void {
    print(msg)
    return  // Optional for void functions
}
```

### Function Calls

```ecem
let result = add(5, 3)         // 8
let greeting = getGreeting()   // "Hello!"
printMessage("Hi there!")      // void
```

### Function Scope

- Functions can access variables from their declaration scope
- Function parameters are locally scoped
- Functions must be declared before they are called

---

## Standard Library

ecem2 comes with a built-in standard library that provides common functionality. You can import modules to access these features.

### IO Module (`<io>`)

```ecem
import <io>

// Print values to console
print("Hello")          // Print string
print(42)               // Print int  
print(true)             // Print boolean
print("Name:", name)    // Print multiple values

// Read input from user
let name = input("Enter your name: ")
let response = input()  // No prompt
```

### String Module (`<string>`)

```ecem
import <string>

// Convert to string
let numStr = to_string(42)      // "42"
let boolStr = to_string(true)   // "true"

// String analysis
let hasPrefix = starts_with("hello", "he")   // true
let hasSuffix = ends_with("world", "ld")     // true  
let contains_sub = contains("test", "es")    // true
```

### String Methods and Properties

```ecem
let text = "Hello World"

// Properties
let length = text.len        // 11

// Methods  
let upper = text.upper()     // "HELLO WORLD"
let lower = text.lower()     // "hello world"
```

### Math Module (`<math>`)

```ecem
import <math>

// Basic math functions
let root = sqrt(16)          // 4
let power = pow(2, 3)        // 8

// Variadic functions
let maximum = max(1, 5, 2, 8, 3)  // 8
let minimum = min(1, 5, 2, 8, 3)  // 1
```

---

## Modules and Imports

### Available Modules

- `<io>`: Input/output operations
- `<string>`: String manipulation functions
- `<math>`: Mathematical operations

### Import Syntax

```ecem
import <module_name>
```

### Import Rules

- Imports must appear at the top of the file
- Modules must be imported before their functions can be used

---

## Error Handling

ecem2 provides comprehensive compile-time error checking:

### Type Errors

```ecem
let x = 5
x = "hello"  // ERROR: Cannot assign value of type string to identifier x of type int
```

### Undefined Variables

```ecem
print(undefinedVar)  // ERROR: Identifier undefinedVar is not defined
```

### Function Errors

```ecem
// Function not imported
print("hello")  // ERROR: print is not a function, did you forget to import <io>?

// ERROR: Wrong argument count
import <math>
let result = pow(2)  // ERROR: pow expects at least 2 argument(s), got 1
```

### Syntax Errors

```ecem
let x =  // ERROR: Unexpected value type EOF for identifier x
```

All errors include:

- File name and line number
- Column position with visual indicator
- Clear description of the problem
- Suggestions when applicable

---

## Code Examples

You can find example programs in the `examples` directory.

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
