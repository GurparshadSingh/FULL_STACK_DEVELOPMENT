# 08. Generics & Wrapper Classes 🔥🔥🔥🔥

---

## PART A — GENERICS

### 8.1 Why Generics Exist

Before Java 5, collections held raw `Object`s — you had to cast on every retrieval, and the compiler couldn't catch type mistakes:
```java
List list = new ArrayList();      // raw type — pre-generics style
list.add("hello");
list.add(42);                      // compiles! no type safety at all
String s = (String) list.get(1);   // compiles, but ClassCastException at RUNTIME
```
Generics push that error to **compile time**:
```java
List<String> list = new ArrayList<>();
list.add("hello");
list.add(42);          // COMPILE ERROR — caught immediately, not at runtime months later
String s = list.get(0); // no cast needed — compiler already knows the type
```

### 8.2 Generic Classes & Methods

```java
class Box<T> {                                  // T = type parameter, conventionally a single letter
    private T content;
    public void set(T content) { this.content = content; }
    public T get() { return content; }
}
Box<String> stringBox = new Box<>();             // diamond operator (Java 7+) infers <String> from the left side

class Pair<K, V> {                                // multiple type parameters
    K key; V value;
    Pair(K key, V value) { this.key = key; this.value = value; }
}
```
**Generic methods** (type parameter scoped to the method, independent of the class's own type parameters):
```java
static <T> T firstElement(List<T> list) {         // <T> before the return type declares the method's own type param
    return list.get(0);
}
static <T> void swap(T[] arr, int i, int j) {
    T temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
}
```

### 8.3 Bounded Type Parameters

```java
static <T extends Comparable<T>> T max(List<T> list) {   // T must implement Comparable<T>
    T result = list.get(0);
    for (T item : list) if (item.compareTo(result) > 0) result = item;
    return result;
}
class NumericBox<T extends Number> {              // T must be Number or a subtype (Integer, Double, ...)
    T value;
    double doubled() { return value.doubleValue() * 2; }  // can call Number's methods on T — the WHOLE point of bounding
}
```
**Multiple bounds** (at most ONE class, but many interfaces — class must come first if present):
```java
static <T extends Number & Comparable<T>> T maxNum(List<T> list) { ... }
```
**Note the keyword is always `extends`, even when bounding by an interface** — Java doesn't have a separate `implements` keyword for generic bounds.

### 8.4 Wildcards — `?`, `? extends`, `? super` — and the PECS principle

```java
List<?> anyList;                          // unbounded wildcard — a list of SOME unknown type
List<? extends Number> upperBound;        // a list of Number OR ANY SUBTYPE (Integer, Double...) — read-mostly
List<? super Integer> lowerBound;         // a list of Integer OR ANY SUPERTYPE (Number, Object...) — write-mostly
```

**PECS — "Producer Extends, Consumer Super"** — the single most important generics mnemonic:
- If a structure only **produces** (you only read `T` OUT of it) → use `? extends T`.
- If a structure only **consumes** (you only put `T` INTO it) → use `? super T`.

```java
static void copy(List<? extends Number> source, List<? super Number> dest) {
    for (Number n : source) {      // reading from `source` is safe — guaranteed AT LEAST a Number
        dest.add(n);                // writing INTO `dest` is safe — it accepts Number or any supertype
    }
    // source.add(5);   // COMPILE ERROR — can't add to a "? extends" list! (see below for WHY)
}
```
**Why you can't `add()` to a `List<? extends Number>`:** the compiler doesn't know the EXACT type — it could be `List<Integer>`, `List<Double>`, anything. If it let you `add(5)` (an `int`, autoboxed to `Integer`), but the actual runtime list were a `List<Double>`, you'd be inserting an `Integer` into a `Double` list — a type violation. The ONLY thing always safe to add to `List<? extends Number>` is `null` (has no type at all).

**Why you can't meaningfully `get()` a specific type from `List<? super Number>` (only `Object` is guaranteed):**
```java
List<? super Integer> list = new ArrayList<Number>();
Object o = list.get(0);      // only Object is guaranteed — could be Number, Integer, or even Object itself
// Integer i = list.get(0);  // COMPILE ERROR — not guaranteed to actually be an Integer
```

### 8.5 Type Erasure — the single most important "internals" fact about generics

**Generics exist ONLY at compile time.** The compiler uses them to check type safety, then **erases** all generic type information, replacing type parameters with their bound (or `Object` if unbounded) in the actual compiled bytecode, and inserting casts where needed.

```java
List<String> strings = new ArrayList<>();
List<Integer> ints = new ArrayList<>();
System.out.println(strings.getClass() == ints.getClass());   // TRUE! Both are just raw ArrayList at runtime!
```

**Direct consequences you WILL be asked about:**
```java
// 1. Cannot create an array of a generic type
List<String>[] arr = new List<String>[10];   // COMPILE ERROR — generic array creation is illegal

// 2. Cannot use instanceof with a parameterized type
if (list instanceof List<String>) { }         // COMPILE ERROR — erased at runtime, no way to check
if (list instanceof List<?>) { }              // OK — unbounded wildcard is fine, since no specific type is asserted

// 3. Cannot have a static field of the class's own type parameter
class Box<T> {
    static T value;    // COMPILE ERROR — static members belong to the CLASS, but T is only known per-INSTANCE
                         // (type erasure means there's only ONE Box.class total; T can't vary "statically" per instantiation)
}

// 4. Cannot overload two methods that erase to the same signature
void print(List<String> list) { }
void print(List<Integer> list) { }    // COMPILE ERROR — both erase to print(List) — "erasure clash"

// 5. Cannot instantiate a generic type parameter directly
class Factory<T> {
    T create() { return new T(); }    // COMPILE ERROR — T is erased; JVM has no idea what "new T()" should allocate
}
```
**Bridge methods (advanced, rarely required but impressive to mention):** when a generic class is subclassed with a concrete type argument and overrides a method, the compiler generates an invisible synthetic **bridge method** with the erased (`Object`) signature to preserve polymorphism correctly across the erasure boundary. You won't write these by hand, but knowing they exist explains some confusing reflection/decompiled-bytecode behavior.

---

## PART B — WRAPPER CLASSES & AUTOBOXING

### 8.6 Why collections need wrapper types instead of primitives

**Generics require a reference type** — `T` is erased to `Object`, and primitives (`int`, `char`, etc.) are not objects and cannot be substituted for `Object`. This is precisely **why** `List<int>` is illegal and `List<Integer>` is required — the wrapper classes exist specifically to let primitive-like values participate in the (reference-type-only) generic collections framework.

```java
// List<int> numbers = new ArrayList<>();   // ILLEGAL — primitives can't be generic type arguments
List<Integer> numbers = new ArrayList<>();  // must use the wrapper
```

### 8.7 The Eight Wrapper Classes

| Primitive | Wrapper |
|---|---|
| `byte` | `Byte` |
| `short` | `Short` |
| `int` | `Integer` |
| `long` | `Long` |
| `float` | `Float` |
| `double` | `Double` |
| `char` | `Character` |
| `boolean` | `Boolean` |

All wrapper classes are **immutable** and **final** (same reasoning as `String` — see file 05). Each provides useful static utilities: `Integer.parseInt()`, `Integer.MAX_VALUE`/`MIN_VALUE`, `Integer.compare(a, b)`, `Character.isDigit(c)`, `Character.isLetter(c)`, `Character.toUpperCase(c)`, `Boolean.parseBoolean()`, etc. — these come up constantly in DSA code (validating characters in a string problem, comparing without overflow risk, etc.).

### 8.8 Autoboxing & Unboxing

```java
Integer boxed = 5;              // AUTOBOXING: compiler inserts Integer.valueOf(5)
int unboxed = boxed;             // AUTO-UNBOXING: compiler inserts boxed.intValue()
```

**Autoboxing/unboxing happens automatically in:**
- Assignment (`Integer i = 5;`)
- Method arguments/return values
- Collection operations (`list.add(5)` boxes; `int x = list.get(0)` unboxes)
- **Arithmetic and comparison operators** — this is where the danger lives:
```java
Integer a = 1000;
Integer b = 1000;
int sum = a + b;          // both operands UNBOXED to int first, then added — works fine, sum=2000
```

### 8.9 The Autoboxing NullPointerException trap (extremely common real-world bug)

```java
Integer count = null;
int x = count;         // NullPointerException! auto-unboxing calls count.intValue() on a null reference
```
```java
Map<String, Integer> scores = new HashMap<>();
int score = scores.get("Alice");     // NPE if "Alice" isn't in the map! get() returns null, then auto-unboxing NPEs
// SAFE version:
int score2 = scores.getOrDefault("Alice", 0);
```
```java
Integer flag = null;
if (flag) { }                          // NPE! `if` needs a primitive boolean — auto-unboxes null -> NPE
```
```java
List<Integer> list = new ArrayList<>();
list.add(null);                        // legal — null Integer reference stored
for (int n : list) { }                 // NPE on the enhanced-for's implicit unboxing of the null element!
```

### 8.10 Ternary operator + autoboxing (revisit from file 01 with wrapper focus)
```java
Integer a = null;
Object result = false ? 10 : a;    // even though `a` (the null) IS the chosen branch here...
System.out.println(result);         // ...this specific case is actually fine (Object target type, no forced unboxing)

int x = false ? 10 : a;             // NPE — target type `int` forces unboxing of `a` (null), even in the "false" branch
```
The rule: if BOTH ternary branches are boxed/unboxed to a common **primitive** target type, Java may need to unbox whichever branch is actually selected — including a `null` — causing an NPE that's easy to miss in code review.

### 8.11 Wrapper equality — repeat from file 05, because it's THAT commonly tested
```java
Integer a = 127, b = 127;
System.out.println(a == b);     // true — Integer cache (-128 to 127)
Integer c = 128, d = 128;
System.out.println(c == d);     // false — outside cache range, distinct objects
System.out.println(c.equals(d)); // true — always correct regardless of caching
```
**Absolute rule: compare wrapper objects with `.equals()`, or unbox to primitives first (`a.intValue() == b.intValue()` or just use `int` variables) — never rely on `==` for wrapper types.**

### 8.12 Autoboxing performance cost in loops (a real, quietly-tested performance trap)
```java
Long sum = 0L;                              // BOXED accumulator!
for (long i = 0; i < 1_000_000_000L; i++) {
    sum += i;   // EVERY iteration: unbox sum, add, RE-BOX the result into a brand-new Long object!
}
```
This creates a **new `Long` object on every single iteration** — a massive, easy-to-miss performance and GC-pressure problem. **Fix: use the primitive `long sum = 0L;`** whenever you don't specifically need a reference type (nullability, generics, collections).

---

## 🚩 Common Traps Recap (Phase 8)

1. Generics are erased at compile time — no `instanceof List<String>`, no `new T()`, no generic arrays, no static fields of type `T`.
2. PECS: `? extends T` for read-only/producer use, `? super T` for write-only/consumer use.
3. `Map.get()` returning a boxed `null`, then being auto-unboxed (directly, or via `int x = map.get(k)`), is one of the most common real-world NPE sources — use `getOrDefault`.
4. Wrapper `==` only "works" inside the -128..127 cache range — always use `.equals()` for wrapper objects.
5. Ternary expressions with a primitive target type can silently force-unbox a `null` branch into an NPE.
6. Boxed accumulator variables (`Long sum` instead of `long sum`) in hot loops cause massive unnecessary object churn.
7. `List<Integer>.remove(int)` vs `.remove(Integer.valueOf(int))` — this is really an autoboxing/overload-resolution issue (see file 07) worth remembering here too.

## ❓ Rapid-Fire Q&A

**Q: Why can't you write `new T[10]` inside a generic class `Box<T>`?**
A: Because of type erasure — at runtime the JVM has no idea what `T` actually is, so it can't determine the correct array component type needed to safely construct and type-check the array.

**Q: When do you use `? extends T` vs `? super T`?**
A: `? extends T` when you'll only read/produce values of type T (or its subtypes) from the structure; `? super T` when you'll only write/consume values of type T into it. Remember: PECS — Producer Extends, Consumer Super.

**Q: What's the output, and why?**
```java
Integer a = 1000, b = 1000;
System.out.println(a == b);
```
A: `false` — 1000 is outside the Integer cache range (-128 to 127), so autoboxing creates two distinct `Integer` objects.

**Q: Why does `List<String>` and `List<Integer>` report the same `.getClass()` at runtime?**
A: Type erasure — generic type parameters exist only for compile-time checking; at runtime, both are simply raw `ArrayList` instances with no retained knowledge of their element type parameter.
