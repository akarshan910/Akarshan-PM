/** Renders the project editor around one tab, on the in-memory repo, for the editor tests. */
import { render } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi } from "vitest";

import type { MemoryRepo } from "~/lib/studio/memory";
import { MEMORY_OWNER } from "~/lib/studio/memory";
import type { EditorTabSlug } from "~/lib/studio/paths";
import { must, testRepo } from "~/lib/studio/test-helpers";
import { StudioDataProvider } from "./data";
import { ProjectEditor, type EditorData } from "./editor/ProjectEditor";
import { ShellContext } from "./shell/ShellContext";
import { ToastProvider } from "./Toast";

export async function editorData(repo: MemoryRepo, id: string): Promise<EditorData> {
  const [row, rows, layout, media] = await Promise.all([
    repo.projects.get(id),
    repo.projects.list(),
    repo.layout.get(),
    repo.media.list(),
  ]);
  const urls: Record<string, string> = {};
  for (const m of media) urls[m.id] = await repo.media.url(m);
  return { row: must(row), rows, layout, media, urls, ownerName: (await repo.profile.get()).draft.name };
}

export async function renderEditor(
  pick: (rows: Awaited<ReturnType<MemoryRepo["projects"]["list"]>>) => string,
  tab: EditorTabSlug,
  body: ReactNode,
  query = "",
) {
  const { repo, clock } = testRepo();
  const id = pick(await repo.projects.list());
  const data = await editorData(repo, id);
  const announce = vi.fn();
  const utils = render(
    <MemoryRouter initialEntries={[`/studio/projects/${id}/${tab}${query}`]}>
      <StudioDataProvider repo={repo}>
        <ToastProvider>
          <ShellContext.Provider
            value={{ session: { email: MEMORY_OWNER, userId: "owner" }, signOut: vi.fn(), announce }}
          >
            <Routes>
              <Route
                path="/studio/projects/:id/:tab"
                element={
                  <ProjectEditor data={data} tab={tab}>
                    {body}
                  </ProjectEditor>
                }
              />
              <Route path="*" element={<p>Elsewhere</p>} />
            </Routes>
          </ShellContext.Provider>
        </ToastProvider>
      </StudioDataProvider>
    </MemoryRouter>,
  );
  return { repo, clock, id, announce, ...utils };
}

/** Types a long value in one step: `user.type` renders once per keystroke, which is slow on CI. */
export async function fill(user: UserEvent, el: HTMLElement, text: string) {
  await user.click(el);
  await user.paste(text);
}
