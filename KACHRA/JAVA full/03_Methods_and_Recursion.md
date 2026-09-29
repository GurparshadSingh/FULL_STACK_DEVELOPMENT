# 03. Methods & Recursion 🔥🔥🔥🔥🔥

---

## PART A — METHODS

### 3.1 Anatomy

```java
accessModifier staticOrNot returnType methodName(parameterList) throws ExceptionList {
    // body
    return value; // omit if void
}
```

- **`void`** methods can still use a bare `return;` to exit early — just no value after it.
- A non-void method **must** return a value (or throw) on **every possible code path** — the compiler proves this statically ("missing return statement" error if it can't).

```java
static int classify(int x) {
    if (x > 0) return 1;
    else if (x < 0) return -1;
    // COMPILE ERROR: missing return statement — compiler can't prove x==0 is unreachable
}
```

### 3.2 static vs instance methods

| | static | instance |
|---|---|---|
| Belongs to | the Class | each Object |
| Called via | `ClassName.method()` (also callable via an instance reference, but discouraged) | `object.method()` |
| Can access | only static fields/methods directly | both static AND instance members |
| Has `this`? | **No** | Yes — implicit first parameter |
| Overridable? | **No** — can be *hidden*, not overridden (see file 04) | Yes |

```java
class Counter {
    static int totalCount = 0;   // shared across ALL instances
    int idInBatch;

    Counter() {
        totalCount++;             // static method-like access is fine from an instance context
        idInBatch = totalCount;
    }

    static void resetAll() {
        // totalCount = 0;      OK
        // idInBatch = 0;       COMPILE ERROR — no `this` in static context, can't reach instance field
    }
}
```

### 3.3 Pass-by-value — Java has ONLY this, always (full theory in file 05, quick version here)

- **Primitives:** the actual value is copied. Changes inside the method never escape.
- **Objects/Arrays:** the **reference** (a pointer-like value) is copied. You can mutate the object the reference points to, but reassigning the local reference parameter doesn't affect the caller's variable.

```java
static void tryToSwap(int a, int b) {
    int temp = a; a = b; b = temp;   // swaps local copies only
}
int x = 1, y = 2;
tryToSwap(x, y);
System.out.println(x + " " + y);    // 1 2 — UNCHANGED. This is why Java has no true "swap by reference" for primitives.
```
To truly swap two array elements, you must pass the array (an object) and swap by index — the array's underlying data is shared by reference:
```java
static void swap(int[] arr, int i, int j) {
    int t = arr[i]; arr[i] = arr[j]; arr[j] = t;   // this DOES persist — mutating shared object state
}
```

### 3.4 Method Overloading

**Overloading = same method name, different parameter list** (type, number, or order of parameters). Return type ALONE is not enough to overload.

```java
void print(int x) { }
void print(String x) { }
void print(int x, int y) { }
// void print(int y) { }     // COMPILE ERROR — duplicate signature (parameter NAME doesn't matter, only type/order/count)
// int print(int x) { }      // COMPILE ERROR if the (int) version above exists — return type alone can't differentiate
```

**Overload resolution order (compile-time, based on static/declared type) — THIS is a favorite tricky topic:**
1. **Exact match** first.
2. **Widening primitive conversion** (`int → long → float → double`, etc.) — but note: `byte`/`short`/`char` never auto-widen to each other, only "upward."
3. **Autoboxing/unboxing** — only tried if no exact/widening match exists.
4. **Varargs** — tried LAST, only if nothing else matches.

```java
void go(long x)   { System.out.println("long"); }
void go(Integer x){ System.out.println("Integer"); }
void go(int... x) { System.out.println("varargs"); }

go(5);   // prints "long" — widening (int->long) is preferred over boxing (int->Integer) and varargs!
```
This surprises almost everyone the first time: **widening beats boxing**, and **boxing beats varargs**, even though "Integer" looks like the "obvious" match for an `int` argument.

**Ambiguous overload — compile error, not a runtime pick:**
```java
void f(int x, double y) { }
void f(double x, int y) { }
f(1, 2);    // COMPILE ERROR: reference to f is ambiguous — both need one widening conversion, compiler can't choose
```

**Overloading + null argument ambiguity:**
```java
void h(String s) { }
void h(Object o) { }
h(null);       // calls h(String) — the MOST SPECIFIC applicable type wins for null
// h(null) would be ambiguous if there were also h(StringBuilder) with no subtype relation to String
```

### 3.5 Varargs (`...`)

```java
static int sum(int... nums) {         // internally treated as an int[] parameter
    int total = 0;
    for (int n : nums) total += n;
    return total;
}
sum();              // legal — nums is an empty array, NOT null
sum(1, 2, 3);
sum(new int[]{1,2,3});  // you can also pass an actual array directly
```
**Rules:** at most **one** varargs parameter per method, and it **must be the last** parameter.
```java
static void log(String tag, int level, String... messages) { }   // legal
// static void bad(int... a, int b) { }   // COMPILE ERROR — varargs must be last
```

---

## PART B — RECURSION

### 3.6 The Two Non-Negotiable Parts

Every correct recursive function needs:
1. **Base case** — the condition that stops recursion (without it: infinite recursion → `StackOverflowError`).
2. **Recursive case** — calls itself with an input that provably moves **closer** to the base case.

```java
static int factorial(int n) {
    if (n <= 1) return 1;              // BASE CASE
    return n * factorial(n - 1);       // RECURSIVE CASE — n-1 moves toward the base case
}
```

### 3.7 The Call Stack — draw this, it's asked constantly

Each recursive call pushes a **new stack frame** (local variables, parameters, return address) onto the **call stack**. Nothing in a frame is evaluated/returned until deeper calls resolve — this is why recursion is fundamentally tied to the **stack** data structure (LIFO), which is also why an explicit stack can always simulate recursion iteratively.

```
factorial(4)
 └── 4 * factorial(3)
      └── 3 * factorial(2)
           └── 2 * factorial(1)
                └── returns 1                 <- base case hit, stack starts UNWINDING
           └── 2 * 1 = 2   (returns 2)
      └── 3 * 2 = 6   (returns 6)
 └── 4 * 6 = 24  (returns 24)
```
Key insight: the multiplication `n * factorial(n-1)` **cannot execute until the recursive call returns** — this is why factorial is not naturally "tail recursive" (see 3.10).

### 3.8 StackOverflowError

```java
static void noBase(int n) {
    System.out.println(n);
    noBase(n + 1);     // NO base case -> recurses forever -> StackOverflowError
}
```
- Every thread has a fixed-size stack (default varies by JVM/OS, often ~512KB–1MB); each frame consumes some of it. Deep-enough recursion (even *correct* recursion, e.g. `factorial(1_000_000)`) exhausts it.
- **`StackOverflowError` is an `Error`, not an `Exception`** — it extends `Throwable → Error → VirtualMachineError → StackOverflowError`. Technically catchable (`catch (StackOverflowError e)`), but doing so is almost always a code smell — the fix is a better algorithm (iteration, or increasing `-Xss` stack size only as a last resort).
- Can be tuned via JVM flag `-Xss<size>` (e.g., `-Xss2m`) but that's a workaround, not a fix.

### 3.9 Types of Recursion — know the vocabulary

| Type | Description | Example |
|---|---|---|
| **Direct** | function calls itself | `factorial()` above |
| **Indirect / Mutual** | A calls B, B calls A | `isEven()`/`isOdd()` calling each other |
| **Linear** | exactly one recursive call per invocation | `factorial`, `sum(1..n)` |
| **Tree / Multiple** | more than one recursive call per invocation | naive `fibonacci`, subsets, permutations, tree traversals |
| **Tail** | the recursive call is the LAST operation, nothing pending after it | `helper(n, acc)` pattern below |
| **Non-tail (Head/General)** | work remains pending after the recursive call returns | `n * factorial(n-1)` — multiplication happens AFTER the call returns |

**Mutual recursion example:**
```java
static boolean isEven(int n) {
    if (n == 0) return true;
    return isOdd(n - 1);
}
static boolean isOdd(int n) {
    if (n == 0) return false;
    return isEven(n - 1);
}
```

**Tree recursion — naive Fibonacci (the classic exponential-blowup example):**
```java
static int fib(int n) {
    if (n <= 1) return n;                  // base cases: fib(0)=0, fib(1)=1
    return fib(n - 1) + fib(n - 2);        // TWO recursive calls -> branches into a call TREE
}
```
Complexity: **O(2ⁿ)** time — each call spawns two more, and huge amounts of work are **repeated** (e.g., `fib(2)` is recomputed hundreds of times inside `fib(30)`). This is the canonical motivation for **memoization / DP** (see file 17).

```java
// Memoized version — top-down DP, turns O(2^n) into O(n)
static int fibMemo(int n, int[] memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];             // cache hit — avoid recomputation
    memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    return memo[n];
}
```

### 3.10 Tail Recursion — and why it does NOT help in Java

```java
// "Tail recursive" style — accumulator carries the running result forward
static int factorialTail(int n, int acc) {
    if (n <= 1) return acc;                  // nothing pending after the recursive call returns
    return factorialTail(n - 1, n * acc);    // the recursive call IS the return value — nothing left to do after
}
```
**Critical Java-specific fact:** unlike languages such as Scala/Kotlin (with `tailrec`) or Scheme, **the JVM does NOT perform tail-call optimization**. Writing tail-recursive style in Java does **not** save stack frames — you can still `StackOverflowError` on deep tail recursion. The *only* way to truly avoid stack growth in Java is to convert to an **explicit iterative loop** (or use an explicit `Stack`/`Deque` object to simulate the call stack on the heap, which has much more room than the fixed thread stack).

```java
// The ONLY real fix for deep recursion depth in Java: go iterative
static int factorialIterative(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) result *= i;
    return result;
}
```

### 3.11 Two Recursion "Shapes" You Must Recognize in Interviews

**(a) Return-value recursion** — each call computes and returns a value; the caller combines results.
```java
static int sumArray(int[] arr, int index) {
    if (index == arr.length) return 0;                       // base case
    return arr[index] + sumArray(arr, index + 1);             // combine current + rest
}
```

**(b) Accumulator / helper-method recursion** — pass a mutable "in-progress result" (list, StringBuilder, running total) down through calls, mutate it, don't rely on the return value to combine things. Extremely common in backtracking (file 16).
```java
static void generateSubsets(int[] nums, int index, List<Integer> current, List<List<Integer>> result) {
    if (index == nums.length) {
        result.add(new ArrayList<>(current));    // MUST copy — `current` is reused/mutated by future calls!
        return;
    }
    // Choice 1: exclude nums[index]
    generateSubsets(nums, index + 1, current, result);
    // Choice 2: include nums[index]
    current.add(nums[index]);
    generateSubsets(nums, index + 1, current, result);
    current.remove(current.size() - 1);          // BACKTRACK — undo the choice before returning up the call stack
}
```
**The single most common backtracking bug:** forgetting `new ArrayList<>(current)` when saving a result — since `current` is one shared mutable object reused across the whole recursion tree, saving a raw reference to it means ALL saved "results" end up pointing to the SAME final (usually empty) list once the recursion unwinds.

### 3.12 Multiple Recursive Calls — permutations example

```java
static void permute(List<Integer> nums, List<Integer> current, boolean[] used, List<List<Integer>> result) {
    if (current.size() == nums.size()) {
        result.add(new ArrayList<>(current));
        return;
    }
    for (int i = 0; i < nums.size(); i++) {
        if (used[i]) continue;                  // skip already-used elements
        used[i] = true;
        current.add(nums.get(i));
        permute(nums, current, used, result);   // recurse into the next position
        current.remove(current.size() - 1);     // backtrack: undo the "add"
        used[i] = false;                        // backtrack: undo the "used" marking
    }
}
```
Here the recursion branches **N ways** at each level (not just 2), producing N! leaves — this "choose one of N, recurse, undo" skeleton is the backbone of nearly every backtracking problem (permutations, N-Queens, Sudoku, combination sum).

### 3.13 Recursion vs Iteration — the honest trade-off table

| | Recursion | Iteration |
|---|---|---|
| Readability for naturally recursive structures (trees, graphs, divide & conquer) | Much cleaner | Often awkward, needs an explicit stack |
| Memory | Uses call stack — O(depth) extra space, risk of `StackOverflowError` | O(1) extra space typically |
| Speed | Slight overhead per call (frame push/pop) | Usually faster in raw constant factors |
| When to prefer | Tree/graph traversal, divide & conquer, backtracking | Simple linear iteration, when recursion depth could be large (e.g., >10,000) |

**Interview-safe rule of thumb:** if input size could make recursion depth exceed a few thousand (e.g., recursing over an unsorted linked list of 100,000 nodes, or recursing per-array-index instead of per-`log n`-level), prefer iteration or an explicit stack to avoid `StackOverflowError`.

---

## 🚩 Common Traps Recap (Phase 3)

1. Return type alone can NEVER distinguish overloaded methods — parameter list must differ.
2. Overload resolution prefers **widening > autoboxing > varargs**, in that order — surprises people expecting boxing to win.
3. A varargs parameter must be the **last** parameter, and there can be only one.
4. Missing a base case → infinite recursion → `StackOverflowError` (an `Error`, not `Exception`).
5. Java does **not** optimize tail calls — "tail-recursive style" still consumes stack frames.
6. Naive tree recursion (like Fibonacci) can be exponential — always ask "am I recomputing the same subproblem" before submitting a recursive DSA solution.
7. In backtracking, saving `current` directly (instead of a copy) into your results list is the #1 bug — the shared mutable object gets mutated after being "saved."
8. Passing an array/object lets you mutate its contents from inside a method; passing a primitive never does.

## ❓ Rapid-Fire Q&A

**Q: Why can't Java swap two `Integer` boxed objects permanently using a `swap(Integer a, Integer b)` method?**
A: Because the reference itself is passed by value — reassigning the local parameter `a`/`b` inside the method never changes what the caller's variables point to. Even boxed wrapper objects are immutable, so you can't mutate them in place either.

**Q: Is `StackOverflowError` recoverable?**
A: It's technically catchable via `catch (StackOverflowError e)`, but by the time it's thrown, the stack is exhausted — recovery is unreliable, and the real fix is an iterative rewrite or a smaller recursion depth, not a try/catch.

**Q: What's the time complexity of naive recursive Fibonacci, and how do you fix it?**
A: O(2ⁿ) due to repeated recomputation of overlapping subproblems; fix with memoization (top-down DP) or an iterative bottom-up DP array, reducing it to O(n).

**Q: Give an example where recursion depth, not algorithmic complexity, is the risk.**
A: Recursively traversing a **skewed** (linked-list-like) binary search tree of 100,000 nodes — the algorithm is conceptually O(n), but recursion depth is also O(n), risking `StackOverflowError` where an iterative traversal with an explicit `Stack` would not.
