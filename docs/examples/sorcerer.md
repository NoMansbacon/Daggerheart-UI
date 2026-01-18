# Wizard Example Character Sheet (School of Knowledge)

This example shows a complete level 1 Sorcerer (Primal Origin) character sheet written as a single Obsidian note using DH-UI blocks.
All rules choices (class, ancestry, community, and domain cards) are drawn from the Daggerheart SRD.

````markdown
---
name: Marlowe Fairwind
class: Sorcerer
subclass: Primal Origin
ancestry: Elf
heritage: Loreborne
level: 1
tier: 1
hp_max: 6
stress_max: 6
armor_slots: 3
hope_max: 6
domains:
  - arcana
  - midnight
vault:
loadout:
  - "[[DH_Compendium/abilities/Arcana/Unleash Chaos.md]]"
  - "[[DH_Compendium/abilities/Midnight/Rain of Blades.md]]"
evasion: 10
spellcast_trait: Instinct
equipped:
  - "[[DH_Compendium/equipment/weapons/Tier 1/Dualstaff.md]]"
  - "[[DH_Compendium/equipment/armor/Tier 1/Leather Armor.md]]"
---

# Marlowe Fairwind

```badges
items:
  - label: Character
    value: "{{ frontmatter.name }}"
  - label: Class
    value: "{{ frontmatter.class }}"
  - label: Subclass
    value: "{{ frontmatter.subclass }}"
  - label: Heritage
    value: "{{ frontmatter.ancestry }} ({{ frontmatter.heritage }})"
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
  Instinct: 2
  Presence: 1
  Knowledge: 0

bonuses:

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
  - label: "Volatile Magic:"
    value: "Spend 3 Hope to reroll any number of your damage dice on an attack that deals magic damage."
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
  - from: "Elf"
    label: "Quick Reactions"
    value: "Mark a Stress to gain advantage on a reaction roll."
  - from: "Elf"
    label: "Celestial Trance"
    value: "During a rest, you can drop into a trance to choose an additional downtime move."

community:
  - from: "Loreborne"
    label: "Well‑Read"
    value: "You have advantage on rolls that involve the history, culture, or politics of a prominent person or place."

class:
  - from: "Sorcerer"
    label: "Arcane Sence"
    value: "You can sense the presence of magical people and objects within Close range."
  - from: "Sorcerer"
    label: "Minor Illusion"
    value: "Make a Spellcast Roll (10). On a success, you create a minor visual illusion no larger than yourself within Close range. This illusion is convincing to anyone at Close range or farther."
  - from: "Sorcerer"
    label: "Channel Raw Power"
    value: |
      Once per long rest, you can place a domain card from your loadout into your vault and choose to either:
      - Gain Hope equal to the level of the card.
      - Enhance a spell that deals damage, gaining a bonus to your damage roll equal to twice the level of the card.

subclass:
  - from: "Primal Origin"
    tier: "Foundation"
    label: "Manipulate Magic"
    value: |
     Your primal origin allows you to modify the essence of magic itself. After you cast a spell or make an attack using a weapon that deals magic damage, you can mark a Stress to do one of the following:
      - Extend the spell or attack’s reach by one range
      - Gain a +2 bonus to the action roll’s result 
      - Double a damage die of your choice
      - Hit an additional target within range
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

```domainpicker
```

This badge block just summarizes the two domain cards Elira has chosen at level 1.
The actual card notes would live elsewhere in your vault and be managed with the Domain Picker.

---

## Optional: Consumables & equipment

You can add consumables or equipment blocks if you want to track items from the SRD (like Minor Health Potions or a Shortsword) on the same sheet:

```consumables
items:
  - label: "Minor Stamina Potion (Clear 1d4 Stress)"
    state_key: "marlowe_minor_stamina_potions"
    uses: 1
```

```equipmentpicker
```

These are optional; they demonstrate how DH-UI can also track consumables and let you manage weapons/armor for a Wizard whose core mechanics still follow the SRD.
