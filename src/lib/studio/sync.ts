/**
 * Startup sync (05 · Session expiry while editing; 06 · Autosave): edits that waited in the
 * offline queue are saved when Studio opens again, with the same version check. A conflict stays
 * queued untouched; the editor's conflict dialog takes it from there when the document is opened.
 */
import type { Post, Profile, Project, SiteLayout } from "../types";
import { allPending, dropPending, type Pending } from "./offline";
import type { SaveResult, StudioRepo } from "./repo";

function save(repo: StudioRepo, p: Pending): Promise<SaveResult<unknown>> | null {
  if (p.key === "profile") return repo.profile.save(p.draft as Profile, p.version);
  if (p.key === "layout") return repo.layout.save(p.draft as SiteLayout, p.version);
  const [kind, id] = p.key.split(":");
  if (!id) return null;
  if (kind === "project") return repo.projects.save(id, p.draft as Project, p.version);
  if (kind === "post") return repo.posts.save(id, p.draft as Post, p.version);
  return null;
}

/** Saves what's queued. Returns how many synced, and how many are still waiting. */
export async function syncPending(repo: StudioRepo): Promise<{ synced: number; left: number }> {
  const queue = await allPending();
  let synced = 0;
  let left = 0;
  for (const p of queue) {
    const result = await save(repo, p);
    if (!result) {
      await dropPending(p.key);
      continue;
    }
    if (result.ok) {
      synced++;
      await dropPending(p.key);
    } else left++;
  }
  return { synced, left };
}
