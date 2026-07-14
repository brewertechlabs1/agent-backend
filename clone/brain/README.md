# The Brain — Richard's Knowledge Base

Every `.json` file in the collection folders below is one entry the clone
can retrieve. The clone consults this brain before it speaks; if the
answer isn't here, it flags the gap instead of inventing one.

## Collections

| Folder | Holds | Feeds |
|---|---|---|
| `01-expertise` | How Richard does things — prompt patterns, multi-agent designs, pipeline approaches, automation playbooks | Substance of technical answers |
| `02-projects` | Current and past builds, status, decisions made | Referencing his work accurately |
| `03-opinions` | His stances on AI, tools, the one-person-business path, hype | His views, not generic ones |
| `04-tools` | His actual stack (Zapier, Notion, LLM APIs, Ollama, Mistral…) and how he uses each | Concrete tool-level answers |
| `05-music-beam` | BEAM, his artist/creator perspective, his own music | Creator-side conversations |
| `06-personal` | Bio-level facts, relationships as context, preferences | Natural, personal-sounding replies |
| `07-style-corpus` | Raw transcripts + writing samples | The Style Guide in `../persona.md` |

## Entry schema

```json
{
  "title": "short name",
  "type": "fact | method | opinion | project | phrase | transcript",
  "topic_tags": ["..."],
  "relationship_scope": "public | known | private",
  "recency": "YYYY-MM-DD or \"evergreen\"",
  "confidence": "stated | inferred",
  "source": "where it came from",
  "content": "the actual substance the clone speaks from"
}
```

- `relationship_scope` — who this may surface to. `public` = anyone,
  `known` = people Richard knows, `private` = Richard only.
- `confidence` — only `stated` (Richard said/wrote it) is treated as fact.
  `inferred` entries are flagged as unconfirmed when used.
- Files named `*.local.json` are gitignored — use that suffix for private
  entries you don't want in the repo.

## Retrieval logic (implemented in `../brain.js`)

1. Match entry `topic_tags` (and title/content keywords) against the
   incoming message.
2. Filter by `relationship_scope` against the caller's audience level.
3. On conflicts, prefer higher `recency`, then `confidence: stated`.
4. The clone speaks the retrieved substance in Richard's voice.

## Seeding checklist (work through with Richard)

- [ ] Drop transcripts / posts / notes into `07-style-corpus`
- [ ] Distill signature phrases + never-says into `../persona.md`
- [ ] Fill `01`–`06` from source material, tagged per the schema
- [ ] Mark everything Richard confirms as `confidence: stated`
- [ ] Keep it live — new projects, takes, and phrasing get added over time
