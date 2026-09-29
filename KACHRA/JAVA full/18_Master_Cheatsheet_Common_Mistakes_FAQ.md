# 18. Master Cheatsheet — Read This The Night Before

Pure recall. No new concepts. If anything here doesn't ring a bell, go back to the relevant file.

---

## 18.1 Time Complexity Cheat Sheet — Collections

| Structure | Access | Search | Insert | Delete | Notes |
|---|---|---|---|---|---|
| `ArrayList` | O(1) | O(n) | O(1) amortized (end) / O(n) (middle) | O(n) | contiguous array |
| `LinkedList` | O(n) | O(n) | O(1) (ends) | O(1) (ends, with node ref) | doubly linked |
| `HashMap`/`HashSet` | — | O(1) avg, O(log n) worst (treeified) | O(1) avg | O(1) avg | O(n) worst-case pre-Java-8 |
| `TreeMap`/`TreeSet` | — | O(log n) | O(log n) | O(log n) | Red-Black tree, sorted |
| `PriorityQueue` | O(1) peek | O(n) | O(log n) | O(log n) poll | binary heap array |
| `ArrayDeque` | O(1) ends | O(n) | O(1) ends | O(1) ends | preferred stack/queue impl |
| `Stack` (legacy) | O(1) top | O(n) | O(1) | O(1) | avoid — use ArrayDeque |

## 18.2 Time Complexity Cheat Sheet — Algorithms

| Algorithm | Time | Space | Notes |
|---|---|---|---|
| Linear Search | O(n) | O(1) | |
| Binary Search | O(log n) | O(1) | requires sorted input |
| Bubble/Selection/Insertion Sort | O(n²) | O(1) | rarely used in practice |
| Merge Sort | O(n log n) | O(n) | stable |
| Quick Sort | O(n log n) avg, O(n²) worst | O(log n) | in-place, not stable |
| TimSort (`Collections.sort`, `Arrays.sort(Object[])`) | O(n log n) worst | O(n) | stable, Java's actual default for objects |
| Dual-Pivot Quicksort (`Arrays.sort(int[])`) | O(n log n) avg, O(n²) worst | O(log n) | Java's default for primitives, not stable |
| BFS / DFS | O(V + E) | O(V) | |
| Dijkstra (binary heap) | O(E log V) | O(V) | non-negative weights only |
| Bellman-Ford | O(V·E) | O(V) | handles negative weights |
| Kruskal's MST | O(E log E) | O(V) | sort + Union-Find |
| Prim's MST (heap) | O(E log V) | O(V) | |
| Topological Sort (Kahn's/DFS) | O(V + E) | O(V) | DAGs only |
| 0/1 Knapsack DP | O(n·W) | O(n·W) or O(W) optimized | |
| LCS / Edit Distance DP | O(n·m) | O(n·m) or O(min(n,m)) optimized | |
| LIS (naive DP) | O(n²) | O(n) | |
| LIS (binary search optimized) | O(n log n) | O(n) | |
| Trie insert/search | O(L) | O(L) per word | L = string length |
| Union-Find (path compression + rank) | O(α(n)) amortized | O(n) | effectively constant |

## 18.3 HashMap Internals — 30-Second Recap
1. `hashCode()` → spread via `h ^ (h >>> 16)` → bucket index via `(capacity-1) & hash`.
2. Collision → linked list in the bucket → **treeified into a red-black tree** if a bucket exceeds 8 entries AND table capacity ≥ 64.
3. Default capacity 16, load factor 0.75, threshold = capacity × loadFactor → doubles + full rehash when exceeded.
4. Correctness depends entirely on a correct, consistent `equals()`+`hashCode()` pair.

## 18.4 The equals/hashCode/compareTo Contract — 30-Second Recap
- `a.equals(b) == true` **implies** `a.hashCode() == b.hashCode()`. Reverse not required (collisions are fine).
- `HashMap`/`HashSet` uniqueness → `equals()` + `hashCode()`.
- `TreeMap`/`TreeSet` uniqueness → `compareTo() == 0` (or Comparator), **completely ignoring `equals()`**.
- Always override both `equals()` and `hashCode()` together, using the same fields.

---

## 18.5 The Master List of "Silent Bugs" (no exception thrown, just wrong behavior)

| Silent bug | Why it's silent |
|---|---|
| `int` overflow (`Integer.MAX_VALUE + 1`) | wraps to `MIN_VALUE`, no exception |
| `0.1 + 0.2 != 0.3` | IEEE-754 binary floating point can't represent 0.1 exactly |
| `Arrays.binarySearch()` on unsorted array | returns garbage, not an error |
| `Arrays.equals()` on nested arrays | shallow — compares inner array references, always `false` for distinct nested arrays |
| `HashSet`/`HashMap` with broken `hashCode()` | lookups silently fail to find "equal" elements |
| Autoboxed `Integer == Integer` outside -128..127 | silently `false` even for equal values |
| `PriorityQueue.toString()`/iteration | NOT sorted order, only `peek()`/`poll()` are correct |
| `clone()` on a 2D array | shallow — inner rows still shared/mutable from outside |
| `Math.round(-4.5)` | gives `-4`, not `-5` — `floor(x + 0.5)`, not symmetric rounding |
| `Math.abs(Integer.MIN_VALUE)` | still negative — no positive counterpart fits in 32 bits |
| Ternary with mixed types | promotes BOTH branches to a common type — can surprise-unbox a null into NPE |
| `finally` with its own `return`/`throw` | silently discards the try/catch's pending return value or exception |
| `TreeSet` with inconsistent Comparator | silently drops "duplicates" that aren't really `.equals()` |

## 18.6 The Master List of "Loud Bugs" (exceptions that surprise people)

| Exception | Common surprise trigger |
|---|---|
| `NullPointerException` | unboxing a `null` wrapper (`Map.get()` result, ternary branch); calling a method on a null chained reference |
| `ConcurrentModificationException` | structurally modifying a collection during a for-each loop |
| `ClassCastException` | invalid downcast; `Object[] o = new String[3]; o[0] = 5;` (array covariance) |
| `UnsupportedOperationException` | mutating `Arrays.asList(...)`, `List.of(...)`, or an unmodifiable view |
| `ArithmeticException` | integer division/modulo by zero (NOT thrown for floating-point ÷0, which gives Infinity/NaN instead) |
| `NumberFormatException` | `Integer.parseInt` on a string with whitespace, decimals, or out-of-range values |
| `StackOverflowError` | missing/unreachable base case in recursion, or just very deep legitimate recursion |
| `IllegalMonitorStateException` | calling `wait()`/`notify()` outside a `synchronized` block on that object |
| `IllegalThreadStateException` | calling `start()` twice on the same `Thread` object |

---

## 18.7 Cross-Topic "Why" Questions Interviewers Love (curveballs)

**Q: Why is `String` immutable, but `StringBuilder` isn't?**
A: `String`'s immutability enables pool-sharing, thread-safety, safe use as hash keys, and security guarantees for sensitive strings (class names, paths). `StringBuilder` exists specifically as the *escape hatch* for when you need efficient, repeated, in-place mutation — trading those safety guarantees for performance in a controlled, typically single-threaded/short-lived context.

**Q: Why does Java use pass-by-value exclusively, even for objects?**
A: Simplicity and predictability of the memory model — there's exactly one rule to remember (values are always copied), and "the value of a reference" is still just a value, letting the same rule explain both primitive and object parameter-passing without a special case.

**Q: Why can array covariance (`Object[] o = new String[3]`) exist safely for arrays but generics deliberately forbid the equivalent (`List<Object> l = new ArrayList<String>()` doesn't compile)?**
A: Arrays predate generics in Java and needed covariance for practical reasons (e.g., a single `sort(Object[])` utility usable on any array type) — but this required a runtime safety net, `ArrayStoreException`, since the compiler can't fully verify it. Generics were designed later with full compile-time safety as a priority, sacrificing covariance (mostly) in exchange for catching type errors at compile time instead of runtime.

**Q: Why is `HashMap` not thread-safe, but `ConcurrentHashMap` is — and why not just always use `ConcurrentHashMap`?**
A: `ConcurrentHashMap` achieves thread-safety through mechanisms (lock striping, CAS operations) that add overhead irrelevant to single-threaded code — "pay only for what you need" is a recurring Java design philosophy (same reasoning applies to `ArrayList` vs `Vector`, `StringBuilder` vs `StringBuffer`).

**Q: Why does Java prefer checked exceptions for I/O but the ecosystem trend (Spring, modern frameworks) has moved toward unchecked exceptions generally?**
A: Checked exceptions work well when there's a small, well-known set of "expected failure modes" the immediate caller can realistically handle (a missing file). In large systems with deep call chains and lambda-heavy functional code, forcing every intermediate layer to catch-or-declare exceptions it can't meaningfully act on creates boilerplate without adding safety — many teams found unchecked exceptions + centralized top-level error handling more maintainable in practice.

**Q: Why does `Integer` cache values -128 to 127 specifically?**
A: These are by far the most commonly used small integer values in typical programs (loop counters, small counts, flags) — caching them trades a small, fixed amount of upfront memory for avoiding a huge number of redundant small-object allocations across a typical program's lifetime. The range is defined by the JLS as a *minimum* guarantee; the JVM is free to cache more (configurable via `-XX:AutoBoxCacheMax`), but -128..127 is the portable guarantee you can always rely on (and only ever rely on for behavior verification, never for correctness).

**Q: Why does Java's `Arrays.sort` use different algorithms for primitives vs. objects?**
A: See file 09 — primitives have no meaningful "identity" beyond value (stability is irrelevant, so the faster, in-place Dual-Pivot Quicksort is used), while objects are typically sorted by a subset of fields and benefit from TimSort's stability guarantee and better worst-case bound.

---

## 18.8 "Explain your code" Follow-Up Prep — the meta-skill

For ANY DSA solution you write, be ready to answer, unprompted:
1. **Time and space complexity** — including whether it's *worst-case*, *average-case*, or *amortized*.
2. **What breaks it** — empty input? single element? all duplicates? negative numbers? integer overflow on large inputs?
3. **Why THIS data structure** — what specifically does it give you that a simpler one wouldn't (e.g., "I used a HashMap here specifically for O(1) average lookup, trading O(n) space")?
4. **Could you reduce the space** — is there a way to do it in O(1) extra space, and what would you trade for that (usually: destroying/reusing the input, or a harder-to-read implementation)?
5. **How would this change for a stream / infinite input / distributed system** (a common senior-level follow-up) — usually points toward `Iterator`/`Stream`-based lazy processing rather than loading everything into memory upfront.

---

## 18.9 Final Pre-Interview Checklist

- [ ] Can you explain `HashMap` internals (hashing, buckets, treeification, load factor, resizing) from memory, unprompted?
- [ ] Can you state the `equals()`/`hashCode()` contract precisely, and explain why breaking it silently corrupts hash-based collections?
- [ ] Can you explain why Java is "always pass-by-value," including the object-reference nuance?
- [ ] Do you know the overload-resolution order (widening > boxing > varargs) and the difference between overload resolution (compile-time) vs override dispatch (runtime)?
- [ ] Can you write the binary search overflow-safe midpoint formula from muscle memory?
- [ ] Can you write the linked-list reversal, BFS level-order, and generic backtracking template without looking anything up?
- [ ] Do you know when to reach for a `PriorityQueue`, a `TreeMap`, and a plain `HashMap`, and why?
- [ ] Can you explain PECS (`? extends` / `? super`) with an example?
- [ ] Do you know why `ArrayDeque` is preferred over `Stack`/`LinkedList` for stack/queue DSA code?
- [ ] Can you name the time complexity of every operation in the file 18.1/18.2 tables without hesitating?

**You now have zero excuses left to blame "I forgot the syntax" — everything is in this handbook. Go get it.**
