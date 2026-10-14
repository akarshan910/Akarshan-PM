import { defineParity } from "./compare";

/** /writing and a post against WritingPublic's 1440 frames. */
defineParity([
  {
    name: "writing-1440",
    board: "WritingPublic",
    boardWidth: 1536,
    width: 1440,
    path: "/writing/",
    sections: [
      { name: "list", board: '.r3 > section:has(h1:has-text("Writing."))', page: "main", band: true },
    ],
  },
  {
    name: "post-1440",
    board: "WritingPublic",
    boardWidth: 1536,
    width: 1440,
    path: "/writing/your-post/",
    sections: [{ name: "post", board: ".r3 > section:nth-of-type(3)", page: "main" }],
  },
]);
