# 07. Collections Framework — Complete Guide 🔥🔥🔥🔥🔥
### The single highest-leverage file in this handbook. Read it twice.

---

## 7.1 The Hierarchy (draw this from memory)

```
                         Iterable<E>
                             |
                        Collection<E>
             /               |                \
          List<E>          Queue<E>          Set<E>
         /   |   \         /     \          /   |   \
  ArrayList  |  Vector  PriorityQueue  Deque  HashSet SortedSet LinkedHashSet
             |    |                     |               |
        LinkedList Stack           ArrayDeque       TreeSet (implements NavigableSet)
                                    LinkedList (implements Deque too!)

                         Map<E,V>   (NOT a Collection! separate hierarchy root)
                        /    |    \
                  HashMap  SortedMap  Hashtable
                     |         |
              LinkedHashMap  TreeMap (implements NavigableMap)
```

**Two things people get wrong immediately:**
1. `Map` is **not** a `Collection` — it's a completely separate interface (a `Map` holds key-value pairs, not single elements).
2. `LinkedList` implements **both** `List` and `Deque` — it's genuinely dual-purpose.

### When to use which — the decision table

| Need | Use |
|---|---|
| Ordered, index-accessible, duplicates allowed | `ArrayList` |
| Frequent insert/delete at both ends, or as a Queue/Stack/Deque | `ArrayDeque` (or `LinkedList` if you also need `List` operations) |
| Unique elements, no ordering guarantee needed, fastest lookup | `HashSet` |
| Unique elements, insertion order preserved | `LinkedHashSet` |
| Unique elements, sorted order + range queries | `TreeSet` |
| Key→value lookup, fastest, no ordering needed | `HashMap` |
| Key→value, insertion/access order preserved (LRU-capable) | `LinkedHashMap` |
| Key→value, sorted by key + range queries | `TreeMap` |
| Always retrieve the min/max element efficiently | `PriorityQueue` |

---

## 7.2 `ArrayList` — internals matter

Backed by a **dynamically-resizing `Object[]` array**.

```java
List<Integer> list = new ArrayList<>();       // default initial capacity 10 (lazily allocated on FIRST add in modern JDKs)
list.add(5);
list.add(0, 10);                              // insert at index 0 — shifts everything right, O(n)
list.get(0);                                  // O(1) — direct array index
list.set(0, 99);                              // O(1)
list.remove(0);                               // remove by INDEX — O(n), shifts everything left
list.remove(Integer.valueOf(5));              // remove by VALUE — must box to disambiguate from index! (see trap below)
list.contains(5);                             // O(n) — linear scan
list.size();
Collections.sort(list);                       // in-place, uses TimSort — O(n log n)
```

### THE classic `remove(int)` vs `remove(Object)` trap
```java
List<Integer> nums = new ArrayList<>(List.of(10, 20, 30));
nums.remove(1);                    // removes the element AT INDEX 1 -> removes "20". List becomes [10, 30]
nums.remove(Integer.valueOf(1));   // removes the element EQUAL TO 1 (no such element -> no-op, returns false)
```
`List<Integer>.remove(int index)` is overloaded against `List<E>.remove(Object o)` — since `Integer` autoboxing exists, the compiler prefers the **exact primitive `int` match** (`remove(int)`) unless you explicitly box the argument to force the `Object` overload. This bites almost everyone once.

### Resizing internals
When `add()` exceeds current capacity, `ArrayList` grows by **~1.5x** (specifically `newCapacity = oldCapacity + (oldCapacity >> 1)`), allocates a new backing array, and **copies all elements over** — an O(n) operation, but happening rarely enough that `add()` is **amortized O(1)**.

```java
List<Integer> list2 = new ArrayList<>(1000);   // pre-sizing avoids repeated resize-copies if you know the size upfront
                                                 // — a real performance-tuning answer worth mentioning
```

### Fail-fast Iterators & `ConcurrentModificationException` (CME)
```java
List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4));
for (Integer n : list) {
    if (n == 2) list.remove(n);     // structurally modifies the list mid-iteration
}
// ConcurrentModificationException — thrown on the NEXT call to iterator.next()
```
**Why:** `ArrayList`'s iterator tracks a `modCount` (structural modification counter) snapshotted at iterator-creation time. Any structural change (add/remove, but NOT `set()`) outside the iterator itself increments `modCount`; the iterator checks this on every `next()` call and throws CME if it detects a mismatch. **This is "fail-fast" — designed to loudly catch bugs, not to be bulletproof concurrency control** (it doesn't reliably catch every possible race in genuinely multi-threaded modification; it's a best-effort safety net for single-threaded misuse).

**The three correct ways to remove-while-iterating:**
```java
// 1. Iterator.remove() — safe, updates modCount correctly
Iterator<Integer> it = list.iterator();
while (it.hasNext()) { if (it.next() == 2) it.remove(); }

// 2. removeIf() (Java 8+) — cleanest modern approach
list.removeIf(n -> n == 2);

// 3. Iterate a COPY, mutate the original
for (Integer n : new ArrayList<>(list)) { if (n == 2) list.remove(n); }
```

### `Vector` — the legacy, rarely-correct-choice cousin
`Vector` is essentially `ArrayList` but with every method `synchronized` — meaning uncontested single-threaded use pays needless lock overhead. **Nearly always prefer `ArrayList`** (or `Collections.synchronizedList(...)` / `CopyOnWriteArrayList` from `java.util.concurrent` if you genuinely need thread safety).

---

## 7.3 `LinkedList` — Doubly Linked List

```java
LinkedList<Integer> ll = new LinkedList<>();
ll.addFirst(1); ll.addLast(2);
ll.getFirst(); ll.getLast();
ll.get(5);          // O(n)! LinkedList has NO random access — must walk from head/tail
```
Internally: each node holds `{ prev, item, next }`. `get(index)` is O(n) (worse than `ArrayList`'s O(1)), but `addFirst`/`addLast`/`removeFirst`/`removeLast` are true **O(1)** (no shifting needed, unlike `ArrayList.add(0, x)` which is O(n)).

**ArrayList vs LinkedList — the honest performance table:**

| Operation | ArrayList | LinkedList |
|---|---|---|
| `get(index)` | **O(1)** | O(n) |
| `add(end)` | O(1) amortized | O(1) |
| `add(0, x)` / `add(middle)` | O(n) (shift) | O(1) once you HAVE the node reference, O(n) to find it by index first |
| `remove(0)` | O(n) (shift) | O(1) |
| Memory overhead | Lower (contiguous array, better cache locality) | Higher (each node has 2 extra pointers + object header) |
| Iteration speed | Faster (cache-friendly, contiguous memory) | Slower (pointer chasing, poor cache locality) |

**Modern interview-safe verdict:** *"Default to `ArrayList` unless you specifically need frequent insert/delete at the head or via a Deque interface — `ArrayList`'s cache locality usually wins in practice even for many "theoretical" LinkedList use cases."* This is also **why the syllabus explicitly recommends `ArrayDeque` over legacy `Stack`/`LinkedList` for stack/queue-style DSA code** (see 7.6).

---

## 7.4 `HashSet` — internals

`HashSet<E>` is internally backed by a `HashMap<E, Object>` — every element you add becomes a **key** in that hidden map, mapped to a shared dummy constant `PRESENT` object as the value. This is why `HashSet` inherits nearly all of `HashMap`'s performance characteristics and gotchas.

```java
Set<String> set = new HashSet<>();
set.add("a");
set.add("a");           // silently ignored — returns false, set already contains "a"
set.contains("a");      // O(1) average
set.remove("a");
```
**Uniqueness is determined by `equals()`+`hashCode()`** — this is why 5.3's contract discussion is not optional theory, it's load-bearing for every `HashSet`/`HashMap` you'll ever write with custom objects.

`HashSet` **allows exactly one `null` element**. Iteration order is **unspecified** — never rely on it.

---

## 7.5 `HashMap` — THE most-asked internals question in all of Java interviewing

```java
Map<String, Integer> map = new HashMap<>();
map.put("a", 1);
map.put("a", 2);                      // OVERWRITES — put() returns the PREVIOUS value (1), map now has "a"->2
map.get("z");                          // null if key absent (no exception!)
map.getOrDefault("z", 0);              // 0 — safe default
map.containsKey("a");
map.containsValue(2);                  // O(n) — must scan all values, unlike containsKey's O(1)
map.remove("a");
map.putIfAbsent("b", 5);               // only inserts if "b" isn't already present
map.merge("count", 1, Integer::sum);   // classic "increment or initialize" idiom — see below
for (Map.Entry<String, Integer> e : map.entrySet()) { }   // BEST way to iterate both key+value — one pass
for (String k : map.keySet()) { }                          // key-only iteration
for (Integer v : map.values()) { }                          // value-only iteration
```

**The classic "count frequencies" idiom — know both the old and new way:**
```java
// Old way (pre-Java 8)
map.put(key, map.getOrDefault(key, 0) + 1);

// Modern, single-lookup way (Java 8+, marginally more efficient — avoids a separate get+put)
map.merge(key, 1, Integer::sum);
```

### How `HashMap.put()` / `get()` actually work internally — SAY THIS PRECISELY

1. Compute `key.hashCode()`.
2. **Spread the hash** — Java 8+ applies `h = hashCode ^ (hashCode >>> 16)` (XOR the top 16 bits into the bottom 16 bits) to reduce collisions from poor hash functions that only vary in high bits, since only the low bits are used for small tables.
3. **Bucket index** = `(table.length - 1) & spreadHash` — this is why the internal table size is **always a power of 2** (lets the JVM use a cheap bitmask instead of an expensive modulo `%` operation).
4. If the bucket is empty, insert directly.
5. If the bucket already has entries (a **collision**), walk the bucket's **linked list**, comparing `hashCode` then `equals()` against existing keys — if an equal key is found, overwrite its value; otherwise append a new node.
6. **Treeification (Java 8+):** if a single bucket's linked list grows beyond **8** entries AND the table itself has capacity ≥ **64**, that bucket is converted from a linked list into a **red-black tree** — turning worst-case lookup within a badly-colliding bucket from O(n) into O(log n). (If capacity is under 64, the table is resized/doubled instead of treeifying — resizing is tried first.)

### Load Factor & Resizing (Rehashing)

- **Default initial capacity: 16.** **Default load factor: 0.75.**
- **Threshold = capacity × loadFactor** (16 × 0.75 = 12). Once `size` exceeds the threshold, the table **doubles** in capacity (stays a power of 2) and **every entry is rehashed** into the new, larger table — an expensive O(n) operation, but amortized across many cheap puts, giving **average O(1)** put/get.
- **Why 0.75 specifically?** It's the classic space/time trade-off: a lower load factor (denser buckets are rarer) means faster lookups but wastes more memory (many empty buckets); a higher load factor saves memory but increases collision chains, slowing lookups. 0.75 is the empirically-chosen "good balance" default.
- **If you know the expected size upfront,** pre-sizing the `HashMap` (`new HashMap<>(expectedSize / 0.75f)` roughly, or just a generously large capacity) avoids repeated resize/rehash operations — a genuine performance-tuning talking point.

### `HashMap` and `null`
```java
Map<String, Integer> m = new HashMap<>();
m.put(null, 1);          // ✅ HashMap allows exactly ONE null key
m.put("a", null);         // ✅ HashMap allows MULTIPLE null values
```
**Contrast with `Hashtable` (legacy) and `ConcurrentHashMap`:** both **throw `NullPointerException`** on a null key OR null value — this is a very commonly tested contrast.

### Worst-case complexity (before Java 8 treeification)
Before Java 8, a pathological set of keys all hashing to the SAME bucket degraded `HashMap` operations to **O(n)** worst case (a hash-flooding **denial-of-service** vector some languages/frameworks had to patch against!). Java 8's treeification caps the true worst case at **O(log n)** per bucket, though this requires the keys to be mutually `Comparable` (or have consistent identity hash ordering) to build the tree — a genuinely deep fact very few candidates know, and dropping it signals real depth.

### `HashMap` vs `Hashtable` vs `ConcurrentHashMap` vs `LinkedHashMap` vs `TreeMap`

| | Thread-safe | Null key/value | Ordering | Notes |
|---|---|---|---|---|
| `HashMap` | ❌ | 1 null key, many null values | none guaranteed | the default choice |
| `Hashtable` | ✅ (synchronized, coarse) | ❌ neither allowed | none guaranteed | legacy, avoid in new code |
| `ConcurrentHashMap` | ✅ (fine-grained, lock striping / CAS) | ❌ neither allowed | none guaranteed | modern concurrent choice (file 13) |
| `LinkedHashMap` | ❌ | same as HashMap | **insertion order** (or access order, if configured) | great for LRU caches |
| `TreeMap` | ❌ | ❌ null key (throws NPE — needs to compare it); null values OK | **sorted by key** | O(log n) ops, Red-Black tree |

**`LinkedHashMap` as a ready-made LRU cache** (a genuinely popular interview coding exercise):
```java
class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    LRUCache(int capacity) {
        super(16, 0.75f, true);     // `true` = ACCESS-order (most recently accessed moves to the end), not insertion-order
        this.capacity = capacity;
    }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;   // override hook — LinkedHashMap calls this after every put()
    }
}
```

---

## 7.6 Queue & Deque

### `Queue` interface — the "throws vs returns special value" split (VERY commonly tested)

| Operation | Throws exception on failure | Returns special value on failure |
|---|---|---|
| Insert | `add(e)` | `offer(e)` (returns `false`) |
| Remove | `remove()` | `poll()` (returns `null`) |
| Examine | `element()` | `peek()` (returns `null`) |

**Rule of thumb interviewers want:** *"Prefer `offer`/`poll`/`peek` in general-purpose code — they signal failure via return value instead of throwing, which is usually easier to handle gracefully, especially for a bounded queue where "full" is an expected condition, not exceptional."*

### `Deque` (Double-Ended Queue) — the modern universal tool

```java
Deque<Integer> deque = new ArrayDeque<>();
deque.addFirst(1); deque.addLast(2);
deque.offerFirst(0); deque.offerLast(3);
deque.peekFirst(); deque.peekLast();      // null if empty, no exception
deque.removeFirst(); deque.removeLast();  // throws if empty
deque.pollFirst(); deque.pollLast();      // null if empty, no exception
```
`ArrayDeque` also directly provides **Stack-like** methods (`push`, `pop`, `peek` — pushing/popping from the **head**) and **Queue-like** methods (`offer`, `poll`, `peek` — from the **tail** for offer, **head** for poll) — making it a genuine Swiss-army-knife for DSA problems needing a stack, a queue, or both.

### `Stack` (legacy class) — why the syllabus tells you to avoid it

```java
Stack<Integer> stack = new Stack<>();     // extends Vector! inherits synchronized overhead, and (bizarrely) List methods
stack.push(1); stack.pop(); stack.peek();
```
`java.util.Stack` extends `Vector`, meaning: (a) every operation is needlessly `synchronized` for single-threaded DSA code, and (b) it also exposes full `List` methods like `get(index)`/`add(middle)`, which **breaks proper stack discipline** (nothing stops you from randomly inserting into the "middle" of a supposed stack). **Modern idiomatic Java uses `Deque<Integer> stack = new ArrayDeque<>();` instead** — faster (array-based, no synchronization), and enforces cleaner stack-only usage via the API you choose to call.

---

## 7.7 `PriorityQueue` — binary heap

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();                       // natural ordering -> MIN-heap by default!
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());  // MAX-heap
PriorityQueue<int[]> custom = new PriorityQueue<>((a, b) -> a[0] - b[0]);      // custom comparator, e.g. sort by first element

minHeap.offer(5); minHeap.offer(1); minHeap.offer(3);
minHeap.poll();     // 1 — always removes the SMALLEST (for a min-heap)
minHeap.peek();     // look at the smallest without removing
```
**Critical gotcha: iteration order is NOT sorted order!**
```java
PriorityQueue<Integer> pq = new PriorityQueue<>(List.of(5, 1, 3, 2, 4));
System.out.println(pq);              // e.g. [1, 2, 3, 5, 4] — NOT [1,2,3,4,5]!
// Only pq.peek()/pq.poll() are GUARANTEED to give the min. The internal array satisfies the
// heap property (parent <= children) but is NOT a fully sorted sequence when read directly/iterated.
```
**Internals:** a binary heap stored in a **flat array** (or `Object[]`), where for index `i`: children are at `2i+1` and `2i+2`, parent is at `(i-1)/2`. `offer` does "sift-up" (bubble the new element up while smaller than its parent) — O(log n). `poll` swaps the root with the last element, removes the last, then "sifts down" the new root — O(log n). `peek` is O(1).

**Custom ordering for objects — the standard idiom:**
```java
class Task { String name; int priority; }
PriorityQueue<Task> pq = new PriorityQueue<>(Comparator.comparingInt(t -> t.priority));
PriorityQueue<Task> pqDesc = new PriorityQueue<>((a, b) -> b.priority - a.priority);   // reversed manually
```
**Overflow trap in comparator subtraction:** `(a, b) -> a.priority - b.priority` can silently **overflow** if priorities are near `Integer.MIN_VALUE`/`MAX_VALUE` — prefer `Integer.compare(a.priority, b.priority)` for correctness in production/edge-case-sensitive code.

---

## 7.8 `TreeSet` & `TreeMap` — sorted, Red-Black tree backed

```java
TreeSet<Integer> ts = new TreeSet<>(List.of(5, 1, 9, 3));
ts.first();          // 1 (smallest)
ts.last();           // 9 (largest)
ts.higher(3);         // 5  — smallest element STRICTLY greater than 3
ts.lower(3);          // 1  — largest element STRICTLY less than 3
ts.ceiling(4);        // 5  — smallest element >= 4
ts.floor(4);          // 3  — largest element <= 4
ts.headSet(5);         // {1, 3} — elements strictly less than 5, as a VIEW (not a copy!)
ts.tailSet(5);         // {5, 9} — elements >= 5
ts.subSet(1, 9);       // {1, 3, 5} — [1, 9) range
ts.pollFirst();        // removes and returns smallest
ts.pollLast();         // removes and returns largest
```
All core operations (`add`, `remove`, `contains`) are **O(log n)** — no O(1) average case like hash-based collections, but you get **ordering guarantees** in exchange.

```java
TreeMap<String, Integer> tm = new TreeMap<>();
tm.put("banana", 2); tm.put("apple", 1); tm.put("cherry", 3);
tm.firstKey();       // "apple"
tm.lastEntry();       // Map.Entry("cherry", 3)
tm.higherKey("banana"); // "cherry"
tm.floorEntry("b");    // Entry("apple", 1) — largest key <= "b"
```
**Requirement:** elements/keys must be mutually `Comparable`, or you must supply a `Comparator` at construction — otherwise you get a `ClassCastException` the first time two elements are actually compared (not necessarily immediately at `add()` time if the tree happens not to need that comparison yet, though in practice it usually surfaces right away).

**`TreeSet`/`TreeMap` and the `equals`/`compareTo` consistency trap:**
```java
TreeSet<String> set = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
set.add("Apple");
set.add("apple");
System.out.println(set.size());   // 1! TreeSet uses compareTo()==0 (via the Comparator) to determine
                                    // "duplicate," NOT equals()! Since CASE_INSENSITIVE_ORDER treats them as equal,
                                    // the second add is rejected even though "Apple".equals("apple") is false.
```
**Rule to state explicitly:** *"`TreeSet`/`TreeMap` determine equality/uniqueness via `compareTo()`==0 (or the supplied Comparator), completely ignoring `equals()`/`hashCode()` — this can silently diverge from `HashSet`'s equals-based notion of uniqueness if your `compareTo` and `equals` aren't consistent."*

---

## 7.9 `Collections` Utility Class — the toolbox

```java
Collections.sort(list);                          // natural order
Collections.sort(list, comparator);
Collections.reverse(list);
Collections.shuffle(list);
Collections.max(list); Collections.min(list);
Collections.frequency(list, target);              // count occurrences
Collections.unmodifiableList(list);                // read-only VIEW (still backed by the original — mutating the original still shows through!)
Collections.synchronizedList(list);                // thread-safe wrapper (still needs manual synchronization on COMPOUND operations/iteration!)
Collections.emptyList();                            // returns a shared IMMUTABLE singleton, not a new object each time
Collections.singletonList(x);                       // immutable one-element list
Collections.nCopies(5, "x");                        // immutable list of 5 references to the SAME "x"
Collections.binarySearch(sortedList, key);          // like Arrays.binarySearch, list MUST be sorted first
```
**`unmodifiableList` gotcha:** it's a **view**, not a deep copy — if the underlying original list is mutated directly, the "unmodifiable" view reflects those changes too (it only blocks mutation attempts made *through the view itself*).

**`List.of(...)` / `Map.of(...)` / `Set.of(...)` (Java 9+) — truly immutable factory methods:**
```java
List<Integer> immutable = List.of(1, 2, 3);
immutable.add(4);        // UnsupportedOperationException
List.of(1, null, 3);     // NullPointerException — List.of() disallows null elements entirely (unlike Arrays.asList!)
```

---

## 🚩 Common Traps Recap (Phase 7)

1. `list.remove(int)` vs `list.remove(Object)` — box your `Integer` argument to remove *by value* instead of by index.
2. Structural modification of a collection during a for-each loop → `ConcurrentModificationException`; use `Iterator.remove()` or `removeIf()`.
3. `HashMap`/`HashSet` correctness depends entirely on a correct `equals()`+`hashCode()` pair (see file 05).
4. `HashMap` allows one null key + many null values; `Hashtable`/`ConcurrentHashMap` allow neither — NPE if you try.
5. `PriorityQueue` iteration order is NOT sorted — only `peek()`/`poll()` guarantee heap-order correctness.
6. `TreeSet`/`TreeMap` determine uniqueness via `compareTo()`, not `equals()` — these can diverge if inconsistent.
7. `Collections.unmodifiableList()` is a live view, not an independent immutable copy.
8. Legacy `Vector`/`Stack`/`Hashtable` carry needless synchronization overhead for single-threaded code — prefer `ArrayList`/`ArrayDeque`/`HashMap`.
9. `ArrayList.get()` is O(1); `LinkedList.get()` is O(n) — pick based on actual access pattern, not just "LinkedList sounds efficient for insertion."

## ❓ Rapid-Fire Q&A

**Q: Why is `HashMap`'s default capacity always a power of 2?**
A: So the bucket index can be computed with a cheap bitmask (`(capacity - 1) & hash`) instead of the slower modulo operator, and so resizing (always doubling) keeps this bitmask trick valid.

**Q: What happens to `HashMap` performance if every key has the exact same, poor `hashCode()`?**
A: All entries collide into a single bucket. Before Java 8: O(n) worst case per operation (a linked list scan). Java 8+: once that bucket exceeds 8 entries (and table capacity ≥ 64), it treeifies into a red-black tree, bounding worst-case lookup to O(log n).

**Q: Why does the syllabus prefer `ArrayDeque` over both `Stack` and `LinkedList` for stack/queue-based DSA code?**
A: `Stack` extends the legacy, needlessly-synchronized `Vector` and also exposes unrelated `List` methods that break stack discipline. `LinkedList` works but has worse cache locality and per-node pointer overhead compared to `ArrayDeque`'s contiguous resizable array — `ArrayDeque` is faster in practice for pure stack/queue/deque access patterns.

**Q: `TreeSet<String> set = new TreeSet<>(); set.add("b"); set.add(null);` — what happens?**
A: `NullPointerException` — `TreeSet` needs to compare the new element against existing ones to place it in sorted order, and comparing against `null` throws (unless a custom `Comparator` explicitly handles nulls, which the natural-ordering default does not).

**Q: How would you implement a simple LRU cache using only standard Java collections?**
A: Extend `LinkedHashMap` with `accessOrder=true` in the constructor and override `removeEldestEntry()` to evict once size exceeds capacity — this leans on `LinkedHashMap`'s built-in access-order re-linking instead of hand-rolling a doubly linked list + hash map from scratch.
