// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-6fi, seam 3: the read path's PAGING half — moved here
// verbatim by odontogram-0w9.
//
// These cases drive `searchAllPages` against a fake `FhirTransport`, i.e. they
// test the HTTP behaviour of the Aidbox transport and nothing about a chart.
// They lived in the chart SDK's `6fi-live-load` suite because the transport
// lived there too. The remaining cases in that suite drive `loadPatientChart`
// through a fake GATEWAY and stay with the SDK, which is the right split: the
// SDK owns what a chart is, this package owns how a server answers.
//
// Two properties, both of which a live mode gets wrong by default:
//
//   1. A search answers in PAGES. A loader that reads the first page silently
//      shows a partial mouth, which is worse than showing none.
//   2. A page count is not a resource count — see the stable-sort block below.

import { describe, it, expect } from "vitest";
import { searchAllPages } from "../aidbox";

const PATIENT = "p-1";

describe("odontogram-6fi: paged search", () => {
  it("follows the next link until the server stops offering one", async () => {
    const requests: string[] = [];
    const transport = {
      async request(_method: string, path: string, init?: { query?: Record<string, string | string[]> }) {
        requests.push(`${path}${init?.query ? `?${new URLSearchParams(init.query as Record<string, string>)}` : ""}`);
        if (path === "/Observation") {
          return {
            resourceType: "Bundle",
            entry: [{ resource: { resourceType: "Observation", id: "a" } }],
            link: [{ relation: "next", url: "http://localhost:8081/fhir/Observation?page=2" }],
          };
        }
        return { resourceType: "Bundle", entry: [{ resource: { resourceType: "Observation", id: "b" } }] };
      },
    };
    const page = await searchAllPages(transport, "Observation", { subject: `Patient/${PATIENT}` });
    expect(page.resources.map((resource) => (resource as { id: string }).id)).toEqual(["a", "b"]);
    expect(page.truncated).toBe(false);
    // The stable sort rides on the first request; the next link carries it on.
    expect(requests[0]).toBe(`/Observation?subject=Patient%2F${PATIENT}&_sort=_id`);
    expect(requests[1]).toBe("/Observation?page=2");
  });

  it("stops at the page budget and SAYS the result is partial", async () => {
    let served = 0;
    const transport = {
      async request() {
        // Distinct ids per page: the assembly is DISTINCT-counted, so a page
        // repeating one resource would collapse instead of exhausting the budget.
        served += 1;
        return {
          resourceType: "Bundle",
          entry: [{ resource: { resourceType: "Observation", id: `page-${served}` } }],
          link: [{ relation: "next", url: "http://localhost:8081/fhir/Observation?page=1" }],
        };
      },
    };
    const page = await searchAllPages(transport, "Observation", {}, 3);
    expect(page.resources).toHaveLength(3);
    // Silence here would show a partial mouth as if it were the whole one.
    expect(page.truncated).toBe(true);
  });
});

describe("odontogram-6fi: searchAllPages counts what the server promised", () => {
  function pagingTransport(pages: Array<{ ids: string[]; next?: string; total?: number }>) {
    let call = 0;
    return {
      async request() {
        const page = pages[Math.min(call++, pages.length - 1)];
        return {
          resourceType: "Bundle",
          total: page.total,
          entry: page.ids.map((id) => ({ resource: { resourceType: "Observation", id } })),
          ...(page.next ? { link: [{ relation: "next", url: page.next }] } : {}),
        };
      },
    };
  }

  it("reports an incomplete read when fewer resources arrive than the server counted", async () => {
    const transport = pagingTransport([{ ids: ["a", "b"], total: 128 }]);
    const page = await searchAllPages(transport, "Observation", {});
    expect(page.resources).toHaveLength(2);
    expect(page.expected).toBe(128);
    expect(page.incomplete).toBe(true);
  });

  it("is complete when the count matches", async () => {
    const transport = pagingTransport([
      { ids: ["a", "b"], total: 3, next: "http://localhost:8081/fhir/Observation?_page=2" },
      { ids: ["c"], total: 3 },
    ]);
    const page = await searchAllPages(transport, "Observation", {});
    expect(page.resources).toHaveLength(3);
    expect(page.incomplete).toBe(false);
  });

  it("does not claim completeness when the server reports no total", async () => {
    const transport = pagingTransport([{ ids: ["a"] }]);
    const page = await searchAllPages(transport, "Observation", {});
    expect(page.expected).toBeUndefined();
    expect(page.incomplete).toBe(false);
  });

  it("never swallows a page failure into a partial result", async () => {
    let call = 0;
    const transport = {
      async request() {
        call += 1;
        if (call === 1) {
          return {
            resourceType: "Bundle",
            total: 2,
            entry: [{ resource: { resourceType: "Observation", id: "a" } }],
            link: [{ relation: "next", url: "http://localhost:8081/fhir/Observation?_page=2" }],
          };
        }
        throw Object.assign(new Error("Active Storage for 'null' not found"), { status: 500 });
      },
    };
    await expect(searchAllPages(transport, "Observation", {})).rejects.toThrow(/Active Storage/);
  });
});

// ---------------------------------------------------------------------------
// Pagination without a stable sort.
//
// The acceptance run saw the SAME server state reject on roughly five loads out
// of six, with a different `rejectedAt` each time — which reads exactly like an
// order-sensitive codec. It is not: measured, `parseDentalCoreBundle` accepts
// all 24 seeded permutations of that very fixture, and all 30 of a synthetic
// one.
//
// What actually happens is that Aidbox paginates WITHOUT a stable sort. Two
// pages of a 128-resource search return 128 resources of which only 100 to 118
// are DISTINCT: some come twice, and just as many never come at all. Measured
// over six consecutive two-page fetches of the standing fixture: 27, 28, 10,
// 12, 10 and 18 duplicates. The codec rejects a collection carrying a duplicate
// id, so the load fails — and which resource duplicates varies per fetch, which
// is why `rejectedAt` moved.
//
// The count check could not catch it: 128 arrived against a total of 128. It is
// the DISTINCT count that matters.
//
// The chart-level consequence — a load that FAILS rather than showing a mouth
// with a tooth missing — is asserted in the SDK's own `6fi-live-load` suite,
// which is where a chart is decided.
// ---------------------------------------------------------------------------

describe("odontogram-6fi: pagination without a stable sort", () => {
  function unstableTransport(pages: string[][], total: number) {
    const seen: Array<Record<string, string | string[]> | undefined> = [];
    let call = 0;
    return {
      seen,
      async request(_method: string, _path: string, init?: { query?: Record<string, string | string[]> }) {
        seen.push(init?.query);
        const page = pages[Math.min(call++, pages.length - 1)];
        return {
          resourceType: "Bundle",
          total,
          entry: page.map((id) => ({ resource: { resourceType: "Observation", id } })),
          ...(call < pages.length ? { link: [{ relation: "next", url: `http://localhost:8081/fhir/Observation?_page=${call + 1}` }] } : {}),
        };
      },
    };
  }

  it("asks the server for a stable order, so the pages cannot overlap", async () => {
    const transport = unstableTransport([["a", "b"]], 2);
    await searchAllPages(transport, "Observation", { subject: "Patient/p-1" });
    expect(transport.seen[0]).toMatchObject({ subject: "Patient/p-1", _sort: "_id" });
  });

  it("counts DISTINCT resources, so a duplicate cannot pass as a complete read", async () => {
    // 4 resources arrive against a total of 4 — but one of them twice, so one
    // of the four never arrived at all.
    const transport = unstableTransport([["a", "b"], ["b", "c"]], 4);
    const page = await searchAllPages(transport, "Observation", {});
    expect(page.resources).toHaveLength(3);
    expect(page.expected).toBe(4);
    expect(page.incomplete).toBe(true);
  });

  it("never hands the codec the same resource twice", async () => {
    const transport = unstableTransport([["a", "b"], ["b", "c"]], 3);
    const page = await searchAllPages(transport, "Observation", {});
    const ids = (page.resources as Array<{ id: string }>).map((resource) => resource.id);
    expect(ids).toEqual(["a", "b", "c"]);
    expect(page.incomplete).toBe(false);
  });
});
