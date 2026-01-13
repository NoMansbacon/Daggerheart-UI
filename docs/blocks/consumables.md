# Consumables (`consumables`)

Renders rows of consumable boxes with per‑item persistent state.

```markdown
```consumables
items:
  - label: "Health Potion"
    state_key: hero_hp_pots
    uses: 3
  - label: "Rage"
    state_key: hero_rage
    uses: "{{ frontmatter.rage_uses }}"
class: my-consumables
```
```

Alternative shapes:

```markdown
```consumables
label: "Health Potion"
state_key: hero_hp_pots
uses: 3
```
```

```markdown
```consumables
items:
  health_potion:
    label: "Health Potion"
    state_key: hero_hp_pots
    uses: 3
  rage:
    label: "Rage"
    state_key: hero_rage
    uses: "{{ frontmatter.rage_uses }}"
```
```

## Options

- `items` – list or map of items.
- `items[].label` – item label.
- `items[].state_key` – unique state key (stored as `dh:consumable:<state_key>` in local storage).
- `items[].uses` – number of boxes (can be a template).
- `label` / `state_key` / `uses` at root – shorthand for a single item.
- `class` – CSS class.
