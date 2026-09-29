# 11. Math for DSA 🔥🔥🔥

---

## 11.1 The `Math` Class — methods and their exact edge-case behavior

```java
Math.max(3, 7);        // 7
Math.min(3, 7);        // 3
Math.abs(-5);           // 5   — ⚠ Math.abs(Integer.MIN_VALUE) == Integer.MIN_VALUE (still negative! overflow, see file 10)
Math.pow(2, 10);        // 1024.0 — returns a DOUBLE, even for integer-looking results! Cast/round if you need an int.
Math.sqrt(16);          // 4.0 — double; Math.sqrt(negative) = NaN (no exception thrown)
Math.ceil(4.1);         // 5.0  — rounds UP toward positive infinity
Math.floor(4.9);        // 4.0  — rounds DOWN toward negative infinity
Math.round(4.5);        // 5    — rounds HALF UP (returns long for double input, int for float input)
Math.round(-4.5);       // -4   — ⚠ NOT -5! Math.round is defined as floor(x + 0.5), so -4.5+0.5=-4.0 -> floor -> -4
```
**`Math.round(-4.5)` giving `-4` (not the "expected" -5) is a classic gotcha** — Java's rounding is NOT symmetric around zero; it's always `floor(x + 0.5)`.

```java
Math.pow(2, 62);        // returns a double — for LARGE integer powers, precision loss becomes real (double has ~15-17 sig figs)
                          // for exact integer powers of 2, prefer bit shifting: 1L << 62
```

---

## 11.2 Integer Division, Modulo, Overflow, and `long`

```java
System.out.println(7 / 2);       // 2 — truncates toward zero
System.out.println(-7 / 2);      // -3 — truncates toward zero (NOT floor! -3.5 truncates to -3, not -4)
System.out.println(Math.floorDiv(-7, 2));   // -4 — TRUE floor division, if that's what you actually want
System.out.println(Math.floorMod(-7, 2));   // 1  — always non-negative result (unlike %, which keeps dividend's sign)
```
**When to reach for `Math.floorDiv`/`Math.floorMod`:** any time you need array/grid indexing with possibly-negative values (e.g., wrapping indices in a circular buffer) — plain `/` and `%` give sign-inconsistent results that break naive modular indexing on negative inputs.

**Overflow is silent — the golden DSA rule:** if intermediate results of multiplication/addition of `int`s could exceed ~2.1 billion, **cast to `long` early**, not late:
```java
int a = 100000, b = 100000;
int overflowed = a * b;              // WRONG — overflows silently to a garbage int value
long correct = (long) a * b;          // RIGHT — cast BEFORE the multiplication happens
long stillWrong = (long)(a * b);      // ⚠ STILL WRONG — the multiplication already overflowed as int BEFORE the cast!
```
This exact "cast too late" mistake is one of the most common silent-bug sources in competitive programming and coding interviews (classic culprits: computing `n*(n+1)/2`, mid-point calculations, area/volume calculations with large inputs).

---

## 11.3 GCD and LCM

```java
static int gcd(int a, int b) {                   // Euclidean algorithm — O(log(min(a,b)))
    return b == 0 ? a : gcd(b, a % b);
}
static long lcm(int a, int b) {
    return (long) a / gcd(a, b) * b;               // divide FIRST to reduce overflow risk, then multiply
}
```
**Why divide before multiplying in `lcm`:** `a * b` could overflow even when the final `lcm` result would have fit comfortably — dividing by the GCD first keeps intermediate values smaller.

**Java's built-ins (know these exist, saves writing your own):**
```java
java.math.BigInteger.valueOf(a).gcd(BigInteger.valueOf(b));   // BigInteger has a native gcd() method
```

---

## 11.4 Prime Numbers & Sieve of Eratosthenes

```java
static boolean isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; (long) i * i <= n; i++) {      // only need to check up to sqrt(n) — cast to long to avoid overflow on i*i
        if (n % i == 0) return false;
    }
    return true;
}
```
**Why checking only up to `√n` is sufficient:** if `n = a × b` with `a ≤ b`, then necessarily `a ≤ √n` — so if no factor exists up to `√n`, none can exist beyond it either (its "partner" factor would already have been found).

```java
// Sieve of Eratosthenes — find all primes up to n, O(n log log n), MUCH faster than checking each number individually
static boolean[] sieve(int n) {
    boolean[] isComposite = new boolean[n + 1];
    for (int i = 2; (long) i * i <= n; i++) {
        if (!isComposite[i]) {
            for (int j = i * i; j <= n; j += i) {     // start marking from i*i (smaller multiples already marked by smaller primes)
                isComposite[j] = true;
            }
        }
    }
    // isComposite[i] == false (and i >= 2) means i is prime
    return isComposite;
}
```
**Why start the inner loop at `i*i` and not `2*i`:** all smaller multiples of `i` (like `2i, 3i, ..., (i-1)i`) have ALREADY been marked composite by a smaller prime factor by the time we reach `i` — starting at `i*i` is a genuine optimization, not just style, and interviewers specifically probe whether you know why it's correct.

---

## 11.5 Modular Arithmetic — essential for "answer might be huge" problems

```java
final int MOD = 1_000_000_007;      // a common large prime modulus used to keep numbers bounded in competitive problems

// Modular addition / subtraction / multiplication:
int add = (int) (((long) a + b) % MOD);
int sub = (int) ((((long) a - b) % MOD + MOD) % MOD);   // add MOD before the final % to handle NEGATIVE intermediate results!
int mul = (int) (((long) a * b) % MOD);
```
**Why the `+ MOD` in subtraction:** Java's `%` can return a **negative** result when the left operand is negative (see file 01/10) — e.g., `(3 - 5) % 7` = `-2` in Java, not the mathematically "expected" non-negative modular residue of `5`. Adding `MOD` before the final `% MOD` guarantees a non-negative, mathematically correct residue.

**Modular exponentiation is covered next (11.6) — modular DIVISION requires modular inverse (via Fermat's Little Theorem, when MOD is prime) — an advanced topic worth name-dropping if the conversation goes deep: `a / b mod p ≡ a * b^(p-2) mod p` for prime `p`.**

---

## 11.6 Fast Exponentiation (Binary Exponentiation) — O(log n), not O(n)

```java
static long power(long base, long exp, long mod) {
    long result = 1;
    base %= mod;
    while (exp > 0) {
        if ((exp & 1) == 1) {              // if the current lowest bit of exp is 1, multiply it into the result
            result = (result * base) % mod;
        }
        base = (base * base) % mod;         // square the base each iteration ("repeated squaring")
        exp >>= 1;                            // move to the next bit
    }
    return result;
}
```
**Core idea to explain out loud:** any exponent can be decomposed into a sum of powers of 2 (its binary representation) — e.g., `base^13 = base^8 * base^4 * base^1` (since 13 = 8+4+1 = `1101` in binary). By repeatedly squaring the base and conditionally multiplying it into the result based on each bit of the exponent, you compute the full power in O(log(exp)) multiplications instead of O(exp) naive repeated multiplication.

---

## 🚩 Common Traps Recap (Phase 11)

1. `Math.abs(Integer.MIN_VALUE)` still returns a negative number.
2. `Math.round(-4.5)` returns `-4`, not `-5` — Java rounding is `floor(x + 0.5)`, not "round half away from zero."
3. `int * int` overflows silently — cast to `long` **before** the multiplication, not after.
4. `%` in Java can return negative results for negative dividends — use `Math.floorMod` or manually add the modulus when a non-negative residue is required.
5. Sieve of Eratosthenes: start marking composites from `i*i`, not `2*i`, for correctness-with-efficiency.
6. `lcm(a,b)`: divide by GCD before multiplying to reduce overflow risk.

## ❓ Rapid-Fire Q&A

**Q: You need `n*(n+1)/2` for `n` up to 2×10⁹. Why might this overflow, and how do you fix it?**
A: `n*(n+1)` as `int*int` can vastly exceed `Integer.MAX_VALUE` for large `n`; cast at least one operand to `long` before the multiplication: `(long) n * (n + 1) / 2`.

**Q: Why check divisibility only up to `√n` when testing primality?**
A: Any factor pair `(a, b)` of `n` with `a ≤ b` must have `a ≤ √n` — so if no divisor is found by `√n`, none exists at all.

**Q: What's the time complexity of binary (fast) exponentiation, and why is it faster than the naive approach?**
A: O(log n) — because it decomposes the exponent into its binary representation and reuses repeated squaring, multiplying only for set bits, instead of performing n-1 sequential multiplications.

**Q: How do you compute `(a - b) % MOD` safely when the result must be non-negative?**
A: `(((a - b) % MOD) + MOD) % MOD` — the extra `+ MOD` and final `% MOD` correct for Java's sign-of-dividend modulo behavior.
