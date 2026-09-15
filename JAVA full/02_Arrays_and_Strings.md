# 02. Arrays & Strings 🔥🔥🔥🔥🔥

---

## PART A — ARRAYS

### 2.1 Fundamentals

Arrays in Java are **objects** (even arrays of primitives!) allocated on the **heap**, with a fixed size decided at creation time.

```java
int[] arr1;                       // declaration only — arr1 is null
arr1 = new int[5];                 // allocation — all elements default to 0
int[] arr2 = {1, 2, 3, 4, 5};      // declaration + initialization (array literal — only at declaration!)
int[] arr3 = new int[]{1, 2, 3};   // equivalent explicit form — usable anywhere, not just at declaration

int[] a, b;      // both a and b are int[]
int c[], d;      // ⚠ TRAP: only c is int[]; d is a plain int! (C-style trailing bracket applies per-variable)
```

**Default values on array creation** (same rule as fields, since array elements behave like fields):
| Type | Default |
|---|---|
| numeric (`int`, `double`...) | `0` / `0.0` |
| `boolean` | `false` |
| `char` | `'\u0000'` |
| reference type (`String[]`, `Object[]`) | `null` |

**Arrays know their own length** via the `.length` **field** (not a method! No parentheses — `arr.length`, not `arr.length()`. Contrast with `String.length()` which **is** a method — a classic mix-up trap).

### 2.2 Traversal, Search, Update

```java
int[] arr = {10, 20, 30, 40, 50};

// Classic for — use when you need the index
for (int i = 0; i < arr.length; i++) {
    System.out.println(i + " -> " + arr[i]);
}

// Enhanced for — cleaner, but you lose the index and CANNOT mutate arr through it
for (int val : arr) {
    // val = val * 2;   // this reassigns the loop variable copy, NOT the array!
}

// Update requires the index form:
for (int i = 0; i < arr.length; i++) arr[i] *= 2;   // works — mutates the real array

// Linear search
int target = 30, index = -1;
for (int i = 0; i < arr.length; i++) {
    if (arr[i] == target) { index = i; break; }
}
```

**ArrayIndexOutOfBoundsException** — arrays never auto-resize, and there is **no bounds-check bypass**:
```java
int[] a = new int[3];
a[3] = 10;     // ArrayIndexOutOfBoundsException: Index 3 out of bounds for length 3
a[-1] = 10;    // ArrayIndexOutOfBoundsException: Index -1 out of bounds for length 3
```

### 2.3 Passing / Returning Arrays — reference semantics

Arrays are **objects**, so they're passed **by reference value** (the reference is copied, but it points to the same array in heap memory):
```java
static void modify(int[] arr) {
    arr[0] = 999;          // mutates the CALLER's array — visible after the call
    arr = new int[]{1,2};  // reassigns the LOCAL copy of the reference only — caller's reference is untouched
}

public static void main(String[] args) {
    int[] data = {1, 2, 3};
    modify(data);
    System.out.println(data[0]);       // 999 — mutation is visible
    System.out.println(data.length);   // 3   — reassignment inside modify() did NOT affect caller
}
```
This exact behavior — **mutation visible, reassignment not** — is the single most tested "pass-by-value vs pass-by-reference" trap in Java and applies identically to all objects (see file 05 for the full theory).

### 2.4 Copying Arrays — five ways, and why naive assignment fails

```java
int[] original = {1, 2, 3};

int[] wrong = original;               // ❌ NOT a copy — both variables point to the SAME array object!
wrong[0] = 99;
System.out.println(original[0]);      // 99 — original was mutated too!

int[] copy1 = original.clone();                                  // ✅ shallow copy, new array object
int[] copy2 = Arrays.copyOf(original, original.length);          // ✅ can also resize (pad with 0/null or truncate)
int[] copy3 = Arrays.copyOfRange(original, 1, 3);                 // ✅ copy a sub-range [from, to)
int[] copy4 = new int[original.length];
System.arraycopy(original, 0, copy4, 0, original.length);         // ✅ fastest — native method
```
**`clone()` is only a SHALLOW copy** — for a 2D array (`int[][]`) or `Object[]`, cloning copies the outer array but the inner arrays/objects are still **shared references**:
```java
int[][] matrix = {{1,2},{3,4}};
int[][] shallow = matrix.clone();
shallow[0][0] = 999;
System.out.println(matrix[0][0]);   // 999 — inner row arrays are shared! clone() didn't go deep.
```

### 2.5 The `Arrays` Utility Class

```java
int[] arr = {5, 3, 8, 1, 9};

Arrays.sort(arr);                          // in-place, ascending, Dual-Pivot Quicksort for primitives — O(n log n) avg
Arrays.sort(arr, 1, 4);                    // sort only the sub-range [1,4)
Arrays.fill(arr, 0);                       // fill entire array with 0
Arrays.fill(arr, 1, 3, 7);                 // fill sub-range [1,3) with 7
int[] copy = Arrays.copyOf(arr, 10);       // pads with default value (0) if new length > old
boolean eq = Arrays.equals(arr, copy);     // element-wise equality (== on array refs alone is always identity!)
String s = Arrays.toString(arr);           // "[5, 3, 8, 1, 9]" — readable printing
int idx = Arrays.binarySearch(arr, 8);     // ⚠ ARRAY MUST BE SORTED FIRST or result is UNDEFINED (not necessarily -1!)
```

**`Arrays.binarySearch` on an unsorted array does NOT throw — it just silently returns garbage.** This is a favorite "spot the bug" question.

**`==` vs `.equals()` vs `Arrays.equals()` vs `Arrays.deepEquals()` for arrays:**
```java
int[] a1 = {1,2,3};
int[] a2 = {1,2,3};
System.out.println(a1 == a2);              // false — different objects
System.out.println(a1.equals(a2));         // false! Array does NOT override equals() — it's the default Object.equals() = reference check
System.out.println(Arrays.equals(a1, a2)); // true — element-wise, 1D only
int[][] m1 = {{1,2}};
int[][] m2 = {{1,2}};
System.out.println(Arrays.equals(m1, m2));      // false — compares inner array REFERENCES (shallow), which differ!
System.out.println(Arrays.deepEquals(m1, m2));  // true — recursively compares nested arrays
```

**`Arrays.asList()` — the fixed-size backing-array trap:**
```java
Integer[] arr = {1, 2, 3};
List<Integer> list = Arrays.asList(arr);
list.set(0, 99);         // OK — mutates arr[0] too! (list is a VIEW backed by arr)
list.add(4);              // UnsupportedOperationException — fixed size, can't grow!
// To get a real mutable, independent list:
List<Integer> real = new ArrayList<>(Arrays.asList(arr));
```
Also note: `Arrays.asList(1, 2, 3)` with **primitive int varargs** is a trap:
```java
int[] primArr = {1, 2, 3};
List list = Arrays.asList(primArr);   // List<int[]> with ONE element (the whole array)! NOT List<Integer>.
// Because generics require reference types — int[] itself is treated as a single Object.
```

### 2.6 2D Arrays / Matrices

```java
int[][] matrix = new int[3][4];           // 3 rows, 4 cols, all rectangular, all zero-initialized
int[][] literal = {{1,2,3},{4,5,6}};      // row-major initialization

// Traversal
for (int i = 0; i < matrix.length; i++) {           // matrix.length = number of ROWS
    for (int j = 0; j < matrix[i].length; j++) {    // matrix[i].length = number of COLUMNS in row i
        System.out.print(matrix[i][j] + " ");
    }
}
```

**Jagged arrays** — Java 2D arrays are really "arrays of arrays," so rows can have **different lengths**:
```java
int[][] jagged = new int[3][];      // only declares 3 row-references, each null initially
jagged[0] = new int[2];
jagged[1] = new int[5];
jagged[2] = new int[1];
// jagged[i].length differs per row — THIS is why you always loop with matrix[i].length, never matrix[0].length
```

**Column traversal / transpose (common interview task):**
```java
static int[][] transpose(int[][] m) {
    int rows = m.length, cols = m[0].length;
    int[][] t = new int[cols][rows];
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            t[j][i] = m[i][j];
    return t;
}
```

**Spiral traversal pattern** (classic FAANG question — memorize the 4-boundary technique):
```java
static List<Integer> spiralOrder(int[][] m) {
    List<Integer> result = new ArrayList<>();
    if (m.length == 0) return result;
    int top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;
    while (top <= bottom && left <= right) {
        for (int j = left; j <= right; j++) result.add(m[top][j]);
        top++;
        for (int i = top; i <= bottom; i++) result.add(m[i][right]);
        right--;
        if (top <= bottom) {                               // guard: row might be exhausted
            for (int j = right; j >= left; j--) result.add(m[bottom][j]);
            bottom--;
        }
        if (left <= right) {                                // guard: column might be exhausted
            for (int i = bottom; i >= top; i--) result.add(m[i][left]);
            left++;
        }
    }
    return result;
}
```

### 2.7 Array covariance and `ArrayStoreException` (advanced, rarely known)

```java
Object[] objArr = new String[3];       // legal! arrays are covariant — String[] IS-A Object[]
objArr[0] = "hello";                   // fine
objArr[1] = 42;                        // compiles (Integer autoboxed to Object) but THROWS at RUNTIME:
                                        // ArrayStoreException — the actual runtime array is String[], can't hold an Integer
```
This is why generics (file 08) use **erasure + no covariant array-like footgun** — `List<Object> l = new ArrayList<String>();` doesn't even **compile**, which is strictly safer than what raw arrays allow.

---

## PART B — STRINGS

### 2.8 String Creation & Immutability

```java
String s1 = "hello";                 // String literal — goes into the String Constant Pool (SCP)
String s2 = new String("hello");     // forces a NEW object on the heap, outside the pool (as of the object itself)
```

**Why Strings are immutable (a "why" question, not just "what"):**
1. **String Pool sharing** — if Strings were mutable, changing one literal would corrupt every other variable pointing at the same pooled instance.
2. **Security** — Strings are used for class names, file paths, network connections, DB URLs; immutability prevents them being altered after a security check but before use (TOCTOU attacks).
3. **Thread safety** — immutable objects are automatically safe to share across threads with no synchronization.
4. **Hashcode caching** — since content can't change, `String.hashCode()` is computed once and cached — crucial for `HashMap` performance since Strings are extremely common keys.
5. **Safe for `HashMap`/`HashSet` keys** — a mutable key could change its hash after insertion, corrupting the bucket it lives in (silently unfindable).

**Internally:** every "mutating" String method returns a **brand-new** String object; the original is untouched.
```java
String s = "hello";
s.toUpperCase();
System.out.println(s);              // still "hello" — return value was discarded!
s = s.toUpperCase();
System.out.println(s);              // "HELLO" — now reassigned
```

### 2.9 The String Constant Pool — draw this out if asked

```java
String a = "java";              // put in SCP (or reused if already there)
String b = "java";              // SAME reference as `a` — pool lookup finds existing "java"
String c = new String("java");  // NEW object on heap, separate from the pool
String d = c.intern();          // explicitly pulls/returns the POOLED reference matching c's content

System.out.println(a == b);        // true  — both point to the same pooled literal
System.out.println(a == c);        // false — c is a distinct heap object
System.out.println(a == d);        // true  — intern() returned the pool reference
System.out.println(a.equals(c));   // true  — content is equal regardless of reference identity
```

**Compile-time constant folding** (a sneaky variant of the above):
```java
String e = "jav" + "a";          // compiler folds this into "java" AT COMPILE TIME (constant expression)
System.out.println(a == e);      // true! because e is treated as a literal by the compiler

String part = "jav";
String f = part + "a";           // NOT a compile-time constant (part is a variable) -> built at RUNTIME with StringBuilder
System.out.println(a == f);      // false — f is a new heap object, not pooled automatically

final String part2 = "jav";      // `final` + compile-time-known value -> IS treated as a constant!
String g = part2 + "a";
System.out.println(a == g);      // true — `final` locals with constant values ARE folded by javac
```

### 2.10 `==` vs `.equals()` vs `.compareTo()`

| | Compares | For Strings |
|---|---|---|
| `==` | reference identity (memory address) | true only if same object (pool hit or intentional reuse) |
| `.equals()` | content, character by character | the CORRECT way to check string equality |
| `.equalsIgnoreCase()` | content ignoring case | |
| `.compareTo()` | lexicographic order, returns int (negative/0/positive) — difference of first mismatching char codes, or length difference if one is a prefix of the other | used for sorting |

```java
System.out.println("apple".compareTo("apply"));  // negative — 'e'(101) - 'y'(121) = -20
System.out.println("apple".compareTo("app"));    // positive — "apple".length() - "app".length() = 2
```

### 2.11 Concatenation — performance trap

```java
String result = "";
for (int i = 0; i < 10000; i++) {
    result += i;     // ⚠ creates a BRAND NEW String object every single iteration — O(n²) overall!
}
// Because Strings are immutable, `result += i` is really `result = new String(result + i)` each time,
// copying the entire growing string each iteration.
```
**Fix: use `StringBuilder` inside loops** (see 2.13) — this single fact is asked in nearly every Java performance-focused interview.

**Note:** a single-line `"a" + "b" + "c" + variable` is compiled by javac into ONE efficient `StringBuilder` chain automatically — the O(n²) trap is specifically about concatenation **inside a loop**, across iterations, not about a single expression.

### 2.12 Common String Methods (the ones people forget the exact behavior of)

```java
String s = "  Hello World  ";

s.length();                  // 15 (includes the spaces!) — method, unlike array's .length field
s.trim();                    // "Hello World" — removes ASCII whitespace <= '\u0020' from both ends only
s.strip();                   // (Java 11+) Unicode-aware trim — prefer this over trim() for i18n text
s.charAt(1);                 // 'H' — index 1 (0 is the leading space)
s.charAt(15);                // StringIndexOutOfBoundsException — valid indices are 0..length-1
s.indexOf('o');              // first occurrence index, or -1 if not found
s.lastIndexOf('o');
s.substring(2, 7);           // "Hello" — start inclusive, end EXCLUSIVE. substring(2,7) means chars[2..6]
s.substring(2);              // from index 2 to the end
s.substring(2, 2);           // "" — empty string, legal (start == end)
s.substring(7, 2);           // StringIndexOutOfBoundsException — start > end is illegal
s.replace('o', '0');         // replaces ALL occurrences of a CHAR (or literal CharSequence) — not regex
s.replaceAll("[aeiou]", "*");// regex-based replace-all
s.replaceFirst("o", "0");    // regex-based, first match only
s.split(" ");                // String[] — splits by regex delimiter
s.toCharArray();             // char[] copy of the string's characters
s.contains("World");
s.startsWith("He" /* trim first if leading spaces matter */);
s.endsWith("ld");
String.join("-", "a", "b", "c");   // "a-b-c"
s.toLowerCase(); s.toUpperCase();
s.isEmpty();                 // length() == 0
s.isBlank();                 // (Java 11+) true if empty OR only whitespace
s.repeat(3);                 // (Java 11+) "abcabcabc" for s="abc"
s.chars();                   // IntStream of char codes — for Stream-based processing (see file 12)
```

**`substring` internal history (an advanced "gotcha" question interviewers use to filter candidates who read internals):**
- **Java 6 and earlier:** `substring()` shared the SAME underlying `char[]` as the original string, just with different `offset`/`count` fields — O(1) but risked **memory leaks** (a tiny substring of a huge string kept the entire huge `char[]` alive).
- **Java 7 onward:** `substring()` **copies** the relevant characters into a new `char[]` — O(n) but no memory-leak risk. **If asked "does substring cause memory leaks in Java," the correct modern answer is NO (post-Java 7), but you should mention the historical behavior to show depth.**

**`split()` trailing-empty-string trap:**
```java
String s = "a,b,c,,,";
System.out.println(s.split(",").length);       // 3 — ["a","b","c"]  trailing empty strings are DROPPED by default!
System.out.println(s.split(",", -1).length);   // 6 — ["a","b","c","","",""]  negative limit KEEPS trailing empties
```

**Regex special characters must be escaped when used as literal split delimiters:**
```java
"a.b.c".split(".");        // returns EMPTY array / all-empty! "." is regex "any character" -> splits after every char
"a.b.c".split("\\.");      // correct — escaped dot splits on literal '.'
```

### 2.13 StringBuilder — the mutable string workhorse

```java
StringBuilder sb = new StringBuilder();       // default capacity 16
sb.append("Hello");
sb.append(" ").append("World");               // chainable — each method returns `this`
sb.insert(5, ",");                            // "Hello, World"
sb.deleteCharAt(0);                           // "ello, World"
sb.delete(0, 2);                              // removes range [0,2) -> "lo, World"
sb.reverse();                                 // reverses in place
sb.setCharAt(0, 'X');                         // mutate a single char
sb.replace(0, 2, "AB");                       // replace range [0,2) with "AB"
sb.charAt(0);
sb.length();                                  // current length (method, since StringBuilder is not an array)
sb.setLength(0);                              // TRICK to "clear" a StringBuilder cheaply
String result = sb.toString();                // convert back to an immutable String at the end
```
**Capacity growth internals:** default capacity 16 chars. When it overflows, capacity typically grows to `(oldCapacity * 2) + 2`. If you know the target size upfront, `new StringBuilder(expectedSize)` avoids repeated internal array copying — a performance-tuning answer worth knowing.

### 2.14 StringBuilder vs StringBuffer vs String — the comparison table

| | `String` | `StringBuilder` | `StringBuffer` |
|---|---|---|---|
| Mutability | Immutable | Mutable | Mutable |
| Thread-safe | Yes (immutability implies safety) | **No** | **Yes** — methods are `synchronized` |
| Performance | Slow for repeated modification | **Fastest** for single-threaded modification | Slower than StringBuilder (sync overhead) |
| Introduced | JDK 1.0 | JDK 1.5 | JDK 1.0 |
| When to use | Fixed/rarely-changing text, HashMap keys | Loops, single-threaded string building (**default choice**) | Multiple threads mutate the SAME buffer concurrently (rare in modern code — usually you'd use thread-confinement instead) |

**Interview one-liner:** *"Use `StringBuilder` unless you specifically need thread-safety on a shared mutable buffer, in which case use `StringBuffer` — but in modern code, prefer confining a `StringBuilder` to one thread over sharing a `StringBuffer`."*

---

## 🚩 Common Traps Recap (Phase 2)

1. `array.length` is a field; `string.length()` is a method — mixing these up is an instant compile error.
2. `clone()` on 2D arrays is shallow — inner rows are still shared.
3. `Arrays.equals()` is for 1D; use `Arrays.deepEquals()` for nested arrays.
4. `Arrays.binarySearch()` on an unsorted array gives undefined garbage, not an exception.
5. `Arrays.asList()` returns a fixed-size view backed by the original array — `add()`/`remove()` throw.
6. `==` on Strings checks reference identity; pool literals may coincidentally be `==`, `new String()` never is.
7. String concatenation in a loop is O(n²) — always use `StringBuilder`.
8. `substring(start, end)` — end is exclusive; reversed args throw.
9. `split(regex)` drops trailing empty strings unless you pass a negative limit.
10. `"."`, `"|"`, `"*"` etc. are regex metacharacters — must be escaped in `split()`/`replaceAll()` for literal matches.

## ❓ Rapid-Fire Q&A

**Q: Why does `Arrays.asList(intArray)` give a `List<int[]>` instead of `List<Integer>`?**
A: Generics require a reference type parameter; varargs `T...` cannot autobox a primitive **array** element-by-element — the whole `int[]` is treated as a single `T` (`Object`), so you get a one-element list.

**Q: Is it true `substring()` never causes memory leaks in modern Java?**
A: Correct for Java 7+ (copies the underlying array). Java 6 and earlier shared the backing array, which *could* leak memory by keeping large arrays alive via a small substring.

**Q: How would you check if two Strings are equal ignoring case *and* leading/trailing whitespace, safely (no NPE)?**
A: `Objects.equals(a == null ? null : a.strip().toLowerCase(), b == null ? null : b.strip().toLowerCase())`, or more simply guard nulls first, then `a.strip().equalsIgnoreCase(b.strip())`.

**Q: What does `new String("abc") == new String("abc")` evaluate to, and why?**
A: `false` — each `new String(...)` call always allocates a brand-new heap object, regardless of pool content.

**Q: How do you reverse a String in Java?**
A: `new StringBuilder(s).reverse().toString()` — there is no built-in `String.reverse()`.
