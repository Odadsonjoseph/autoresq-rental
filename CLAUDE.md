# CLAUDE.md - AutoresQ Rental

## Project Identity
- **Name:** AutoresQ Rental
- **Description:** Premium Car Rental Platform with white-label profiles
- **Repository:** Odadsonjoseph/autoresq-rental
- **Branch:** main
- **Supabase Ref:** epjfkpzjekhzlqazfasu
- **Vercel Project:** autoresq-rental
- **Tech Stack:** Next.js, TypeScript, Tailwind CSS, Supabase, Vercel

## CRITICAL: Project Isolation
You are working on **AutoresQ Rental** and ONLY AutoresQ Rental.
- Do NOT reference code, configs, or data from other projects
- Do NOT deploy to any other Vercel project
- Do NOT modify any other Supabase instance
- Verify: `git remote -v` must show `Odadsonjoseph/autoresq-rental`

## Standards
- Follow the company AGENTS.md universal operating protocol
- Use the quality-gate skill before every commit
- Use the git-workflow skill for all branching and PRs
- Use the security-hardening skill before every deployment
- All code must pass TypeScript strict mode
- All Supabase tables must have RLS enabled

## Environment
- Local dev: `npm run dev` or `pnpm dev`
- Build: `npm run build`
- Deploy: `vercel --prod --token $VERCEL_TOKEN`
- Supabase: `supabase` CLI with `$SUPABASE_ACCESS_TOKEN`
