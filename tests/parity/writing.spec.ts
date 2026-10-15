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
      {
        name: "list",
        board: '.r3 > section:has(h1:has-text("Writing."))',
        page: "main",
        band: true,
        // 09 · D75: the board's placeholder cover vs the fixture's, and an "Older posts" pager that
        // assumes 21 posts.
        mask: {
          board: [".r3 > section:nth-of-type(2) > a > .cv"],
          page: ['main > a > span[class*="_box_"]'],
        },
        collapse: { board: [".r3 > section:nth-of-type(2) > div:last-of-type"] },
        note: "09 · D75: lead cover masked, Older posts pager removed",
      },
    ],
  },
  {
    name: "post-1440",
    board: "WritingPublic",
    boardWidth: 1536,
    width: 1440,
    path: "/writing/your-post/",
    sections: [
      {
        name: "post",
        board: ".r3 > section:nth-of-type(3)",
        page: "main",
        // 09 · D75: the post frame draws the post without a cover and with placeholder title and
        // meta; /writing's lead draws the same post with a cover. The page's cover is removed, and
        // the title and meta line are masked.
        mask: {
          board: [
            ".r3 > section:nth-of-type(3) article h1",
            ".r3 > section:nth-of-type(3) article > div.mono",
            // The reading-progress bar's state, and the figure's art (D75 / D60).
            ".r3 > section:nth-of-type(3) > div:first-child",
            ".r3 > section:nth-of-type(3) article figure > :first-child",
          ],
          page: [
            "main article h1",
            'main article > div[class*="_mono_"]',
            'main > [class*="_progress_"]',
            "main article figure > :first-child",
          ],
        },
        // 09 · D60: the post byline draws no dashed avatar placeholder; the board's is removed.
        collapse: {
          board: [".r3 > section:nth-of-type(3) article > div:nth-of-type(2) > span:first-child"],
          page: ['main article [class*="_postCover_"]'],
        },
        note: "09 · D75: cover removed, title and meta masked; D60: board avatar removed",
      },
    ],
  },
]);
