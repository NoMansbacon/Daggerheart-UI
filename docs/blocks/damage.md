# Damage (`damage`)

The `damage` block is an inline calculator that applies damage to HP/Armor trackers and highlights major/severe thresholds.

```markdown
```damage
title: "Damage"

# Tracker keys
hp_key: din_health
armor_key: din_armor::{{ file.path }}

# thresholds – can be literals or templates/frontmatter driven
major_threshold: "{{ frontmatter.major_threshold }}"
severe_threshold: "{{ frontmatter.severe_threshold }}"

base_major: 3
base_severe: 6
level: "{{ frontmatter.level }}"

class: my-damage
```
```

## Threshold resolution

1. If `major_threshold` / `severe_threshold` are provided in the block (and templates resolve to numbers), those are used.
2. Otherwise, frontmatter aliases like `majorthreshold` / `severethreshold` (or `major_threshold` / `severe_threshold`) are used.
3. Otherwise, `base_major` / `base_severe` in the block are used.
4. In all cases, your `level` is added on top.

## Options

- `title` – heading text above the calculator.
- `hp_key`, `armor_key` – tracker state keys to update.
- `major_threshold`, `severe_threshold` – explicit values or templates.
- `base_major`, `base_severe` – fallback base thresholds.
- `level` – added to thresholds.
- `class` – CSS class.
