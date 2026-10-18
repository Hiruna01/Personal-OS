# Project brief — A small study library

## Overview

Design and implement a private library for organising university study materials.

## Outcomes

- A clear semester → module → lecture structure.
- External links for original documents.
- Readable Markdown study pages.

## Deliverables

| Deliverable | Evidence |
| --- | --- |
| Data model | Schema diagram and constraints |
| Interface | Responsive study pages |
| Reflection | Short explanation of key decisions |

## Technical notes

Use transactions for related updates. A failed replacement must preserve the existing document.

```text
Validate → Preview → Save atomically
```

Dates, responsibilities, and milestones in this brief are ordinary document text. They are not automatically added to a calendar or project-management system.
