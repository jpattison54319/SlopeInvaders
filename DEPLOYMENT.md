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
2. In the project's **SQL Editor**, paste and run
   [`supabase/migrations/0001_classroom.sql`](supabase/migrations/0001_classroom.sql).
   It creates the `classrooms`, `students`, and `level_results` tables, locks
   them with RLS (default-deny), and exposes four `SECURITY DEFINER` RPCs to the
   anon role.
3. In **Project Settings → API**, copy the **Project URL** and the **anon public**
   key.
4. Set the two env vars (locally in a `.env` file — see `.env.example` — and in
   your host's environment for production builds):

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```

5. Rebuild (`npm run build`). The Classroom button and Teacher Dashboard now go
   live. The anon key is **safe to ship** — every write/read goes through the
   capability-gated RPCs; direct table access is denied by RLS.

> Running in Claude Code on the web? The session's **network policy** must allow
> outbound HTTPS to `*.supabase.co` for live sync during development.

## 3. How access works (no accounts)

- **Students** get a device UUID (minted in `localStorage`) plus a chosen cadet
  name. They join with the teacher's 6-character class code.
- **Teachers** create a class and receive an unguessable **secret dashboard
  link** (`?teacher=<key>`). Possession of the link = access; bookmark it. The
  link is also remembered on the creating device. There is no password — keep
  the link private (anyone with it can view that class).

## 4. Phase 2 (not yet built)

Live 1v1 Versus matchmaking (Supabase Realtime) is designed but deferred. See
`docs/agent/10-classroom-cloud.md`.
