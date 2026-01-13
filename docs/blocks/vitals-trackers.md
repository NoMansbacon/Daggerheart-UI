# Vitals & Trackers

## Vitals grid (`vitals` / `vital-trackers`)

The `vitals` block shows HP, Stress, Armor, and Hope in a 2×2 tracker grid with persistent state.

```markdown
```vitals
hp: "{{ frontmatter.hp }}"        # or a literal number
stress: "{{ frontmatter.stress }}"
armor: "{{ frontmatter.armor }}"
hope: 6                            # defaults to 6 if omitted

hp_label: HP
stress_label: Stress
armor_label: Armor
hope_label: Hope

# Optional storage keys (for cross‑note sharing)
hp_key: din_health
stress_key: din_stress::{{ file.path }}
armor_key: din_armor::{{ file.path }}
hope_key: din_hope::{{ file.path }}

# Optional hope footer / feature rows
hope_feature:
  - label: "Hope Feature"
    value: "{{ frontmatter.hope_feature }}"

class: my-vitals
```
```

**Options**

- `hp`, `stress`, `armor`, `hope` – number of boxes (literal or template).
- `<type>_label` – label text.
- `<type>_key` – state keys used by the shared store so other blocks (rest, damage, etc.) can find/update trackers.
- `hope_feature` – rows rendered under Hope.
- `class` – CSS class on the container.

## Individual trackers (`hp`, `stress`, `armor`, `hope`)

```markdown
```hp
label: HP
state_key: din_health
uses: "{{ frontmatter.hp }}"   # or hp: 8
class: my-hp
```

```stress
label: Stress
state_key: din_stress::{{ file.path }}
uses: "{{ frontmatter.stress }}"
```
```

- `label` – label for the row.
- `state_key` – key in the state store.
- `uses` *or* the type‑specific key (`hp`, `stress`, `armor`, `hope`) – number of boxes.
- `class` – optional CSS class.

`hope` trackers default to 6 boxes if `uses` is omitted.
