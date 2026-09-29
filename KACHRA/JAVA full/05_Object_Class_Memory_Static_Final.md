# 05. Object Class & Java Mechanics 🔥🔥🔥🔥

---

## 5.1 The `Object` Class — root of everything

Every class implicitly `extends Object` if it doesn't extend anything else. Key methods:

```java
public class Object {
    public String toString();
    public boolean equals(Object obj);
    public int hashCode();
    public final Class<?> getClass();
    protected Object clone() throws CloneNotSupportedException;
    protected void finalize() throws Throwable;   // deprecated since Java 9 — do not use
    public final void wait()/notify()/notifyAll(); // for thread coordination (see file 13)
}
```

### `toString()`
Default implementation: `ClassName@HashCodeInHex` (e.g., `Car@1b6d3586`) — this is why printing an object without overriding `toString()` gives that ugly output.
```java
class Point {
    int x, y;
    @Override public String toString() { return "(" + x + ", " + y + ")"; }
}
System.out.println(new Point());   // uses toString() automatically — println calls it implicitly
```
**Gotcha:** `System.out.println(obj)` and string concatenation (`"" + obj`) both call `toString()` implicitly — but `System.out.println(char[])` is a special OVERLOADED case that prints the characters directly instead of calling `toString()` (which would print something like `[C@hashcode`).

### `getClass()`
Returns the **runtime** `Class` object — always the actual type, never the declared type:
```java
Animal a = new Dog();
System.out.println(a.getClass().getSimpleName());   // "Dog" — NOT "Animal"
```
`getClass()` is `final` — cannot be overridden (makes sense: it must always tell the truth about the real runtime type for reflection to be reliable).

---

## 5.2 `==` vs `.equals()` — the definitive breakdown

| | Primitives | Objects (default `Object.equals`) | Objects (overridden `equals`) |
|---|---|---|---|
| `==` | value comparison (the only option — primitives have no `.equals()`) | reference/identity comparison | still reference comparison — `==` NEVER changes meaning |
| `.equals()` | N/A | Same as `==` by default (`Object.equals` literally does `this == obj`) | Whatever logic YOU define — usually content comparison |

```java
Integer a = new Integer(127);
Integer b = new Integer(127);
System.out.println(a == b);        // false — two distinct objects (new always allocates)
System.out.println(a.equals(b));   // true — Integer overrides equals() to compare .intValue()

Integer x = 127, y = 127;           // autoboxed — uses Integer.valueOf() internally, NOT `new`
System.out.println(x == y);         // true! — see Integer Cache trap below

Integer p = 200, q = 200;
System.out.println(p == q);         // false! — outside the cached range
```

**The Integer Cache trap (extremely popular question):** `Integer.valueOf(int)` (which is what autoboxing calls) caches and reuses `Integer` objects for the range **-128 to 127** (configurable up to `Integer.IntegerCache.high` via a JVM flag, but the low bound -128 is fixed by spec). Within that range, `==` on autoboxed `Integer`s "accidentally" works because they're literally the same cached object; outside it, every value is a fresh object and `==` fails. **Rule: NEVER use `==` to compare wrapper objects — always `.equals()` (or unwrap to primitive `int` first).** This same caching exists for `Byte`, `Short`, `Long` (-128 to 127), `Character` (0 to 127), and `Boolean` (`TRUE`/`FALSE` singletons).

---

## 5.3 The `equals()` / `hashCode()` Contract — the single most-tested "theory" topic in Java

**The contract (recite it precisely):**
1. **Reflexive:** `x.equals(x)` must be `true`.
2. **Symmetric:** `x.equals(y)` iff `y.equals(x)`.
3. **Transitive:** if `x.equals(y)` and `y.equals(z)`, then `x.equals(z)`.
4. **Consistent:** repeated calls return the same result, provided no fields used in the comparison changed.
5. **Null comparison:** `x.equals(null)` must return `false` (never throw).
6. **THE CRITICAL RULE linking the two methods:** *if `a.equals(b)` is `true`, then `a.hashCode() == b.hashCode()` MUST also be true.* (The reverse is NOT required — different objects can share a hash code; that's called a **collision**, and it's expected/normal, just should be rare.)

### Why breaking this contract silently corrupts HashMap/HashSet

```java
class BadPoint {
    int x, y;
    BadPoint(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) {
        if (!(o instanceof BadPoint)) return false;
        BadPoint p = (BadPoint) o;
        return x == p.x && y == p.y;
    }
    // ⚠ hashCode() NOT overridden — still uses Object's identity-based hashCode!
}

Set<BadPoint> set = new HashSet<>();
set.add(new BadPoint(1, 2));
System.out.println(set.contains(new BadPoint(1, 2)));   // FALSE! Even though equals() says they're equal!
```
**Why:** `HashSet`/`HashMap` first computes `hashCode()` to pick a **bucket**, and only calls `.equals()` against other entries **already in that same bucket**. Two "equal" `BadPoint`s with different (identity-based) hash codes land in **different buckets**, so `.equals()` is never even invoked between them — `contains()` looks in the wrong bucket entirely and reports "not found."

**Correct version:**
```java
@Override public int hashCode() { return Objects.hash(x, y); }   // combines field hashcodes consistently
```
**Golden rule to say out loud:** *"Always override `hashCode()` whenever you override `equals()`, using exactly the same fields in both — otherwise the class becomes unusable (silently broken) as a `HashMap`/`HashSet` key."*

### `instanceof` vs `getClass()` inside `equals()` — a genuine design debate interviewers probe

```java
// Version A: uses instanceof — allows a subclass to be "equal" to a superclass instance
@Override public boolean equals(Object o) {
    if (!(o instanceof Point)) return false;
    Point p = (Point) o;
    return x == p.x && y == p.y;
}

// Version B: uses getClass() — strict, only exact same runtime class can be equal
@Override public boolean equals(Object o) {
    if (o == null || getClass() != o.getClass()) return false;
    Point p = (Point) o;
    return x == p.x && y == p.y;
}
```
- **`instanceof` version** risks breaking **symmetry** if a subclass adds new fields to its own `equals()` (a subtle, real bug called the "equals is not symmetric across inheritance" problem — `Point.equals(ColorPoint)` might say true while `ColorPoint.equals(Point)` says false).
- **`getClass()` version** is symmetric-safe but violates the **Liskov Substitution Principle** in spirit (a subclass instance can never equal its parent type, even if conceptually appropriate).
- **The commonly accepted best-practice answer:** prefer composition over inheritance for value types that need `equals()`; if you must inherit, use `getClass()` for a bulletproof symmetric contract, or make the equality-participating class `final`.

### `Objects` utility helpers (Java 7+) — use these instead of hand-rolling null checks
```java
Objects.equals(a, b);         // null-safe equals — true if both null, false if only one is null
Objects.hash(x, y, z);        // convenience hashCode combiner (wraps Arrays.hashCode(new Object[]{x,y,z}))
Objects.requireNonNull(obj, "obj must not be null");  // throws NPE with a custom message if null — great for fail-fast constructors
```

---

## 5.4 Pass-by-Value — the deep, precise version (Java has ONLY pass-by-value, no exceptions)

**The precise mental model:** for a reference-type variable, the "value" being copied is the **reference itself** (think of it as copying an address/pointer value, not the object it points to).

```java
class Box { int val; }

static void reassign(Box b) {
    b = new Box();      // b now points to a DIFFERENT new object — only the LOCAL copy of the reference changed
    b.val = 99;
}
static void mutate(Box b) {
    b.val = 99;          // follows the copied reference to the SAME original object and changes its field
}

Box original = new Box();
original.val = 1;
reassign(original);
System.out.println(original.val);   // 1 — unaffected, because only the local reference copy was redirected

mutate(original);
System.out.println(original.val);   // 99 — the shared object WAS mutated through the copied reference
```
**One-sentence answer for the interview:** *"Java is always pass-by-value. For objects, the value passed is a copy of the reference — so you can mutate the object's state through that reference, but you can never make the caller's variable point to a different object."*

This is why languages/people loosely say Java is "pass-by-reference for objects" — that phrasing is **technically incorrect** and a real interviewer distinguishes candidates who understand the actual mechanism from those who don't.

---

## 5.5 `static` — Deep Dive

```java
class Config {
    static int instanceCount = 0;              // static (class) variable — ONE copy total, shared
    int id;                                     // instance variable — one copy PER OBJECT

    static { System.out.println("static block runs ONCE, at class-loading time"); }
    { System.out.println("instance block runs on EVERY object creation"); }

    Config() { id = ++instanceCount; }

    static void printCount() {                  // static method
        System.out.println(instanceCount);
        // System.out.println(id);   // COMPILE ERROR — no `this`, can't access instance field id here
    }
}
```
**Static initialization block execution order:** all static blocks/static field initializers across a class run **once**, in **top-to-bottom declaration order**, the **first time the class is loaded** by the JVM (which can be lazily triggered by first use — first instantiation, first static member access, etc., NOT necessarily at program start).

**Static nested class vs (non-static) Inner class — a real distinction, often confused:**
```java
class Outer {
    int outerField = 10;
    static class StaticNested {                     // does NOT need an Outer instance to exist
        void show() { /* outerField NOT accessible here — no implicit Outer reference */ }
    }
    class Inner {                                     // needs an enclosing Outer INSTANCE
        void show() { System.out.println(outerField); }  // implicit reference to the enclosing Outer.this
    }
}
Outer.StaticNested sn = new Outer.StaticNested();      // no Outer instance needed
Outer o = new Outer();
Outer.Inner inner = o.new Inner();                     // MUST go through an Outer instance — unusual syntax!
```

---

## 5.6 `final` — memory/optimization angle (complements file 04's syntax coverage)

- `final` fields can enable **compiler optimizations** and, for `static final` primitives/Strings with compile-time-constant values, **inlining at every call site** (see file 02's constant folding).
- **Blank final fields** are legal — declared without an initializer, but MUST be assigned exactly once, in every constructor (or every branch of an instance initializer block), by the time construction completes:
```java
class Config {
    final int id;                          // "blank final" — no initializer here
    Config(int id) { this.id = id; }       // must assign it here (or in every other constructor)
}
```

---

## 5.7 Immutability — String, Wrapper Classes, and how to build your own

**Recipe for a fully immutable class (memorize this checklist — it's asked as "design an immutable class"):**
1. Make the class `final` (prevent subclasses from adding mutable behavior/breaking invariants).
2. Make all fields `private final`.
3. No setters.
4. If a field is a **mutable object type** (e.g., `Date`, `List`, array), **never** hand out the real reference:
   - In the constructor, store a **defensive copy** of any mutable input.
   - In any getter, return a **defensive copy** (or an unmodifiable/immutable view) — never the internal reference itself.

```java
final class ImmutablePerson {
    private final String name;
    private final List<String> hobbies;

    ImmutablePerson(String name, List<String> hobbies) {
        this.name = name;
        this.hobbies = new ArrayList<>(hobbies);        // DEFENSIVE COPY on the way in
    }
    public String getName() { return name; }
    public List<String> getHobbies() {
        return Collections.unmodifiableList(hobbies);   // DEFENSIVE (read-only) VIEW on the way out
        // or: return new ArrayList<>(hobbies); for a full independent copy
    }
}
```
**Why this matters — the bug it prevents:**
```java
List<String> hobbies = new ArrayList<>(List.of("chess"));
ImmutablePerson p = new ImmutablePerson("Alice", hobbies);
hobbies.add("hacking");                 // mutating the ORIGINAL list after construction
System.out.println(p.getHobbies());     // still just ["chess"] — because a defensive copy was made!
// Without the defensive copy, p's "immutable" state would have silently changed here.
```

**Benefits of immutability (memorize 4+):**
- Inherently **thread-safe** (no synchronization needed — state never changes after construction).
- Safe to use as `HashMap`/`HashSet` keys (hash code never becomes stale).
- Safe to **freely share/cache** instances (no defensive copying needed when *handing out* an immutable object itself).
- Simpler to reason about — no "who else might change this while I'm looking at it" bugs.
- Enables safe **failure atomicity** — if construction fails partway, no partially-mutated shared state exists.

**Wrapper classes (`Integer`, `Double`, etc.) are immutable for the exact same reasons Strings are** — any "modification" (like `Integer + 1`) produces a brand-new wrapper object.

---

## 5.8 Memory Model: Stack vs Heap

```
┌─────────────────────────┐        ┌────────────────────────────┐
│   STACK (per thread)     │        │          HEAP (shared)       │
│                          │        │                              │
│ frame: main()            │        │  Car@1b6d [color="red",      │
│  int x = 5;    <────┐    │        │            speed=0]           │
│  Car c;  (ref) ------────┼───────>│                              │
│                     └────┼────────┼──> primitives stored INSIDE  │
│ frame: someMethod()      │        │    the heap object itself     │
│  local vars...           │        │                              │
└─────────────────────────┘        └────────────────────────────┘
```
- **Stack:** stores method call frames — local (primitive) variables, and **references** to objects. LIFO, extremely fast allocation/deallocation, automatically reclaimed the instant a method returns. One stack **per thread**.
- **Heap:** stores all objects and arrays (regardless of whether created via `new`, autoboxing, or String literals in the pool). Shared **across all threads**. Managed by the **Garbage Collector**, not automatically freed when a method returns.
- A local primitive lives entirely on the stack. A local reference variable's **pointer value** lives on the stack, but the **object it points to** lives on the heap.
- Since Java 7, the **String Constant Pool** moved from a special region called **PermGen** into the regular **heap** (specifically conceptually into what's now called **Metaspace** for class metadata, separate from the String pool which is just regular heap memory) — this is a commonly-tested "did you know" historical fact.

---

## 5.9 Garbage Collection Basics

**Core idea:** an object becomes **eligible for GC** the moment it's **unreachable** from any **GC root** (active thread stacks, static references, JNI references, etc.) — there's no reference counting in the mainstream JVM GCs (which avoids the classic "circular reference never freed" problem that reference-counting schemes suffer from).

```java
Car c = new Car();
c = null;          // the original Car object is now unreachable -> eligible for GC (not necessarily collected immediately!)
```

**Generational hypothesis** (why the JVM heap is split into generations): *most objects die young.* So the heap is divided:
- **Young Generation** (Eden + two Survivor spaces `S0`/`S1`): new objects allocated here. Frequent, fast **Minor GC** collects it — most objects die here and are cheaply reclaimed.
- **Old/Tenured Generation:** objects that survive several minor GC cycles get **promoted** here. Collected less often by a more expensive **Major/Full GC**.
- (Metaspace: class metadata — replaced PermGen since Java 8, grows into native memory rather than a fixed heap region, largely eliminating the old `OutOfMemoryError: PermGen space`.)

**Common GC algorithms to name-drop:** Serial, Parallel, **CMS** (Concurrent Mark Sweep, deprecated), **G1 (Garbage First)** — the default since Java 9, and **ZGC**/**Shenandoah** for very low pause-time needs on huge heaps.

**Mark-and-Sweep (the conceptual algorithm underlying most collectors):**
1. **Mark** phase: starting from GC roots, traverse and mark every reachable object.
2. **Sweep** phase: reclaim memory occupied by unmarked (unreachable) objects.
3. (Many modern collectors add a **Compact** phase to defragment the heap afterward.)

**`System.gc()`** merely **suggests** to the JVM that now might be a good time to run GC — it is NOT a guarantee, and relying on it for correctness is a bug.

**`finalize()` is deprecated (Java 9+) and removed as a reliable mechanism** — never rely on it for releasing resources (file handles, sockets); use **`try-with-resources`** and `AutoCloseable` instead (see file 06).

**`WeakReference`/`SoftReference`** (brief awareness-level mention, sometimes comes up): allow you to reference an object *without* preventing its GC eligibility — used for caches (`SoftReference`, cleared only under memory pressure) and canonicalizing maps (`WeakReference`, cleared as soon as no strong references remain) — this underpins `WeakHashMap`.

---

## 🚩 Common Traps Recap (Phase 5)

1. `Object.equals()`'s default behavior is identical to `==` (identity comparison) until you override it.
2. Overriding `equals()` **without** overriding `hashCode()` silently breaks `HashMap`/`HashSet` lookups.
3. Autoboxed `Integer` caching (-128 to 127) makes `==` "accidentally" work in that range and fail outside it — never rely on it.
4. Java is always pass-by-value; for objects, it's "pass-by-value of the reference" — you can mutate but never reassign-and-have-it-stick.
5. `static` blocks run once at class-loading time; instance blocks run on every object construction.
6. An inner (non-static) class needs an outer class **instance** to be created (`outer.new Inner()`); a static nested class does not.
7. A "blank final" field must be definitely assigned exactly once by the end of every constructor.
8. Immutable classes must defensively copy mutable inputs/outputs, not just mark fields `final`.
9. `System.gc()` and `finalize()` are unreliable — never depend on them for correctness or resource cleanup.

## ❓ Rapid-Fire Q&A

**Q: If `a.equals(b)` is true, must `a.hashCode() == b.hashCode()`? What about the reverse?**
A: Yes, equal objects MUST have equal hash codes. The reverse is not required — unequal objects CAN share a hash code (a collision), which is allowed and expected to happen occasionally.

**Q: Why does `Integer.valueOf(100) == Integer.valueOf(100)` return `true` but `Integer.valueOf(200) == Integer.valueOf(200)` return `false`?**
A: The `Integer` cache pre-creates and reuses objects for values -128 to 127; outside that range, `valueOf` allocates a new object each time.

**Q: Does an object get garbage collected the instant its last reference is set to `null`?**
A: No — it merely becomes *eligible* for GC. The actual collection happens at a JVM-determined time (or possibly never, if memory pressure never triggers a GC cycle before the JVM exits).

**Q: What's the real difference between a static nested class and an inner class?**
A: A static nested class behaves like a top-level class placed inside another for namespacing — no implicit reference to an outer instance, can be created without one. An inner class implicitly holds a reference to its enclosing instance and cannot be created without one (`outer.new Inner()`), and can directly access the outer instance's fields/methods.

**Q: How would you make a class holding a `java.util.Date` field truly immutable?**
A: Store a defensive copy (`new Date(inputDate.getTime())`) in the constructor, and return a defensive copy from the getter too — otherwise callers can mutate the "immutable" object's internal state through the shared mutable `Date` reference (in modern code, prefer the inherently-immutable `java.time.LocalDate`/`Instant` instead, sidestepping the problem entirely).
