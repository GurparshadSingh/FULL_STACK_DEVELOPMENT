# The Complete Java + DSA Interview Handbook
### One-stop reference — built from your `Java_DSA_Interview_Syllabus.docx`, expanded with every edge case, gotcha, and "why" behind the "what."

> **How to use this handbook:** Every file below is self-contained and heavily commented. Each topic follows the same pattern:
> **Theory → How it really works internally → Code with real (non-trivial) examples → Edge cases / gotchas → Common interview traps → Rapid-fire Q&A.**
> Read in order the first time. After that, use the "Common Traps" and "Rapid-fire Q&A" sections at the end of each file as revision flashcards the night before an interview.

---

## 📂 File Map

| # | File | Covers (Syllabus Phase) | Priority |
|---|------|--------------------------|----------|
| 01 | `01_Java_Fundamentals.md` | Basics, JDK/JRE/JVM, data types, casting, operators, control flow, I/O (Phase 1) | 🔥🔥🔥 |
| 02 | `02_Arrays_and_Strings.md` | Arrays, 2D arrays, Strings, String Pool, StringBuilder/Buffer (Phase 2) | 🔥🔥🔥🔥🔥 |
| 03 | `03_Methods_and_Recursion.md` | Methods, overloading, pass-by-value, recursion, call stack (Phase 3) | 🔥🔥🔥🔥🔥 |
| 04 | `04_OOP_Complete_Guide.md` | Classes, constructors, encapsulation, inheritance, polymorphism, abstraction, interfaces (Phase 4) | 🔥🔥🔥🔥🔥 |
| 05 | `05_Object_Class_Memory_Static_Final.md` | Object methods, equals/hashCode, pass-by-value deep dive, static, final, immutability, memory model (Phase 5) | 🔥🔥🔥🔥 |
| 06 | `06_Exception_Handling.md` | Throwable hierarchy, try/catch/finally, checked vs unchecked, custom exceptions (Phase 6) | 🔥🔥🔥 |
| 07 | `07_Collections_Framework_Complete.md` | Full Collections hierarchy, ArrayList, LinkedList, HashSet, HashMap internals, Queue, Deque, Stack, PriorityQueue, TreeMap/TreeSet (Phase 7) | 🔥🔥🔥🔥🔥 |
| 08 | `08_Generics_Wrappers_Autoboxing.md` | Generics, bounded types, wildcards, type erasure, wrapper classes, autoboxing (Phase 8) | 🔥🔥🔥🔥 |
| 09 | `09_Comparable_Comparator_Sorting.md` | Comparable vs Comparator, sorting algorithms used internally, lambda comparators (Phase 9) | 🔥🔥🔥🔥 |
| 10 | `10_Bit_Manipulation.md` | Bitwise ops, tricks, XOR patterns, set bits (Phase 10) | 🔥🔥🔥🔥🔥 |
| 11 | `11_Math_for_DSA.md` | Math class, GCD/LCM, primes, Sieve, modular arithmetic, fast power (Phase 11) | 🔥🔥🔥 |
| 12 | `12_Modern_Java_Lambda_Streams.md` | Lambdas, method references, Streams, Optional (Phase 12) | 🔥🔥 |
| 13 | `13_Multithreading_Enums_InnerClasses_Misc.md` | Threads, synchronized, race conditions, deadlock, enums, inner/anonymous classes, records, reflection, serialization (Phase 13) | 🔥🔥 / 🔥 |
| 14 | `14_DSA_Arrays_Strings_Hashing_TwoPointers_SlidingWindow.md` | Core array/string patterns, hashing, two pointers, sliding window | 🔥🔥🔥🔥🔥 |
| 15 | `15_DSA_LinkedList_Stack_Queue_Deque_BinarySearch.md` | Linked list patterns, stack/queue/deque patterns, binary search variants | 🔥🔥🔥🔥🔥 |
| 16 | `16_DSA_Recursion_Backtracking_Trees_BST_Heaps.md` | Recursion patterns, backtracking, trees, BST, heaps | 🔥🔥🔥🔥 |
| 17 | `17_DSA_Greedy_Graphs_Trie_DP.md` | Greedy, graph algorithms (BFS/DFS/shortest path/MST/topo sort), Trie, Dynamic Programming | 🔥🔥🔥🔥 |
| 18 | `18_Master_Cheatsheet_Common_Mistakes_FAQ.md` | Cross-topic cheat sheet, complexity tables, the mistakes every candidate makes, curveball questions | Read last, night before interview |

---

## 🎯 Suggested Study Order (matches your syllabus's own priority guide)

1. **Foundation first (files 01–06):** You cannot skip these — every DSA answer is expressed in this vocabulary.
2. **Collections is the single highest-leverage file (07):** A huge fraction of "explain your code" follow-ups come from here. Do not rush it.
3. **Generics, Comparable/Comparator, Bit Manipulation, Math (08–11):** These directly power DSA code quality.
4. **Modern Java + Multithreading (12–13):** Enough to read/write modern code and survive a "have you used threads" question — not a systems-design-level deep dive.
5. **DSA files (14–17):** Apply everything above. Each pattern file assumes you've read 01–11.
6. **File 18 the night before:** Pure recall — no new concepts, just triggers for what you already know.

## 🧭 Principle used throughout this handbook

> **Don't just memorize *what* a method does — know *why* it behaves that way, and what breaks if you assume otherwise.**
> Interviewers rarely ask "what does `HashMap.put()` do." They ask "what happens if two keys hash to the same bucket," or "why did your `HashSet` let in a duplicate," or "why does this recursive function stack-overflow at n=10,001 but not n=10." This handbook is written to answer *that* class of question.

Good luck. Start with `01_Java_Fundamentals.md`.
