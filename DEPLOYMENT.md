# Deployment & Classroom Cloud Setup

Slope Invaders is a static frontend. The optional **classroom cloud** (teacher
dashboards + student class join + progress sync) is powered by Supabase and is
**additive**: with no Supabase env vars set, the game runs exactly as before —
fully offline on `localStorage`, no network, no accounts.

## 1. Static hosting (always)

```bash
npm install
npm run build      # outputs static assets to dist/
npm run preview    # optional local check of the production build
```

`dist/` can be served from any static host (Netlify, Vercel, GitHub Pages, S3,
or even `file://` — `vite.config.ts` uses a relative `base`).

## 2. Enable the classroom cloud (optional, do this whenever)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project's **SQL Editor**, paste and run, in order:
   [`supabase/migrations/0001_classroom.sql`](supabase/migrations/0001_classroom.sql),
   then [`supabase/migrations/0002_versus.sql`](supabase/migrations/0002_versus.sql),
   then [`supabase/migrations/0003_dashboard_adaptivity.sql`](supabase/migrations/0003_dashboard_adaptivity.sql),
   then [`supabase/migrations/0004_class_goals.sql`](supabase/migrations/0004_class_goals.sql).
   The first creates the `classrooms`, `students`, and `level_results` tables; the
   second adds the `matches` table for live Versus; the third updates the teacher
   dashboard RPC to return each level's synced stats (including the adaptivity
   tier + reason shown to teachers); the fourth adds the cooperative class goal
   (`set_class_goal`/`get_class_goal` + `goal_kind`/`goal_target` on `classrooms`).
   All lock their tables with RLS (default-deny) and expose only
   `SECURITY DEFINER` RPCs to the anon role. **If you set up the cloud before
   `0004` existed, just run `0004` now** — it only adds the goal columns/RPCs and
   is safe to run on an existing project (it uses `add column if not exists`).
3. In **Project Settings → API**, copy the **Project URL** and the
   **Publishable key** (`sb_publishable_…`; on older projects this is the **anon
   public** key).
4. Set the two env vars (locally in a `.env` file — see `.env.example` — and in
   your host's environment for production builds):

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR-KEY
   ```

   (The legacy `VITE_SUPABASE_ANON_KEY` name is still read as a fallback.)

5. Rebuild (`npm run build`). The Classroom button and Teacher Dashboard now go
   live. The publishable key is **safe to ship** — every write/read goes through
   the capability-gated RPCs; direct table access is denied by RLS.

> Running in Claude Code on the web? The session's **network policy** must allow
> outbound HTTPS to `*.supabase.co` for live sync during development.

## 3. How access works (no accounts)

- **Students** get a device UUID (minted in `localStorage`) plus a chosen cadet
  name. They join with the teacher's 6-character class code.
- **Teachers** create a class and receive an unguessable **secret dashboard
  link** (`?teacher=<key>`). Possession of the link = access; bookmark it. The
  link is also remembered on the creating device. There is no password — keep
  the link private (anyone with it can view that class).

## 4. Live 1v1 Versus

Once the cloud is configured and a student has joined a class, the **Versus** mode
is live: classmates create/join a match and race on side-by-side boards. It uses
Supabase **Realtime broadcast** channels (enabled by default on Supabase projects —
no extra setup) for live board mirroring and attack effects; the `matches` table is
only the matchmaking authority. Only students in the same class can see/join each
other. See `docs/agent/10-classroom-cloud.md` for the design.
