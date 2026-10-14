import { describe, expect, it } from "vitest";

import { allPending, putPending } from "./offline";
import { syncPending } from "./sync";
import { must, testRepo } from "./test-helpers";

describe("syncPending", () => {
  it("saves queued edits, keeps conflicts and drops what it can't route", async () => {
    const { repo } = testRepo();
    const profile = await repo.profile.get();
    const layout = await repo.layout.get();
    const project = must(await repo.projects.get("arcana-workspace"));
    const post = await repo.posts.create(
      { ...(await import("../defaults")).newPost(), title: "Queued" },
      "queued",
    );
    await putPending({
      key: "profile",
      draft: { ...profile.draft, name: "Synced name" },
      version: profile.version,
      at: 1,
    });
    await putPending({ key: "layout", draft: layout.draft, version: layout.version - 1, at: 2 });
    await putPending({
      key: `project:${project.id}`,
      draft: { ...project.draft, overview: { ...project.draft.overview, title: "Synced title" } },
      version: project.version,
      at: 3,
    });
    await putPending({
      key: `post:${post.id}`,
      draft: { ...post.draft, title: "Synced post" },
      version: post.version,
      at: 4,
    });
    await putPending({ key: "nonsense", draft: {}, version: 1, at: 5 });
    await putPending({ key: "thing:x", draft: {}, version: 1, at: 6 });

    expect(await syncPending(repo)).toEqual({ synced: 3, left: 1 });
    expect((await repo.profile.get()).draft.name).toBe("Synced name");
    expect((await repo.projects.get(project.id))?.draft.overview.title).toBe("Synced title");
    expect((await repo.posts.get(post.id))?.draft.title).toBe("Synced post");
    // The layout was a version behind: a conflict, still queued for its editor.
    expect((await allPending()).map((p) => p.key)).toEqual(["layout"]);
  });
});
