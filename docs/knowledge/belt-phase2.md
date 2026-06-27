# Belt Knowledge Extraction - Phase 2

Date: 2026-06-26

Scope: one product only - leather belt.

This document follows the same structure as the Cardholder knowledge document. It is not implementation code. It records source-backed rules, engineering-derived rules, and rules that need master validation before becoming Pattern Engine defaults.

## Sources

1. Weaver Leather Supply, Belt Making hub: https://www.weaverleathersupply.com/pages/belt-making
2. Weaver Leather Supply, How to Attach a Belt Buckle to a Leather Belt: https://www.weaverleathersupply.com/pages/how-to-attach-a-belt-buckle-to-a-leather-belt
3. Weaver Leather Supply, Different Belt Buckle Types: https://www.weaverleathersupply.com/pages/different-types-of-belt-buckles-which-one-is-right-for-you
4. Weaver Leather Supply, How To Make Leather Straps: https://www.weaverleathersupply.com/pages/how-to-make-leather-straps-beginners-welcome
5. MakeSupply, How to Use Leather Templates: https://projects.makesupply.co/info/how-to-use-makesupply-leather-templates/

## Product Definition

A leather belt is a long strap-based product designed to fasten around the waist or another object, usually with a buckle, holes, keeper, tip shape, and optional decorative hardware.

Supported construction families found in open sources:

- single-layer belt blank with buckle;
- belt with heel-bar buckle and keeper;
- belt with center-bar buckle;
- belt with Conway buckle;
- belt with Chicago screws, rivets, or snaps;
- decorated belt with conchos;
- strap-only product that can become a belt, bag strap, guitar strap, or handle.

## User Inputs

- waist size or reference belt measurement;
- belt width;
- belt length preference;
- buckle type;
- buckle width;
- hole count;
- hole spacing;
- leather thickness/weight;
- tip style;
- keeper required or not;
- fastening method: Chicago screws, rivets, snaps, stitching;
- optional decoration count and placement.

## Pattern Engine Derived Parameters

- full strap length;
- center size hole position;
- additional adjustment hole positions;
- buckle fold zone;
- oblong slot position for prong;
- Chicago screw/rivet positions;
- keeper position;
- tip cut line;
- decoration positions;
- strap cutting layout;
- A4 tiling requirement if printed.

## Rule Records

### B-001 - Belt Blank Is a Pre-Cut Strip

Description: A belt blank is a pre-cut strip of leather; it may include pre-punched rivet holes, an oblong shape, edge paint, and a skived back to make buckle attachment easier.

Source: Weaver "How to Attach a Belt Buckle".

Formula:

```txt
beltBlank = strap + optionalPrepunchedHoles + optionalOblong + optionalSkive + optionalEdgeFinish
```

Variables:

- `strapWidth`;
- `strapLength`;
- `prepunchedHoles`;
- `oblongSlot`;
- `skiveZone`;
- `edgeFinish`.

Allowed ranges:

- Not numerically specified by source.

Applies when:

- The product starts from a bought or generated belt blank.

Does not apply when:

- The user cuts a raw strap without pre-processing.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### B-002 - Belt and Buckle Width Must Match

Description: The belt blank and buckle must match in width.

Source: Weaver "How to Attach a Belt Buckle".

Formula:

```txt
abs(strapWidth - buckleInternalWidth) <= fitTolerance
```

Variables:

- `strapWidth`;
- `buckleInternalWidth`;
- `fitTolerance`.

Allowed ranges:

- Source states the requirement; exact tolerance is hardware-dependent.

Applies when:

- Any belt uses a buckle.

Does not apply when:

- Strap product does not pass through hardware.

Confidence: `source-backed` for the requirement, `needs-master-validation` for tolerance.

Pattern Engine automation: yes.

### B-003 - Standard Belt Width Reference

Description: Weaver states standard belt width as 1.5 inches, while also emphasizing that width must match buckle width.

Source: Weaver "How to Attach a Belt Buckle".

Formula:

```txt
standardBeltWidth = 1.5 in = 38.1 mm
```

Variables:

- `strapWidth`.

Allowed ranges:

- 1.5 in is a standard reference, not universal.

Applies when:

- Default casual belt preset is needed.

Does not apply when:

- Dress belt, narrow strap, bag strap, watch strap, or custom buckle width.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### B-004 - Strap Cutter Width Capability

Description: Weaver states that a wooden strap cutter can handle straps from 1/8 inch to 4 inches wide.

Source: Weaver "How To Make Leather Straps".

Formula:

```txt
strapWidth in 0.125..4.0 in
strapWidthMm in 3.175..101.6 mm
```

Variables:

- `strapWidth`;
- `toolType`.

Allowed ranges:

- 1/8 in to 4 in for the referenced wooden strap cutter.

Applies when:

- The user plans to cut straps manually with a wooden strap cutter.

Does not apply when:

- Laser cutting, clicker die cutting, factory cutting, or a different strap cutter.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### B-005 - Strap Requires Straight Reference Edge

Description: Clean strap cutting starts from a straight edge. Weaver describes making a straight edge before cutting repeated straps.

Source: Weaver "How To Make Leather Straps".

Formula:

```txt
referenceEdgeStraightnessError <= maxStraightnessError
```

Variables:

- `referenceEdge`;
- `maxStraightnessError`;
- `strapLength`.

Allowed ranges:

- Error tolerance not specified by source.

Applies when:

- Generating cutting instructions or validating material layout.

Does not apply when:

- Using pre-cut belt blanks.

Confidence: `source-backed` for process, `needs-master-validation` for tolerance.

Pattern Engine automation: partial, mostly instruction/QA.

### B-006 - Firmer Leather Works Better for Straps

Description: Weaver notes that softer leather may not be ideal for straps, while firmer leather with body and thickness makes strapping easier.

Source: Weaver "How To Make Leather Straps".

Formula:

```txt
if productType == 'belt' then leatherTemper should be 'firm' or 'medium-firm'
```

Variables:

- `leatherTemper`;
- `strapUse`;
- `thickness`.

Allowed ranges:

- Temper categories are qualitative.

Applies when:

- Selecting material for belts or structural straps.

Does not apply when:

- Soft fashion straps, decorative straps, lined straps, or non-load-bearing accessories.

Confidence: `source-backed`.

Pattern Engine automation: partial, as recommendation/validation.

### B-007 - Heel Bar Buckle Requires Keeper

Description: A heel bar buckle requires a loop or belt keeper to hold down the tongue/strap.

Source: Weaver "Different Belt Buckle Types"; Weaver "How to Attach a Belt Buckle".

Formula:

```txt
if buckleType == 'heel-bar' then keeperRequired = true
```

Variables:

- `buckleType`;
- `keeperRequired`.

Allowed ranges:

- Boolean.

Applies when:

- Heel bar buckle is selected.

Does not apply when:

- Center bar buckle or Conway buckle is selected.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### B-008 - Center Bar Buckle Does Not Require Separate Keeper

Description: A center bar buckle can serve as the keeper itself, so a separate keeper is not required.

Source: Weaver "Different Belt Buckle Types"; Weaver "How to Attach a Belt Buckle".

Formula:

```txt
if buckleType == 'center-bar' then keeperRequired = false
```

Variables:

- `buckleType`;
- `keeperRequired`.

Allowed ranges:

- Boolean.

Applies when:

- Center bar buckle is selected.

Does not apply when:

- Heel bar buckle or buckle sets requiring separate components.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### B-009 - Two-Prong Buckle Requires Two Oblong Holes

Description: Weaver states that a two-pronged center bar buckle requires two oblong holes.

Source: Weaver "Different Belt Buckle Types".

Formula:

```txt
if buckleProngCount == 2 then oblongSlotCount = 2
```

Variables:

- `buckleProngCount`;
- `oblongSlotCount`;
- `slotSpacing`.

Allowed ranges:

- Slot spacing depends on buckle hardware.

Applies when:

- Two-prong buckle is selected.

Does not apply when:

- Single-prong buckle, trophy buckle, Conway buckle.

Confidence: `source-backed` for slot count, `needs-master-validation` for exact spacing.

Pattern Engine automation: yes.

### B-010 - Conway Buckle Uses a Line of Holes

Description: Weaver states that Conway buckles do not require keeper, oblong, screws, or snaps; they need a line of holes.

Source: Weaver "Different Belt Buckle Types".

Formula:

```txt
if buckleType == 'conway' then requiredFeatures = ['hole-line']
```

Variables:

- `buckleType`;
- `holeLine`;
- `holeSpacing`.

Allowed ranges:

- Hardware-specific.

Applies when:

- Conway buckle is selected.

Does not apply when:

- Heel bar, center bar, trophy buckle.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### B-011 - Waist Size Measurement From Existing Belt

Description: One method is measuring from the bend back to the most-used hole of an existing belt.

Source: Weaver "How to Attach a Belt Buckle".

Formula:

```txt
waistSize = distance(buckleBend, wornHoleCenter)
```

Variables:

- `buckleBend`;
- `wornHoleCenter`;
- `waistSize`.

Allowed ranges:

- Measurement method, not a range.

Applies when:

- User has an existing belt that fits.

Does not apply when:

- No reference belt exists.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### B-012 - Waist Size Measurement From Body

Description: Another method is measuring around the waist with a tape measure.

Source: Weaver "How to Attach a Belt Buckle".

Formula:

```txt
waistSize = bodyCircumferenceAtWearPosition
```

Variables:

- `bodyCircumference`;
- `wearPosition`.

Allowed ranges:

- User-entered.

Applies when:

- User does not have an existing belt reference.

Does not apply when:

- Product is not a waist belt.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### B-013 - Size Hole Is Measured From Bend Back

Description: Weaver instructs measuring from the bend back to mark the size hole.

Source: Weaver "How to Attach a Belt Buckle".

Formula:

```txt
centerHolePosition = waistSize measured from buckleBend
```

Variables:

- `buckleBend`;
- `waistSize`;
- `centerHolePosition`.

Allowed ranges:

- Depends on user waist size.

Applies when:

- Standard prong buckle belt.

Does not apply when:

- Conway buckle or non-hole fastening.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### B-014 - Hole Spacing Reference

Description: Weaver suggests 1.25 inches between holes.

Source: Weaver "How to Attach a Belt Buckle".

Formula:

```txt
holeSpacing = 1.25 in = 31.75 mm
```

Variables:

- `holeSpacing`;
- `holeCount`.

Allowed ranges:

- 1.25 in source-backed reference.

Applies when:

- Adjustment holes for prong buckle belts.

Does not apply when:

- Conway buckle, decorative holes, non-adjustable strap.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### B-015 - Five Adjustment Holes Reference

Description: Weaver recommends five total size holes: one inside usual measurement and three outside, with the usual measurement hole included.

Source: Weaver "How to Attach a Belt Buckle".

Formula:

```txt
holeOffsets = [-1, 0, +1, +2, +3] * holeSpacing
holeCount = 5
```

Variables:

- `holeCount`;
- `holeSpacing`;
- `centerHolePosition`.

Allowed ranges:

- Five holes is a recommendation, not a universal law.

Applies when:

- Beginner-friendly standard belt preset.

Does not apply when:

- Custom fashion belts, high-adjustment belts, tactical belts, Conway buckles.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### B-016 - Tip Cut Distance

Description: Weaver instructs marking the belt 3 inches from the last hole before cutting the tip.

Source: Weaver "How to Attach a Belt Buckle".

Formula:

```txt
tipCutStart = lastHoleCenter + 3 in
```

Variables:

- `lastHoleCenter`;
- `tipCutStart`;
- `tipStyle`.

Allowed ranges:

- 3 in source-backed reference.

Applies when:

- Standard belt tip after adjustment holes.

Does not apply when:

- Custom long tail, western belt, decorative tip hardware.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### B-017 - English Point Tip

Description: Weaver recommends an English point punch, or a manually scribed similar shape using a centered mark and circular edge.

Source: Weaver "How to Attach a Belt Buckle".

Formula:

```txt
tipShape = englishPoint(strapWidth)
```

Variables:

- `strapWidth`;
- `tipLength`;
- `tipRadius`.

Allowed ranges:

- Geometry details not specified.

Applies when:

- User selects English point belt tip.

Does not apply when:

- Square, round, tapered, or hardware-covered tip.

Confidence: `source-backed` for shape/process, `engineering-derived` for generated geometry.

Pattern Engine automation: yes.

### B-018 - Concho Equal Spacing

Description: Weaver suggests dividing the belt into equal sections for concho placement. Example: four conchos divide by five.

Source: Weaver "How to Attach a Belt Buckle".

Formula:

```txt
segmentCount = conchoCount + 1
spacing = decorationSpan / segmentCount
conchoPosition[i] = start + spacing * (i + 1)
```

Variables:

- `conchoCount`;
- `decorationSpan`;
- `spacing`;
- `start`;
- `end`.

Allowed ranges:

- Decoration span must be user-defined or derived from belt usable length.

Applies when:

- Adding equally spaced conchos.

Does not apply when:

- Asymmetric decoration or manual artwork layout.

Confidence: `source-backed` for equal division, `engineering-derived` for formula.

Pattern Engine automation: yes.

## Universal Knowledge

- material thickness matters;
- hardware compatibility matters;
- cut lines, hole marks, labels, and scale tests are reusable concepts;
- print/export format must preserve units;
- source-derived rules and maker-validated rules must be separated;
- geometry should be generated from normalized parameters.

## Belt-Specific Knowledge

- linear strap geometry dominates;
- buckle type changes required features;
- keeper requirement depends on buckle;
- belt size is measured from buckle bend to hole;
- hole spacing and tip distance are core product rules;
- leather temper is especially important for long straps.

## Algorithmizable Immediately

- strap width and length calculations;
- buckle/strap width compatibility warning;
- keeper requirement by buckle type;
- hole line generation;
- 1.25 in hole spacing preset;
- five-hole preset;
- tip position 3 in after last hole;
- concho equal spacing;
- export scaling and page/tile layout.

## Requires Expert Validation

- exact fit tolerance between strap and buckle;
- exact oblong slot dimensions per hardware;
- exact fold length per buckle style and leather thickness;
- rivet/screw spacing beyond pre-punched blank workflows;
- English point geometry for specific strap widths;
- leather thickness recommendations for load-bearing use;
- long-term stretch allowance.

## Not Extractable Reliably From Open Sources

- universal belt length formula across fashion, western, dress, and work belts;
- hardware-specific slot geometry without hardware spec sheets;
- strength calculations for rivets/screws/snaps;
- stretch compensation for different tannages and tempers;
- professional grading rules for belt sizes.

## Knowledge Needed From Masters Or Professional Literature

- leather stretch and break-in allowance;
- fold/skive geometry by thickness;
- buckle-specific drafting libraries;
- acceptable punch diameter by prong size;
- strength/safety margins for load-bearing belts;
- production tolerances for cutting and punching.

## Phase 2 Conclusion

Belt knowledge scales well from the Cardholder structure. It is simpler geometrically because it is mostly one-dimensional, but more dependent on hardware compatibility. A future Pattern Engine can automate a useful belt module quickly if hardware dimensions are explicit inputs or selected from a hardware catalog.
