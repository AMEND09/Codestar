# Codestar: Python DSA Curriculum
### A Duolingo-Style Course for Data Structures & Algorithms

---

> **Design Philosophy:** Students never read a definition before encountering a concept. Every unit begins by showing them working code and asking questions about it. Mistakes drive learning — explanations only appear *after* the student commits to an answer. Code is always presented in realistic, multi-line Python format.

---

## Curriculum Overview

| Unit | Topic | Lessons | XP |
|------|-------|---------|-----|
| 1 | Python Foundations for DSA | 6 | 200 |
| 2 | Arrays & Lists | 7 | 250 |
| 3 | Strings & Hashing | 6 | 250 |
| 4 | Stacks & Queues | 6 | 300 |
| 5 | Linked Lists | 7 | 350 |
| 6 | Recursion | 7 | 350 |
| 7 | Sorting Algorithms | 6 | 400 |
| 8 | Binary Search | 5 | 300 |
| 9 | Trees & BSTs | 8 | 450 |
| 10 | Graphs & BFS/DFS | 8 | 500 |
| 11 | Dynamic Programming | 8 | 550 |
| 12 | Advanced Patterns | 6 | 500 |

**Total: 80 Lessons · ~4,400 XP**

---

## Question Types

Every lesson uses a mix of these question types, ordered from easiest (recognition) to hardest (production):

| Type | Description | Cognitive Level |
|------|-------------|----------------|
| **Trace the Output** | Given code, predict what it prints | Recognize |
| **Spot the Bug** | Find the error in broken code | Recognize |
| **Multiple Choice — Concept** | Choose the correct explanation | Recall |
| **Fill in the Blank** | Complete a missing piece of code | Recall |
| **Arrange the Blocks** | Drag/drop lines into correct order | Construct |
| **Fix the Code** | Edit broken code in a text editor | Construct |
| **Write from Scratch** | Write a function given a docstring | Produce |
| **Complexity Choice** | Choose the Big O for shown code | Analyze |
| **Match the Pairs** | Match data structures to their properties | Recognize |

---

## Unit 1: Python Foundations for DSA

*Students who already know Python basics can test out. The focus here is not general Python — it's the specific Python patterns that appear constantly in DSA.*

### Lesson 1.1 — Lists and Indexing

**Concept introduced:** Zero-indexing, negative indexing, slicing

**Question 1 — Trace the Output**
```python
nums = [10, 20, 30, 40, 50]
print(nums[1])
print(nums[-1])
print(nums[1:3])
```
*What does this print? (Choose all three outputs)*
- A) `20`, `50`, `[20, 30]` ✅
- B) `10`, `40`, `[10, 20]`
- C) `20`, `50`, `[20, 30, 40]`
- D) `10`, `50`, `[20, 30]`

**Feedback (wrong):** `nums[1]` is the *second* item — arrays start at 0. `nums[-1]` counts from the end. `nums[1:3]` means "from index 1 up to (but not including) index 3."

---

**Question 2 — Fill in the Blank**
```python
fruits = ["apple", "banana", "cherry", "date"]

# Get the last item without knowing the length
last = fruits[____]
```
*What goes in the blank?*

**Correct answer:** `-1`
**Feedback:** Negative indices count backward. `-1` always gives the last element regardless of list length — a pattern you'll use constantly.

---

**Question 3 — Spot the Bug**
```python
def get_middle(arr):
    mid = len(arr) / 2
    return arr[mid]

print(get_middle([1, 2, 3, 4, 5]))
```
*This crashes. Why?*
- A) `len()` doesn't work on lists
- B) List indices must be integers, but `/` returns a float ✅
- C) You can't divide by 2
- D) The function is missing a parameter

**Feedback:** Python's `/` operator always returns a float. `arr[2.5]` is invalid. Use `//` (integer division) for index math: `mid = len(arr) // 2`.

---

**Question 4 — Write from Scratch**
```python
def first_and_last(arr):
    """
    Given a list, return a new list containing
    only the first and last elements.
    
    first_and_last([1, 2, 3, 4]) -> [1, 4]
    first_and_last([7, 8])       -> [7, 8]
    first_and_last([5])          -> [5, 5]
    """
    # your code here
```
**Test cases run automatically on submit.**

---

### Lesson 1.2 — Loops and Iteration Patterns

**Concept introduced:** `for` loops, `range()`, `enumerate()`, `while` loops

**Question 1 — Trace the Output**
```python
total = 0
numbers = [3, 1, 4, 1, 5]

for i, num in enumerate(numbers):
    if i % 2 == 0:
        total += num

print(total)
```
*What does this print?*
- A) `14`
- B) `12` ✅
- C) `5`
- D) `9`

**Feedback:** `enumerate` gives both the index `i` and value `num`. `i % 2 == 0` is true for indices 0, 2, 4 — so we add `numbers[0]=3`, `numbers[2]=4`, `numbers[4]=5`. Total = 12.

---

**Question 2 — Arrange the Blocks**

*Put these lines in order to print all even numbers from 0 to 8 (inclusive):*

Blocks:
```
print(i)
for i in range(0, 10, 2):
```
*Correct order:*
```python
for i in range(0, 10, 2):
    print(i)
```
**Feedback:** `range(start, stop, step)` — the third argument is the step size. `range(0, 10, 2)` yields 0, 2, 4, 6, 8.

---

**Question 3 — Fill in the Blank**
```python
# Print indices 0 through n-1 in reverse
n = 5

for i in range(____, ____, ____):
    print(i)

# Expected output: 4, 3, 2, 1, 0
```
**Correct answer:** `4, -1, -1`
**Feedback:** `range(4, -1, -1)` starts at 4, stops before -1, and steps by -1. The stop must be -1 (not 0) to *include* 0 in the output.

---

**Question 4 — Write from Scratch**
```python
def count_evens(arr):
    """
    Return the count of even numbers in the list.
    
    count_evens([1, 2, 3, 4, 6]) -> 3
    count_evens([1, 3, 5])       -> 0
    count_evens([])              -> 0
    """
    # your code here
```

---

### Lesson 1.3 — Dictionaries and Sets

**Concept introduced:** Dict lookups, `.get()`, sets for O(1) membership

**Question 1 — Trace the Output**
```python
scores = {"alice": 90, "bob": 75, "carol": 88}

print(scores.get("bob"))
print(scores.get("dave"))
print(scores.get("dave", 0))
```
*What prints?*
- A) `75`, `None`, `0` ✅
- B) `75`, `KeyError`, `0`
- C) `75`, `0`, `0`
- D) `75`, `None`, `None`

**Feedback:** `.get(key)` returns `None` if the key doesn't exist — no crash. `.get(key, default)` returns the default instead of `None`. This is safer than `scores["dave"]` which would raise `KeyError`.

---

**Question 2 — Spot the Bug**
```python
def has_duplicate(nums):
    seen = {}
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    return False
```
*This code has a bug. What is it?*
- A) You can't use `in` with a dictionary
- B) Dictionaries don't have `.add()` — that's a set method ✅
- C) The function should return `None`, not `False`
- D) `seen` should be initialized as a list

**Feedback:** `.add()` is a `set` method. Dicts use `seen[num] = True` (or any value). For this use case, a `set` is actually the better choice: `seen = set()` then `seen.add(num)`.

---

**Question 3 — Complexity Choice**
```python
def two_sum_slow(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []


def two_sum_fast(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
```
*What are the time complexities of `two_sum_slow` and `two_sum_fast`?*
- A) O(n²) and O(n) ✅
- B) O(n) and O(1)
- C) O(n²) and O(n²)
- D) O(n log n) and O(n)

**Feedback:** The nested loop in `two_sum_slow` is O(n²). `two_sum_fast` uses a hash map — each lookup is O(1), and we do it once per element, giving O(n) overall. This is a fundamental DSA trade-off: space for speed.

---

**Question 4 — Write from Scratch**
```python
def word_frequency(sentence):
    """
    Return a dictionary mapping each word to the
    number of times it appears in the sentence.
    
    word_frequency("the cat sat on the mat")
    -> {"the": 2, "cat": 1, "sat": 1, "on": 1, "mat": 1}
    """
    # your code here
```

---

### Lesson 1.4 — Functions and Scope

**Concept introduced:** Default args, return values, scope, helper functions

**Question 1 — Trace the Output**
```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))
print(greet("Bob", "Hi"))
print(greet(greeting="Hey", name="Carol"))
```
*What prints?*
- A) `Hello, Alice!`, `Hi, Bob!`, `Hey, Carol!` ✅
- B) `Hello, Alice!`, `Hello, Bob!`, `Hey, Carol!`
- C) Error — can't use keyword arguments
- D) `Hello, Alice!`, `Hi, Bob!`, `Hey, name!`

---

**Question 2 — Write from Scratch**
```python
def clamp(value, min_val, max_val):
    """
    Return value clamped between min_val and max_val.
    If value < min_val, return min_val.
    If value > max_val, return max_val.
    Otherwise return value.
    
    clamp(5, 1, 10)  -> 5
    clamp(-3, 1, 10) -> 1
    clamp(15, 1, 10) -> 10
    """
    # your code here
```

---

### Lesson 1.5 — Big O Notation

**Concept introduced:** O(1), O(n), O(n²), O(log n) — by recognition, not memorization

**Question 1 — Complexity Choice**
```python
def mystery_a(arr):
    return arr[0]


def mystery_b(arr):
    for item in arr:
        print(item)


def mystery_c(arr):
    for i in arr:
        for j in arr:
            print(i, j)
```
*Match each function to its Big O:*
- `mystery_a` → O(?) 
- `mystery_b` → O(?)
- `mystery_c` → O(?)

**Correct:** `O(1)`, `O(n)`, `O(n²)`
**Feedback:** `mystery_a` always does one operation regardless of input size. `mystery_b` does *n* operations (one per element). `mystery_c`'s nested loops mean for every element, we visit every other element — n × n = n².

---

**Question 2 — Multiple Choice — Concept**

*You have a sorted list of 1,000,000 items. You search for a value. The algorithm halves the search space each step. After 20 steps, what's the maximum remaining search space?*
- A) 50,000 items
- B) About 1 item ✅
- C) 500,000 items
- D) 0 items

**Feedback:** 2²⁰ = 1,048,576 > 1,000,000. Binary search can find any element in at most 20 steps on a million-item list. This is O(log n) — and why sorted data structures are powerful.

---

**Question 3 — Match the Pairs**

*Match the operation to its time complexity for a Python list:*

| Operation | Complexity |
|-----------|-----------|
| `arr.append(x)` | ? |
| `arr.insert(0, x)` | ? |
| `x in arr` | ? |
| `arr[i]` | ? |

**Correct:**
- `append` → O(1) amortized
- `insert(0, x)` → O(n) — shifts everything
- `x in arr` → O(n) — linear scan
- `arr[i]` → O(1) — direct memory access

---

### Lesson 1.6 — Unit 1 Review + Test Out

*A 10-question mix of all Lesson 1.1–1.5 types. Passing (≥80%) unlocks Unit 2. A perfect score awards the "Pythonista" badge.*

---

---

## Unit 2: Arrays & Lists

*The workhorse of DSA. Almost every problem touches arrays. This unit builds pattern recognition for the most common array techniques.*

### Lesson 2.1 — Two Pointers

**Concept introduced:** Left/right pointers converging toward each other

**Question 1 — Trace the Output**
```python
def is_palindrome(s):
    left = 0
    right = len(s) - 1
    
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    
    return True

print(is_palindrome("racecar"))
print(is_palindrome("hello"))
```
*What prints?*
- A) `True`, `True`
- B) `True`, `False` ✅
- C) `False`, `False`
- D) Error

**Feedback:** Two pointers start at both ends and move inward. For "racecar": r=r, a=a, c=c — all match, so `True`. For "hello": h≠o, so `False` immediately.

---

**Question 2 — Arrange the Blocks**

*Build a function that reverses a list in-place using two pointers:*

Blocks:
```
def reverse_in_place(arr):
right = len(arr) - 1
    arr[left], arr[right] = arr[right], arr[left]
left = 0
    while left < right:
        left += 1
        right -= 1
```
*Correct:*
```python
def reverse_in_place(arr):
    left = 0
    right = len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1
```

---

**Question 3 — Write from Scratch**
```python
def two_sum_sorted(nums, target):
    """
    Given a SORTED list and a target, return the indices
    (1-indexed) of the two numbers that add up to target.
    Exactly one solution is guaranteed.
    Use O(1) extra space.
    
    two_sum_sorted([2, 7, 11, 15], 9) -> [1, 2]
    two_sum_sorted([2, 3, 4], 6)      -> [1, 3]
    """
    # Hint: start with left=0, right=len(nums)-1
    # your code here
```

---

### Lesson 2.2 — Sliding Window

**Concept introduced:** A window that moves through an array without restarting

**Question 1 — Trace the Output**
```python
def max_sum_subarray(arr, k):
    window_sum = sum(arr[:k])
    max_sum = window_sum
    
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, window_sum)
    
    return max_sum

print(max_sum_subarray([2, 1, 5, 1, 3, 2], 3))
```
*What prints?*
- A) `5`
- B) `9` ✅
- C) `8`
- D) `6`

**Feedback:** Instead of re-summing each window (O(n·k)), we slide: subtract the element leaving the window, add the element entering. Windows of size 3: [2,1,5]=8, [1,5,1]=7, [5,1,3]=9, [1,3,2]=6. Max is 9.

---

**Question 2 — Complexity Choice**
```python
# Version A
def max_sum_brute(arr, k):
    max_sum = 0
    for i in range(len(arr) - k + 1):
        window_sum = sum(arr[i:i+k])
        max_sum = max(max_sum, window_sum)
    return max_sum


# Version B
def max_sum_sliding(arr, k):
    window_sum = sum(arr[:k])
    max_sum = window_sum
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, window_sum)
    return max_sum
```
*What are their time complexities?*
- A) Both O(n)
- B) O(n·k) and O(n) ✅
- C) O(n²) and O(n log n)
- D) O(n·k) and O(k)

---

**Question 3 — Write from Scratch**
```python
def longest_subarray_with_sum(arr, target):
    """
    Return the length of the longest contiguous subarray
    whose elements sum to exactly target.
    Return 0 if none exists.
    
    longest_subarray_with_sum([1, 2, 3, 1, 1], 3) -> 3  ([1,2] or [3] or [1,1,1])
    longest_subarray_with_sum([1, -1, 5, -2, 3], 3) -> 4
    """
    # your code here
```

---

### Lesson 2.3 — Prefix Sums

**Concept introduced:** Precompute running totals to answer range queries in O(1)

**Question 1 — Trace the Output**
```python
def build_prefix(arr):
    prefix = [0] * (len(arr) + 1)
    for i in range(len(arr)):
        prefix[i + 1] = prefix[i] + arr[i]
    return prefix

def range_sum(prefix, left, right):
    return prefix[right + 1] - prefix[left]

arr = [3, 1, 4, 1, 5, 9]
prefix = build_prefix(arr)
print(range_sum(prefix, 1, 3))
print(range_sum(prefix, 0, 5))
```
*What prints?*
- A) `6`, `23` ✅
- B) `5`, `23`
- C) `6`, `22`
- D) Error

**Feedback:** `prefix = [0, 3, 4, 8, 9, 14, 23]`. `range_sum(1, 3)` = prefix[4] - prefix[1] = 9 - 3 = 6 (sum of arr[1..3] = 1+4+1). `range_sum(0, 5)` = prefix[6] - prefix[0] = 23 - 0 = 23.

---

**Question 4 — Write from Scratch**
```python
def subarray_sum_equals_k(nums, k):
    """
    Return the count of contiguous subarrays
    whose sum equals k.
    
    subarray_sum_equals_k([1, 1, 1], 2)    -> 2
    subarray_sum_equals_k([1, 2, 3], 3)    -> 2
    subarray_sum_equals_k([-1, -1, 1], 0)  -> 1
    
    Aim for O(n) using a prefix sum hash map.
    """
    # your code here
```

---

### Lesson 2.4 — Kadane's Algorithm

**Concept introduced:** Maximum subarray — a classic DP-like array pattern

**Question 1 — Arrange the Blocks**

*Build Kadane's algorithm to find the maximum subarray sum:*

Blocks:
```
def max_subarray(nums):
    max_sum = nums[0]
    for num in nums[1:]:
    current = nums[0]
        current = max(num, current + num)
        max_sum = max(max_sum, current)
    return max_sum
```
*Correct:*
```python
def max_subarray(nums):
    current = nums[0]
    max_sum = nums[0]
    for num in nums[1:]:
        current = max(num, current + num)
        max_sum = max(max_sum, current)
    return max_sum
```
**Feedback:** At each step we decide: extend the current subarray, or start fresh? `max(num, current + num)` captures that choice. If the running sum is worse than just the current number, restart.

---

### Lesson 2.5 — Sorting Patterns on Arrays

**Concept introduced:** Using sort order to simplify array problems

**Question 1 — Spot the Bug**
```python
def merge_intervals(intervals):
    intervals.sort()
    merged = [intervals[0]]
    
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    
    return merged

print(merge_intervals([[1, 3], [2, 6], [8, 10]]))
```
*This crashes on line 6. Why?*
- A) You can't sort a list of lists
- B) `merged[-1][1]` is read-only because tuples are immutable ✅ (if using tuples) — but here it's because `intervals[0]` is a list reference
- C) `start` and `end` can't be unpacked from a list
- D) `merged.append` doesn't work with lists of lists

**Correct answer:** B — `merged[-1][1] = ...` works if `merged[-1]` is a mutable list. The real bug is that `merged = [intervals[0]]` stores a *reference* to the original list. Use `merged = [list(intervals[0])]` to avoid mutating input.

---

### Lesson 2.6 — Write Real Code: Array Patterns

*This lesson is all "Write from Scratch" questions covering the unit's patterns.*

**Question 1**
```python
def product_except_self(nums):
    """
    Return a list where each element is the product of
    all other elements. Do NOT use division. Aim for O(n).
    
    product_except_self([1, 2, 3, 4]) -> [24, 12, 8, 6]
    product_except_self([2, 3, 4])    -> [12, 8, 6]
    """
    # your code here
```

**Question 2**
```python
def container_with_most_water(heights):
    """
    Given a list of wall heights, find the two walls
    that hold the most water (water = min height × distance).
    Return the maximum water volume.
    
    container_with_most_water([1, 8, 6, 2, 5, 4, 8, 3, 7]) -> 49
    """
    # Hint: two pointers from both ends
    # your code here
```

---

### Lesson 2.7 — Unit 2 Boss Level

*A 12-question timed challenge mixing all question types. Problems mirror real interview questions.*

---

---

## Unit 3: Strings & Hashing

### Lesson 3.1 — String Basics in Python

**Question 1 — Trace the Output**
```python
s = "Hello, World!"

print(s.lower())
print(s[7:12])
print(s[::-1])
print(len(s))
```
*What prints?*
- A) `hello, world!`, `World`, `!dlroW ,olleH`, `13` ✅
- B) `hello, world!`, `World!`, `!dlroW ,olleH`, `13`
- C) `Hello, world!`, `World`, `!dlroW ,olleH`, `12`
- D) `hello, world!`, `world`, `!dlrow ,olleh`, `13`

**Feedback:** `s[7:12]` is indices 7 through 11 = "World" (no exclamation). `s[::-1]` uses step -1 to reverse the entire string.

---

**Question 2 — Write from Scratch**
```python
def is_anagram(s, t):
    """
    Return True if t is an anagram of s (same letters, different order).
    Both strings contain only lowercase letters.
    
    is_anagram("anagram", "nagaram") -> True
    is_anagram("rat", "car")         -> False
    """
    # your code here
```

---

### Lesson 3.2 — Hash Maps for String Problems

**Question 1 — Complexity Choice**
```python
def has_unique_chars_v1(s):
    seen = set()
    for ch in s:
        if ch in seen:
            return False
        seen.add(ch)
    return True


def has_unique_chars_v2(s):
    return len(s) == len(set(s))
```
*What is the time complexity of each?*
- A) O(n) and O(n) ✅
- B) O(n) and O(n²)
- C) O(n²) and O(n)
- D) O(1) and O(n)

**Feedback:** Both are O(n). Building a set is O(n), and set `in` lookups are O(1). v2 is more Pythonic but both are equivalent in complexity.

---

**Question 2 — Write from Scratch**
```python
def group_anagrams(words):
    """
    Group a list of words into anagram families.
    Return a list of groups (order within groups doesn't matter).
    
    group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])
    -> [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]
    """
    # Hint: sorted(word) is the same for all anagrams
    # your code here
```

---

### Lessons 3.3–3.6

*(Covering: Sliding window on strings, Character frequency arrays, Rabin-Karp intuition, Longest substring without repeating characters)*

---

---

## Unit 4: Stacks & Queues

### Lesson 4.1 — The Stack

**Concept introduced:** LIFO — Last In, First Out

**Question 1 — Trace the Output**
```python
stack = []

stack.append(1)
stack.append(2)
stack.append(3)

print(stack.pop())
print(stack.pop())
stack.append(4)
print(stack)
```
*What prints?*
- A) `3`, `2`, `[1, 4]` ✅
- B) `1`, `2`, `[3, 4]`
- C) `3`, `2`, `[4]`
- D) `3`, `1`, `[2, 4]`

**Feedback:** `list.append()` pushes to the top (end). `list.pop()` removes from the top (end). This is LIFO: last item pushed (3) is first popped.

---

**Question 2 — Arrange the Blocks**

*Build a function that uses a stack to check if parentheses are balanced:*

Blocks:
```
def is_balanced(s):
    stack = []
    for ch in s:
    pairs = {')': '(', '}': '{', ']': '['}
        if ch in '({[':
        elif ch in ')}]':
            stack.append(ch)
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
    return len(stack) == 0
```
*Correct:*
```python
def is_balanced(s):
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for ch in s:
        if ch in '({[':
            stack.append(ch)
        elif ch in ')}]':
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
    return len(stack) == 0
```

---

**Question 3 — Write from Scratch**
```python
def evaluate_rpn(tokens):
    """
    Evaluate a Reverse Polish Notation expression.
    tokens is a list of strings (numbers and operators).
    
    evaluate_rpn(["2", "1", "+", "3", "*"]) -> 9
    evaluate_rpn(["4", "13", "5", "/", "+"]) -> 6
    """
    # your code here
```

---

### Lesson 4.2 — The Queue and Deque

**Concept introduced:** FIFO — First In, First Out; `collections.deque`

**Question 1 — Spot the Bug**
```python
from collections import deque

def process_tasks(tasks):
    queue = deque(tasks)
    results = []
    
    while queue:
        task = queue.pop()   # process front first
        results.append(task)
    
    return results

print(process_tasks([1, 2, 3, 4]))
```
*This processes tasks in the wrong order. What's the fix?*
- A) Use `queue.popleft()` instead of `queue.pop()` ✅
- B) Use a list instead of deque
- C) Reverse the input first
- D) Use `queue.popright()`

**Feedback:** `deque.pop()` removes from the *right* (the end you appended to) — that's stack behavior (LIFO). For queue behavior (FIFO), use `popleft()` which removes from the *left* (front). `deque` is O(1) for both ends; a list's `pop(0)` is O(n).

---

### Lesson 4.3 — Monotonic Stack

**Concept introduced:** A stack that maintains a sorted order — powerful for "next greater element" problems

**Question 1 — Trace the Output**
```python
def next_greater(nums):
    result = [-1] * len(nums)
    stack = []  # stores indices
    
    for i, num in enumerate(nums):
        while stack and nums[stack[-1]] < num:
            idx = stack.pop()
            result[idx] = num
        stack.append(i)
    
    return result

print(next_greater([2, 1, 2, 4, 3]))
```
*What prints?*
- A) `[4, 2, 4, -1, -1]` ✅
- B) `[2, 2, 4, -1, -1]`
- C) `[4, 4, 4, -1, -1]`
- D) `[-1, 2, 4, -1, -1]`

---

### Lessons 4.4–4.6

*(Covering: Implementing a stack with min/max in O(1), LRU Cache introduction using OrderedDict, Queue from two stacks)*

---

---

## Unit 5: Linked Lists

### Lesson 5.1 — What is a Linked List?

**Concept introduced:** Nodes, pointers, traversal — no arrays

**Question 1 — Multiple Choice — Concept**

*In a singly linked list, what does the `.next` attribute of the last node hold?*
- A) A pointer back to the head
- B) `None` ✅
- C) The index of the last node
- D) The length of the list

---

**Question 2 — Trace the Output**
```python
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

# Build list: 1 -> 2 -> 3
head = Node(1)
head.next = Node(2)
head.next.next = Node(3)

curr = head
while curr:
    print(curr.val)
    curr = curr.next
```
*What prints?*
- A) `1`, `2`, `3` ✅
- B) `3`, `2`, `1`
- C) `1`
- D) Infinite loop

---

**Question 3 — Fill in the Blank**
```python
def linked_list_length(head):
    count = 0
    curr = ____
    while curr:
        count += 1
        curr = ____
    return count
```
*What fills the two blanks?*
- Blank 1: `head`
- Blank 2: `curr.next`

---

**Question 4 — Write from Scratch**
```python
def reverse_linked_list(head):
    """
    Reverse a singly linked list in-place.
    Return the new head.
    
    Input:  1 -> 2 -> 3 -> 4 -> None
    Output: 4 -> 3 -> 2 -> 1 -> None
    """
    # your code here
```

---

### Lesson 5.2 — Fast and Slow Pointers

**Concept introduced:** Floyd's cycle detection — two pointers at different speeds

**Question 1 — Multiple Choice — Concept**

*In Floyd's cycle detection, you have a `slow` pointer (moves 1 step) and `fast` pointer (moves 2 steps). If they ever point to the same node, what does that mean?*
- A) The list has an even number of nodes
- B) The list has a cycle ✅
- C) `fast` has lapped `slow` twice
- D) The list is a palindrome

---

**Question 2 — Arrange the Blocks**

*Build a function that finds the middle of a linked list:*

Blocks:
```
def find_middle(head):
slow = head
    while fast and fast.next:
fast = head
        slow = slow.next
        fast = fast.next.next
    return slow
```
*Correct:*
```python
def find_middle(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow
```
**Feedback:** When `fast` reaches the end, `slow` is at the middle. `fast` moves at 2× the speed — by the time fast has traversed the full list, slow has only gone halfway.

---

### Lessons 5.3–5.7

*(Covering: Merge two sorted lists, Remove nth node from end, Palindrome linked list, Merge K sorted lists, LRU Cache with doubly linked list + hash map)*

---

---

## Unit 6: Recursion

### Lesson 6.1 — Base Case First

**Concept introduced:** Every recursive function needs a stop condition

**Question 1 — Spot the Bug**
```python
def countdown(n):
    print(n)
    countdown(n - 1)

countdown(5)
```
*What happens when you run this?*
- A) Prints 5, 4, 3, 2, 1, 0
- B) Prints 5, 4, 3, 2, 1
- C) Prints 5 then crashes with RecursionError ✅
- D) Prints nothing

**Feedback:** There's no base case — the function calls itself forever until Python hits its recursion limit (~1000 calls) and raises `RecursionError`. Add `if n <= 0: return` before the recursive call.

---

**Question 2 — Fill in the Blank**
```python
def factorial(n):
    if ____:        # base case
        return 1
    return n * factorial(n - 1)

print(factorial(5))  # 120
```
*What is the base case condition?*
- A) `n == 0` ✅
- B) `n < 0`
- C) `n == 1`
- D) `n > 1`

**Feedback:** Both `n == 0` and `n == 1` work mathematically. `n == 0` is more complete since `factorial(0) = 1` by definition. `n <= 1` is even safer.

---

**Question 3 — Trace the Output**
```python
def mystery(n):
    if n <= 0:
        return 0
    return n + mystery(n - 2)

print(mystery(6))
print(mystery(5))
```
*What prints?*
- A) `12`, `9` ✅
- B) `6`, `5`
- C) `21`, `15`
- D) `12`, `10`

**Feedback:** `mystery(6)` = 6 + mystery(4) = 6 + 4 + mystery(2) = 6+4+2+mystery(0) = 6+4+2+0 = 12. `mystery(5)` = 5+3+1+mystery(-1) = 5+3+1+0 = 9.

---

**Question 4 — Write from Scratch**
```python
def power(base, exp):
    """
    Compute base^exp recursively without using **.
    Assume exp >= 0.
    
    power(2, 10) -> 1024
    power(3, 0)  -> 1
    power(5, 3)  -> 125
    
    Challenge: Can you do it in O(log n) steps?
    Hint: 2^8 = (2^4)^2
    """
    # your code here
```

---

### Lesson 6.2 — The Call Stack

**Concept introduced:** Visualizing recursion as a stack of function calls

**Question 1 — Match the Pairs**

*Match the recursive call to the order it returns:*

```python
def sum_list(arr, i=0):
    if i == len(arr):
        return 0
    return arr[i] + sum_list(arr, i + 1)

sum_list([1, 2, 3])
```

*Which call returns first?*
- A) `sum_list([1,2,3], 0)` — returns 6
- B) `sum_list([1,2,3], 1)` — returns 5
- C) `sum_list([1,2,3], 2)` — returns 3
- D) `sum_list([1,2,3], 3)` — returns 0 ✅

**Feedback:** Recursion unwinds like a stack — the deepest call returns first. `i=3` hits the base case and returns 0. Then `i=2` returns `3+0=3`, then `i=1` returns `2+3=5`, finally `i=0` returns `1+5=6`.

---

### Lesson 6.3 — Recursive Data Structures

**Concept introduced:** Trees are naturally recursive — a tree is a node + subtrees

**Question 1 — Trace the Output**
```python
class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def tree_sum(node):
    if node is None:
        return 0
    return node.val + tree_sum(node.left) + tree_sum(node.right)

root = TreeNode(1,
    TreeNode(2, TreeNode(4), TreeNode(5)),
    TreeNode(3)
)
print(tree_sum(root))
```
*What prints?*
- A) `6`
- B) `10`
- C) `15` ✅
- D) `9`

---

### Lessons 6.4–6.7

*(Covering: Fibonacci with memoization, Generate all permutations, Subsets/power set, Merge sort as recursion)*

---

---

## Unit 7: Sorting Algorithms

### Lesson 7.1 — Bubble Sort

**Question 1 — Trace the Output**
```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

print(bubble_sort([64, 34, 25, 12, 22, 11, 90]))
```
*What prints?*
- A) `[90, 64, 34, 25, 22, 12, 11]`
- B) `[11, 12, 22, 25, 34, 64, 90]` ✅
- C) `[64, 34, 25, 12, 22, 11, 90]`
- D) `[25, 34, 64, 90, 12, 11, 22]`

---

**Question 2 — Complexity Choice**

*What is the worst-case and best-case time complexity of Bubble Sort?*
- A) O(n log n) worst, O(n) best
- B) O(n²) worst, O(n²) best
- C) O(n²) worst, O(n) best ✅
- D) O(n) worst, O(1) best

**Feedback:** Worst case is O(n²) (reversed input — every pair swaps every pass). With an early-exit optimization (stop if no swaps happened in a pass), best case on already-sorted input is O(n).

---

### Lesson 7.2 — Merge Sort

**Concept introduced:** Divide and conquer — split, sort halves, merge

**Question 1 — Arrange the Blocks**

*Build the merge helper function:*

Blocks:
```
def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
```
*This one is already in order — identify which line is wrong if we change `<=` to `<`:*

**Question (Spot the Bug):** If we use `<` instead of `<=` in the comparison, what breaks?
- A) The function crashes
- B) Equal elements still merge correctly ✅ (trick question — `<` still works for correctness, just unstable)
- C) Elements get lost
- D) Duplicates cause an infinite loop

**Feedback:** Changing `<=` to `<` makes merge sort *unstable* — equal elements from `right` will come before equal elements from `left`. For a sort to be stable, equal elements must preserve their original relative order. `<=` ensures left array's equal elements come first.

---

**Question 2 — Write from Scratch**
```python
def merge_sort(arr):
    """
    Sort arr using merge sort. Return the sorted list.
    Do not modify the original list.
    
    merge_sort([3, 1, 4, 1, 5, 9, 2, 6]) -> [1, 1, 2, 3, 4, 5, 6, 9]
    """
    # your code here
    # (you may define and call a helper merge() function)
```

---

### Lesson 7.3 — Quick Sort

**Question 1 — Multiple Choice — Concept**

*Quick sort picks a "pivot" and partitions elements into two groups. Which partition strategy leads to O(n²) worst-case behavior?*
- A) Always picking the median element
- B) Always picking the first element on an already-sorted array ✅
- C) Randomly picking the pivot
- D) Picking the last element on a random array

**Feedback:** If you always pick the first element and the array is sorted, the pivot is always the smallest — one partition gets 0 elements, the other gets n-1. This degenerates to O(n²). Random pivot selection or median-of-three avoids this.

---

### Lessons 7.4–7.6

*(Covering: Counting Sort and Radix Sort, Python's `sorted()` and Timsort, Sorting interview patterns: k closest points, top k frequent)*

---

---

## Unit 8: Binary Search

### Lesson 8.1 — Classic Binary Search

**Question 1 — Spot the Bug**
```python
def binary_search(arr, target):
    left = 0
    right = len(arr)   # bug here
    
    while left < right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1
```
*What is the bug?*
- A) `mid` calculation could overflow
- B) `right` should be `len(arr) - 1` ✅
- C) The while condition should be `<=`
- D) `left = mid + 1` should be `left = mid`

**Feedback:** `arr[len(arr)]` is out of bounds. `right` should start at `len(arr) - 1`. With `right = len(arr)`, the first `mid` calculation could yield an out-of-bounds index on the first pass.

---

**Question 2 — Write from Scratch**
```python
def search_rotated(nums, target):
    """
    Search for target in a sorted array that has been rotated.
    Return the index if found, else -1.
    
    search_rotated([4, 5, 6, 7, 0, 1, 2], 0) -> 4
    search_rotated([4, 5, 6, 7, 0, 1, 2], 3) -> -1
    search_rotated([1], 0)                    -> -1
    
    Must run in O(log n).
    """
    # your code here
```

---

### Lessons 8.2–8.5

*(Covering: Find first and last position, Search in 2D matrix, Binary search on the answer — "minimum max", Koko eating bananas)*

---

---

## Unit 9: Trees & Binary Search Trees

### Lesson 9.1 — Tree Traversals

**Concept introduced:** Inorder, Preorder, Postorder — by tracing, not memorization

**Question 1 — Trace the Output**
```python
class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorder(node):
    if node is None:
        return
    inorder(node.left)
    print(node.val, end=" ")
    inorder(node.right)

root = TreeNode(4,
    TreeNode(2, TreeNode(1), TreeNode(3)),
    TreeNode(6, TreeNode(5), TreeNode(7))
)

inorder(root)
```
*What prints?*
- A) `4 2 1 3 6 5 7`
- B) `1 2 3 4 5 6 7` ✅
- C) `1 3 2 5 7 6 4`
- D) `4 2 6 1 3 5 7`

**Feedback:** Inorder visits left → root → right. For a BST, this always produces elements in sorted order. The tree is a valid BST (left < parent < right at every node), so inorder gives 1 2 3 4 5 6 7.

---

**Question 2 — Multiple Choice — Concept**

*Without running any code — which traversal would produce `4 2 1 3 6 5 7` for this tree?*
- A) Inorder
- B) Preorder ✅
- C) Postorder
- D) Level-order

**Feedback:** Preorder visits root → left → right. Starting at 4, go left to 2, go left to 1 (leaf), back to 3 (leaf), back to 4, go right to 6, go left to 5, back to 7. Result: 4 2 1 3 6 5 7.

---

**Question 3 — Write from Scratch**
```python
def max_depth(root):
    """
    Return the maximum depth (height) of a binary tree.
    An empty tree has depth 0. A single node has depth 1.
    
    For the tree: 
        3
       / \
      9  20
        /  \
       15   7
    max_depth returns 3.
    """
    # your code here
```

---

### Lesson 9.2 — BST Operations

**Question 1 — Arrange the Blocks**

*Build BST insert:*

Blocks:
```
def insert(root, val):
    if root is None:
        return TreeNode(val)
    if val < root.val:
        root.left = insert(root.left, val)
    elif val > root.val:
        root.right = insert(root.right, val)
    return root
```
*(Already in order — this lesson asks students to TRACE through an insertion of val=5 into a given tree and predict the resulting structure.)*

---

### Lessons 9.3–9.8

*(Covering: Validate BST, Lowest Common Ancestor, Level-order BFS traversal, Serialize and deserialize a tree, Construct BST from preorder, Diameter of binary tree)*

---

---

## Unit 10: Graphs & BFS/DFS

### Lesson 10.1 — Graph Representations

**Question 1 — Multiple Choice — Concept**

*Which representation uses less space for a sparse graph (few edges)?*

```python
# Adjacency Matrix (n=4 nodes)
matrix = [
    [0, 1, 0, 0],
    [1, 0, 1, 1],
    [0, 1, 0, 0],
    [0, 1, 0, 0]
]

# Adjacency List (same graph)
adj = {
    0: [1],
    1: [0, 2, 3],
    2: [1],
    3: [1]
}
```
- A) Adjacency Matrix — O(1) edge lookups
- B) Adjacency List — O(V + E) vs O(V²) ✅
- C) Both use the same space
- D) Adjacency Matrix — better for large graphs

---

### Lesson 10.2 — BFS

**Question 1 — Trace the Output**
```python
from collections import deque

def bfs(graph, start):
    visited = set()
    queue = deque([start])
    visited.add(start)
    result = []
    
    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    
    return result

graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B'],
    'F': ['C']
}

print(bfs(graph, 'A'))
```
*What prints?*
- A) `['A', 'B', 'D', 'E', 'C', 'F']`
- B) `['A', 'B', 'C', 'D', 'E', 'F']` ✅
- C) `['A', 'C', 'F', 'B', 'D', 'E']`
- D) `['A', 'B', 'C', 'F', 'E', 'D']`

**Feedback:** BFS explores layer by layer. Layer 0: A. Layer 1: B, C (A's neighbors). Layer 2: D, E (B's unvisited neighbors), F (C's unvisited neighbor). Result: A B C D E F.

---

**Question 2 — Write from Scratch**
```python
def shortest_path(graph, start, end):
    """
    Return the length of the shortest path (in edges)
    from start to end in an unweighted graph.
    Return -1 if no path exists.
    
    Use BFS.
    """
    # your code here
```

---

### Lesson 10.3 — DFS

**Question 1 — Fill in the Blank**
```python
def dfs_iterative(graph, start):
    visited = set()
    stack = [start]
    result = []
    
    while stack:
        node = stack.____()    # blank 1
        if node not in visited:
            visited.add(node)
            result.append(node)
            for neighbor in graph[node]:
                if neighbor not in visited:
                    stack.append(neighbor)
    
    return result
```
*What goes in blank 1?*

**Correct:** `pop`
**Feedback:** DFS uses a *stack* (LIFO). `pop()` removes from the end, which gives us the most-recently-added neighbor first — that's depth-first behavior. If you used `popleft()`, it would become BFS.

---

### Lessons 10.4–10.8

*(Covering: Number of islands, Clone graph, Course schedule / topological sort, Dijkstra's algorithm, Union Find)*

---

---

## Unit 11: Dynamic Programming

### Lesson 11.1 — What is DP? (From Fibonacci)

**Concept introduced:** Overlapping subproblems — discovered by watching a naive solution be slow

**Question 1 — Spot the Bug (Performance)**
```python
def fib_naive(n):
    if n <= 1:
        return n
    return fib_naive(n - 1) + fib_naive(n - 2)

# This takes forever for large n. Why?
print(fib_naive(40))
```
*What is the time complexity of `fib_naive`?*
- A) O(n)
- B) O(n²)
- C) O(2ⁿ) ✅
- D) O(n log n)

**Feedback:** Each call spawns two more calls, creating an exponential tree. `fib(40)` makes over 300 million calls! `fib(5)` alone recalculates `fib(3)` twice, `fib(2)` three times. DP fixes this by storing results we've already computed.

---

**Question 2 — Fix the Code**
```python
def fib_memo(n, memo={}):
    if n <= 1:
        return n
    if n in memo:
        return memo[n]
    result = fib_memo(n - 1) + fib_memo(n - 2)
    # BUG: we compute result but never store it
    return result
```
*Fix this function so it actually memoizes:*

**Correct fix:** Add `memo[n] = result` before `return result`.

---

**Question 3 — Write from Scratch**
```python
def fib_dp(n):
    """
    Compute the nth Fibonacci number using bottom-up DP.
    Use only O(1) space (no array, no dict).
    
    fib_dp(0) -> 0
    fib_dp(1) -> 1
    fib_dp(10) -> 55
    """
    # your code here
```

---

### Lesson 11.2 — 1D DP: Climbing Stairs and Variants

**Question 1 — Trace the Output**
```python
def climb_stairs(n):
    if n <= 2:
        return n
    
    prev2 = 1
    prev1 = 2
    
    for _ in range(3, n + 1):
        curr = prev1 + prev2
        prev2 = prev1
        prev1 = curr
    
    return prev1

print(climb_stairs(4))
print(climb_stairs(5))
```
*What prints?*
- A) `5`, `8` ✅
- B) `4`, `5`
- C) `3`, `5`
- D) `8`, `13`

**Feedback:** To reach step n, you came from step n-1 (one step) or n-2 (two steps). `ways(n) = ways(n-1) + ways(n-2)`. For n=4: 1,2,3,5. For n=5: 1,2,3,5,8. It's Fibonacci, shifted!

---

### Lesson 11.3 — 2D DP: Grids and Matrices

**Question 1 — Multiple Choice — Concept**

*You want to count unique paths in a grid from top-left to bottom-right, moving only right or down. The grid is m×n. What is the recurrence?*
- A) `dp[i][j] = dp[i-1][j] * dp[i][j-1]`
- B) `dp[i][j] = dp[i-1][j] + dp[i][j-1]` ✅
- C) `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`
- D) `dp[i][j] = dp[i-1][j-1] + 1`

---

**Question 2 — Write from Scratch**
```python
def unique_paths(m, n):
    """
    Return the number of unique paths in an m x n grid
    moving only right or down from top-left to bottom-right.
    
    unique_paths(3, 7) -> 28
    unique_paths(3, 2) -> 3
    """
    # your code here
```

---

### Lessons 11.4–11.8

*(Covering: 0/1 Knapsack, Coin Change, Longest Common Subsequence, Word Break, Edit Distance)*

---

---

## Unit 12: Advanced Patterns

### Lesson 12.1 — Heap / Priority Queue

**Question 1 — Trace the Output**
```python
import heapq

nums = [3, 1, 4, 1, 5, 9, 2, 6]
heapq.heapify(nums)

print(heapq.heappop(nums))
print(heapq.heappop(nums))
print(heapq.heappop(nums))
```
*What prints?*
- A) `9`, `6`, `5`
- B) `1`, `1`, `2` ✅
- C) `3`, `1`, `4`
- D) `1`, `2`, `3`

**Feedback:** Python's `heapq` is a **min-heap** — `heappop` always removes the *smallest* element. After heapify, the structure is valid but not fully sorted. The three smallest elements are 1, 1, 2.

---

**Question 2 — Write from Scratch**
```python
def top_k_frequent(nums, k):
    """
    Return the k most frequent elements.
    
    top_k_frequent([1, 1, 1, 2, 2, 3], 2) -> [1, 2]
    top_k_frequent([1], 1)                 -> [1]
    
    Aim for O(n log k) using a heap.
    """
    # your code here
```

---

### Lesson 12.2 — Trie

**Question 1 — Arrange the Blocks**

*Build a Trie insert method:*

Blocks:
```
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True
```
*(Students arrange the method body lines)*

---

### Lessons 12.3–12.6

*(Covering: Backtracking — N-Queens, Bit manipulation patterns, Segment trees introduction, Comprehensive review)*

---

---

## Appendix A: Question Type Distribution Per Lesson

Each lesson of 8–12 questions uses this approximate distribution:

| Question Type | Frequency | Placement |
|---------------|-----------|-----------|
| Trace the Output | 2–3 | First (warm up) |
| Spot the Bug | 1–2 | Early/Middle |
| Complexity Choice | 1 | Middle |
| Fill in the Blank | 1–2 | Middle |
| Arrange the Blocks | 1 | Middle |
| Fix the Code | 0–1 | Late |
| Write from Scratch | 2–3 | Last (hardest) |

---

## Appendix B: Teaching Philosophy Notes

### Why No Lectures?

The course never opens a lesson with "A stack is a LIFO data structure." Instead, students are shown code that uses a stack and asked what it prints. They form their own mental model before vocabulary is introduced. When they get it wrong, the feedback panel provides the vocabulary as an explanation of *why they were wrong* — anchored to a concrete failure they just experienced.

### Progression Within Each Question Type

**Fill in the Blank** questions follow this internal progression:
1. Blank is a single token (e.g., `length`, `-1`, `pop`)
2. Blank is an expression (e.g., `len(arr) // 2`)
3. Blank is an entire line
4. Multiple blanks in the same function

**Write from Scratch** questions progress across units:
1. 3 lines with a clear pattern (Unit 1–2)
2. 5–10 lines with a hint about the approach (Unit 3–6)
3. 10–20 lines with no hints (Unit 7–10)
4. 20+ lines, interview-style — no hints, edge cases in test suite (Unit 11–12)

### Code Style Standards

All code in this course follows these conventions:
- **Realistic formatting** — always multi-line, properly indented, real variable names
- **Type hints** where they help clarity (later units)
- **Docstrings** on all Write from Scratch prompts
- **Test cases in docstrings** so students can manually trace before submitting
- No compressed one-liners in teaching examples (only valid in "Spot the Bug — is this Pythonic?" challenges)