# Templates & Events

Anywhere you can provide a string in block YAML, you can usually use templates like `{{ frontmatter.hp }}`.

## Template paths

- `frontmatter.*` – note frontmatter, e.g. `{{ frontmatter.level }}`.
- `abilities.*` – totals from the nearest ```traits block, e.g. `{{ abilities.Agility }}`.
- `skills.*` – from a `skills` map in frontmatter.
- `character.*` – derived summary, e.g. `{{ character.level }}`, `{{ character.hp }}`.

## Helpers

- `{{ add 2 frontmatter.level }}`
- `{{ subtract frontmatter.hp 2 }}`
- `{{ multiply 2 frontmatter.level }}`
- `{{ floor divide frontmatter.hp 2 }}`

If a template expression fails, it resolves to an empty string instead of throwing.

## Events

The plugin fires custom DOM events for cross‑block reactivity:

- `dh:tracker:changed` – `{ key, filled }` when a tracker changes.
- `dh:kv:changed` – `{ key, val }` when a key in the state store changes.
- `dh:rest:short` / `dh:rest:long` – rest events.

Advanced code / plugins should prefer using helpers from `src/utils/events.ts` instead of calling `window.dispatchEvent` directly.
