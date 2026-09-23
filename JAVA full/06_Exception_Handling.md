# 06. Exception Handling 🔥🔥🔥

---

## 6.1 Why Exceptions Exist

Without exceptions, every function would need to return error codes, and callers would need to check them manually every time (easy to forget — a huge source of C-style bugs). Exceptions **separate error-handling code from normal business logic** and guarantee an error **cannot be silently ignored** (an uncaught exception crashes/propagates loudly, rather than continuing silently with bad state).

---

## 6.2 The `Throwable` Hierarchy — draw this from memory

```
                    Throwable
                   /          \
              Error            Exception
             /    \            /        \
   StackOverflow  OutOfMemory  RuntimeException   (checked exceptions)
       Error         Error      /  |  |  \          IOException, SQLException,
                            NPE  AIOOBE  ArithmeticException  ClassNotFoundException, ...
                          (Null   (ArrayIndex          |
                          Pointer  OutOfBounds)   ClassCastException,
                          Exception)                NumberFormatException,
                                                    IllegalArgumentException,
                                                    IllegalStateException,
                                                    UnsupportedOperationException,
                                                    ConcurrentModificationException
```

| Branch | Meaning | Should you catch it? |
|---|---|---|
| `Error` | Serious problems typically **outside application control** (JVM-level) — `OutOfMemoryError`, `StackOverflowError`, `NoClassDefFoundError` | Generally **no** — usually unrecoverable; the app typically can't meaningfully fix the underlying JVM/environment issue. |
| `RuntimeException` (unchecked) | Programming errors / logic bugs — `NullPointerException`, `ArrayIndexOutOfBoundsException`, `ClassCastException`, `ArithmeticException`, `IllegalArgumentException`, `NumberFormatException` | Fix the bug instead of catching, generally — though sometimes caught deliberately at a boundary (e.g., validating and converting to a domain error). |
| `Exception` (checked, everything NOT extending `RuntimeException`) | Recoverable conditions **external** to your code's own logic — `IOException`, `SQLException`, `FileNotFoundException`, `ParseException` | **Yes** — the compiler forces you to either catch or declare (`throws`) these. |

**Checked vs Unchecked — the one-sentence distinction interviewers want:**
*"Checked exceptions are checked by the COMPILER at compile time — you must handle or declare them, because they represent recoverable external conditions the caller should be aware of and plan for (like a missing file). Unchecked exceptions (`RuntimeException` and `Error`) are not checked by the compiler — they typically represent programming bugs or unrecoverable JVM failures that could occur almost anywhere, so forcing every method to declare them would be impractical."*

---

## 6.3 try / catch / finally

```java
try {
    riskyOperation();
} catch (IOException e) {
    // handle
} catch (SQLException e) {
    // handle a DIFFERENT exception type
} finally {
    // ALWAYS runs — success, exception caught, exception NOT caught, even a `return` in try/catch
    cleanup();
}
```

### `finally` execution guarantee — and its one real exception
`finally` runs in **every** case: normal completion, an exception caught, an exception NOT caught (propagating further up), or even a `return`/`break`/`continue` inside the `try`/`catch`. The **only** ways to skip `finally`:
- `System.exit(...)` is called inside `try`/`catch` (terminates the JVM immediately, no cleanup).
- The JVM itself crashes/is killed (power loss, `kill -9`, etc.).
- An infinite loop or fatal `Error` inside the `try` block prevents ever reaching `finally`.

### The `finally`-overrides-`return` trap (a favorite "predict the output" question)
```java
static int test() {
    try {
        return 1;
    } finally {
        return 2;                 // this SWALLOWS the try's return value entirely!
    }
}
System.out.println(test());        // 2
```
**Why:** if `finally` contains its own `return` (or `throw`), it **completely discards** any pending return value (or in-flight exception!) from the `try`/`catch` block. This is considered **terrible practice** — never put a `return` inside `finally`.

```java
static int test2() {
    int x = 1;
    try {
        return x;              // x is EVALUATED and "recorded" as 1 here...
    } finally {
        x = 2;                 // ...then this mutation happens too LATE to affect the already-recorded return value
    }
}
System.out.println(test2());   // 1 — NOT 2! (contrast with the previous example where finally has its OWN return)
```
**Precise mental model:** the `return` expression's *value* is computed and stashed **before** `finally` runs; `finally` can still execute, but merely mutating a variable afterward doesn't change the already-stashed value — only an explicit `return`/`throw` **inside** `finally` can override the outcome.

### An exception thrown inside `finally` swallows the original exception
```java
static void test3() {
    try {
        throw new RuntimeException("original");
    } finally {
        throw new IllegalStateException("from finally");   // this WINS — "original" is completely lost!
    }
}
```
This is why production code almost never throws from a `finally` block directly — modern code uses **try-with-resources** instead, which handles this far more gracefully via **suppressed exceptions** (see 6.6).

### Multiple catch blocks — ORDER MATTERS (subclass before superclass)
```java
try {
    // ...
} catch (ArithmeticException e) {
    // more specific — must come FIRST
} catch (RuntimeException e) {
    // more general — comes AFTER
}
// } catch (RuntimeException e) { } catch (ArithmeticException e) { }
// COMPILE ERROR: "exception ArithmeticException has already been caught" — unreachable catch block!
```
**Multi-catch (Java 7+)** — one block for multiple unrelated exception types:
```java
try {
    // ...
} catch (IOException | SQLException e) {
    // `e` is effectively final here, and its static type is the LUB (least upper bound) of both types
    log(e.getMessage());
}
```
**Restriction:** the types in a multi-catch must NOT have a subtype relationship to each other (e.g., `catch (IOException | FileNotFoundException e)` is a compile error, since `FileNotFoundException` already IS-A `IOException`, making the union redundant/ambiguous).

### Nested try
```java
try {
    try {
        throw new RuntimeException("inner");
    } finally {
        System.out.println("inner finally");
    }
} catch (RuntimeException e) {
    System.out.println("outer caught: " + e.getMessage());
}
// Output: "inner finally"  then  "outer caught: inner"
```

---

## 6.4 `throw` vs `throws`

| | `throw` | `throws` |
|---|---|---|
| Used | inside a method body, to actually raise an exception NOW | in a method signature, to declare what MIGHT propagate out |
| Followed by | a single exception **instance** | a comma-separated list of exception **types** |
| Example | `throw new IllegalArgumentException("bad");` | `void read() throws IOException, SQLException { }` |

```java
void validate(int age) {
    if (age < 0) throw new IllegalArgumentException("Age cannot be negative");   // throw — an instance
}
void readFile() throws IOException {    // throws — declares the possibility, forces callers to handle/declare it too
    new FileReader("x.txt");
}
```

---

## 6.5 Exception Chaining ("cause") — don't lose the original root cause

```java
try {
    parseConfig();
} catch (NumberFormatException e) {
    throw new ConfigException("Invalid config value", e);   // `e` becomes the "cause" — preserved in the stack trace!
}
// e.getCause() on the ConfigException would return the original NumberFormatException
// printStackTrace() prints "Caused by: ..." showing the full original chain
```
This matters enormously in real systems — **rethrowing a NEW exception without passing the original as the cause destroys debugging information** and is considered a serious anti-pattern.

---

## 6.6 try-with-resources (Java 7+) — the modern replacement for manual `finally` cleanup

```java
try (BufferedReader br = new BufferedReader(new FileReader("file.txt"));
     FileWriter fw = new FileWriter("out.txt")) {           // multiple resources, semicolon-separated
    String line = br.readLine();
    fw.write(line);
} catch (IOException e) {
    e.printStackTrace();
}
// br.close() and fw.close() are called AUTOMATICALLY, in REVERSE declaration order (fw closed first, then br)
// — NO explicit finally block needed!
```
**Requirement:** any resource used in try-with-resources must implement `AutoCloseable` (or the stricter `Closeable`), i.e. have a `void close() throws Exception` method.

**Suppressed exceptions** — the elegant improvement over the manual-`finally` "swallowed exception" problem from 6.3:
```java
class Resource implements AutoCloseable {
    public void doWork() { throw new RuntimeException("work failed"); }
    public void close() { throw new RuntimeException("close failed"); }
}
try (Resource r = new Resource()) {
    r.doWork();
}
// The PRIMARY exception surfaced is "work failed" (from the try body)
// "close failed" is NOT lost — it's attached as a SUPPRESSED exception, retrievable via
// primaryException.getSuppressed() — unlike the manual finally-throws-swallows-everything problem in 6.3!
```
**Interview one-liner:** *"try-with-resources doesn't just save you `finally` boilerplate — it also fixes the exception-swallowing bug that manual cleanup in `finally` is prone to, by using suppressed exceptions instead of silently discarding the original."*

### `Closeable` vs `AutoCloseable`
- `AutoCloseable.close()` throws `Exception` (broad).
- `Closeable.close()` (used by I/O classes) throws only `IOException` (narrower) and is also **idempotent by contract** (safe to call multiple times) — a subtle refinement `AutoCloseable` doesn't guarantee.

---

## 6.7 Custom Exceptions

```java
class InsufficientFundsException extends Exception {              // CHECKED — forces callers to handle it
    private final double shortfall;
    public InsufficientFundsException(String message, double shortfall) {
        super(message);
        this.shortfall = shortfall;
    }
    public double getShortfall() { return shortfall; }
}

class InvalidOrderException extends RuntimeException {            // UNCHECKED — a programming/validation bug
    public InvalidOrderException(String message) { super(message); }
    public InvalidOrderException(String message, Throwable cause) { super(message, cause); }
}
```
**When to choose checked vs unchecked for your OWN custom exception (a real design-judgment question):**
- **Checked**, if the caller has a realistic, expected way to **recover** and should be forced to think about it (e.g., "insufficient funds" — the caller might prompt the user for another payment method).
- **Unchecked**, if it represents a **programming error** or a condition the caller usually can't meaningfully recover from at the call site (e.g., invalid internal state, violated precondition) — this is also the modern trend: many popular frameworks (Spring, Hibernate) deliberately favor unchecked exceptions to avoid "checked exception fatigue" (forcing every caller up the whole stack to catch-or-declare exceptions they can't do anything about).

**Best practices checklist:**
- Always provide constructors matching `Exception`'s common ones: `()`, `(String message)`, `(String message, Throwable cause)`, `(Throwable cause)`.
- Name ending in `Exception` by convention.
- Add a `serialVersionUID` if you care about serialization compatibility (rarely essential for interview-level code, but shows polish).
- Don't put excessive business logic inside the exception class — keep it a data carrier.

---

## 6.8 Common Runtime Exceptions You Must Recognize on Sight

| Exception | Typical trigger |
|---|---|
| `NullPointerException` | calling a method / accessing a field on a `null` reference |
| `ArrayIndexOutOfBoundsException` | `arr[i]` where `i < 0` or `i >= arr.length` |
| `StringIndexOutOfBoundsException` | invalid index/range in `charAt`/`substring` |
| `ClassCastException` | invalid explicit downcast (`(Cat) someDog`) |
| `ArithmeticException` | integer division/modulo by zero |
| `NumberFormatException` | `Integer.parseInt("abc")` — malformed numeric string |
| `IllegalArgumentException` | a method argument violates a documented precondition |
| `IllegalStateException` | a method called at the wrong time / wrong object state |
| `UnsupportedOperationException` | calling a mutator (`add`/`remove`) on an immutable/fixed-size collection view |
| `ConcurrentModificationException` | structurally modifying a collection while iterating it without `Iterator.remove()` |
| `NegativeArraySizeException` | `new int[-1]` |

**`NullPointerException` deep dive — Helpful NPEs (Java 14+):**
```java
a.b.c.doSomething();   // if `b` is null, modern JVMs print exactly:
// "Cannot invoke "C.doSomething()" because "a.b.c" is null" — pinpointing WHICH reference in the chain was null
```
This JEP 358 feature (enabled by default since Java 15) is worth mentioning — it removes a lot of the historical pain of "which of these five chained calls actually NPE'd."

---

## 🚩 Common Traps Recap (Phase 6)

1. `finally` always runs (except `System.exit`/JVM crash) — even overriding an in-flight `return` or exception if `finally` itself has its own `return`/`throw`.
2. A `return` value from `try` is computed/stashed BEFORE `finally` executes; later mutating the variable in `finally` does not change the returned value (unless `finally` itself returns).
3. Catch blocks must go from most-specific to least-specific subtype, or it's a compile error.
4. Multi-catch types must not be subtype-related to each other.
5. An exception thrown in `finally` (manually) completely swallows an in-flight exception from `try`/`catch` — try-with-resources avoids this via suppressed exceptions.
6. Checked exceptions must be caught or declared (`throws`); unchecked exceptions have no such compiler requirement.
7. Rethrowing without preserving `cause` destroys debugging context.
8. `Error`s (like `OutOfMemoryError`) generally shouldn't be caught/handled as if recoverable.

## ❓ Rapid-Fire Q&A

**Q: What prints, and why?**
```java
static int f() {
    try { return 10; }
    finally { System.out.println("finally"); }
}
```
A: Prints "finally", then the method returns `10` — `finally` runs, but since it doesn't have its OWN `return`, the original stashed return value of 10 survives.

**Q: Is `ClassCastException` checked or unchecked?**
A: Unchecked — it extends `RuntimeException`.

**Q: Why does modern framework code (Spring, etc.) favor unchecked exceptions over checked ones?**
A: To avoid forcing every method in a long call chain to declare or wrap exceptions it has no meaningful way to recover from — "checked exception fatigue" — and because checked exceptions don't compose well with functional-style code (e.g., lambdas passed to Stream operations can't throw checked exceptions without wrapping).

**Q: What's the difference between `Exception` and `Error` in terms of intended handling?**
A: `Exception`s (especially checked ones) represent conditions an application might reasonably anticipate and recover from; `Error`s represent serious, usually unrecoverable JVM-level problems that application code generally shouldn't try to catch and handle as if recoverable.

**Q: How does try-with-resources improve on manual `finally`-based cleanup?**
A: It automatically closes resources in reverse declaration order without boilerplate, and — critically — if both the try-block body AND the `close()` call throw, it preserves BOTH: the try-block's exception is primary, and the `close()` exception is attached as a "suppressed" exception rather than silently overwriting the original (which is exactly what happens with a naive manual `finally` block that itself throws).
