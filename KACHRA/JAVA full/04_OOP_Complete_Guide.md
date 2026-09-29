# 04. OOP Complete Guide 🔥🔥🔥🔥🔥

The four pillars — **Encapsulation, Inheritance, Polymorphism, Abstraction** — are almost always asked with a "give a real example, not the textbook definition" follow-up. This file gives you both.

---

## 4.1 Classes & Objects — what actually happens in memory

```java
class Car {
    String model;         // instance field
    int speed;
    void accelerate() { speed += 10; }
}

Car c1 = new Car();      // step-by-step below
```

**`new Car()` execution steps (say these out loud in an interview — it signals real understanding):**
1. JVM allocates memory on the **heap** for a `Car` object, fields set to default values (`null`, `0`).
2. The constructor runs, initializing fields (instance initializer blocks run first, then the constructor body).
3. `new` returns a **reference** (memory address, abstracted) to that heap object.
4. The reference is stored in `c1`, which itself lives on the **stack** (if `c1` is a local variable) or heap (if it's a field of another object).

```java
Car c1 = new Car();
Car c2 = c1;              // c2 now points to the SAME object as c1 — no new object created!
c2.speed = 50;
System.out.println(c1.speed);   // 50 — c1 and c2 are two references to ONE object
```

---

## 4.2 Constructors

### Rules
- Same name as the class, **no return type** (not even `void`).
- If you write **zero** constructors, the compiler auto-generates a no-arg **default constructor** that calls `super()` and does nothing else.
- **The moment you write ANY constructor yourself, the free default constructor disappears.**

```java
class Point {
    int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
}
Point p = new Point();   // COMPILE ERROR — no-arg constructor no longer exists once you define Point(int,int)
```

### Constructor Overloading + Chaining with `this(...)`

```java
class Rectangle {
    int width, height;

    Rectangle() {
        this(1, 1);               // MUST be the first statement in the constructor
    }
    Rectangle(int side) {
        this(side, side);          // chains to the 2-arg constructor -> makes a square
    }
    Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }
}
```
**Rule:** `this(...)` (constructor chaining) can appear **only as the first statement**, and a constructor can call **at most one** other constructor via `this(...)`. You cannot have both `this(...)` and `super(...)` in the same constructor (only one "first statement" slot exists) — chaining eventually always bottoms out at a `super(...)` call somewhere in the chain.

### Constructor + Inheritance — `super(...)`

```java
class Animal {
    String name;
    Animal(String name) {
        this.name = name;
        System.out.println("Animal constructor");
    }
}
class Dog extends Animal {
    Dog(String name) {
        super(name);                      // MUST be first statement if used explicitly
        System.out.println("Dog constructor");
    }
}
new Dog("Rex");
// Output:
// Animal constructor
// Dog constructor
```
**If you don't write `super(...)` explicitly, the compiler inserts an implicit `super();` (no-arg) as the first line automatically.** This FAILS to compile if the parent has no no-arg constructor available:
```java
class Animal {
    Animal(String name) { }     // only a 1-arg constructor exists, no no-arg version
}
class Dog extends Animal {
    Dog() { }    // COMPILE ERROR: implicit super() call, but Animal has no no-arg constructor!
}
```

**Construction order for an object of a subclass (say this precisely — it's tested via "predict the output" code):**
1. Static initializers/blocks of the **parent**, then of the **child** (only once ever, at class-loading time, top to bottom in declaration order).
2. Parent's instance initializer blocks + parent constructor body run (triggered by the implicit/explicit `super()` call).
3. Child's instance initializer blocks, in declaration order, interleaved with field initializers.
4. Child's constructor body.

```java
class Parent {
    { System.out.println("Parent instance block"); }
    Parent() { System.out.println("Parent constructor"); }
}
class Child extends Parent {
    { System.out.println("Child instance block"); }
    Child() { System.out.println("Child constructor"); }
}
new Child();
// Output:
// Parent instance block
// Parent constructor
// Child instance block
// Child constructor
```

---

## 4.3 Encapsulation

**Definition that actually satisfies interviewers:** bundling data (fields) with the methods that operate on it, and **restricting direct access** to the internal state so it can only be changed through a controlled, validated interface.

```java
class BankAccount {
    private double balance;                 // hidden — can't be touched directly from outside

    public double getBalance() { return balance; }

    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Deposit must be positive");
        balance += amount;
    }
    public void withdraw(double amount) {
        if (amount > balance) throw new IllegalStateException("Insufficient funds");
        balance -= amount;
    }
}
```
**Why not just make `balance` public?** Because then ANY code, anywhere, could set `account.balance = -1000;` bypassing all business rules. Encapsulation is what makes **invariants enforceable**.

**Access modifiers — the full visibility matrix (frequently drawn as a table in interviews):**

| Modifier | Same class | Same package | Subclass (different package) | Different package (non-subclass) |
|---|---|---|---|---|
| `private` | ✅ | ❌ | ❌ | ❌ |
| *default* (no modifier / package-private) | ✅ | ✅ | ❌ | ❌ |
| `protected` | ✅ | ✅ | ✅ | ❌ |
| `public` | ✅ | ✅ | ✅ | ✅ |

**Subtle `protected` gotcha:** a subclass in a different package can access an inherited `protected` member only **through its own type or a subtype**, not through an arbitrary reference of the parent type:
```java
package a;
public class Base { protected int x; }

package b;
class Derived extends Base {
    void test(Base other, Derived self) {
        // other.x;      // COMPILE ERROR — `other` is typed as Base, not accessible cross-package this way
        self.x = 5;      // OK — accessed through Derived (or Base within the SAME inheritance chain, this instance)
        this.x = 5;      // OK
    }
}
```

---

## 4.4 Inheritance

```java
class Animal {
    void eat() { System.out.println("eating"); }
}
class Dog extends Animal {
    void bark() { System.out.println("barking"); }
}
Dog d = new Dog();
d.eat();    // inherited
d.bark();
```

**Java supports single inheritance for classes** (`extends` only one class) but **multiple inheritance of type via interfaces** (`implements` many). **Why no multiple class inheritance?** The **Diamond Problem** — if `class C extends A, B` and both `A` and `B` define a method `foo()` with actual field state, the compiler can't unambiguously decide which `foo()`/state `C` should inherit. Interfaces avoid the *state* half of this problem (traditionally no fields), and even the *method* diamond (via default methods, see 4.8) is resolved by an explicit compiler rule rather than silent ambiguity.

**`instanceof` and upcasting/downcasting:**
```java
Animal a = new Dog();                 // upcasting — always safe, always implicit
if (a instanceof Dog) {
    Dog d2 = (Dog) a;                 // downcasting — must be explicit, can throw ClassCastException if wrong
}
Cat cat = (Cat) a;                    // compiles (Cat might be an Animal subtype) but throws ClassCastException at runtime
                                       // because `a` is ACTUALLY a Dog, not a Cat, at runtime
```
Modern pattern-matching `instanceof` (Java 16+) merges the check and cast:
```java
if (a instanceof Dog dog) {           // `dog` is auto-cast and scoped only within this branch
    dog.bark();
}
```

---

## 4.5 Polymorphism

### Compile-time (Static) Polymorphism = Method Overloading
Resolved by the **compiler**, based on the **declared (static) type** of arguments — covered fully in file 03.

### Runtime (Dynamic) Polymorphism = Method Overriding
Resolved by the **JVM at runtime**, based on the **actual (runtime) type** of the object — this is "dynamic method dispatch."

```java
class Animal { void sound() { System.out.println("Some sound"); } }
class Dog extends Animal { @Override void sound() { System.out.println("Bark"); } }
class Cat extends Animal { @Override void sound() { System.out.println("Meow"); } }

Animal[] animals = { new Dog(), new Cat() };
for (Animal a : animals) {
    a.sound();     // JVM looks at a's ACTUAL runtime type each time, not its declared type `Animal`
}
// Output: Bark   Meow
```
**How dynamic dispatch actually works internally:** each class has a **vtable (virtual method table)** — an array of method pointers built at class-load time. An instance method call compiles to an `invokevirtual` bytecode instruction that looks up the method in the **runtime type's** vtable, not the compile-time reference type's vtable. `static`, `private`, and `final` methods use `invokestatic`/`invokespecial` instead — resolved at **compile time**, which is exactly why they can't be (dynamically) overridden.

### Overriding — the full rulebook (this is asked in extreme detail)

```java
class Parent {
    protected Number process(int x) throws IOException { ... }
}
class Child extends Parent {
    @Override
    public Integer process(int x) throws FileNotFoundException { ... }  // ALL LEGAL — here's why:
}
```
1. **Method signature (name + parameters) must match exactly.**
2. **Access modifier can be widened, never narrowed** — `protected → public` ✅, `protected → private` ❌ (compile error).
3. **Return type may be the same or a covariant (subtype) return type** — `Number → Integer` is legal since Java 5 ("covariant return types"). It can NOT be widened to a supertype or an unrelated type.
4. **Checked exceptions in `throws` can be removed or narrowed to subclasses, never added or widened.** `IOException → FileNotFoundException` ✅ (subclass). Adding a brand-new unrelated checked exception ❌. Unchecked exceptions (`RuntimeException` and subtypes) are **unrestricted** — you can always add those regardless.
5. `static` methods **cannot be overridden** — they can only be **hidden** (see 4.6).
6. `final` methods **cannot be overridden** at all — compile error if attempted.
7. `private` methods are **not inherited at all**, so a same-named method in a subclass is a completely independent new method, not an override (no polymorphism applies).
8. Must use `@Override` as a best practice — it's **not required by the compiler** but catches typos (e.g., misspelling a method name means you silently created an *overload*, not an override, and `@Override` turns that into a compile error instead of a silent runtime bug).

### The classic "overriding vs overloading in the same output" trick question
```java
class A {
    void show(Object o) { System.out.println("Object"); }
    void show(String s) { System.out.println("String"); }
}
class B extends A {
    @Override void show(Object o) { System.out.println("B's Object"); }
}
A a = new B();
a.show("hello");
// Output: "String" — NOT "B's Object"!
// WHY: show(String) vs show(Object) overload resolution happens at COMPILE TIME based on the
// declared type of the argument ("hello" is a String) — this picks show(String) on class A's
// overload set (only show(Object) and show(String) exist as OVERLOADS at compile time on type A).
// Runtime polymorphism (dynamic dispatch) only decides WHICH CLASS's version of the CHOSEN
// overload runs (B's show(Object) override would run only if show(Object) were the one selected) —
// it never changes WHICH overload gets selected in the first place.
```
This question tests whether you truly understand that **overload resolution is compile-time & static-type-based**, while **override dispatch is runtime & actual-type-based** — they are two completely separate mechanisms operating at two different times.

### Calling an overridden method from a constructor — a real production bug pattern
```java
class Parent {
    Parent() { init(); }               // calling an overridable method from a constructor!
    void init() { System.out.println("Parent init"); }
}
class Child extends Parent {
    int value = 10;
    @Override void init() { System.out.println("Child init, value=" + value); }
}
new Child();
// Output: "Child init, value=0"   <-- NOT 10!
// WHY: Parent's constructor runs FIRST (see 4.2 construction order), calling init() — but dynamic
// dispatch means Child's OVERRIDE runs, even though Child's field initializers haven't executed
// yet (`value` is still its default 0 at this point). The object is only PARTIALLY constructed.
```
**Lesson (say this in an interview to sound senior):** *"Never call an overridable method from a constructor — the subclass override can run before the subclass's own fields are initialized."*

### Static method "hiding" (not overriding) — another classic trick
```java
class Parent {
    static void greet() { System.out.println("Parent static"); }
}
class Child extends Parent {
    static void greet() { System.out.println("Child static"); }
}
Parent p = new Child();
p.greet();     // "Parent static" — resolved at COMPILE TIME by declared type, since static methods use invokestatic
Child.greet(); // "Child static"
```
Contrast directly with the instance-method polymorphism example in 4.5 — this is the #1 way interviewers test if you *actually* understand the static-vs-dynamic-dispatch distinction rather than reciting it.

---

## 4.6 Abstraction

### Abstract classes
```java
abstract class Shape {
    abstract double area();                 // no body — subclasses MUST implement
    void describe() {                       // concrete method — shared implementation
        System.out.println("Area = " + area());
    }
}
class Circle extends Shape {
    double radius;
    Circle(double r) { radius = r; }
    @Override double area() { return Math.PI * radius * radius; }
}
// Shape s = new Shape();     // COMPILE ERROR — cannot instantiate an abstract class
Shape s = new Circle(2);      // OK — via a concrete subclass
s.describe();                 // "Area = 12.566..."
```
**Rules:**
- An abstract class **can** have constructors (called via `super()` from subclasses), fields, static methods, and concrete methods — it's NOT required to be 100% abstract methods.
- A class with even **one** abstract method **must** be declared `abstract` itself.
- The **first concrete subclass** in the hierarchy must implement **all** inherited abstract methods, or itself remain abstract.

### Interfaces
```java
interface Flyable {
    void fly();                          // implicitly public abstract (pre-Java 8 style)
    int MAX_ALTITUDE = 40000;            // implicitly public static final — an interface field is ALWAYS a constant!
}
class Bird implements Flyable {
    @Override public void fly() { System.out.println("Flying"); }   // must be public — can't narrow visibility
}
```
**Every field in an interface is implicitly `public static final`** — you cannot declare instance state in an interface. Every abstract method is implicitly `public abstract` even if you omit those words.

### Abstract class vs Interface — the full modern comparison (post Java 8)

| | Abstract class | Interface |
|---|---|---|
| Multiple inheritance | ❌ only one parent class | ✅ implement many interfaces |
| Constructors | ✅ Yes | ❌ No |
| Instance fields (state) | ✅ Yes, any modifier | ❌ Only `public static final` constants |
| Access modifiers on methods | any (`private`, `protected`, `public`) | methods are `public` (abstract/default) or `private` (Java 9+ helper methods) |
| Concrete methods | ✅ freely | ✅ via `default` (Java 8+) and `static` (Java 8+) methods |
| When to use | "IS-A" relationship + shared state/code among closely related classes | "CAN-DO" capability contract across unrelated classes; multiple-inheritance-like behavior |

**Modern rule of thumb interviewers want to hear:** *"Prefer interfaces for defining a capability/contract (especially across unrelated classes), and reserve abstract classes for when you need to share actual field state or a common constructor among closely related subclasses."*

### `default` and `static` interface methods (Java 8+) — and the Diamond Problem resurrected
```java
interface A { default void hello() { System.out.println("A"); } }
interface B { default void hello() { System.out.println("B"); } }
class C implements A, B {
    @Override public void hello() {     // MANDATORY override — compiler forces you to resolve the ambiguity!
        A.super.hello();                 // explicit syntax to call a specific interface's default method
        B.super.hello();
    }
}
```
If two interfaces provide conflicting `default` methods, **the compiler refuses to compile** unless the implementing class explicitly overrides the method — Java resolves the interface diamond problem by **forcing an explicit human decision**, unlike C++'s more implicit (and infamous) resolution rules.

**Static interface methods** are NOT inherited by implementing classes — call them via the interface name only:
```java
interface MathOps { static int square(int x) { return x * x; } }
// class Impl implements MathOps { } ; Impl obj; obj.square(4);   // COMPILE ERROR — not inherited!
MathOps.square(4);   // correct usage
```

**Private interface methods (Java 9+)** — helper methods to share code between default methods, not exposed to implementers:
```java
interface Logger {
    private String timestamp() { return "[" + System.currentTimeMillis() + "] "; }  // private helper
    default void log(String msg) { System.out.println(timestamp() + msg); }
}
```

---

## 4.7 Keyword Reference Table

| Keyword | Meaning | Key gotcha |
|---|---|---|
| `this` | reference to the current object | Cannot be used in a `static` context; used for field disambiguation and constructor chaining `this(...)`. |
| `super` | reference to the parent class portion of the object | `super(...)` for parent constructor (must be first statement); `super.method()` to explicitly call an overridden parent method. |
| `static` | belongs to the class, not instances | One copy shared across ALL instances; cannot access instance members directly. |
| `final` | "cannot be changed further" — meaning depends on context | See 4.9. |
| `abstract` | incomplete — must be implemented by a subclass | Cannot be combined with `final`, `private`, or `static` on a method (contradictory: abstract MUST be overridden, those prevent overriding). |
| `interface` | defines a contract/capability | All fields are constants; supports multiple inheritance of type. |
| `extends` | class-to-class or interface-to-interface inheritance | An interface can `extends` **multiple** other interfaces (unlike classes, which extend only one class). |
| `implements` | class fulfilling an interface contract | A class can implement multiple interfaces. |
| `instanceof` | runtime type check | Returns `false` (never throws) for `null instanceof AnyType`. |

## 4.8 `final` — the three contexts (asked as "what does final mean" — answer must cover all three)

```java
final int MAX = 100;         // final VARIABLE — value can't be reassigned after initialization
                              // (for objects: the REFERENCE is frozen, but the object's internal
                              //  state can still change! `final List<Integer> l` still allows l.add(1))

class Utils {
    final void helper() { }  // final METHOD — cannot be overridden by any subclass
}

final class ImmutablePoint { }  // final CLASS — cannot be subclassed at all (e.g., String, Integer are final classes)
```
```java
final List<Integer> list = new ArrayList<>();
list.add(1);              // ✅ legal — mutating the OBJECT, not reassigning the reference
list = new ArrayList<>(); // ❌ COMPILE ERROR — reassigning a final reference
```
**`final` local variables inside lambdas/anonymous classes:** a local variable captured by a lambda or anonymous inner class must be **final or "effectively final"** (never reassigned after initialization, even without the `final` keyword) — the compiler enforces this because the lambda might outlive the enclosing method's stack frame, so it captures a **copy** of the variable's value, and allowing reassignment afterward would create confusing inconsistency between the copy and the "real" variable.

---

## 🚩 Common Traps Recap (Phase 4)

1. Defining any constructor removes the free default no-arg constructor.
2. `this(...)`/`super(...)` must be the first statement, and you can only use one of them per constructor.
3. Overload resolution (which method signature) is decided at **compile time** by the declared type; override dispatch (which class's body runs) is decided at **runtime** by the actual object type — these are two separate mechanisms, and mixing them up is the #1 polymorphism trap.
4. `static` methods are hidden, not overridden — always resolved by declared (reference) type.
5. Calling an overridable method from a constructor can run subclass logic before subclass fields are initialized.
6. Overriding can widen access and narrow the return type (covariant) and narrow/remove checked exceptions — never the reverse.
7. Every interface field is implicitly `public static final`; every interface method is `public` unless `private`/`static` (Java 9+/8+).
8. Conflicting `default` methods from two interfaces force a mandatory explicit override — the compiler will not silently pick one.
9. `final` on a reference variable freezes the reference, not the referenced object's internal mutable state.

## ❓ Rapid-Fire Q&A

**Q: Can an abstract class have a constructor? Why would it need one if you can't `new` it directly?**
A: Yes — it's invoked via `super()` from a concrete subclass's constructor, used to initialize fields the abstract class itself declares.

**Q: Why can't `static` methods be overridden?**
A: Because they're resolved at compile-time via `invokestatic`, based on the reference's declared type — there's no dynamic dispatch mechanism (vtable lookup) involved for static calls.

**Q: A subclass method has a wider `throws` clause with a new checked exception than its parent's overridden method. Does it compile?**
A: No — overriding can only keep the same or narrower (subtype) checked exceptions; adding a new/unrelated/broader checked exception is a compile error. Unchecked exceptions are unaffected by this rule.

**Q: Why does Java disallow multiple inheritance of classes but allow it for interfaces?**
A: Multiple class inheritance risks the Diamond Problem for both *state* (conflicting fields) and *behavior* (conflicting concrete method implementations with ambiguous precedence). Interfaces historically had no state, and even now that they can have `default` methods, Java resolves method conflicts by **forcing the implementing class to explicitly override and disambiguate** rather than silently picking a winner.

**Q: What happens if you try to make a method both `abstract` and `final`?**
A: Compile error — contradictory (abstract means "must be overridden," final means "cannot be overridden").
