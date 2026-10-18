# Practical — Build a relational schema

## Objective

Create a small schema for a study workspace using PostgreSQL.

## Tasks

1. Create `semesters` and `modules` tables.
2. Add a foreign key from each module to its semester.
3. Insert two synthetic modules.
4. Attempt an insert with an invalid semester. Explain the result.

```sql
CREATE TABLE semesters (
  id uuid PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE modules (
  id uuid PRIMARY KEY,
  semester_id uuid NOT NULL REFERENCES semesters(id),
  title text NOT NULL
);
```

## Reflection

Which constraints protect the data even when a request bypasses the user interface?
