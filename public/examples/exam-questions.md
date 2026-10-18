# Database systems — Exam practice

## Section A: Short answers

1. Define a candidate key.
2. Explain the difference between `INNER JOIN` and `LEFT JOIN`.
3. Describe a transaction and its atomicity guarantee.

## Section B: Applied reasoning

A module has $n$ lectures and each lecture has $m$ resources.

1. Express the total number of resources as a function of $n$ and $m$.
2. Propose an index for finding resources belonging to one lecture.

### Model discussion

There are $n \times m$ resources under the stated assumptions. An index beginning with `lecture_id` supports the lookup.
