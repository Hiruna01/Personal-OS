# Relational modelling tutorial

Work through these questions at your own pace. Sketch your answers before reading the notes.

## 1. Identify the entities

A university organises **semesters**, **modules**, and **lectures**.

1. List the attributes of each entity.
2. Choose a primary key for each table.
3. Draw the relationships between them.

| Entity | Example attributes | Parent |
| --- | --- | --- |
| Semester | Name, academic year, dates | Workspace |
| Module | Code, title, credits | Semester |
| Lecture | Title, topic, study status | Module |

## 2. Write the query

Write a query to return the lectures in one module in their study order.

```sql
SELECT title, topic, study_status
FROM lectures
WHERE module_id = 'your-module-id'
ORDER BY position;
```

## 3. Think about integrity

Why should a lecture not reference a module from another workspace?

### Discussion

A foreign key ensures the parent exists. A **composite foreign key** can also ensure the lecture and its parent belong to the same workspace.

## 4. A mathematical perspective

For a set of keys $K$ and rows $R$, the primary key defines a one-to-one mapping:

$$
f: K \rightarrow R
$$

Read more in the [PostgreSQL constraints documentation](https://www.postgresql.org/docs/current/ddl-constraints.html).
