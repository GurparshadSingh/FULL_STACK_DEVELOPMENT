# 13. Multithreading, Enums, Inner Classes & Misc 🔥🔥 / 🔥

---

## PART A — MULTITHREADING BASICS

### 13.1 Creating Threads — two ways, and why one is preferred

```java
// Way 1: extend Thread
class MyThread extends Thread {
    @Override public void run() { System.out.println("Running"); }
}
new MyThread().start();

// Way 2: implement Runnable (PREFERRED)
class MyTask implements Runnable {
    @Override public void run() { System.out.println("Running"); }
}
new Thread(new MyTask()).start();

// Modern lambda style (Runnable is a functional interface — one abstract method, run())
new Thread(() -> System.out.println("Running")).start();
```
**Why `Runnable` is preferred over extending `Thread`:** Java has single class inheritance — extending `Thread` burns your one `extends` slot, preventing your task class from extending anything else. Implementing `Runnable` keeps the "what to run" logic decoupled from "how it's threaded," and lets the same `Runnable` be reused with an `ExecutorService`/thread pool instead of manually managing raw `Thread` objects.

### `start()` vs `run()` — THE classic threading trap
```java
Thread t = new Thread(() -> System.out.println(Thread.currentThread().getName()));
t.run();      // ⚠ runs the code on the CURRENT thread (e.g. "main") — NO new thread is created!
t.start();    // ✅ actually creates a new OS-level thread and calls run() on IT
```
**Calling `run()` directly is just a normal synchronous method call** — it does not spawn a thread at all. Only `start()` triggers the JVM/OS to allocate a new thread of execution. **Calling `start()` twice on the same `Thread` object throws `IllegalThreadStateException`** — a `Thread` object can only be started once.

### Thread Lifecycle States
```
NEW -> RUNNABLE -> (BLOCKED / WAITING / TIMED_WAITING) -> TERMINATED
```
| State | Meaning |
|---|---|
| `NEW` | created but `start()` not yet called |
| `RUNNABLE` | eligible to run (may or may not actually be executing on a CPU core right now — the OS scheduler decides) |
| `BLOCKED` | waiting to acquire a monitor lock (stuck on entering a `synchronized` block held by another thread) |
| `WAITING` | waiting indefinitely for another thread's signal (`Object.wait()` with no timeout, `Thread.join()` with no timeout) |
| `TIMED_WAITING` | waiting with a timeout (`Thread.sleep(ms)`, `wait(ms)`, `join(ms)`) |
| `TERMINATED` | `run()` has completed |

### Race Conditions — why `count++` is NOT atomic
```java
class Counter { int count = 0; void increment() { count++; } }
// count++ is actually THREE separate steps: 1) READ count, 2) ADD 1, 3) WRITE count back.
// Two threads can interleave these steps and LOSE an update:
// Thread A reads count=5, Thread B reads count=5 (before A writes back),
// A writes 6, B writes 6 — one increment is LOST, final count is 6 instead of the correct 7.
```
**Fix options (in order of typical preference for a simple counter):**
```java
// 1. AtomicInteger — lock-free, CAS-based, usually fastest for simple counters
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();

// 2. synchronized method/block — simplest to reason about, but coarser-grained locking
synchronized void increment() { count++; }

// 3. Explicit Lock (java.util.concurrent.locks.ReentrantLock) — more flexible (tryLock, fairness, interruptible)
```

### `synchronized` — the intrinsic lock (monitor)

```java
class Account {
    private int balance;
    public synchronized void withdraw(int amt) { balance -= amt; }   // locks on `this`
    public static synchronized void staticMethod() { }                // locks on the Account.class object!
    public void transfer(Account to, int amt) {
        synchronized (this) {           // synchronized BLOCK — lock on an explicit object, finer-grained than a whole method
            balance -= amt;
        }
    }
}
```
- Every object has an intrinsic **monitor lock**. `synchronized` on an instance method locks on `this`; on a static method, it locks on the **Class object** itself (`Account.class`) — a genuinely important distinction, since instance-level and class-level `synchronized` methods **do NOT contend with each other** (they lock different objects entirely).
- Only **one thread** can hold a given lock at a time; others attempting to enter a block/method synchronized on the SAME object are placed into the `BLOCKED` state until the lock is released.
- Locks are **reentrant** — a thread already holding a lock can re-enter another `synchronized` block/method that requires the SAME lock without deadlocking itself.

### Deadlock — the classic two-lock example
```java
Object lockA = new Object(), lockB = new Object();

// Thread 1:
synchronized (lockA) {
    synchronized (lockB) { /* ... */ }
}
// Thread 2:
synchronized (lockB) {
    synchronized (lockA) { /* ... */ }   // if Thread 1 holds lockA and Thread 2 holds lockB simultaneously — DEADLOCK!
}
```
**The four Coffman conditions for deadlock (name-drop these for depth):** mutual exclusion, hold-and-wait, no preemption, circular wait. **The standard fix:** always acquire multiple locks in a **globally consistent order** across all threads (e.g., always lock the lower-ID account before the higher-ID one) — this breaks the "circular wait" condition, preventing deadlock by design.

### `volatile` — visibility, NOT atomicity (a very commonly confused keyword)
```java
class Flag {
    private volatile boolean running = true;    // ensures every thread sees the LATEST write immediately
    void stop() { running = false; }
    void loop() { while (running) { /* do work */ } }   // without volatile, a thread might cache `running` in a
                                                            // CPU register/local cache and NEVER see the update!
}
```
**`volatile` guarantees:** (1) every read sees the most recently written value (no stale caching across threads/CPU cores — a "happens-before" memory-visibility guarantee), and (2) prevents certain compiler/CPU instruction reorderings around it. **`volatile` does NOT guarantee atomicity** — `volatile int count; count++;` is STILL a race condition (three separate steps, as above), even though every thread sees the latest value at each individual read/write.

### `wait()` / `notify()` / `notifyAll()` — low-level thread coordination
```java
synchronized (lock) {
    while (!condition) {         // ALWAYS use a while loop, never `if` — guards against "spurious wakeups"
        lock.wait();              // releases the lock and sleeps until notified; re-acquires the lock before returning
    }
    // proceed once condition is true
}
// elsewhere:
synchronized (lock) {
    condition = true;
    lock.notifyAll();             // wakes ALL threads waiting on this lock's monitor — notify() wakes only ONE, arbitrarily chosen
}
```
`wait()`/`notify()`/`notifyAll()` **must be called from within a `synchronized` block on the same object**, or an `IllegalMonitorStateException` is thrown. Modern code typically prefers higher-level `java.util.concurrent` constructs (below) over hand-rolled `wait`/`notify`.

### `java.util.concurrent` — name-drop these (awareness level, per the syllabus's scope)
| Class | Purpose |
|---|---|
| `ExecutorService` / `Executors.newFixedThreadPool(n)` | manage a pool of reusable worker threads instead of manually creating `Thread` objects per task |
| `Callable<V>` + `Future<V>` | like `Runnable` but can **return a value** and **throw checked exceptions** |
| `ConcurrentHashMap` | thread-safe map with fine-grained locking (much better throughput than a synchronized `HashMap`) |
| `CopyOnWriteArrayList` | thread-safe list optimized for many reads, few writes (copies the whole array on each write) |
| `AtomicInteger`/`AtomicLong`/`AtomicReference` | lock-free atomic operations via CAS (Compare-And-Swap) |
| `CountDownLatch` | one-time gate — threads wait until a counter reaches zero |
| `CyclicBarrier` | reusable rendezvous point where N threads all wait for each other |
| `Semaphore` | limits concurrent access to a resource to N permits |

---

## PART B — ENUMS

```java
enum Day { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }

Day d = Day.MONDAY;
d.ordinal();          // 0 — position in declaration order (⚠ fragile if you reorder constants later — avoid relying on this for persisted/serialized data)
d.name();              // "MONDAY" — exact declared identifier
Day.valueOf("MONDAY"); // parses a String back into the enum constant; throws IllegalArgumentException if no match
Day.values();          // returns a new array of all constants, in declaration order, EVERY call (mild perf note: cache it if hot-looped)
```
**Enums are full classes** — they can have fields, constructors (implicitly `private` — you can never `new` an enum constant from outside), and methods:
```java
enum Planet {
    MERCURY(3.3e23, 2.4e6), EARTH(5.9e24, 6.4e6);       // each constant invokes the constructor with these args

    private final double mass, radius;
    Planet(double mass, double radius) { this.mass = mass; this.radius = radius; }

    double surfaceGravity() { return 6.674e-11 * mass / (radius * radius); }
}
```
**Enums implementing interfaces:**
```java
interface Operation { int apply(int a, int b); }
enum BasicOp implements Operation {
    ADD { public int apply(int a, int b) { return a + b; } },       // PER-CONSTANT abstract method override!
    SUBTRACT { public int apply(int a, int b) { return a - b; } };
}
System.out.println(BasicOp.ADD.apply(3, 4));   // 7
```
This "per-constant method body" pattern is a genuinely elegant, underused feature — each enum constant can override an abstract method DIFFERENTLY, replacing what would otherwise be an ugly `switch` statement.

**`switch` on enums** doesn't need the enum name qualifier inside the `case` labels:
```java
switch (d) {
    case MONDAY -> System.out.println("Start of week");    // NOT Day.MONDAY — compile error if qualified!
    default -> System.out.println("Another day");
}
```
**`EnumMap`/`EnumSet`** — specialized, highly efficient (array-backed internally) `Map`/`Set` implementations specifically for enum keys/elements — prefer these over `HashMap<EnumType,V>`/`HashSet<EnumType>` when the key/element type is an enum, for both memory and speed.

**Singleton pattern via enum (the "best" Singleton, per Effective Java):**
```java
enum Singleton {
    INSTANCE;
    void doSomething() { }
}
Singleton.INSTANCE.doSomething();
```
This is considered the most robust Singleton implementation because the JVM **guarantees** enum constants are instantiated exactly once, it's inherently **serialization-safe** (no risk of reflection or deserialization creating a second instance, unlike hand-rolled Singletons which need extra defensive code to prevent this).

---

## PART C — INNER & ANONYMOUS CLASSES

(Static nested vs. non-static inner class fundamentals are covered in file 05 §5.5 — this section covers the other two kinds.)

### Local classes — defined inside a method body
```java
void processOrder() {
    class Validator {                          // scoped ONLY to this method
        boolean isValid(int amount) { return amount > 0; }
    }
    Validator v = new Validator();
    System.out.println(v.isValid(100));
}
```

### Anonymous classes — a class AND its single instance, defined inline, no name
```java
Comparator<String> byLength = new Comparator<String>() {     // implementing an interface inline
    @Override public int compare(String a, String b) { return a.length() - b.length(); }
};

Thread t = new Thread() {                                     // extending a class inline
    @Override public void run() { System.out.println("Running"); }
};
```
**Modern equivalent:** whenever the anonymous class implements a **functional interface**, a **lambda is almost always preferred** — shorter, and doesn't create a whole new `.class` file (`Outer$1.class`) at compile time. Anonymous classes remain necessary when: implementing an interface/abstract class with **more than one** abstract method, or when you need actual **instance state (fields)** inside the class body, which a lambda cannot have.

**Capture rules identical to lambdas:** anonymous (and local) classes can only capture effectively-final local variables from the enclosing scope, for the same reasons discussed in file 12.

---

## PART D — MISCELLANEOUS AWARENESS TOPICS

### Records (Java 14 preview, 16+ standard) — concise immutable data carriers
```java
record Point(int x, int y) { }     // auto-generates: constructor, x(), y() accessors (NOT getX()!), equals(), hashCode(), toString()

Point p = new Point(1, 2);
p.x();                              // 1 — accessor method name matches the FIELD name, no "get" prefix
System.out.println(p);              // "Point[x=1, y=2]" — auto-generated toString()
```
**Records are implicitly `final`** (can't be extended) and all fields are implicitly `private final` — they're purpose-built for immutable data-holder classes, replacing a LOT of the boilerplate from file 05's "how to write an immutable class" recipe.
**Compact canonical constructor** — for validation without repeating the field list:
```java
record Range(int min, int max) {
    Range {                                    // "compact" constructor — no parameter list repeated!
        if (min > max) throw new IllegalArgumentException("min > max");
    }
}
```

### Reflection — awareness level only (per syllabus)
```java
Class<?> clazz = Class.forName("java.lang.String");     // or someObject.getClass()
Method[] methods = clazz.getDeclaredMethods();
Field field = clazz.getDeclaredField("value");
field.setAccessible(true);                                // bypasses private access — powerful and dangerous
```
Reflection lets you inspect/invoke classes, methods, and fields **at runtime**, even `private` ones — used heavily by frameworks (Spring, Hibernate, JUnit) for dependency injection, ORM mapping, and test discovery. **Trade-offs to mention if asked:** slower than direct calls (no JIT inlining benefits, extra security checks), bypasses compile-time type safety, and can violate encapsulation (`setAccessible(true)`) — use sparingly in application code; it's primarily a framework-building tool.

### Serialization — awareness level only (per syllabus)
```java
class User implements Serializable {
    private static final long serialVersionUID = 1L;    // versioning — mismatch causes InvalidClassException on deserialize
    String name;
    transient String password;                            // transient fields are SKIPPED during serialization entirely
}
```
- A class must implement the **marker interface** `Serializable` (no methods to implement — it just flags eligibility) to be convertible to/from a byte stream via `ObjectOutputStream`/`ObjectInputStream`.
- **`transient`** fields are deliberately excluded from the serialized form (e.g., passwords, `Thread`/socket handles that make no sense to persist) — they come back as their default value (`null`/`0`/`false`) after deserialization.
- **`serialVersionUID`** should be explicitly declared — if omitted, the JVM computes one implicitly based on the class's structure, meaning any structural change (adding/removing a field) can silently break deserialization of OLDER serialized data with a `InvalidClassException`.
- Constructors are **NOT called** during deserialization (the object is reconstructed directly from the byte stream) — a subtlety that can surprise people relying on constructor-run invariants.

---

## 🚩 Common Traps Recap (Phase 13)

1. Calling `run()` instead of `start()` executes on the current thread — no new thread is created.
2. `count++` is not atomic — three separate steps create a race condition window.
3. `volatile` guarantees visibility, NOT atomicity — `volatile int x; x++;` is still unsafe.
4. `synchronized` on a static method locks the `Class` object, not `this` — instance and static synchronized methods never contend with each other.
5. Always call `wait()` inside a `while(!condition)` loop, never `if`, to guard against spurious wakeups.
6. Deadlock arises from inconsistent lock acquisition order across threads — fix by enforcing a global lock ordering.
7. `enum.ordinal()` is fragile — reordering enum constants silently changes ordinal values; never persist/serialize based on it.
8. Anonymous/local classes and lambdas can only capture effectively-final locals.
9. `transient` fields reset to their default value after deserialization; constructors don't run during deserialization at all.

## ❓ Rapid-Fire Q&A

**Q: What's the difference between `Thread.sleep()` and `Object.wait()`?**
A: `sleep()` pauses the current thread for a fixed time WITHOUT releasing any locks it holds; `wait()` releases the monitor lock it's called with and waits until `notify()`/`notifyAll()` (or a timeout) — `wait()` must be called from a `synchronized` context, `sleep()` does not require one.

**Q: Why is the enum-based Singleton considered superior to the classic double-checked-locking Singleton?**
A: The JVM inherently guarantees a single instance per enum constant, and it's automatically thread-safe and serialization-safe with zero extra code — hand-rolled Singletons need careful `volatile`+double-checked-locking for thread safety and extra `readResolve()` handling to survive serialization/reflection attacks safely.

**Q: Is `ConcurrentHashMap` allowed to have null keys or values? Why might that matter?**
A: No, neither is allowed (throws NPE) — this is intentional: in a concurrent context, `map.get(key) == null` is ambiguous between "key absent" and "key present with a null value," and resolving that ambiguity safely under concurrent access is expensive/unreliable, so the design forbids nulls entirely to sidestep the issue.

**Q: What happens if you forget to declare `serialVersionUID` and later add a field to a `Serializable` class?**
A: The implicitly-computed UID changes because it's derived from the class's structure — deserializing OLD data (created before your change) with the NEW class definition throws `InvalidClassException` due to a UID mismatch, unless you'd explicitly pinned a stable `serialVersionUID`.
