# Database fundamentals

Format: campus-quiz-v1

## Question 1

Type: mcq

Which key uniquely identifies a row in a relational table?

### Options

- A. Foreign key
- B. Primary key
- C. Search term

### Answer

B

### Explanation

A **primary key** uniquely identifies each row. A foreign key connects it to a row in another table.

## Question 2

Type: written

Explain why the following query uses a foreign key, and describe what happens if the referenced semester does not exist.

```sql
INSERT INTO modules (title, semester_id)
VALUES ('Database Systems', 'semester-01');
```

### Answer

The `semester_id` points to a semester record. A foreign-key constraint rejects the insert if that semester does not exist, preserving referential integrity.

### Explanation

The relationship ensures every module has a valid parent. This is a database-level guarantee, independent of form validation.

## Question 3

Type: mcq

For a relation with $n$ rows, which statement about a primary key is correct?

### Options

- A. Its values may repeat $n$ times.
- B. It must contain exactly $n$ distinct, non-null values.
- C. It is always a text column.

### Answer

B

### Explanation

Uniqueness and non-nullability identify every row. A key may be a number, text, or a combination of columns.
