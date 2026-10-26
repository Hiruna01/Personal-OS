import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

const loaderUrl = new URL("../src/lib/data.ts", import.meta.url).href;
let state;
globalThis.__dataLoadingTest = () => state;
registerHooks({
  resolve(specifier, context, next) {
    const mocks = {
      "server-only": "empty",
      "next/navigation": "navigation",
    };
    if (context.parentURL === loaderUrl) {
      mocks["./auth"] = "auth";
      mocks["./fixtures"] = "fixtures";
      if (specifier === "./performance")
        return {
          url: new URL("../src/lib/performance.ts", import.meta.url).href,
          shortCircuit: true,
        };
    }
    return mocks[specifier]
      ? { url: `test:${mocks[specifier]}`, shortCircuit: true }
      : next(specifier, context);
  },
  load(url, context, next) {
    const sources = {
      "test:empty": "export {};",
      "test:navigation":
        'export function notFound() { throw new Error("NOT_FOUND"); }',
      "test:auth":
        "export async function requireOwner() { const s = globalThis.__dataLoadingTest(); s.ownerCalls++; return {db: s.db, workspace: s.workspace}; }",
      "test:fixtures":
        "export const demoEnabled = () => globalThis.__dataLoadingTest().preview; export const fixtures = () => globalThis.__dataLoadingTest().fixture;",
    };
    return sources[url] !== undefined
      ? { format: "module", source: sources[url], shortCircuit: true }
      : next(url, context);
  },
});
const { loadContext } = await import(loaderUrl);

function setup() {
  const workspace = { id: "owner-workspace" };
  const rows = {
    academic_profiles: [
      { workspace_id: workspace.id, programme: "Synthetic degree" },
    ],
    semesters: [
      { id: "current", workspace_id: workspace.id, is_current: true },
      { id: "past", workspace_id: workspace.id, is_current: false },
    ],
    modules: [
      { id: "module", workspace_id: workspace.id, semester_id: "current" },
      { id: "old-module", workspace_id: workspace.id, semester_id: "past" },
    ],
    lectures: [
      {
        id: "second",
        workspace_id: workspace.id,
        module_id: "module",
        position: 2,
      },
      {
        id: "first",
        workspace_id: workspace.id,
        module_id: "module",
        position: 1,
      },
      {
        id: "old",
        workspace_id: workspace.id,
        module_id: "old-module",
        position: 1,
      },
    ],
    study_documents: [
      {
        id: "quiz",
        workspace_id: workspace.id,
        module_id: "module",
        lecture_id: "second",
        kind: "quiz",
        quiz_json: { questions: [] },
        source_markdown: "canonical",
      },
      {
        id: "note",
        workspace_id: workspace.id,
        module_id: "module",
        lecture_id: "first",
        kind: "questions",
        quiz_json: null,
        source_markdown: "note",
      },
      {
        id: "foreign",
        workspace_id: "other-workspace",
        module_id: "module",
        kind: "quiz",
      },
    ],
    resources: [
      {
        id: "second-note",
        workspace_id: workspace.id,
        module_id: "module",
        lecture_id: "second",
      },
      {
        id: "first-note",
        workspace_id: workspace.id,
        module_id: "module",
        lecture_id: "first",
      },
    ],
    projects: [
      { id: "project", workspace_id: workspace.id, module_id: "module" },
    ],
  };
  const calls = [],
    gates = new Map(),
    started = new Map();
  const db = {
    from(table) {
      const query = {
        table,
        filters: [],
        orders: [],
        columns: "*",
        single: false,
        bound: Infinity,
      };
      const chain = {
        select(columns) {
          query.columns = columns;
          return chain;
        },
        eq(key, value) {
          query.filters.push([key, value]);
          return chain;
        },
        in(key, values) {
          query.filters.push([key, values]);
          return chain;
        },
        order(key, options) {
          query.orders.push([key, options?.ascending !== false]);
          return chain;
        },
        limit(bound) {
          query.bound = bound;
          return chain;
        },
        maybeSingle() {
          query.single = true;
          return chain;
        },
        then(resolve, reject) {
          return (async () => {
            calls.push(query);
            assert(
              query.filters.some(
                ([key, value]) =>
                  key === "workspace_id" && value === workspace.id,
              ),
              "Every data query must enforce workspace ownership",
            );
            started.get(table)?.();
            await gates.get(table);
            if (state.failure === table)
              return { data: null, error: new Error("Synthetic failure") };
            let result = rows[table].filter((row) =>
              query.filters.every(([key, value]) =>
                Array.isArray(value)
                  ? value.includes(row[key])
                  : row[key] === value,
              ),
            );
            result.sort((a, b) => {
              for (const [key, ascending] of query.orders) {
                if (a[key] < b[key]) return ascending ? -1 : 1;
                if (a[key] > b[key]) return ascending ? 1 : -1;
              }
              return 0;
            });
            result = result
              .slice(0, query.bound)
              .map((row) =>
                query.columns === "*"
                  ? { ...row }
                  : Object.fromEntries(
                      query.columns.split(",").map((key) => [key, row[key]]),
                    ),
              );
            return {
              data: query.single ? (result[0] ?? null) : result,
              error: null,
            };
          })().then(resolve, reject);
        },
      };
      return chain;
    },
  };
  state = {
    db,
    workspace,
    ownerCalls: 0,
    preview: false,
    calls,
    rows,
    gates,
    started,
  };
  return state;
}
const academic = (kind, id) => ["education", "campus", kind, id];
const tables = () => state.calls.map((call) => call.table).sort();

test("settings, templates, education, and future areas skip academic queries", async () => {
  for (const path of [
    ["settings"],
    ["templates"],
    ["education"],
    ["personal"],
    ["business"],
    ["education", "self-learning"],
  ]) {
    setup();
    const data = await loadContext(path);
    assert.equal(data.workspace.id, state.workspace.id);
    assert.equal(state.ownerCalls, 1);
    assert.deepEqual(tables(), []);
  }
});
test("quiz reader fetches only the document, module, and its parent lecture", async () => {
  setup();
  const data = await loadContext(["documents", "quiz"]);
  assert.deepEqual(tables(), ["lectures", "modules", "study_documents"]);
  assert.equal(data.document.source_markdown, "canonical");
  assert.deepEqual(
    data.lectures.map((row) => row.id),
    ["second"],
  );
  assert.deepEqual(data.resources, []);
  assert.deepEqual(data.projects, []);
});
test("module-level quiz needs no lecture or semester query", async () => {
  setup();
  state.rows.study_documents[0].lecture_id = null;
  await loadContext(["documents", "quiz"]);
  assert.deepEqual(tables(), ["modules", "study_documents"]);
});
test("ordinary document retains parent breadcrumbs", async () => {
  setup();
  const data = await loadContext(["documents", "note"]);
  assert.deepEqual(tables(), [
    "lectures",
    "modules",
    "semesters",
    "study_documents",
  ]);
  assert.equal(data.semesters[0].id, "current");
  assert.equal(data.lectures[0].id, "first");
});
test("lecture keeps ordered siblings for chapter numbering and only its own materials", async () => {
  setup();
  const data = await loadContext(academic("lectures", "second"));
  assert.deepEqual(
    data.lectures.map((row) => row.id),
    ["first", "second"],
  );
  assert.deepEqual(
    data.resources.map((row) => row.id),
    ["second-note"],
  );
  assert.deepEqual(
    data.documents.map((row) => row.id),
    ["quiz"],
  );
  assert(!tables().includes("projects"));
  assert(!tables().includes("academic_profiles"));
});
test("module retains lecture/material/project counts without loading document bodies", async () => {
  setup();
  const data = await loadContext(academic("modules", "module"));
  assert.equal(data.lectures.length, 2);
  assert.equal(data.resources.length, 2);
  assert.equal(data.documents.length, 2);
  assert.equal(data.projects.length, 1);
  assert(!("source_markdown" in data.documents[0]));
  assert(!("quiz_json" in data.documents[0]));
});
test("home scopes modules and lecture previews to the current semester", async () => {
  setup();
  const data = await loadContext([]);
  assert.deepEqual(
    data.semesters.map((row) => row.id),
    ["current"],
  );
  assert.deepEqual(
    data.modules.map((row) => row.id),
    ["module"],
  );
  assert.deepEqual(
    data.lectures.map((row) => row.id),
    ["first", "second"],
  );
  assert.equal(data.profile.programme, "Synthetic degree");
});
test("semester browser needs module metadata but no lectures or materials", async () => {
  setup();
  const data = await loadContext(["education", "campus", "semesters"]);
  assert.equal(data.semesters.length, 2);
  assert.equal(data.modules.length, 2);
  assert.deepEqual(tables(), ["modules", "semesters"]);
});
test("profile loads only the academic profile", async () => {
  setup();
  await loadContext(["education", "campus", "profile"]);
  assert.deepEqual(tables(), ["academic_profiles"]);
});
test(
  "independent module requests begin while breadcrumb data is still pending",
  { timeout: 2000 },
  async () => {
    setup();
    let release;
    state.gates.set(
      "semesters",
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const resourceStarted = new Promise((resolve) =>
      state.started.set("resources", resolve),
    );
    const request = loadContext(academic("modules", "module"));
    try {
      await resourceStarted;
    } finally {
      release();
    }
    const data = await request;
    assert.equal(data.semesters[0].id, "current");
  },
);
test("missing/foreign documents stay inaccessible and database errors stay errors", async () => {
  setup();
  await assert.rejects(loadContext(["documents", "foreign"]), /NOT_FOUND/);
  setup();
  state.failure = "study_documents";
  await assert.rejects(
    loadContext(["documents", "quiz"]),
    /document could not be loaded/,
  );
});
test("disabled preview stops before owner access and data queries", async () => {
  setup();
  await assert.rejects(loadContext([], true), /NOT_FOUND/);
  assert.equal(state.ownerCalls, 0);
  assert.deepEqual(tables(), []);
});
