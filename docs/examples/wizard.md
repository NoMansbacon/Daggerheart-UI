# Wizard Example Character Sheet (School of Knowledge)

This example shows a complete level 1 Wizard (School of Knowledge) character sheet written as a single Obsidian note using DH-UI blocks.
All rules choices (class, ancestry, community, and domain cards) are drawn from the Daggerheart SRD.

````markdown
---
name: Elira Highstar
class: Wizard
subclass: School of Knowledge
ancestry: Human
community: Highborne
heritage: "Human (Highborne)"
level: 1
tier: 1

# Core stats
hp_max: 5          # Wizard starting HP
stress_max: 6
armor_slots: 0
hope_max: 6

# Domains and domain cards (level 1 Wizard, Codex & Splendor)
domains:
  - Codex
  - Splendor

vault:
  - "[[BOOK OF TYFAR]]"       # Codex, Level 1 Grimoire
  - "[[MENDING TOUCH]]"       # Splendor, Level 1 Spell
loadout:
  - "[[BOOK OF TYFAR]]"
  - "[[MENDING TOUCH]]"

evasion: 11        # Wizard starting Evasion
spellcast_trait: Knowledge
---

# {{ frontmatter.name }}

```badges
items:
  - label: Character
    value: "{{ frontmatter.name }}"
  - label: Class
    value: "{{ frontmatter.class }}"
  - label: Subclass
    value: "{{ frontmatter.subclass }}"
  - label: Heritage
    value: "{{ frontmatter.ancestry }} ({{ frontmatter.community }})"
  - label: Level
    value: "{{ frontmatter.level }}"
  - label: Evasion
    value: "{{ frontmatter.evasion }}"
  - label: Spellcast Trait
    value: "{{ frontmatter.spellcast_trait }}"
```

---

## Traits

```traits
abilities:
  Agility: 0
  Strength: -1
  Finesse: 1
  Instinct: 0
  Presence: 1
  Knowledge: 2

bonuses:
  Knowledge: 1    # from School of Knowledge training
  Presence: 1     # from Highborne upbringing
```

These values are just an example; assign trait points per the SRD and adjust the YAML above to match your build.

---

## Vitals

```vitals
hp_label: "HP"
stress_label: "Stress"
armor_label: "Armor"
hope_label: "Hope"

hp: "{{ frontmatter.hp_max }}"
stress: "{{ frontmatter.stress_max }}"
armor: "{{ frontmatter.armor_slots }}"
hope: "{{ frontmatter.hope_max }}"

hp_key: "din_health::Characters/Elira"
stress_key: "din_stress::Characters/Elira"
armor_key: "din_armor::Characters/Elira"
hope_key: "din_hope::Characters/Elira"

hope_feature:
  - label: "Not This Time (Wizard Hope Feature)"
    value: "Spend 3 Hope to force an adversary within Far range to reroll an attack or damage roll."
```

This block renders HP, Stress, Armor, and Hope trackers that other blocks (rest, damage, etc.) will interact with using the same keys.

---

## Rest & Level Up controls

```rest
rest_label: "Rest"
short_label: "Short Rest"
long_label: "Long Rest"
levelup_label: "Level Up"

show_short: true
show_long: true
show_levelup: true
show_full_heal: true
show_reset_all: true

hp_key: "din_health::Characters/Elira"
stress_key: "din_stress::Characters/Elira"
armor_key: "din_armor::Characters/Elira"
hope_key: "din_hope::Characters/Elira"

max_picks: 2
```

Place this block under your `vitals` block so it can auto-detect the trackers. The Level Up button will open DH-UIs Level Up modal for this note.

---

## Features (heritage, class, subclass)

```features
styleClass: dh-features--character-sheet
layout: grid

ancestry:
  - from: "Human"
    label: "High Stamina"
    value: "Your human endurance grants you an extra Stress slot at character creation."
  - from: "Human"
    label: "Adaptability"
    value: "When an Experience roll goes badly, you can mark Stress to try again."

community:
  - from: "Highborne"
    label: "Privilege"
    value: "You have an easier time dealing with nobles and merchants thanks to your highborn reputation."

class:
  - from: "Wizard"
    label: "Prestidigitation"
    value: "You can create small, harmless magical effects at will: light, sounds, minor illusions, and similar tricks."
  - from: "Wizard"
    label: "Strange Patterns"
    value: "You choose a number on your Duality Dice; when you roll it, you may gain Hope or clear Stress."

subclass:
  - from: "School of Knowledge"
    tier: "Foundation"
    label: "Prepared"
    value: "You begin play with one extra domain card of your level or lower from Codex or Splendor."
  - from: "School of Knowledge"
    tier: "Foundation"
    label: "Adept"
    value: "When you Utilize an Experience, you can mark Stress instead of spending Hope to greatly increase its effect."
```

This block summarizes the ancestry, community, class, and subclass features that Elira has at level 1, matching the SRD Wizard (School of Knowledge).

---

## Experiences

```experiences
items:
  - name: "Arcane Apprentice"
    note: "You studied under a strict mentor who taught you to respect dangerous magic."
    bonus: +2

  - name: "Court Tutor"
    note: "You once served as a magical tutor to a Highborne heir, learning the politics of the court."
    bonus: +1
```

These are homebrew experiences, but they work with the SRD rule that Wizards can Utilize an Experience (and School of Knowledges Adept feature modifies that move).

---

## Domain cards summary

```badges
items:
  - label: "Codex Card"
    value: "BOOK OF TYFAR (Level 1 Codex Grimoire)"
  - label: "Splendor Card"
    value: "MENDING TOUCH (Level 1 Splendor Spell)"
```

This badge block just summarizes the two domain cards Elira has chosen at level 1.
The actual card notes would live elsewhere in your vault and be managed with the Domain Picker.

---

## Optional: Consumables & equipment

You can add consumables or equipment blocks if you want to track items from the SRD (like Minor Health Potions or a Shortsword) on the same sheet:

```consumables
items:
  - label: "Minor Health Potion"
    state_key: "elira_minor_health_potions"
    uses: 2
  - label: "Stride Potion"
    state_key: "elira_stride_potions"
    uses: 1
```

```equipmentpicker
# folders:
#   - "Cards/Equipment"
# enforce_tier: true
# view: table
```

These are optional; they demonstrate how DH-UI can also track consumables and let you manage weapons/armor for a Wizard whose core mechanics still follow the SRD.
````
