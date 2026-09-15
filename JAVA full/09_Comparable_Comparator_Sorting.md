# 09. Comparable, Comparator & Sorting 🔥🔥🔥🔥

---

## 9.1 `Comparable<T>` — Natural Ordering (defined INSIDE the class)

```java
class Employee implements Comparable<Employee> {
    String name; int salary;
    Employee(String name, int salary) { this.name = name; this.salary = salary; }

    @Override
    public int compareTo(Employee other) {
        return this.salary - other.salary;    // ascending by salary (see overflow warning below!)
    }
}
List<Employee> employees = new ArrayList<>(...);
Collections.sort(employees);                    // uses compareTo() automatically — "natural ordering"
```

**The `compareTo()` contract (mirrors `equals()`'s contract from file 05 — recite precisely):**
- Returns **negative** if `this < other`, **zero** if `this == other` (in ordering terms), **positive** if `this > other`.
- Must be **consistent** and roughly **transitive**: if `a.compareTo(b) > 0` and `b.compareTo(c) > 0`, then `a.compareTo(c) > 0` must also hold.
- **Strongly recommended (not strictly enforced by the compiler) to be "consistent with equals":** `a.compareTo(b) == 0` should imply `a.equals(b) == true`. Violating this is legal Java but causes surprising behavior in **sorted collections** (`TreeSet`/`TreeMap`, which use `compareTo` for uniqueness — see file 07's `CASE_INSENSITIVE_ORDER` example) versus **hash-based collections** (`HashSet`/`HashMap`, which use `equals`/`hashCode`).

---

## 9.2 `Comparator<T>` — Custom, External Ordering (defined OUTSIDE the class)

```java
Comparator<Employee> byName = new Comparator<Employee>() {
    @Override public int compare(Employee a, Employee b) { return a.name.compareTo(b.name); }
};
Collections.sort(employees, byName);
```

**Modern lambda / method-reference style (what you should actually write in an interview):**
```java
Comparator<Employee> byName = (a, b) -> a.name.compareTo(b.name);
Comparator<Employee> bySalary = Comparator.comparingInt(e -> e.salary);
employees.sort(bySalary);                                       // List.sort() (Java 8+) — no need for Collections.sort()
```

### The `Comparator` factory toolkit (Java 8+) — memorize these, they're expected fluency

```java
Comparator.comparing(Employee::getName)                     // key-extractor based, ascending
          .thenComparing(Employee::getSalary)                 // tie-breaker — CHAINING for multi-key sort
          .reversed();                                        // flips the WHOLE chain's direction

Comparator.comparingInt(Employee::getSalary);                // avoids autoboxing overhead vs comparing(Integer-returning fn)
Comparator.comparingDouble(...); Comparator.comparingLong(...);

Comparator.naturalOrder();                                    // for Comparable types — ascending natural order
Comparator.reverseOrder();                                    // descending natural order

Comparator.nullsFirst(Comparator.naturalOrder());             // handles null elements gracefully — nulls sort first
Comparator.nullsLast(Comparator.naturalOrder());
```

**Multi-key sort — sort employees by department, then by salary descending within each department:**
```java
employees.sort(
    Comparator.comparing((Employee e) -> e.department)
              .thenComparing(Comparator.comparingInt((Employee e) -> e.salary).reversed())
);
```

---

## 9.3 Comparable vs Comparator — the comparison table

| | `Comparable` | `Comparator` |
|---|---|---|
| Package | `java.lang` | `java.util` |
| Method | `compareTo(T other)` — single argument (compares `this` to `other`) | `compare(T a, T b)` — two arguments |
| Defined | Inside the class being compared (the class itself implements it) | Externally, as a separate object/lambda |
| Number of orderings per class | **Exactly one** ("the" natural ordering) | **Unlimited** — as many different Comparators as you want |
| Modifies the original class? | Yes — the class must implement the interface | No — completely decoupled, doesn't touch the class at all |
| When to use | There's one single obvious canonical ordering (e.g., numbers by value, dates chronologically) | You need multiple/situational/temporary orderings, or can't modify the class (e.g., it's from a third-party library) |

**Interview one-liner:** *"Use `Comparable` when a class has one single obvious natural ordering that should always apply by default; use `Comparator` when you need flexible, multiple, or externally-defined orderings — especially for classes you can't or shouldn't modify."*

---

## 9.4 Sorting Arrays, Lists, and PriorityQueues

```java
// Primitive arrays
int[] arr = {5, 2, 8, 1};
Arrays.sort(arr);                              // ascending only — NO comparator overload exists for primitive arrays!
// To sort primitives descending, you must either box them or reverse manually after sorting.

// Object arrays
Integer[] boxedArr = {5, 2, 8, 1};
Arrays.sort(boxedArr, Collections.reverseOrder());   // works — Comparator overload exists for Object[]

// Lists
List<Integer> list = new ArrayList<>(List.of(5, 2, 8, 1));
Collections.sort(list);                         // natural order
list.sort(Comparator.reverseOrder());           // List.sort() (Java 8+), preferred modern style

// PriorityQueue (see file 07 for full internals)
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
```

**Why can't you sort a primitive array in descending order directly with `Arrays.sort`?**
Because `Arrays.sort(int[])` has **no `Comparator` overload** — `Comparator<T>` requires a reference type `T`, and `int` is a primitive. Common workarounds:
```java
// Option 1: box, sort, unbox (a bit wasteful, but simple)
Integer[] boxed = Arrays.stream(arr).boxed().toArray(Integer[]::new);
Arrays.sort(boxed, Collections.reverseOrder());

// Option 2: sort ascending then reverse in place (most efficient for primitives)
Arrays.sort(arr);
for (int i = 0, j = arr.length - 1; i < j; i++, j--) {
    int t = arr[i]; arr[i] = arr[j]; arr[j] = t;
}
```

### Sorting a 2D array by a specific column
```java
int[][] intervals = {{1,3},{2,6},{8,10}};
Arrays.sort(intervals, (a, b) -> a[0] - b[0]);         // sort by the START of each interval
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));  // overflow-safe version — PREFER THIS
```

---

## 9.5 What Sorting Algorithm Does Java Actually Use? (a genuine "under the hood" question)

| | Algorithm | Time complexity | Stable? |
|---|---|---|---|
| `Arrays.sort(primitiveArray)` | **Dual-Pivot Quicksort** | O(n log n) average, **O(n²) worst case** (rare, but possible with adversarial input patterns) | **No** — irrelevant for primitives anyway (no "identity" beyond value) |
| `Arrays.sort(Object[])` / `Collections.sort()` / `List.sort()` | **TimSort** (a hybrid of merge sort + insertion sort, adaptive to already-sorted runs) | **O(n log n) guaranteed worst case** | **Yes** — stable |

**Why the difference?** Primitives have no notion of "identity" beyond their value — two `5`s are indistinguishable, so stability is meaningless and the (usually) faster, in-place Quicksort variant is used. Objects, however, are compared via `equals`/`compareTo` but might carry OTHER, non-compared fields that differentiate them — **stability preserves the relative order of elements considered "equal" by the comparator**, which matters enormously for multi-key sorts.

**Why stability matters — a concrete example:**
```java
// Sort employees by department first, then (in a SEPARATE stable sort) by salary
employees.sort(Comparator.comparing(e -> e.salary));       // sort #1: by salary
employees.sort(Comparator.comparing(e -> e.department));   // sort #2: by department
// BECAUSE the sort is STABLE, employees with the SAME department retain their salary-sorted
// relative order from sort #1! This "sort by least significant key first" trick ONLY works
// correctly with a stable sort — an unstable sort could scramble the salary ordering within
// each department group.
```

---

## 9.6 Lambda-based Comparators — common patterns cheat sheet

```java
// Sort strings by length
list.sort((a, b) -> a.length() - b.length());
list.sort(Comparator.comparingInt(String::length));            // cleaner, method-reference style

// Sort by length, then alphabetically for ties
list.sort(Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder()));

// Sort a Map's entries by value, descending (a VERY common interview pattern)
map.entrySet().stream()
   .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
   .forEach(e -> System.out.println(e.getKey() + "=" + e.getValue()));

// Sort a custom object by multiple fields, mixing ascending/descending
list.sort(Comparator.comparing(Person::getAge)
                     .thenComparing(Person::getName, Comparator.reverseOrder()));
```

---

## 🚩 Common Traps Recap (Phase 9)

1. `this.field - other.field` in `compareTo`/`compare` can silently overflow — always prefer `Integer.compare(a, b)` / `Double.compare(a, b)`.
2. `Arrays.sort(primitiveArray)` has no `Comparator` overload — box the array (or sort-then-reverse) to sort descending.
3. `TreeSet`/`TreeMap` rely on `compareTo`, not `equals` — an inconsistent `compareTo` (one that says `0` for objects that aren't `.equals()`) silently drops "duplicates" that aren't really equal.
4. Primitive array sort (Dual-Pivot Quicksort) is NOT stable and has O(n²) worst case; Object sort (TimSort) IS stable and guarantees O(n log n) worst case.
5. `Comparable` gives exactly one ordering per class; use `Comparator` whenever you need more than one, or can't touch the class's source.

## ❓ Rapid-Fire Q&A

**Q: Why does Java use different sorting algorithms for primitive arrays vs object arrays?**
A: Primitives have no meaningful "stability" concept and benefit from the raw speed of an in-place Dual-Pivot Quicksort. Objects are typically sorted by a subset of their fields (via `compareTo`/`Comparator`), so preserving the relative order of "equal" elements (stability) matters — TimSort guarantees that, plus a better worst-case bound.

**Q: What's wrong with `Comparator<Person> c = (a, b) -> a.getAge() - b.getAge();`?**
A: If ages can be near `Integer.MIN_VALUE`/`MAX_VALUE` (unlikely for ages specifically, but the pattern generalizes to any int-subtraction comparator), the subtraction can overflow and silently produce an incorrect sign, corrupting the sort order. Use `Integer.compare(a.getAge(), b.getAge())` instead.

**Q: You need to sort a list of Strings by length, and alphabetically for ties. Write the comparator.**
A: `Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder())`.

**Q: You have a `Comparable` class where `compareTo` treats two objects as equal (`0`) but `equals()` says they're different. What real-world collection behavior breaks because of this?**
A: A `TreeSet`/`TreeMap` will treat them as duplicates and silently reject/overwrite one, even though a `HashSet`/`HashMap` (which uses `equals`/`hashCode`, unaffected by `compareTo`) would correctly keep both as distinct entries.
