# Flutter Vibe Code — Agent Skills Marketplace

This directory contains **Agent Skills**: markdown files with YAML frontmatter
(`name:`, `description:`) that the Claude Agent SDK can load and use as expert
guidance during code generation.

## File naming convention

`<source>--<skill-id>.md`

| Source prefix | Origin |
|---|---|
| `flutter--*` | Official `github.com/flutter/skills` (Flutter team) |
| `yelmuratoff--*` | `github.com/yelmuratoff/agent_sync` (Flutter clean-arch focused) |
| `rodydavis--*` | `github.com/rodydavis/skills` (Rody Davis — Google Flutter team) |
| `hoangnguyen0403--*` | `github.com/hoangnguyen0403/agent-skills-standard` |
| `xfstudio--*` | `github.com/xfstudio/skills` |
| `thruthesky--*` | `github.com/thruthesky/flutter-skill` |
| `ehtbanton--*` | `github.com/ehtbanton/claudeskillsrepo` |
| `partme-ai--*` | `github.com/partme-ai/full-stack-skills` |
| `clix-so--*` | `github.com/clix-so/skills` |
| `medz--*` | `github.com/medz/oref` |
| `first-fluke--*` | `github.com/first-fluke/fullstack-starter` |
| `shaul1991--*` | `github.com/shaul1991/shaul-agents-plugin` |
| `zenobi-us--*` | `github.com/zenobi-us/dotfiles` |

## Wire-up status

The skills are stored in this directory but **NOT yet automatically loaded** by
the Claude Agent SDK in the sandbox. The original `SKILL_CONFIGS` array in
`packages/sandbox/src/skills/config.ts` is a different concept (UI features
the user picks per-project: Claude chat, DALL-E, Whisper, etc.) — these
marketplace files are LLM guidance, loaded at agent invocation time.

To wire them up, the next step is to:
1. Bundle this directory as an asset of the sandbox package
2. In `apps/web/lib/claude-code-service.ts`, before launching the agent
   command, upload all skill markdowns to `/home/user/.claude/skills/`
   in the sandbox (the Claude Agent SDK auto-discovers them there)
3. Optionally let the user toggle subsets in the UI

## Sources

- https://playbooks.com/for/flutter (63 skills indexed)
- https://claudemarketplaces.com/skills/flutter/skills (55 skills indexed)
