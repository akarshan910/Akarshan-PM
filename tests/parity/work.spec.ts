import { defineParity } from "./compare";

/**
 * /work against WorkScale's "Work page preview" at 1440. The board's slider is set to the
 * fixture's five strategy volumes (plus four shipped: nine in all).
 */
defineParity([
  {
    name: "work-1440",
    board: "WorkScale",
    state: { n: 5 },
    boardWidth: 1536,
    width: 1440,
    path: "/work/",
    sections: [{ name: "page", board: 'section[aria-label="Work page preview"]', page: "main", band: true }],
  },
]);
