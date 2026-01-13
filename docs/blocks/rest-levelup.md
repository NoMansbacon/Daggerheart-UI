# Rest & Level Up (`rest`)

The `rest` block provides a Rest row with buttons and a combined **Rest modal** for short/long rests plus Level Up and reset actions.

## Basic rest row

```markdown
```rest
rest_label: "Rest"
levelup_label: "Level Up"
full_heal_label: "Full Heal"
reset_all_label: "Reset All"

# Auto‑detects trackers from visible vitals/trackers in the note by default
# but you can override with explicit keys:
# hp_key: din_health
# stress_key: din_stress::{{ file.path }}
# armor_key: din_armor::{{ file.path }}
# hope_key: din_hope::{{ file.path }}

show_short: true
show_long: true
show_levelup: true
show_full_heal: true
show_reset_all: true

max_picks: 2        # max actions allowed per rest in the modal
class: my-rest-row
```
```

### Buttons

- **Rest** – opens the combined rest modal.
- **Short / Long rest** – shortcuts into the relevant column of the same modal.
- **Level Up** – opens the Level Up chooser modal.
- **Full Heal** – scans visible HP trackers and fills them.
- **Reset All** – resets HP/Stress/Armor/Hope trackers.

### Options

- Labels: `rest_label`, `levelup_label`, `full_heal_label`, `reset_all_label`.
- Visibility: `show_short`, `show_long`, `show_levelup`, `show_full_heal`, `show_reset_all`.
- Tracker keys: `hp_key`, `stress_key`, `armor_key`, `hope_key`.
- `max_picks` – how many rest moves can be selected per rest (default 2).
- `class` – CSS class on the row.

Legacy `short-rest` / `long-rest` fenced blocks have been removed; always use `rest`.

See the **Level Up & multiclassing** section of the Usage Guide for what the Level Up modal actually changes in frontmatter.
