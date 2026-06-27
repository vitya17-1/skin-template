# Cardholder Knowledge Extraction - Phase 1

Date: 2026-06-26

Scope: one product only - leather cardholder.

This document is not implementation code. It is the first engineering knowledge base for a future Pattern Engine. Rules are grouped by confidence:

- `source-backed` - directly supported by a referenced source.
- `engineering-derived` - derived from source-backed facts plus geometry/manufacturing logic.
- `needs-master-validation` - plausible leathercraft rule, but should be validated by an experienced maker or physical prototype before production use.

## Sources

1. ISO/IEC 7810 ID-1 reference: https://en.wikipedia.org/wiki/ISO/IEC_7810
2. MakeSupply, How to Use Leather Templates: https://projects.makesupply.co/info/how-to-use-makesupply-leather-templates/
3. MakeSupply, Free Card Holder Templates: https://projects.makesupply.co/templates/free-card-holder-templates-pdf/
4. MakeSupply, Free 5 Pocket Card Holder Pattern: https://projects.makesupply.co/templates/free-5-pocket-card-holder-pattern-diy-pdf/
5. MakeSupply, Folded Leather Card Holder: https://projects.makesupply.co/templates/make-a-folded-leather-card-holder-free-template-build-along-video-tutorial/
6. MakeSupply, No-Stitch Leather Card Holder: https://projects.makesupply.co/templates/no-stitch-leather-card-holder-free-pdf/
7. MakeSupply, Minimalist Leather Wallet Pattern / Slim Card Holder: https://projects.makesupply.co/templates/make-a-simple-minimalist-wallet-free-pdf-pattern/
8. MakeSupply, Leather Card Holder with Flap: https://projects.makesupply.co/templates/leather-card-holder-with-flap-free-pdf/
9. MakeSupply, Quick Tip: Adding A Crease To Your Card Slots: https://projects.makesupply.co/leathercraft-tutorials/quick-tip-adding-a-crease-to-your-card-slots/

## Product Definition

Cardholder means a small leather goods pattern intended to hold ID-1 cards such as credit cards, debit cards, identity cards, and loyalty cards.

Supported construction families found in open sources:

- folded single-body cardholder;
- stitched 3-pocket cardholder;
- stitched 5-pocket cardholder;
- slim minimalist cardholder;
- no-stitch folded/fastened cardholder;
- flap cardholder.

This phase does not attempt to extract or copy any commercial pattern geometry. It extracts reusable engineering principles.

## Rule Records

### R-001 - Card Size Baseline

Description: A cardholder intended for standard credit cards must be dimensioned around the ID-1 card size.

Source: ISO/IEC 7810 ID-1 reference.

Formula:

```txt
CARD_W = 85.60 mm
CARD_H = 53.98 mm
CARD_R = 2.88..3.48 mm
```

Variables:

- `CARD_W` - card width;
- `CARD_H` - card height;
- `CARD_R` - card corner radius.

Allowed ranges:

- Fixed for ID-1 cards.

Applies when:

- The cardholder is designed for bank cards, ID cards, loyalty cards, or similar ID-1 cards.

Does not apply when:

- The product is for business cards, passports, folded cash, SIM cards, or non-ID-1 cards.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### R-002 - Print-Ready PDF Format

Description: Printable leather templates should be generated for standard home print formats and preserve real physical scale.

Source: MakeSupply "How to Use Leather Templates".

Formula:

```txt
A4 = 210 mm x 297 mm
US_LETTER = 8.5 in x 11 in
```

Variables:

- `pageFormat`;
- `pageOrientation`;
- `scale`.

Allowed ranges:

- `pageFormat`: A4 or US Letter for home printing.
- `scale`: 100%.

Applies when:

- Output is a print-ready PDF template.

Does not apply when:

- Output is only CNC, laser, DXF, SVG, or acrylic template production.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### R-003 - Scale Test Requirement

Description: Every generated PDF should include a physical scale test that the user can measure after printing.

Source: MakeSupply "How to Use Leather Templates".

Formula:

```txt
metricScaleBox = 25 mm x 25 mm
imperialScaleBox = 1 in x 1 in
```

Variables:

- `scaleTestMetric`;
- `scaleTestImperial`;
- `printedScale`.

Allowed ranges:

- Printed measurement error should be close to 0. Practical tolerance should be defined later.

Applies when:

- Any PDF is intended for printing and tracing/cutting.

Does not apply when:

- The generated file is only used digitally and never printed.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### R-004 - Print at 100 Percent / Actual Size

Description: The generated PDF must tell the user to print at 100% or actual size, with auto-scale disabled.

Source: MakeSupply template guide and No-Stitch Card Holder page.

Formula:

```txt
printerScale = 100%
autoScale = false
```

Variables:

- `printerScale`;
- `autoScale`.

Allowed ranges:

- `printerScale` must be 100% for reliable pattern dimensions.

Applies when:

- The PDF is printed on a home or office printer.

Does not apply when:

- The template is exported to a production workflow that controls units directly.

Confidence: `source-backed`.

Pattern Engine automation: yes, as PDF metadata/instruction text and validation reminder.

### R-005 - Leather Thickness Must Match Design

Description: Cardholder patterns are sensitive to leather weight. If the leather is much thinner or thicker than the design target, the final object may not behave as expected.

Source: MakeSupply template guide.

Formula:

```txt
abs(userThickness - designThickness) <= thicknessTolerance
```

Variables:

- `userThickness`;
- `designThickness`;
- `thicknessTolerance`.

Allowed ranges:

- Exact tolerance is not source-defined.

Applies when:

- The user inputs leather thickness.

Does not apply when:

- The pattern is only being used as a non-functional visual exercise.

Confidence: `source-backed` for the dependency, `needs-master-validation` for exact tolerance.

Pattern Engine automation: yes, as warning/validation.

### R-006 - Common Cardholder Leather Weight

Description: Several cardholder templates recommend or use leather around 3-4 oz, approximately 1.2-1.4 mm, especially for slim stitched designs.

Source: MakeSupply 5 Pocket Card Holder; Minimalist Leather Wallet / Slim Card Holder.

Formula:

```txt
recommendedThickness = 1.2..1.4 mm
```

Variables:

- `leatherThicknessMm`.

Allowed ranges:

- Strong recommendation: 1.2-1.4 mm for slim cardholders.
- Upper warning observed: more than 4 oz requires skiving in some designs.

Applies when:

- Slim, stitched, multi-layer cardholder.

Does not apply when:

- Heavy rustic design, single-layer cover, wet-molded design, or intentionally bulky product.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### R-007 - Outer Cover and Slot Thickness May Differ

Description: In folded cardholders, the outer cover can be thicker than the card slots. A cited folded design suggests outer cover 2-5 oz and card slots 2-4 oz, with 3/4 oz as an all-around choice.

Source: MakeSupply Folded Leather Card Holder.

Formula:

```txt
outerThickness = 2..5 oz
slotThickness = 2..4 oz
allAroundThickness ~= 3..4 oz
```

Variables:

- `outerThickness`;
- `slotThickness`;
- `constructionType`.

Allowed ranges:

- Outer: 2-5 oz.
- Slots: 2-4 oz.

Applies when:

- Folded cardholder with distinct cover and slot pieces.

Does not apply when:

- One-piece no-stitch design or single-thickness all-parts design.

Confidence: `source-backed`.

Pattern Engine automation: yes, if separate material zones are supported.

### R-008 - Multi-Layer Stack Warning

Description: Areas with multiple leather layers, snaps, or button studs require clearance planning; thick leather can require skiving.

Source: MakeSupply No-Stitch Leather Card Holder and 5 Pocket Card Holder.

Formula:

```txt
stackHeight = sum(layerThicknesses) + hardwareCompressionAllowance
if stackHeight > hardwareClearance => invalid or warning
```

Variables:

- `layerThicknesses`;
- `stackHeight`;
- `hardwareClearance`;
- `skiveAllowance`.

Allowed ranges:

- Source advises measuring leather thickness and allowing enough clearance; exact clearance depends on hardware.

Applies when:

- No-stitch design with snaps/buttons.
- Multi-pocket design with stacked edges or T-slots.

Does not apply when:

- Simple stitched two-layer edge with no hardware.

Confidence: `source-backed` for the need; `needs-master-validation` for exact hardware clearance.

Pattern Engine automation: yes, as stack-height calculation and warning.

### R-009 - Pocket Count Is a Construction Variant

Description: Cardholder patterns can support 2, 3, 4, or 5 pockets depending on construction family.

Source: MakeSupply Folded Card Holder and 5 Pocket Card Holder.

Formula:

```txt
pocketCount in construction.allowedPocketCounts
```

Variables:

- `pocketCount`;
- `constructionType`;
- `allowedPocketCounts`.

Allowed ranges:

- Folded source: 2, 3, or 4 pockets.
- 5-pocket source: 2 front slots, 2 back slots, 1 middle slot.

Applies when:

- Selecting or validating a cardholder construction.

Does not apply when:

- The design uses an arbitrary custom pocket layout.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### R-010 - 5-Pocket Layout Topology

Description: A 5-pocket front-pocket cardholder can be structured with two card slots on the face, two on the back, and one larger middle slot.

Source: MakeSupply 5 Pocket Card Holder.

Formula:

```txt
frontSlots = 2
backSlots = 2
middleSlots = 1
totalSlots = frontSlots + backSlots + middleSlots
```

Variables:

- `frontSlots`;
- `backSlots`;
- `middleSlots`.

Allowed ranges:

- This topology is fixed for the cited 5-pocket family.

Applies when:

- The chosen template is a 5-pocket cardholder.

Does not apply when:

- Folded 2-pocket, 3-pocket, no-stitch, or flap cardholder.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### R-011 - Stitch Hole Spacing

Description: One folded cardholder source marks optional stitching holes at approximately 6 mm spacing. The general MakeSupply guide also describes 6 mm as a default spacing for their templates.

Source: MakeSupply Folded Leather Card Holder; MakeSupply template guide.

Formula:

```txt
defaultHolePitch = 6 mm
holeCount = floor(pathLength / defaultHolePitch) + 1
actualPitch = pathLength / (holeCount - 1)
```

Variables:

- `pathLength`;
- `defaultHolePitch`;
- `holeCount`;
- `actualPitch`.

Allowed ranges:

- Source-backed default: 6 mm.
- Other pitches may be user-defined but need validation against tools.

Applies when:

- Pattern includes pre-marked stitching holes.

Does not apply when:

- Pattern provides only a stitch line, or maker uses their own chisel spacing.

Confidence: `source-backed` for 6 mm default; `engineering-derived` for hole count adjustment.

Pattern Engine automation: yes.

### R-012 - Punch Diameter / Hole Size

Description: The MakeSupply guide references 1.0-1.25 mm round leather punches for punching holes from templates, and 1.25-1.5 mm precision round hole sizes for some chisel systems.

Source: MakeSupply template guide.

Formula:

```txt
roundHoleDiameter = 1.0..1.25 mm
precisionHoleDiameter = 1.25..1.5 mm
```

Variables:

- `holeDiameter`;
- `toolType`;
- `threadSize`.

Allowed ranges:

- 1.0-1.25 mm for simple round punch workflow.
- 1.25-1.5 mm for referenced precision tools.

Applies when:

- PDF includes actual hole marks rather than only stitch lines.

Does not apply when:

- Holes are not pre-punched or tool-specific marks are omitted.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### R-013 - Thread Size Pairing

Description: MakeSupply guide states a sweet spot of 0.8 mm flat-braided polyester thread with size 00 saddler needles for their default workflow; another slim cardholder source uses 0.6 mm thread with 3.85 mm pricking irons.

Source: MakeSupply template guide; Minimalist Leather Wallet / Slim Card Holder.

Formula:

```txt
if holePitch ~= 6 mm then threadSize ~= 0.8 mm
if prickingIronPitch ~= 3.85 mm then threadSize ~= 0.6 mm
```

Variables:

- `holePitch`;
- `threadSize`;
- `needleSize`;
- `toolType`.

Allowed ranges:

- 0.6-0.8 mm observed in sources.

Applies when:

- Pattern includes a recommended stitching setup.

Does not apply when:

- User supplies their own stitching system.

Confidence: `source-backed` for cited pairings; `needs-master-validation` for generalized mapping.

Pattern Engine automation: partial, as recommendations not hard geometry.

### R-014 - Tool-Specific Stitch Marks

Description: Cardholder patterns may include holes, stitch lines, or no stitch marks, depending on whether the user works from paper, acrylic, laser, awl, chisel, or punch.

Source: MakeSupply template guide; Minimalist Wallet comment discussion about awl, chisel, and round punch being interchangeable workflows.

Formula:

```txt
stitchMarkMode in ['none', 'line-only', 'round-holes', 'diamond-holes']
```

Variables:

- `stitchMarkMode`;
- `toolType`;
- `holePitch`;
- `holeDiameter`.

Allowed ranges:

- Tool-dependent.

Applies when:

- Exporting PDF/SVG/CAD for different maker workflows.

Does not apply when:

- A fixed template intentionally supports only one workflow.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### R-015 - Cut, Punch, Then Assemble Workflow

Description: In the MakeSupply Standard, instructions begin after pieces are cut and stitching holes are punched, independent of paper PDF, laser files, or acrylic templates.

Source: MakeSupply 5 Pocket Card Holder.

Formula:

```txt
workflow = ['cut pieces', 'punch holes', 'assemble/stitch']
```

Variables:

- `workflowStage`;
- `exportType`.

Allowed ranges:

- PDF, laser, acrylic all share the same completed pre-assembly geometry.

Applies when:

- Pattern Engine exports maker-ready templates.

Does not apply when:

- Interactive tutorial generation or full assembly instruction generation.

Confidence: `source-backed`.

Pattern Engine automation: yes, as metadata and output completeness check.

### R-016 - Card Slot Crease Line

Description: Adding a crease to the lip of card slots is a professional finishing detail for cardholders and wallets.

Source: MakeSupply Quick Tip: Adding A Crease To Your Card Slots.

Formula:

```txt
creaseLine = offset(slotLipEdge, creaseOffset)
```

Variables:

- `slotLipEdge`;
- `creaseOffset`;
- `creaseTool`.

Allowed ranges:

- Offset not specified in source.

Applies when:

- Card slot lips are visible and user wants decorative/professional finishing marks.

Does not apply when:

- No visible slot lip, raw utility pattern, or no creasing tool.

Confidence: `source-backed` for the feature; `needs-master-validation` for offset.

Pattern Engine automation: yes, if offset is user-defined or validated.

### R-017 - Burnishable Vegetable-Tanned Leather for Edge Finish

Description: Vegetable-tanned leather is recommended when following hand-burnished edge finishing workflows; chrome-tanned and very soft leathers may be difficult or impossible to burnish by hand.

Source: MakeSupply Folded Leather Card Holder.

Formula:

```txt
if edgeFinish == 'burnish' then leatherType should be 'vegetable-tanned'
```

Variables:

- `leatherType`;
- `edgeFinish`.

Allowed ranges:

- Leather type vocabulary needs product taxonomy later.

Applies when:

- Pattern includes edge finishing guidance or burnish marks.

Does not apply when:

- Edge paint, folded edge, lined construction, or no edge finish.

Confidence: `source-backed`.

Pattern Engine automation: partial, as validation/recommendation.

### R-018 - Minimum Card Clearance

Description: The card cavity must be larger than the ID-1 card so cards can enter and exit after stitching and leather compression.

Source: Derived from ID-1 card size and physical assembly logic; open sources confirm standard-card sizing but do not publish a universal clearance formula.

Formula:

```txt
internalW = CARD_W + 2 * sideClearance
internalH = CARD_H + topClearance + bottomClearance
```

Variables:

- `sideClearance`;
- `topClearance`;
- `bottomClearance`;
- `leatherThickness`;
- `stitchInset`.

Allowed ranges:

- Needs prototype validation. Initial engineering candidate: 0.8-2.0 mm per side depending on leather stiffness and pocket type.

Applies when:

- Any pocket is intended to hold standard cards.

Does not apply when:

- Decorative pocket or non-ID-1 content.

Confidence: `engineering-derived`, exact values `needs-master-validation`.

Pattern Engine automation: yes, but default values must be flagged until validated.

### R-019 - Stitch Line Must Not Reduce Usable Card Opening

Description: Stitching defines the closed boundary of a pocket. The usable card cavity is inside the stitch line, not the outer cut contour.

Source: Derived from stitched pocket construction and source-backed presence of stitched cardholders.

Formula:

```txt
usablePocketW = outerPocketW - 2 * stitchInset
usablePocketH = outerPocketH - bottomStitchInset
usablePocketW >= CARD_W + 2 * sideClearance
```

Variables:

- `outerPocketW`;
- `outerPocketH`;
- `stitchInset`;
- `sideClearance`;
- `bottomStitchInset`.

Allowed ranges:

- `stitchInset` needs tool/material validation.

Applies when:

- Stitched card pocket.

Does not apply when:

- No-stitch folded slot where retention comes from folds or hardware.

Confidence: `engineering-derived`.

Pattern Engine automation: yes.

### R-020 - Hole Marks Must Stay Inside Safe Material Zone

Description: Stitching holes should not be too close to the cut edge or the piece may tear; they also should not collide with rounded corners or slot openings.

Source: Derived from leather mechanics and source-backed use of pre-marked holes.

Formula:

```txt
distance(holeCenter, cutEdge) >= minEdgeDistance
distance(holeCenter, slotOpening) >= minSlotDistance
```

Variables:

- `holeCenter`;
- `cutEdge`;
- `slotOpening`;
- `minEdgeDistance`;
- `holeDiameter`;
- `leatherThickness`.

Allowed ranges:

- Needs master validation. A conservative engine should expose this as a configurable rule.

Applies when:

- PDF includes hole marks.

Does not apply when:

- Pattern includes only stitch guide lines.

Confidence: `engineering-derived`, exact thresholds `needs-master-validation`.

Pattern Engine automation: yes.

### R-021 - Pocket Reveal Must Allow Card Retrieval

Description: The visible part of a card must be high enough for the user to grip the card. Too-deep pockets may hold the card securely but make retrieval difficult.

Source: Derived from cardholder usability; open pattern sources show visible card slots but do not publish a universal reveal formula.

Formula:

```txt
cardReveal = CARD_H - pocketDepth
cardReveal >= minGripReveal
```

Variables:

- `cardReveal`;
- `pocketDepth`;
- `minGripReveal`.

Allowed ranges:

- Needs prototype/master validation. Initial engineering candidate: 10-18 mm.

Applies when:

- Exposed slot cardholder.

Does not apply when:

- Fully enclosed flap/snap cardholder where cards are accessed differently.

Confidence: `engineering-derived`, threshold `needs-master-validation`.

Pattern Engine automation: yes, with flagged defaults.

### R-022 - A4 Fit Validation

Description: Generated pattern pieces must fit on the selected paper size with margins and scale marks.

Source: MakeSupply print-ready PDF requirement; geometry layout requirement derived from PDF output.

Formula:

```txt
max(pieceBounds + margins + scaleTestBounds) <= pageBounds
```

Variables:

- `pieceBounds`;
- `pageBounds`;
- `margin`;
- `scaleTestBounds`.

Allowed ranges:

- Page bounds from selected format.
- Margins depend on printer safety; should be configurable.

Applies when:

- Output is a print-ready PDF.

Does not apply when:

- Output is multi-page tiled, laser bed layout, or roll plotter layout.

Confidence: `source-backed` for page format; `engineering-derived` for layout formula.

Pattern Engine automation: yes.

### R-023 - Export Format Separation

Description: The same geometry should be exportable as printable PDF, laser/source files, or acrylic-template geometry.

Source: MakeSupply pages repeatedly offer printable PDF, laser-ready/source files, and acrylic templates.

Formula:

```txt
geometryModel -> renderer(PDF | SVG | AI/DXF/EPS | acrylic)
```

Variables:

- `geometryModel`;
- `exportFormat`;
- `renderer`.

Allowed ranges:

- Export details are renderer-specific; geometry should be unit-stable.

Applies when:

- Building platform architecture.

Does not apply when:

- One-off static PDF only.

Confidence: `source-backed` for format families; `engineering-derived` for architecture.

Pattern Engine automation: yes.

### R-024 - Source Files Must Not Be Copied

Description: Open/free templates can be studied for common principles, but their specific template geometry must not be redistributed or used as a substitute for the source.

Source: MakeSupply usage notes and terms language on template pages.

Formula:

```txt
allowed = extract_general_principles
forbidden = copy_specific_template_geometry
```

Variables:

- `sourceLicense`;
- `geometryOrigin`;
- `redistribution`.

Allowed ranges:

- Project may use independently generated geometry from general rules.

Applies when:

- Researching public templates.

Does not apply when:

- User owns a licensed template and explicitly uses it only for personal conversion, subject to license.

Confidence: `source-backed`.

Pattern Engine automation: process rule, not geometry.

## Automatically Implementable Rules

The following rules can be implemented in Pattern Engine Phase 1 without pretending to know undocumented craft tolerances:

- R-001 card size baseline;
- R-002 PDF page format;
- R-003 scale test;
- R-004 print at 100% instruction;
- R-005 leather thickness warning;
- R-006 common thickness recommendation;
- R-009 pocket count validation;
- R-010 5-pocket topology;
- R-011 stitch hole spacing;
- R-012 punch diameter;
- R-014 stitch mark mode;
- R-015 cut/punch/assemble workflow metadata;
- R-016 card slot crease line if offset is user-configurable;
- R-017 leather type recommendation for burnishing;
- R-018 minimum card clearance with flagged default;
- R-019 stitch line usable cavity validation;
- R-020 safe material zone validation with configurable threshold;
- R-021 pocket reveal validation with flagged default;
- R-022 A4 fit validation;
- R-023 export format separation;
- R-024 source/licensing process rule.

## Not Yet Safe to Hard-Code

These values should not be hard-coded as professional truth until validated by a maker or prototype:

- exact side clearance for different leather stiffness values;
- exact pocket reveal threshold;
- exact stitch inset from cut edge;
- exact safe edge distance for holes;
- exact fold compensation for one-piece folded cardholders;
- exact skive zone geometry near stacked edges and T-slots;
- exact hardware clearance for snaps/button studs;
- generalized mapping from stitch pitch to thread size and hole diameter.

## Initial Pattern Engine Knowledge Model

Recommended data shape for each future rule:

```txt
id
name
description
source
formula
variables
allowedRanges
appliesWhen
doesNotApplyWhen
confidence
automationReadiness
notes
```

The Pattern Engine should accept parameters from any source, including manual form entry, imported CAD, image analysis, or future AI interpretation. The knowledge rules should validate and derive geometry after inputs are normalized.

## Phase 1 Conclusion

Cardholder is suitable as the first professional Pattern Engine proof of concept, but only if the engine clearly separates:

- source-backed fixed facts, such as card size and print scale;
- engineering-derived geometry, such as cavity width and hole distribution;
- values requiring maker validation, such as clearances, reveal, stitch inset, and skiving zones.

The safest next implementation target is not a complex bifold wallet. It is a simple stitched cardholder with ID-1 card support, configurable pocket count, configurable stitch mark mode, PDF scale test, and explicit warnings for unvalidated craft tolerances.
