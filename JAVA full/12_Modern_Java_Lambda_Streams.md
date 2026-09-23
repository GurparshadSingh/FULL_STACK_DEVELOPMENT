# 12. Modern Java: Lambdas, Method References, Streams 🔥🔥

---

## 12.1 Functional Interfaces — the foundation lambdas are built on

A **functional interface** is an interface with **exactly one abstract method** (it can have any number of `default`/`static` methods too — those don't count). The `@FunctionalInterface` annotation is optional but recommended — it makes the compiler enforce the "exactly one abstract method" rule and fail loudly if someone later adds a second one.

```java
@FunctionalInterface
interface Calculator { int calculate(int a, int b); }

Calculator add = (a, b) -> a + b;         // lambda IS-A Calculator — the compiler matches it to the single abstract method
System.out.println(add.calculate(2, 3));  // 5
```

### The standard library's pre-built functional interfaces (`java.util.function`) — memorize these four core ones

| Interface | Abstract method | Signature shape | Typical use |
|---|---|---|---|
| `Predicate<T>` | `boolean test(T t)` | T → boolean | filtering |
| `Function<T,R>` | `R apply(T t)` | T → R | transforming/mapping |
| `Consumer<T>` | `void accept(T t)` | T → void | side-effecting actions (e.g. `forEach`) |
| `Supplier<T>` | `T get()` | () → T | lazy value production/factories |
| `BiFunction<T,U,R>` | `R apply(T t, U u)` | (T,U) → R | two-argument transform |
| `UnaryOperator<T>` | `T apply(T t)` | T → T (Function specialization where input/output types match) | e.g. `x -> x * 2` |
| `BinaryOperator<T>` | `T apply(T t1, T t2)` | (T,T) → T | e.g. `Integer::sum`, used in `reduce` |
| `Runnable` | `void run()` | () → void | (pre-existing, reused as a functional interface) |

Also: `Comparator<T>` itself is a functional interface (`int compare(T a, T b)`) — that's WHY lambdas work as comparators (file 09).

---

## 12.2 Lambda Syntax — every valid form

```java
() -> 42;                                    // no params
x -> x * 2;                                  // one param, parens optional
(x) -> x * 2;                                // one param, parens present — also legal
(x, y) -> x + y;                             // multiple params — parens REQUIRED
(int x, int y) -> x + y;                     // explicit types — allowed, rarely needed (type inferred from context)
x -> { return x * 2; };                      // block body — needs explicit `return` and semicolon
x -> System.out.println(x);                  // expression body with a void-returning call — no return needed
```
**Rule:** if the body is a single expression, no braces/semicolon/`return` needed (the expression's value IS the return value). If you use `{ }` (a block body), you must use explicit `return` (unless the target type is `void`).

### Variable capture — "effectively final" (recap and expand from file 04)
```java
int factor = 10;                              // NOT reassigned anywhere after this -> "effectively final"
Function<Integer, Integer> multiply = x -> x * factor;   // captures `factor`'s VALUE at lambda-creation time
factor = 20;                                   // COMPILE ERROR if this line existed BEFORE the lambda —
                                                 // would make `factor` not effectively final, breaking the capture rule
```
**Why this restriction exists:** a lambda might be invoked later, potentially on a different thread or after the enclosing method has returned (its stack frame is gone) — capturing by **value** (a snapshot) instead of by live reference avoids dangling/inconsistent state, but only works safely if that value can never change after the snapshot is taken.

---

## 12.3 Method References — four flavors (a very commonly drilled list)

```java
// 1. Static method reference:      ClassName::staticMethod
Function<String, Integer> parse = Integer::parseInt;             // equivalent to: s -> Integer.parseInt(s)

// 2. Instance method reference on a PARTICULAR object:   instance::instanceMethod
String prefix = "Hello, ";
Function<String, String> greet = prefix::concat;                  // equivalent to: s -> prefix.concat(s)

// 3. Instance method reference on an ARBITRARY object (of a given type), determined by the first lambda argument:
//    ClassName::instanceMethod
Function<String, Integer> len = String::length;                   // equivalent to: s -> s.length()
BiFunction<String, String, Boolean> eq = String::equals;           // equivalent to: (a, b) -> a.equals(b)

// 4. Constructor reference:      ClassName::new
Supplier<ArrayList<Integer>> factory = ArrayList::new;             // equivalent to: () -> new ArrayList<>()
Function<Integer, int[]> arrayMaker = int[]::new;                   // equivalent to: size -> new int[size]
```
**Interviewers often ask you to identify which "flavor" a given `::` reference is — flavor #3 (arbitrary object of a type) is the one people most often misidentify**, since it looks syntactically identical to flavor #1 (static) but behaves completely differently (the first lambda parameter becomes the implicit receiver `this`, not a regular argument).

---

## 12.4 Streams — Core Concepts

A **Stream** is a (potentially lazy, potentially parallel) pipeline of computations over a source of data — it does **not** store data itself, and (critically) **cannot be reused/re-traversed** once a terminal operation consumes it.

```java
List<String> names = List.of("Alice", "Bob", "Charlie", "Dave");

List<String> result = names.stream()
    .filter(n -> n.length() > 3)      // intermediate op — LAZY, doesn't run yet
    .map(String::toUpperCase)          // intermediate op — LAZY
    .sorted()                           // intermediate op — LAZY
    .collect(Collectors.toList());      // TERMINAL op — this is what actually TRIGGERS the whole pipeline to execute
```

### Intermediate vs Terminal operations — and Stream laziness

| Intermediate (lazy, returns a Stream, chainable) | Terminal (eager, triggers execution, ends the pipeline) |
|---|---|
| `filter`, `map`, `sorted`, `distinct`, `limit`, `skip`, `peek`, `flatMap` | `collect`, `forEach`, `reduce`, `count`, `anyMatch`/`allMatch`/`noneMatch`, `findFirst`/`findAny`, `toArray`, `sum`/`min`/`max` (on primitive streams) |

**Nothing executes until a terminal operation is called** — this is why you can chain `filter().map().sorted()` all day and nothing actually runs until `.collect()`/`.forEach()`/etc. appears at the end. This laziness also means intermediate operations are evaluated **element-by-element, lazily fused**, not as separate full passes (e.g., `filter` then `map` doesn't create an intermediate filtered list and then a second mapped list — each element flows through the ENTIRE pipeline one at a time).

**A Stream can only be consumed ONCE:**
```java
Stream<String> s = names.stream();
s.forEach(System.out::println);
s.forEach(System.out::println);    // IllegalStateException: stream has already been operated upon or closed
```

### Common `Collectors`
```java
list.stream().collect(Collectors.toList());
list.stream().collect(Collectors.toSet());
list.stream().collect(Collectors.joining(", "));                      // concatenate Strings with a delimiter
list.stream().collect(Collectors.toMap(k -> k, String::length));       // key mapper, value mapper
list.stream().collect(Collectors.counting());                          // like .count() but usable inside groupingBy
list.stream().collect(Collectors.groupingBy(String::length));          // Map<Integer, List<String>> — group by a key
list.stream().collect(Collectors.groupingBy(String::length, Collectors.counting()));  // Map<Integer, Long> — grouped + downstream aggregation
list.stream().collect(Collectors.partitioningBy(s -> s.length() > 3)); // Map<Boolean, List<String>> — always exactly 2 keys
```

### `reduce` — folding a stream into a single value
```java
int sum = List.of(1,2,3,4).stream().reduce(0, Integer::sum);           // identity + accumulator
Optional<Integer> max = List.of(1,2,3).stream().reduce(Integer::max);   // no identity -> returns Optional (empty if source is empty)
```

### `flatMap` — flattening nested structures
```java
List<List<Integer>> nested = List.of(List.of(1,2), List.of(3,4));
List<Integer> flat = nested.stream()
    .flatMap(List::stream)          // turns each inner List<Integer> into its own Stream<Integer>, then flattens all into one
    .collect(Collectors.toList());  // [1, 2, 3, 4]
```
**`map` vs `flatMap`:** `map` transforms each element 1-to-1 (could produce a Stream<Stream<X>> if you're not careful — a common bug); `flatMap` transforms each element into a Stream and then **merges** all those streams into a single flat stream — essential whenever your mapping function itself returns a collection/stream.

### Primitive streams (avoid autoboxing overhead)
```java
IntStream.range(0, 10);          // 0..9 (exclusive end)
IntStream.rangeClosed(1, 10);    // 1..10 (inclusive end)
IntStream.of(1, 2, 3).sum();
list.stream().mapToInt(String::length).average();   // OptionalDouble
```
Prefer `IntStream`/`LongStream`/`DoubleStream` over `Stream<Integer>` when doing numeric work — they avoid the autoboxing overhead discussed in file 08.

### Short-circuiting operations (don't process the whole stream if not needed)
```java
boolean any = list.stream().anyMatch(s -> s.startsWith("A"));    // stops at FIRST match
boolean all = list.stream().allMatch(s -> s.length() > 0);        // stops at FIRST failure
Optional<String> first = list.stream().filter(s -> s.length() > 3).findFirst();
```

---

## 12.5 `Optional<T>` — a container that may or may not hold a value

```java
Optional<String> opt = Optional.of("hello");     // throws NPE immediately if the argument is null
Optional<String> maybeNull = Optional.ofNullable(getNameOrNull());   // safe wrapper — empty if null
Optional<String> empty = Optional.empty();

opt.isPresent();                 // true/false
opt.isEmpty();                    // (Java 11+) the inverse
opt.get();                        // ⚠ throws NoSuchElementException if empty — avoid calling this blindly!
opt.orElse("default");            // safe unwrap with a fallback value
opt.orElseGet(() -> computeDefault()); // fallback computed LAZILY only if empty (prefer over orElse for expensive fallbacks)
opt.orElseThrow(() -> new IllegalStateException("missing"));
opt.ifPresent(v -> System.out.println(v));
opt.map(String::toUpperCase);      // transforms the value IF present, stays empty otherwise — chainable, null-safe
```
**`orElse` vs `orElseGet` — a real performance trap:**
```java
opt.orElse(expensiveComputation());     // expensiveComputation() ALWAYS runs, even if opt is present! (eager argument evaluation)
opt.orElseGet(() -> expensiveComputation());  // only runs if opt is actually empty (lazy — a Supplier)
```
**Best practice `Optional` is intended for RETURN TYPES, not fields or parameters** — using `Optional` as a class field or method parameter is widely considered an anti-pattern (adds indirection/serialization complications without the benefit it provides at API boundaries); the accepted use case is "a method that might not have a result to return."

---

## 🚩 Common Traps Recap (Phase 12)

1. Lambdas can only capture "effectively final" local variables — captured by value, not by live reference.
2. Streams are lazy — nothing executes until a terminal operation is invoked, and a stream can be consumed exactly once.
3. `map` vs `flatMap` — use `flatMap` whenever your mapping function itself returns a collection/stream, to avoid nested-stream results.
4. `Optional.orElse(x)` always evaluates `x` eagerly, even when the Optional is present — use `orElseGet(() -> x)` for expensive fallbacks.
5. Calling `.get()` on an empty `Optional` throws `NoSuchElementException` — always check `isPresent()` or prefer `orElse`/`orElseThrow`.
6. Method reference "flavor #3" (arbitrary instance method, e.g. `String::length`) is easy to confuse with the static-method flavor — the FIRST lambda parameter becomes the implicit receiver.

## ❓ Rapid-Fire Q&A

**Q: Why can't a lambda capture a local variable that gets reassigned later in the enclosing method?**
A: Because the lambda might execute after the enclosing method's stack frame is gone (e.g., on another thread, or later via a stored reference) — Java captures a value snapshot, and allowing reassignment afterward would create ambiguous, inconsistent semantics about which value the lambda "should" see.

**Q: What's wrong with calling `.get()` on every `Optional` without checking first?**
A: It throws `NoSuchElementException` if the Optional is empty — defeats the entire purpose of using `Optional` to avoid unchecked null-related crashes; prefer `orElse`/`orElseGet`/`orElseThrow`/`ifPresent`/`map`.

**Q: Given `List<List<Integer>>`, how do you get a single flat `List<Integer>`?**
A: `nested.stream().flatMap(List::stream).collect(Collectors.toList())`.

**Q: Does `list.stream().filter(...).map(...)` create two intermediate lists?**
A: No — streams are lazily fused; each element flows through the entire chain of intermediate operations one at a time when the terminal operation eventually pulls it through, rather than materializing a separate list after each stage.
