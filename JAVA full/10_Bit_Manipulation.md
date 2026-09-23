# 10. Bit Manipulation 🔥🔥🔥🔥🔥

---

## 10.1 Two's Complement — the foundation of EVERYTHING here

Java integers are stored in **two's complement** binary representation. For a 32-bit `int`:
- Positive numbers: normal binary.
- Negative numbers: invert all bits of the positive value and add 1.

```java
System.out.println(Integer.toBinaryString(5));    // "101"
System.out.println(Integer.toBinaryString(-5));    // "11111111111111111111111111111011" (32 bits, sign bit=1)
```
**Why two's complement:** it makes addition/subtraction work identically for positive and negative numbers using the SAME circuit (no special-casing subtraction), and there's exactly **one representation of zero** (unlike sign-magnitude, which has both `+0` and `-0`).
**The most negative value has no positive counterpart:** `Integer.MIN_VALUE` = -2147483648, but `Math.abs(Integer.MIN_VALUE)` still returns **-2147483648** (overflow — the "positive" 2147483648 doesn't fit in an `int`)! This is a genuine, frequently-tested edge case.

---

## 10.2 The Operators — precise semantics

| Op | Name | Behavior |
|---|---|---|
| `&` | AND | 1 only if both bits are 1 |
| `\|` | OR | 1 if either bit is 1 |
| `^` | XOR | 1 if bits DIFFER |
| `~` | NOT | flips every bit (`~x` == `-x - 1`, a direct consequence of two's complement) |
| `<<` | left shift | shifts bits left, fills with 0 on the right — equivalent to `× 2ⁿ` (can overflow silently!) |
| `>>` | signed (arithmetic) right shift | shifts right, fills with the **sign bit** (preserves negativity) — equivalent to `÷ 2ⁿ` rounding toward negative infinity |
| `>>>` | unsigned (logical) right shift | shifts right, **always fills with 0** — treats the value as an unsigned bit pattern (Java-specific, no C equivalent) |

```java
System.out.println(-1 >> 1);    // -1  (sign-extends: all 1s stay all 1s)
System.out.println(-1 >>> 1);   // 2147483647 (0x7FFFFFFF) — fills with 0s, reinterprets as unsigned
System.out.println(1 << 31);    // -2147483648 — shifts the 1 into the SIGN bit position -> becomes MIN_VALUE!
System.out.println(1 << 32);    // 1, NOT 0!  Shift amounts for int are taken MOD 32 (only low 5 bits of the
                                  // shift count are used) — shifting by 32 is the same as shifting by 0.
```

---

## 10.3 Odd/Even Check

```java
boolean isOdd = (n & 1) == 1;      // faster than n % 2 != 0, and correctly handles negative n too
// Why it works: the LAST BIT of any binary integer is 1 iff the number is odd, regardless of sign,
// because two's complement negative numbers still have a well-defined last bit.
```
**Gotcha with `%` on negatives (revisited from file 01):** `-3 % 2` is `-1` in Java (not `1`), so `n % 2 == 1` INCORRECTLY reports `-3` as "not odd." `(n & 1) == 1` handles this correctly since it only inspects the bit pattern.

---

## 10.4 Get / Set / Clear / Toggle a Specific Bit

```java
int n = 0b1010;   // 10 in binary

// GET bit at position i (0-indexed from the right)
boolean isSet = ((n >> i) & 1) == 1;

// SET bit at position i (force it to 1)
n = n | (1 << i);

// CLEAR bit at position i (force it to 0)
n = n & ~(1 << i);

// TOGGLE bit at position i (flip it)
n = n ^ (1 << i);
```
**Why these work — build the mask, then apply it:**
- `1 << i` produces a mask with exactly ONE bit set at position `i`.
- OR-ing with that mask can only ever turn a bit ON (never off) — perfect for SET.
- AND-ing with the COMPLEMENT of that mask (`~(1 << i)` — all 1s except position `i`) can only turn a bit OFF — perfect for CLEAR.
- XOR-ing with the mask flips exactly that bit — perfect for TOGGLE (since `x ^ 1 = !x` and `x ^ 0 = x`).

---

## 10.5 `n & (n - 1)` — turns off the LOWEST set bit — the single most useful bit trick

```java
System.out.println(Integer.toBinaryString(12));         // 1100
System.out.println(Integer.toBinaryString(12 & 11));    // 12 & (12-1)=11(1011) = 1000 (8) — lowest set bit cleared!
```
**Why it works:** subtracting 1 flips all the trailing zero bits to 1s AND flips the lowest set bit to 0. ANDing this with the original number keeps everything above the lowest set bit unchanged, but zeroes out that lowest set bit and everything below it (which was already 0 anyway).

**Direct application #1 — check power of two:**
```java
static boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;      // a power of 2 has EXACTLY one set bit; clearing it leaves 0
}
// n > 0 guard is essential: n=0 gives (0 & -1) == 0 which would WRONGLY pass without this check
```

**Direct application #2 — count set bits (Hamming Weight), Brian Kernighan's algorithm, O(number of set bits):**
```java
static int countSetBits(int n) {
    int count = 0;
    while (n != 0) {
        n = n & (n - 1);   // clears the lowest set bit each iteration
        count++;
    }
    return count;
}
// Built-in alternative: Integer.bitCount(n) — O(1)-ish (uses SWAR/parallel bit tricks internally), prefer this in practice
```

---

## 10.6 `n & (-n)` — isolates the LOWEST set bit (keeps only that one bit, clears everything else)

```java
System.out.println(Integer.toBinaryString(12 & -12));   // 12 = 1100, -12 = ...110100 -> AND = 100 (4)
```
**Why it works:** `-n` in two's complement is `~n + 1`. Every bit above the lowest set bit of `n` gets inverted by `~n`, then the `+1` propagates a carry that re-flips everything back UP TO AND INCLUDING the lowest set bit — leaving only that bit surviving the AND with the original `n`. This is heavily used in **Binary Indexed Trees (Fenwick Trees)** for `O(log n)` prefix-sum updates/queries — a great fact to mention if the interview goes into advanced data structures.

---

## 10.7 XOR — the "magic" operator and its core properties

```
a ^ a = 0        (anything XORed with itself cancels to zero)
a ^ 0 = a        (identity element)
a ^ b = b ^ a    (commutative)
(a ^ b) ^ c = a ^ (b ^ c)   (associative)
```
These four properties alone unlock a huge family of interview questions:

### Find the single non-repeating element (every other element appears exactly twice)
```java
static int singleNumber(int[] nums) {
    int result = 0;
    for (int n : nums) result ^= n;    // all PAIRED elements cancel out (a^a=0); the lone survivor remains
    return result;
}
```

### Find two non-repeating elements (every other element appears exactly twice)
```java
static int[] singleNumberTwo(int[] nums) {
    int xorAll = 0;
    for (int n : nums) xorAll ^= n;                 // xorAll = a ^ b (the two unique numbers), since pairs cancel
    int diffBit = xorAll & (-xorAll);                // isolate ANY bit where a and b differ (lowest set bit trick from 10.6)
    int a = 0, b = 0;
    for (int n : nums) {
        if ((n & diffBit) != 0) a ^= n;              // partition into two groups based on that differing bit
        else b ^= n;                                  // each group independently cancels its OWN pairs, leaving a and b separately
    }
    return new int[]{a, b};
}
```
**The key insight to explain out loud:** since `a != b`, there must be at least one bit where they differ; using that bit to partition the array guarantees `a` and `b` land in DIFFERENT groups, while every duplicate pair (which is identical, so shares every bit) always lands together in the SAME group — letting XOR cancel them out cleanly within each group.

### Swap two integers without a temp variable (and its landmine)
```java
a = a ^ b;
b = a ^ b;    // b becomes original a
a = a ^ b;    // a becomes original b
```
**⚠ CRITICAL PITFALL:** if `a` and `b` are actually **the same variable / same array index** (e.g., `arr[i]` and `arr[i]`, or you accidentally call `swap(arr, i, i)`), this XOR-swap **zeroes out the value entirely**! `x ^ x = 0`, so all three lines just XOR zero with itself, destroying the data. **A plain temp-variable swap has NO such edge case — many senior interviewers consider the XOR-swap trick a red flag / premature-optimization anti-pattern in real production code specifically because of this landmine**, even though it's fun to know for trivia purposes.

### Check if two integers have opposite signs
```java
static boolean oppositeSigns(int a, int b) {
    return (a ^ b) < 0;   // if signs differ, the XOR's sign bit (bit 31) will be 1, making the result negative
}
```

---

## 10.8 Multiply/Divide by Powers of Two via Shifts

```java
int x = 5;
System.out.println(x << 1);   // 10  (x * 2)
System.out.println(x << 3);   // 40  (x * 2^3 = x * 8)
System.out.println(x >> 1);   // 2   (x / 2, truncated toward negative infinity, NOT toward zero for negatives!)
```
**Negative-number division gotcha:** `-5 >> 1` = `-3` (rounds toward negative infinity), but `-5 / 2` in normal integer division = `-2` (rounds toward zero). **These are NOT interchangeable for negative numbers** — a genuinely common bug if you optimize `/2` into `>>1` without checking the sign.

---

## 10.9 Bitmasking for Subsets (Bitmask DP foundation — used heavily in file 17)

```java
int n = 4;                                  // 4 elements: represent every subset as an n-bit number
for (int mask = 0; mask < (1 << n); mask++) {   // iterate all 2^n subsets
    List<Integer> subset = new ArrayList<>();
    for (int i = 0; i < n; i++) {
        if ((mask & (1 << i)) != 0) subset.add(i);   // bit i set -> element i is IN this subset
    }
    System.out.println(subset);
}
```
This "iterate 0 to 2ⁿ-1, check each bit" pattern is the standard way to enumerate subsets/represent visited-state combinations, and underlies **Bitmask Dynamic Programming** (e.g., Traveling Salesman DP, "assign tasks to workers" DP) — see file 17.

---

## 🚩 Common Traps Recap (Phase 10)

1. `Math.abs(Integer.MIN_VALUE)` still returns a negative number — no positive counterpart fits in 32 bits.
2. `>>` sign-extends (preserves negativity); `>>>` always fills with zero — mixing these up silently breaks negative-number logic.
3. Shift amounts for `int` wrap modulo 32 (`1 << 32` == `1 << 0`) — a genuine, surprising JLS rule.
4. `(n & (n-1)) == 0` needs an explicit `n > 0` guard, since it also (incorrectly) passes for `n == 0`.
5. `>> 1` and `/ 2` diverge for negative numbers (floor vs. truncate-toward-zero).
6. The XOR-swap trick catastrophically fails (zeroes the value) if both operands are the same variable/array slot.

## ❓ Rapid-Fire Q&A

**Q: How do you check if a number is a power of two, in O(1)?**
A: `n > 0 && (n & (n - 1)) == 0` — a power of two has exactly one set bit, and that trick clears the lowest set bit, leaving zero only when there was exactly one to begin with.

**Q: Explain `n & -n` and one real use case.**
A: It isolates the lowest set bit of `n`, because `-n` (two's complement negation) is `~n + 1`, and the `+1` carry re-flips bits only up to and including the lowest set bit of the original `n`. Used in Fenwick Trees (Binary Indexed Trees) to navigate parent/child indices in O(log n).

**Q: Given an array where every element appears twice except one, find the unique one in O(n) time and O(1) space.**
A: XOR every element together — all paired duplicates cancel to zero via `a^a=0`, leaving only the unique element.

**Q: Why is XOR-based swapping considered risky in production code despite being "clever"?**
A: It silently zeroes the value if both operands alias the same memory location (same variable or same array index passed twice), a bug a plain temp-variable swap can never have — the cleverness isn't worth the fragility for real code.
