# Domain & Equipment Pickers

## Domain Picker (`domainpicker`)

The `domainpicker` block helps manage which domain cards are in a character's **Vault** vs **Loadout**.

```markdown
```domainpicker
```
```

How it works:

- Reads your character note's frontmatter, including `level` and `domains`.
- Uses the Dataview plugin to find candidate domain card notes.
- Shows **Vault** and **Loadout** tables and lets you move cards between them.
- Token counts and max‑loadout behavior are configured via plugin settings.

## Equipment Picker (`equipmentpicker`)

Use the `equipmentpicker` block to manage your character's weapons, armor, and other gear between **Inventory** and **Equipped** lists.

```markdown
```equipmentpicker
# optional per-block overrides
# folders:
#   - "Cards/Equipment"
# enforce_tier: true   # use character tier to hide too-high-tier items
# view: table          # or "card" for card-style tiles
```
```

How it works:

- Reads your character note's frontmatter, including `tier`.
- Uses the Dataview plugin to discover equipment notes from folders or the global setting.
- Groups items into Weapons, Armor, Other.
- Lets you move items between Inventory and Equipped.
