# Traits & Abilities (`traits`, `ability`)

The traits/abilities block renders the six Daggerheart abilities as cards, optionally with per‑ability bonuses and notes.

## Basic usage

```markdown
```traits
# usually no YAML needed – reads from frontmatter + your traits config
```
```

By default, traits are built from your character frontmatter and internal helpers.

## Options

```markdown
```traits
bonuses:
  Agility: 1
  Strength: 2

notes:
  Agility: "From Emberborn ancestry"
  Strength: "From Warrior class"

show_markers: true   # gold checkmarks on each card
layout: row          # or grid (style-dependent)
class: my-traits     # optional CSS class
```
```

- `bonuses.<Ability>` – numeric bonus applied to that ability.
- `notes.<Ability>` – small note text under that ability.
- `show_markers` – show/hide the gold marker toggles.
- `layout` – layout hint (implementation may vary by theme).
- `class` – top‑level CSS class.

Aliases `ability`, `dh-ability`, and `dh-traits` are available if `traits` is taken by another plugin.
