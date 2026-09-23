# 01. Java Fundamentals

---

## 1.1 What is Java — Features that actually get asked about

| Feature | What it really means | Interview angle |
|---|---|---|
| Platform independent | Compiles to **bytecode** (`.class`), not machine code. The JVM interprets/JIT-compiles bytecode per OS. | "Write once, run anywhere" refers to bytecode portability, **not** source portability — native libraries (JNI) break this. |
| Object-Oriented | Everything (except the 8 primitives) is an object. | Java is not 100% pure OOP because primitives exist outside the object model. |
| Automatic memory management | Garbage Collector reclaims heap memory. | You don't control *when* GC runs (`System.gc()` is only a *hint*). |
| Multithreaded | Built-in `Thread`, `Runnable`, `java.util.concurrent`. | See file 13. |
| Statically typed | Types are checked at compile time. | Doesn't stop `ClassCastException` at runtime with generics erasure (see file 08). |
| Robust | Strong compile-time checking + exception handling + no explicit pointers. | "No pointers" is a half-truth — references *are* pointers, just not arithmetic-capable. |

---

## 1.2 JDK vs JRE vs JVM — the classic Day-1 question

```
JDK (Java Development Kit)
 └── JRE (Java Runtime Environment)
      └── JVM (Java Virtual Machine)
      └── Core libraries (java.lang, java.util, ...)
 └── Development tools: javac, javadoc, jar, debugger
```

- **JVM** — the abstract engine that actually executes bytecode. Platform-**specific** implementation, but presents a platform-**independent** spec.
- **JRE** — JVM + standard class libraries needed to *run* a compiled Java program. No compiler.
- **JDK** — JRE + `javac` (compiler), tools needed to *develop*.

**Tricky point:** You need the JDK to compile (`.java → .class`), but only the JRE to run a `.jar`. Since Java 11, Oracle stopped shipping a separate public JRE download — but conceptually the JRE still exists *inside* the JDK.

**JVM internal components (name-drop these, they matter for file 05 too):**
- **Class Loader Subsystem** — loading, linking (verify, prepare, resolve), initialization.
- **Runtime Data Areas** — Method Area, Heap, Stack (per-thread), PC Registers (per-thread), Native Method Stack.
- **Execution Engine** — Interpreter, JIT Compiler, Garbage Collector.

---

## 1.3 Compilation & Execution Flow

```
MyClass.java --(javac)--> MyClass.class (bytecode)
                                 |
                                 v
                          Class Loader loads .class into JVM
                                 |
                                 v
                Bytecode Verifier checks it's safe (no stack corruption etc.)
                                 |
                                 v
              Execution Engine: Interpreter (line by line) 
                                 + JIT compiler (hot code paths -> native machine code)
                                 |
                                 v
                              Program runs
```

**Gotcha:** `javac` produces **one `.class` file per class**, including every nested/inner/anonymous class (`Outer$Inner.class`, `Outer$1.class` for anonymous classes). If you write 3 classes in one `.java` file (only one `public`), compiling produces 3 `.class` files.

---

## 1.4 `class`, `main()`, and the rules around them

```java
public class Main {
    public static void main(String[] args) {   // exact signature required
        System.out.println("Hello");
    }
}
```

**Every keyword in the signature is load-bearing:**
- `public` — JVM must call it from outside the class → must be accessible.
- `static` — JVM calls it **without creating an object** of the class. If it weren't static, the JVM would need to know how to construct your object first (chicken-and-egg).
- `void` — main doesn't return a value to the JVM in the language sense (it *does* signal exit code via `System.exit(int)` or an uncaught exception, but not via `return`).
- `String[] args` — command-line arguments. `String... args` (varargs) is **also legal** — this is a lesser-known valid alternative signature.
- Method name **must** be `main` — case-sensitive.

**Edge cases interviewers love:**
- Can a class have **no `main`** and still compile? Yes — it just can't be run directly via `java ClassName`.
- Can you **overload** `main`? Yes! `public static void main(String args)` (no array) is a legal *overload*, but the JVM will never call it — only the exact `String[]` signature is the entry point.
- What if a class has multiple classes with `main` methods? You choose which class to run at the command line — `java ClassName`.
- **Can `main` be `final`, `synchronized`, `private`?** `final`/`synchronized` — legal, compiles, runs fine. `private` — compiles, but `java ClassName` fails at runtime with `NoSuchMethodError: main` (the JVM can't call a private method from outside).

---

## 1.5 Naming Conventions (asked in "clean code" style rounds)

| Element | Convention | Example |
|---|---|---|
| Class / Interface | UpperCamelCase, noun | `BankAccount`, `Runnable` |
| Method / variable | lowerCamelCase, verb for methods | `calculateInterest()`, `accountBalance` |
| Constant (`static final`) | ALL_CAPS_SNAKE | `MAX_LIMIT` |
| Package | all lowercase, reverse domain | `com.company.project` |

These are conventions, not compiler rules — code with wrong naming still compiles. Interviewers sometimes deliberately give you badly-named code and ask you to "clean it up" as a proxy for code-quality awareness.

---

## 1.6 Variables & Primitive Data Types — the full table (memorize sizes and ranges)

| Type | Size | Range | Default value | Wrapper |
|---|---|---|---|---|
| `byte` | 8 bit | -128 to 127 | 0 | `Byte` |
| `short` | 16 bit | -32,768 to 32,767 | 0 | `Short` |
| `int` | 32 bit | -2,147,483,648 to 2,147,483,647 (~2.1×10⁹) | 0 | `Integer` |
| `long` | 64 bit | -9.2×10¹⁸ to 9.2×10¹⁸ | 0L | `Long` |
| `float` | 32 bit | ~±3.4×10³⁸ (7 decimal digits precision) | 0.0f | `Float` |
| `double` | 64 bit | ~±1.7×10³⁰⁸ (15 decimal digits precision) | 0.0d | `Double` |
| `char` | 16 bit **unsigned** | 0 to 65,535 (Unicode) | `'\u0000'` | `Character` |
| `boolean` | JVM-dependent (spec doesn't fix size, typically 1 bit conceptually, often stored as 1 byte/int) | `true`/`false` | `false` | `Boolean` |

**Critical, frequently-missed facts:**
- `char` is the **only unsigned** primitive in Java. It's essentially an unsigned 16-bit integer that maps to a UTF-16 code unit.
- There is no unsigned `int`/`long` in Java (unlike C). Java 8 added `Integer.toUnsignedString()`, `Long.divideUnsigned()` etc. as **library-level** workarounds, not a new type.
- **Local variables have NO default value** — must be explicitly initialized before use, or you get a compile error ("variable might not have been initialized"). Only **fields** (instance/static) get defaults.
- Literal suffixes: `100L` (long), `3.14f` (float, mandatory `f` or it's a `double` by default), `100D`/`100d` (double, optional since it's the default).
- Underscore in numeric literals for readability (Java 7+): `int million = 1_000_000;` — cannot be at the start/end or adjacent to a decimal point.

### Scope of variables

```java
public class ScopeDemo {
    static int staticVar = 1;          // class/static scope — lives for class lifetime
    int instanceVar = 2;               // instance scope — lives with the object

    void method() {
        int localVar = 3;              // method scope — dies when method returns
        for (int i = 0; i < 5; i++) {  // block scope — i dies after the loop
            int blockVar = i * 2;      // dies each iteration in concept, exists only in this block
        }
        // i and blockVar are NOT visible here
    }
}
```

**Gotcha:** Variable shadowing — a local variable/parameter with the same name as a field *hides* the field inside that scope. Use `this.fieldName` to disambiguate.

```java
class Box {
    int size;
    Box(int size) {
        size = size;       // BUG: assigns parameter to itself, field stays 0! Classic interview trap.
        this.size = size;  // CORRECT
    }
}
```

---

## 1.7 Type Casting

### Implicit (Widening) — automatic, no data loss risk
```
byte -> short -> int -> long -> float -> double
         char  ----^
```
```java
int i = 100;
double d = i;   // implicit widening, no cast needed
```
**Gotcha:** `long → float` and `long → double` **can lose precision** even though they're "widening" in terms of range — because `float`/`double` have limited mantissa bits. E.g., a `long` with 19 significant digits can't be exactly represented in a `double` (52-bit mantissa ≈ 15-17 decimal digits).

### Explicit (Narrowing) — you must cast; possible data loss
```java
double d = 100.99;
int i = (int) d;     // 100 — truncates (NOT rounds!) the decimal part
long big = 300L;
byte b = (byte) big; // overflow-wraps using modulo 256 arithmetic
```

**The narrowing-conversion overflow formula (memorize this, it's asked constantly):**
For casting a larger integer type to `byte`: the JVM takes the value **modulo 256**, and if the result is ≥128, subtracts 256 (two's-complement wraparound).

```java
int i = 130;
byte b = (byte) i;   // 130 - 256 = -126
System.out.println(b); // -126

int i2 = 300;
byte b2 = (byte) i2; // 300 % 256 = 44 → 44 < 128 → stays 44
System.out.println(b2); // 44
```

### Integer Overflow — silent, no exception!
```java
int max = Integer.MAX_VALUE;      // 2147483647
System.out.println(max + 1);      // -2147483648 (wraps to MIN_VALUE!) — NO exception thrown
```
This is a **notorious DSA bug source**: e.g. `int mid = (low + high) / 2;` in binary search can overflow if `low + high > Integer.MAX_VALUE`. Correct idiom:
```java
int mid = low + (high - low) / 2;   // avoids overflow
```

### Floating point gotchas
```java
System.out.println(0.1 + 0.2);          // 0.30000000000000004  — NOT 0.3!
System.out.println(0.1 + 0.2 == 0.3);   // false
```
**Why:** `double`/`float` use IEEE-754 binary floating point — most decimal fractions (like 0.1) **cannot be represented exactly** in binary, same way 1/3 can't be represented exactly in decimal. **Never compare floats/doubles with `==`** — use a tolerance (`Math.abs(a - b) < 1e-9`) or `BigDecimal` for exact decimal arithmetic (money calculations).

```java
System.out.println(1.0 / 0);    // Infinity  (no exception for floating-point div by zero!)
System.out.println(-1.0 / 0);   // -Infinity
System.out.println(0.0 / 0);    // NaN
System.out.println(Double.NaN == Double.NaN); // false! NaN is never equal to anything, even itself
System.out.println(Double.isNaN(0.0/0));      // true — correct way to check

System.out.println(5 / 0);      // ArithmeticException: / by zero  — INTEGER division DOES throw!
```
**Key contrast interviewers test:** integer `x/0` → `ArithmeticException`. Floating-point `x/0.0` → `Infinity`/`NaN`, no exception.

---

## 1.8 Operators — full list with the traps

### Arithmetic: `+ - * / %`
```java
System.out.println(7 / 2);     // 2  (integer division truncates)
System.out.println(7 % 2);     // 1
System.out.println(-7 % 2);    // -1  — Java's % keeps the SIGN OF THE DIVIDEND (unlike Python's -7 % 2 = 1)
System.out.println(7 % -2);    // 1
System.out.println(-7.5 % 2);  // -1.5 — % works on doubles too in Java, unlike some languages
```
`+` is overloaded for `String` concatenation — **left-to-right evaluation** matters:
```java
System.out.println(1 + 2 + "3");   // "33"  (1+2 evaluated first = 3, then "3"+"3")
System.out.println("1" + 2 + 3);   // "123" (string concat left to right, no more numeric addition)
```

### Relational: `== != > < >= <=`
For objects, `==` compares **references** (memory addresses), not content — this is THE most-tested gotcha (fully covered in file 02 & 05 with String Pool / equals()).

### Logical: `&& || !` (short-circuit) vs `& |` (non-short-circuit, also bitwise)
```java
int[] arr = null;
if (arr != null && arr.length > 0) { }   // safe — short-circuits, arr.length never evaluated if arr is null
if (arr != null & arr.length > 0) { }    // DANGEROUS — both sides always evaluated -> NullPointerException if arr is null!
```
**Interview trap using side effects:**
```java
int x = 5;
boolean result = (x > 10) && (++x > 5);
System.out.println(x); // 5 — right side never executed because left was false (short-circuit)

boolean result2 = (x > 10) & (++x > 5);
System.out.println(x); // 6 — & always evaluates both sides
```

### Assignment: `= += -= *= /= %= &= |= ^= <<= >>= >>>=`
**Compound assignment secretly casts** — this is a top interview trap:
```java
byte b = 10;
b = b + 1;      // COMPILE ERROR: int cannot be converted to byte (b+1 promotes to int)
b += 1;         // WORKS FINE — equivalent to b = (byte)(b + 1); the compiler inserts an implicit cast
```

### Unary: `+ - ++ --`
Pre vs post increment — classic trick questions:
```java
int a = 5;
int b = a++ + ++a;
// a++ : use 5, then a becomes 6
// ++a : a becomes 7, then use 7
// b = 5 + 7 = 12; a = 7
System.out.println(a + " " + b); // 7 12
```
```java
int i = 1;
i = i++;              // i stays 1! (classic trap)
// Sequence: RHS evaluated -> i++ returns 1 (the OLD value) but ALSO schedules i=2 internally;
// then the assignment "i = " overwrites i with the returned OLD value (1), clobbering the increment.
System.out.println(i); // 1
```

### Ternary: `condition ? a : b`
**Hidden type-promotion trap** — the ternary operator's result type is the *common promoted type* of both branches, decided at compile time, which can cause unexpected (un)boxing:
```java
Object result = true ? 10 : 20.5;
System.out.println(result); // 10.0  — NOT 10!
// Because one branch is int and other is double, Java promotes BOTH branches to double
// even though only one branch is actually "chosen" at runtime.
```
```java
Integer a = null;
Integer b = 5;
int c = true ? a : b;      // NullPointerException!
// Because the ternary's target type is `int` (primitive), Java tries to unbox `a` (null) -> NPE,
// even though the condition means `a` is never the branch you "wanted" to use logically... 
// wait — here condition is true so `a` (null) IS chosen, then auto-unboxed into int -> NPE.
```

### Bitwise & Shift: covered in depth in file `10_Bit_Manipulation.md` — but the core set:
| Operator | Meaning |
|---|---|
| `&` | AND |
| `\|` | OR |
| `^` | XOR |
| `~` | bitwise NOT (complement) |
| `<<` | left shift (multiply by 2ⁿ) |
| `>>` | signed right shift (fills with sign bit — arithmetic shift) |
| `>>>` | **unsigned** right shift (fills with 0 — logical shift) — Java-specific, doesn't exist in C |

```java
System.out.println(-8 >> 1);   // -4  (sign-extends, fills with 1s)
System.out.println(-8 >>> 1);  // 2147483644 (fills with 0s, treats as unsigned 32-bit pattern)
```

### instanceof (also technically an operator)
```java
Object o = "hello";
if (o instanceof String) { ... }
// Java 16+ pattern matching:
if (o instanceof String s) {         // 's' auto-cast and scoped to the if-block
    System.out.println(s.length());
}
```
`null instanceof AnyType` is always `false` — never throws.

---

## 1.9 Control Flow

### if/else — dangling-else trap
```java
if (a > 0)
    if (b > 0)
        System.out.println("both positive");
else
    System.out.println("a not positive");  // WRONG intuition!
```
The `else` binds to the **nearest unmatched `if`** — here it binds to `if (b > 0)`, not `if (a > 0)`. Always use braces to avoid ambiguity.

### switch — fall-through is the #1 trap
```java
int day = 2;
switch (day) {
    case 1: System.out.println("Mon");
    case 2: System.out.println("Tue");   // no break -> falls through
    case 3: System.out.println("Wed"); break;
    default: System.out.println("??");
}
// Output: Tue  Wed   (day=2 prints Tue AND Wed because of missing break after case 2)
```
**Switch works on:** `byte, short, char, int` (and their wrappers via auto-unboxing), `String` (Java 7+), `enum`. **Does NOT work on:** `long`, `float`, `double`, `boolean`.

**Modern switch expressions (Java 14+)** — no fall-through, returns a value:
```java
String name = switch (day) {
    case 1 -> "Mon";
    case 2, 3 -> "Tue-or-Wed";      // multiple labels, comma-separated
    default -> {
        yield "Unknown";           // yield needed inside a block body
    }
};
```

### Loops
```java
for (int i = 0; i < 5; i++) { }          // classic
for (int x : array) { }                   // enhanced for / for-each — read-only view, can't mutate index
while (condition) { }                     // condition checked BEFORE body — may run 0 times
do { } while (condition);                 // condition checked AFTER — always runs >= 1 time
```
**for-each gotcha — cannot remove/modify the collection while iterating:**
```java
List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4));
for (int n : list) {
    if (n == 2) list.remove(Integer.valueOf(2));  // ConcurrentModificationException on next iteration!
}
```
Correct approach: use `Iterator.remove()` or `removeIf()` (see file 07).

**Infinite loop idioms:** `for(;;) {}` and `while(true) {}` are equivalent and both legal.

### break / continue + LABELS (frequently forgotten feature)
```java
outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (j == 1) continue outer;   // skips to next `i`, not just next `j`
        if (i == 2) break outer;      // breaks BOTH loops entirely
        System.out.println(i + "," + j);
    }
}
```
Labeled break/continue is the *only* clean way to escape nested loops in Java (no `goto`). This is heavily used in matrix/grid DSA problems (e.g., breaking out of nested loops on finding a target in a 2D grid).

---

## 1.10 Input/Output

```java
import java.util.Scanner;
Scanner sc = new Scanner(System.in);
int n = sc.nextInt();
String line = sc.nextLine();   // ⚠ CLASSIC BUG: after nextInt(), the newline character is still
                                // in the buffer, so this nextLine() reads an EMPTY string, not the
                                // next line of real input!
// Fix: consume the leftover newline first
sc.nextLine();      // eat the leftover '\n'
String realLine = sc.nextLine();
```

```java
import java.io.BufferedReader;
import java.io.InputStreamReader;
BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
int n = Integer.parseInt(br.readLine().trim());
String[] parts = br.readLine().split(" ");
int[] arr = new int[n];
for (int i = 0; i < n; i++) arr[i] = Integer.parseInt(parts[i]);
```

**Scanner vs BufferedReader — asked as a performance question:**
| | Scanner | BufferedReader |
|---|---|---|
| Speed | Slower (regex-based parsing, synchronized) | Much faster (raw buffered char reads) |
| Convenience | `nextInt()`, `nextDouble()` etc. built in | Only reads raw `String` — you must parse manually |
| Use in competitive programming | Avoid for large inputs (TLE risk) | Preferred for large inputs |

**Parsing gotchas:**
```java
Integer.parseInt("123");     // 123 (int, primitive)
Integer.valueOf("123");      // Integer object (may be cached, see file 08)
Integer.parseInt(" 123 ");   // NumberFormatException — parseInt does NOT trim whitespace!
Integer.parseInt("12.5");    // NumberFormatException — not a valid integer literal
Integer.parseInt("2147483648"); // NumberFormatException — exceeds Integer.MAX_VALUE (overflow on parse, not silent wrap)
```
`System.out.println` vs `System.out.print` vs `System.out.printf`:
```java
System.out.printf("%d + %d = %d%n", 2, 3, 5);  // %n is platform-independent newline (prefer over \n in printf)
```

---

## 🚩 Common Traps Recap (Phase 1)

1. `int` overflow wraps silently — no exception. `long` for anything that might exceed ~2.1 billion.
2. `float`/`double` equality checks with `==` — never do it.
3. Compound assignment (`+=`) silently narrows/casts — plain `=` does not.
4. `switch` fall-through when `break` is forgotten.
5. Ternary operator promotes both branches to a common type — can cause surprise unboxing NPEs.
6. `Scanner.nextInt()` followed by `nextLine()` leaves a dangling newline.
7. `&`/`|` evaluate both sides (no short-circuit) — can NPE where `&&`/`||` would have been safe.
8. Dangling `else` binds to the nearest `if`.
9. `i = i++` doesn't do what people assume — the post-increment's "new" value gets discarded.

## ❓ Rapid-Fire Q&A

**Q: Why is `main` static?**
A: So the JVM can invoke it without first instantiating the class (avoids a chicken-and-egg constructor problem).

**Q: What's the default value of a local `int` variable?**
A: There isn't one — local variables are not auto-initialized; the compiler forces you to assign before use.

**Q: Is `String` a primitive type?**
A: No — it's a reference type (a class), even though it has literal syntax like a primitive (`"abc"`). Covered in depth in file 02.

**Q: Does `5/0` throw an exception? Does `5.0/0`?**
A: Integer division by zero → `ArithmeticException`. Floating-point division by zero → `Infinity`/`NaN`, no exception.

**Q: What does `(int)(char)(byte) -1` evaluate to, and why?**
A: `-1` as `byte` = `11111111`. Casting to `char` (unsigned 16-bit) reinterprets those bits as `0x00FF` = `255` (zero-extended, no sign bit). Casting `255` (`char`) to `int` keeps it as `255`. Answer: **255**. This tests whether you understand that `char` is unsigned and casting reinterprets bit patterns per the source/target type's signedness rules.
