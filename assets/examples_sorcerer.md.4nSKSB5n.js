import{_ as s,c as n,o as e,ag as p}from"./chunks/framework.BpVvFBTM.js";const d=JSON.parse('{"title":"Marlowe Fairwind","description":"","frontmatter":{"name":"Marlowe Fairwind","class":"Sorcerer","subclass":"Primal Origin","ancestry":"Elf","heritage":"Loreborne","level":1,"tier":1,"hp":6,"stress":6,"armor":3,"hope":6,"major_threshold":"6","severe_threshold":"13","domains":["arcana","midnight"],"vault":null,"loadout":["[[DH_Compendium/abilities/Arcana/Unleash Chaos.md]]","[[DH_Compendium/abilities/Midnight/Rain of Blades.md]]"],"evasion":10,"spellcast_trait":"Instinct","equipped":["[[DH_Compendium/equipment/weapons/Tier 1/Dualstaff.md]]","[[DH_Compendium/equipment/armor/Tier 1/Leather Armor.md]]"]},"headers":[],"relativePath":"examples/sorcerer.md","filePath":"examples/sorcerer.md"}'),l={name:"examples/sorcerer.md"};function t(i,a,o,r,c,h){return e(),n("div",null,[...a[0]||(a[0]=[p(`<h1 id="marlowe-fairwind" tabindex="-1">Marlowe Fairwind <a class="header-anchor" href="#marlowe-fairwind" aria-label="Permalink to &quot;Marlowe Fairwind&quot;">​</a></h1><div class="language-badges vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">badges</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>styleClass:</span></span>
<span class="line"><span>items:</span></span>
<span class="line"><span>  - label: Character</span></span>
<span class="line"><span>    value: &quot;{{ frontmatter.name }}&quot;</span></span>
<span class="line"><span>  - label: Class</span></span>
<span class="line"><span>    value: &quot;{{ frontmatter.class }}&quot;</span></span>
<span class="line"><span>  - label: Subclass</span></span>
<span class="line"><span>    value: &quot;{{ frontmatter.subclass }}&quot;</span></span>
<span class="line"><span>  - label: Heritage</span></span>
<span class="line"><span>    value: &quot;{{ frontmatter.ancestry }} ({{ frontmatter.heritage }})&quot;</span></span>
<span class="line"><span>  - label: Level</span></span>
<span class="line"><span>    value: &quot;{{ frontmatter.level }}&quot;</span></span>
<span class="line"><span>  - label: Evasion</span></span>
<span class="line"><span>    value: &quot;{{ frontmatter.evasion }}&quot;</span></span>
<span class="line"><span>  - label: Spellcast Trait</span></span>
<span class="line"><span>    value: &quot;{{ frontmatter.spellcast_trait }}&quot;</span></span></code></pre></div><hr><h2 id="traits" tabindex="-1">Traits <a class="header-anchor" href="#traits" aria-label="Permalink to &quot;Traits&quot;">​</a></h2><div class="language-traits vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">traits</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>styleClass:</span></span>
<span class="line"><span>abilities:</span></span>
<span class="line"><span>  Agility: 0</span></span>
<span class="line"><span>  Strength: -1</span></span>
<span class="line"><span>  Finesse: 1</span></span>
<span class="line"><span>  Instinct: 2</span></span>
<span class="line"><span>  Presence: 1</span></span>
<span class="line"><span>  Knowledge: 0</span></span>
<span class="line"><span></span></span>
<span class="line"><span>bonuses:</span></span></code></pre></div><p>These values are just an example; assign trait points per the SRD and adjust the YAML above to match your build.</p><hr><h2 id="vitals" tabindex="-1">Vitals <a class="header-anchor" href="#vitals" aria-label="Permalink to &quot;Vitals&quot;">​</a></h2><div class="language-vitals vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">vitals</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>styleClass:</span></span>
<span class="line"><span>hp_label: &quot;HP&quot;</span></span>
<span class="line"><span>stress_label: &quot;Stress&quot;</span></span>
<span class="line"><span>armor_label: &quot;Armor&quot;</span></span>
<span class="line"><span>hope_label: &quot;Hope&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>hp: &quot;{{ frontmatter.hp }}&quot;</span></span>
<span class="line"><span>stress: &quot;{{ frontmatter.stress }}&quot;</span></span>
<span class="line"><span>armor: &quot;{{ frontmatter.armor }}&quot;</span></span>
<span class="line"><span>hope: &quot;{{ frontmatter.hope }}&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>hp_key: &quot;din_health::Characters/Marlowe&quot;</span></span>
<span class="line"><span>stress_key: &quot;din_stress::Characters/Marlowe&quot;</span></span>
<span class="line"><span>armor_key: &quot;din_armor::Characters/Marlowe&quot;</span></span>
<span class="line"><span>hope_key: &quot;din_hope::Characters/Marlowe&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>hope_feature:</span></span>
<span class="line"><span>  - label: &quot;Volatile Magic:&quot;</span></span>
<span class="line"><span>    value: &quot;Spend 3 Hope to reroll any number of your damage dice on an attack that deals magic damage.&quot;</span></span></code></pre></div><p>This block renders HP, Stress, Armor, and Hope trackers that other blocks (rest, damage, etc.) will interact with using the same keys.</p><hr><h2 id="damage" tabindex="-1">Damage <a class="header-anchor" href="#damage" aria-label="Permalink to &quot;Damage&quot;">​</a></h2><div class="language-damage vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">damage</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>styleClass:</span></span>
<span class="line"><span>title: &quot;Damage&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span># Use the same keys as the vitals block so damage updates Marlowe&#39;s trackers</span></span>
<span class="line"><span>hp_key: &quot;din_health::Characters/Marlowe&quot;</span></span>
<span class="line"><span>armor_key: &quot;din_armor::Characters/Marlowe&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span># thresholds – these override base_major/base_severe when present</span></span>
<span class="line"><span>major_threshold: &quot;{{ frontmatter.major_threshold }}&quot;</span></span>
<span class="line"><span>severe_threshold: &quot;{{ frontmatter.severe_threshold }}&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span># fallback base thresholds if frontmatter is missing</span></span>
<span class="line"><span>base_major: 3</span></span>
<span class="line"><span>base_severe: 6</span></span></code></pre></div><p>This block lets you enter a damage amount (and Armor used) and then applies the resulting tiered damage directly to your existing HP and Armor trackers, using the same state keys as your vitals block.</p><hr><h2 id="rest-level-up-controls" tabindex="-1">Rest &amp; Level Up controls <a class="header-anchor" href="#rest-level-up-controls" aria-label="Permalink to &quot;Rest &amp; Level Up controls&quot;">​</a></h2><div class="language-rest vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">rest</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>styleClass:</span></span>
<span class="line"><span>rest_label: &quot;Rest&quot;</span></span>
<span class="line"><span>short_label: &quot;Short Rest&quot;</span></span>
<span class="line"><span>long_label: &quot;Long Rest&quot;</span></span>
<span class="line"><span>levelup_label: &quot;Level Up&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>show_short: true</span></span>
<span class="line"><span>show_long: true</span></span>
<span class="line"><span>show_levelup: true</span></span>
<span class="line"><span>show_full_heal: true</span></span>
<span class="line"><span>show_reset_all: true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>hp_key: &quot;din_health::Characters/Marlowe&quot;</span></span>
<span class="line"><span>stress_key: &quot;din_stress::Characters/Marlowe&quot;</span></span>
<span class="line"><span>armor_key: &quot;din_armor::Characters/Marlowe&quot;</span></span>
<span class="line"><span>hope_key: &quot;din_hope::Characters/Marlowe&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>max_picks: 2</span></span></code></pre></div><p>Place this block under your <code>vitals</code> block so it can auto-detect the trackers. The Level Up button will open DH-UI&#39;s Level Up modal for this note.</p><hr><h2 id="features-heritage-class-subclass" tabindex="-1">Features (heritage, class, subclass) <a class="header-anchor" href="#features-heritage-class-subclass" aria-label="Permalink to &quot;Features (heritage, class, subclass)&quot;">​</a></h2><div class="language-features vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">features</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>styleClass:</span></span>
<span class="line"><span>layout: grid</span></span>
<span class="line"><span></span></span>
<span class="line"><span>ancestry:</span></span>
<span class="line"><span>  - from: &quot;Elf&quot;</span></span>
<span class="line"><span>    label: &quot;Quick Reactions&quot;</span></span>
<span class="line"><span>    value: &quot;Mark a Stress to gain advantage on a reaction roll.&quot;</span></span>
<span class="line"><span>  - from: &quot;Elf&quot;</span></span>
<span class="line"><span>    label: &quot;Celestial Trance&quot;</span></span>
<span class="line"><span>    value: &quot;During a rest, you can drop into a trance to choose an additional downtime move.&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>community:</span></span>
<span class="line"><span>  - from: &quot;Loreborne&quot;</span></span>
<span class="line"><span>    label: &quot;Well‑Read&quot;</span></span>
<span class="line"><span>    value: &quot;You have advantage on rolls that involve the history, culture, or politics of a prominent person or place.&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>class:</span></span>
<span class="line"><span>  - from: &quot;Sorcerer&quot;</span></span>
<span class="line"><span>    label: &quot;Arcane Sence&quot;</span></span>
<span class="line"><span>    value: &quot;You can sense the presence of magical people and objects within Close range.&quot;</span></span>
<span class="line"><span>  - from: &quot;Sorcerer&quot;</span></span>
<span class="line"><span>    label: &quot;Minor Illusion&quot;</span></span>
<span class="line"><span>    value: &quot;Make a Spellcast Roll (10). On a success, you create a minor visual illusion no larger than yourself within Close range. This illusion is convincing to anyone at Close range or farther.&quot;</span></span>
<span class="line"><span>  - from: &quot;Sorcerer&quot;</span></span>
<span class="line"><span>    label: &quot;Channel Raw Power&quot;</span></span>
<span class="line"><span>    value: |</span></span>
<span class="line"><span>      Once per long rest, you can place a domain card from your loadout into your vault and choose to either:</span></span>
<span class="line"><span>      - Gain Hope equal to the level of the card.</span></span>
<span class="line"><span>      - Enhance a spell that deals damage, gaining a bonus to your damage roll equal to twice the level of the card.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>subclass:</span></span>
<span class="line"><span>  - from: &quot;Primal Origin&quot;</span></span>
<span class="line"><span>    tier: &quot;Foundation&quot;</span></span>
<span class="line"><span>    label: &quot;Manipulate Magic&quot;</span></span>
<span class="line"><span>    value: |</span></span>
<span class="line"><span>     Your primal origin allows you to modify the essence of magic itself. After you cast a spell or make an attack using a weapon that deals magic damage, you can mark a Stress to do one of the following:</span></span>
<span class="line"><span>      - Extend the spell or attack’s reach by one range</span></span>
<span class="line"><span>      - Gain a +2 bonus to the action roll’s result </span></span>
<span class="line"><span>      - Double a damage die of your choice</span></span>
<span class="line"><span>      - Hit an additional target within range</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  - from: &quot;Primal Origin&quot;</span></span>
<span class="line"><span>    tier: &quot;Specialization&quot;</span></span>
<span class="line"><span>    label: &quot;Enchanted Aid&quot;</span></span>
<span class="line"><span>    value: &quot;You can enhance the magic of others with your essence. When you Help an Ally with a Spellcast Roll, you can roll a d8 as your advantage die. Once per long rest, after an ally has made a Spellcast Roll with your help, you can swap the results of their Duality Dice.&quot;</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>  - from: &quot;Primal Origin&quot;</span></span>
<span class="line"><span>    tier: &quot;Mastery&quot;</span></span>
<span class="line"><span>    label: &quot;Arcane Charge&quot;</span></span>
<span class="line"><span>    value: &quot;You can gather magical energy to enhance your capabilities. When you take magic damage, you become Charged. Alternatively, you can spend 2 Hope to become Charged. When you successfully make an attack that deals magic damage while Charged, you can clear your Charge to either gain a +10 bonus to the damage roll or gain a +3 bonus to the Difficulty of a reaction roll the spell causes the target to make. You stop being Charged at your next long rest.&quot;</span></span></code></pre></div><p>This block summarizes the ancestry, community, class, and subclass features that Marlowe has at level 1, matching the SRD Sorcerer (Primal Origin).</p><hr><h2 id="experiences" tabindex="-1">Experiences <a class="header-anchor" href="#experiences" aria-label="Permalink to &quot;Experiences&quot;">​</a></h2><div class="language-experiences vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">experiences</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>styleClass:</span></span>
<span class="line"><span>items:</span></span>
<span class="line"><span>  - name: &quot;Storm-Born&quot;</span></span>
<span class="line"><span>    note: &quot;You survived a violent storm as a child; since then, thunder and wind answer your emotions.&quot;</span></span>
<span class="line"><span>    bonus: +2</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  - name: &quot;Whispers of the Wild&quot;</span></span>
<span class="line"><span>    note: &quot;Spirits of stone, root, and river sometimes speak in the edge of your hearing, guiding your steps.&quot;</span></span>
<span class="line"><span>    bonus: +2</span></span></code></pre></div><p>These are homebrew experiences, but they work with the SRD rule that Sorcerer can Utilize an Experience (and Primal Origin Adept feature modifies that move).</p><hr><h2 id="domain-cards-summary" tabindex="-1">Domain cards summary <a class="header-anchor" href="#domain-cards-summary" aria-label="Permalink to &quot;Domain cards summary&quot;">​</a></h2><div class="language-domainpicker vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">domainpicker</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span># Only look for Domain cards under these folders:</span></span>
<span class="line"><span>folders:</span></span>
<span class="line"><span>  - DH_Compendium/abilities/Arcana</span></span>
<span class="line"><span>  - DH_Compendium/abilities/Midnight</span></span>
<span class="line"><span># Modal view for picking cards: &#39;card&#39; or &#39;table (no art)&#39;</span></span>
<span class="line"><span>view: table</span></span>
<span class="line"><span># Per-block override for max equipped Domain cards</span></span>
<span class="line"><span>max_loadout: 5</span></span>
<span class="line"><span># Use the character&#39;s level and domains frontmatter for default filters</span></span>
<span class="line"><span>use_character_filters: true</span></span></code></pre></div><p>This badge block just summarizes the two domain cards Marlowe has chosen at level 1. The actual card notes would live elsewhere in your vault and be managed with the Domain Picker.</p><hr><h2 id="consumables" tabindex="-1">Consumables <a class="header-anchor" href="#consumables" aria-label="Permalink to &quot;Consumables&quot;">​</a></h2><p>You can add a <code>consumables</code> block if you want to track anything and the number of uses it has (like having 3 Minor Health Potions in your inventory) on the same sheet:</p><div class="language-yaml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yaml</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">consumables</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">styleClass</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">items</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  - </span><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">label</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;Minor Health Potion (1d4)&quot;</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">    state_key</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;din_minor_health_single&quot;</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">    uses</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">3</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`</span></span></code></pre></div><hr><div class="language-yaml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yaml</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">equipmentpicker</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># optional per-block overrides</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">folders</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  - </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;DH_Compendium/equipment&quot;</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">enforce_tier</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">   # default: use character tier to hide too-high-tier items</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">view</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">table</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">          # or &quot;card&quot; for card-style tiles</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`</span></span></code></pre></div><p>These are to demonstrate how DH-UI can also track consumables and let you manage weapons/armor for a character.</p>`,37)])])}const m=s(l,[["render",t]]);export{d as __pageData,m as default};
