# Shoe Knowledge Extraction - Phase 2

Date: 2026-06-26

Scope: research only. No shoe Pattern Engine is implemented or specified as production-ready.

This document follows the same structure as the Cardholder knowledge document, but shoe knowledge is materially more complex. Shoe patterns are not just flat leather geometry: they depend on foot measurement, shoe last geometry, upper design, material behavior, construction method, lasting, sole attachment, and fit testing.

## Sources

1. Wikipedia, Shoe Size: https://en.wikipedia.org/wiki/Shoe_size
2. Wikipedia, Last: https://en.wikipedia.org/wiki/Last
3. Shoemakers Academy, Free Shoemaking Lesson: https://shoemakersacademy.com/free-shoemaking-lesson/
4. Shoemakers Academy, Blog index / footwear development references: https://shoemakersacademy.com/blog/
5. Shoemakers Academy, textbooks and course catalog references: https://shoemakersacademy.com/shoemaking-text-books/

Note: Several older public URLs for Sneaker Factory / Shoemakers Academy pattern pages now return 404 or redirect to generic pages. They were not used as source-backed pattern rules.

## Product Definition

Shoe means footwear built around a last or foot-shaped form, usually with an upper, lining, insole/footbed, outsole, heel/counter areas, and lasting or assembly allowances.

This Phase 2 document does not attempt to generate a professional shoe pattern. It captures which knowledge categories would be required.

## User Inputs

- shoe type: sandal, sneaker, derby, loafer, boot, etc.;
- foot length;
- foot width;
- left/right foot measurements;
- target size system;
- last ID or last measurements;
- material type and thickness;
- construction method;
- upper style;
- closure type;
- seam/stitching style;
- lasting method;
- sole type;
- fit preference;
- production format.

## Pattern Engine Derived Parameters

- target last size;
- foot-to-last allowance;
- inner cavity allowance;
- upper shell reference;
- vamp, quarter, tongue, heel/counter component zones;
- seam allowances;
- lasting allowance;
- lining allowance;
- eyelet/lace placement;
- edge and folding allowances;
- left/right mirrored parts;
- material grain direction;
- prototype/fit validation checklist.

## Rule Records

### S-001 - Foot Length Definition

Description: Foot length is commonly measured between two parallel lines perpendicular to the foot, touching the most prominent toe and heel, while standing barefoot with weight evenly distributed.

Source: Wikipedia "Shoe size".

Formula:

```txt
footLength = distance(heelTangentLine, toeTangentLine)
```

Variables:

- `footLength`;
- `heelTangentLine`;
- `toeTangentLine`;
- `weightDistribution`.

Allowed ranges:

- User measurement.

Applies when:

- Measuring the wearer.

Does not apply when:

- Pattern is drafted directly from an existing last with no user sizing.

Confidence: `source-backed`.

Pattern Engine automation: yes, as input definition and measurement guide.

### S-002 - Measure Both Feet

Description: Left and right feet are often slightly different; both should be measured, and mass-produced shoe sizing commonly uses the larger foot.

Source: Wikipedia "Shoe size".

Formula:

```txt
targetFootLength = max(leftFootLength, rightFootLength)
targetFootWidth = max(leftFootWidth, rightFootWidth)
```

Variables:

- `leftFootLength`;
- `rightFootLength`;
- `leftFootWidth`;
- `rightFootWidth`.

Allowed ranges:

- User measurement.

Applies when:

- Custom or size-selection workflow.

Does not apply when:

- Building asymmetrical bespoke left/right patterns from separate lasts.

Confidence: `source-backed`.

Pattern Engine automation: yes.

### S-003 - Shoe Size Can Refer To Foot, Inner Cavity, Or Last

Description: Shoe size systems may refer to the median foot length, the inner cavity length, or the last length. These are not the same measurement.

Source: Wikipedia "Shoe size".

Formula:

```txt
footLength != innerCavityLength != lastLength
```

Variables:

- `footLength`;
- `innerCavityLength`;
- `lastLength`;
- `sizeSystem`.

Allowed ranges:

- Depends on sizing system and shoe type.

Applies when:

- Converting user size into pattern/last parameters.

Does not apply when:

- Using a measured physical last directly and not fitting to a foot.

Confidence: `source-backed`.

Pattern Engine automation: yes, as model separation.

### S-004 - Inner Cavity Is Typically Longer Than Foot

Description: The inner cavity of a shoe must typically be longer than the foot. The source gives common values around 12.7-16.9 mm depending on system/type, with broader possible ranges.

Source: Wikipedia "Shoe size".

Formula:

```txt
innerCavityLength = footLength + toeAllowance
toeAllowance ~= 12.7..16.9 mm
```

Variables:

- `footLength`;
- `innerCavityLength`;
- `toeAllowance`;
- `shoeType`.

Allowed ranges:

- Typical: 12.7-16.9 mm.
- Broader ranges exist by system and shoe type.

Applies when:

- Estimating fit allowance from foot length.

Does not apply when:

- Exact last and fit model are provided.

Confidence: `source-backed` for typical range, `needs-master-validation` for product-specific value.

Pattern Engine automation: partial, as default warning/calculation.

### S-005 - Last Is The Manufacturing Form

Description: A last is the mechanical foot-shaped form used by shoemakers in manufacture and repair.

Source: Wikipedia "Last".

Formula:

```txt
shoePatternBasis = lastGeometry
```

Variables:

- `lastGeometry`;
- `shoeType`;
- `size`.

Allowed ranges:

- Lasts vary by style, size, and purpose.

Applies when:

- Drafting professional shoe patterns.

Does not apply when:

- Very simple non-lasted sandals or soft moccasin-like constructions.

Confidence: `source-backed`.

Pattern Engine automation: yes, as architectural requirement.

### S-006 - Lasts Vary By Job And Style

Description: Lasts come in different styles and sizes depending on the job; boot lasts may hug the instep, and modern last shapes are often designed in CAD.

Source: Wikipedia "Last".

Formula:

```txt
lastGeometry = f(shoeType, size, width, style, fitIntent)
```

Variables:

- `shoeType`;
- `size`;
- `width`;
- `style`;
- `fitIntent`.

Allowed ranges:

- Not universal.

Applies when:

- Selecting or generating a shoe pattern.

Does not apply when:

- Flat accessory patterns.

Confidence: `source-backed`.

Pattern Engine automation: partial, requires last database or 3D last input.

### S-007 - Pattern Depends On 3D-To-2D Transformation

Description: A professional shoe upper pattern requires converting a 3D last surface into 2D components. Open sources confirm the last basis but did not provide a complete free drafting method.

Source: Derived from last-based shoemaking and CAD references.

Formula:

```txt
upper2D = flatten(surfaceRegion(last3D, designLines))
```

Variables:

- `last3D`;
- `designLines`;
- `surfaceRegion`;
- `flatteningMethod`;
- `materialStretch`.

Allowed ranges:

- Method-dependent.

Applies when:

- Drafting upper parts for a lasted shoe.

Does not apply when:

- Non-lasted flat sandal straps.

Confidence: `engineering-derived`, exact method `needs-master-validation`.

Pattern Engine automation: not immediately without 3D last and validated flattening method.

### S-008 - Left And Right Lasts May Differ

Description: Modern lasts usually come in pairs to match separate right and left feet.

Source: Wikipedia "Last".

Formula:

```txt
leftPattern = pattern(leftLast)
rightPattern = mirrorOrPattern(rightLast)
```

Variables:

- `leftLast`;
- `rightLast`;
- `symmetryMode`.

Allowed ranges:

- Pair-based for modern footwear.

Applies when:

- Creating actual shoe pairs.

Does not apply when:

- Simple repair lasts or generic symmetrical demonstrations.

Confidence: `source-backed`.

Pattern Engine automation: yes, if last data exists.

### S-009 - Width Is A Separate Fit Dimension

Description: Some sizing systems include width. Width may be measured in millimetres or expressed by letters; width step sizes can vary.

Source: Wikipedia "Shoe size".

Formula:

```txt
fitSize = { length, width }
```

Variables:

- `footWidth`;
- `widthSystem`;
- `widthCode`;
- `shoeLength`.

Allowed ranges:

- System-dependent.

Applies when:

- Fit-sensitive footwear.

Does not apply when:

- Non-sized decorative research mockup.

Confidence: `source-backed`.

Pattern Engine automation: yes as input model, not as complete pattern formula.

### S-010 - Arch Length Can Affect Size Selection

Description: The Brannock device measures arch length, and if that scale indicates a larger size it is taken instead of foot length for fitting.

Source: Wikipedia "Shoe size".

Formula:

```txt
targetSize = max(lengthBasedSize, archLengthBasedSize)
```

Variables:

- `lengthBasedSize`;
- `archLengthBasedSize`;
- `targetSize`.

Allowed ranges:

- Depends on measuring system.

Applies when:

- Fit workflow includes Brannock-like measurement.

Does not apply when:

- Last is already chosen and fit is validated physically.

Confidence: `source-backed`.

Pattern Engine automation: partial, for sizing assistant/validation.

### S-011 - Upper Components Need Product Taxonomy

Description: Shoe upper patterns commonly involve named regions such as vamp, quarters, tongue, collar, lining, heel/counter zones. Open sources found here did not provide complete source-backed drafting dimensions.

Source: General shoemaking terminology and Shoemakers Academy course/textbook references; exact formulas not freely extracted.

Formula:

```txt
upper = components(vamp, quarters, tongue, heelCounter, lining, reinforcements)
```

Variables:

- `componentType`;
- `designLines`;
- `constructionMethod`.

Allowed ranges:

- Shoe-type dependent.

Applies when:

- Any closed shoe or sneaker upper is drafted.

Does not apply when:

- Simple single-strap sandal.

Confidence: `needs-master-validation`.

Pattern Engine automation: no, not until professional references are licensed/validated.

### S-012 - Lasting Allowance Is Required But Not Openly Quantified

Description: Lasted shoe uppers require extra material to pull around/under the last and attach to the bottom construction. The exact allowance depends on construction, material, last, and factory process.

Source: Engineering-derived from last-based shoemaking; source-backed existence of lasting process/last force from Wikipedia "Last".

Formula:

```txt
partWithLastingAllowance = upperEdge + lastingAllowance(construction, material, last)
```

Variables:

- `lastingAllowance`;
- `constructionMethod`;
- `materialThickness`;
- `lastGeometry`.

Allowed ranges:

- Not reliably extracted from open sources.

Applies when:

- Lasted footwear.

Does not apply when:

- Non-lasted sandals or flat moccasin variants.

Confidence: `needs-master-validation`.

Pattern Engine automation: no, unless allowance is user-supplied.

### S-013 - Prototype Review Is Core To Footwear Development

Description: Shoemakers Academy references pattern review and early pullover prototypes as important in footwear development.

Source: Shoemakers Academy blog index.

Formula:

```txt
draftPattern -> pulloverPrototype -> review -> revisePattern
```

Variables:

- `prototypeType`;
- `reviewChecklist`;
- `revisionNotes`.

Allowed ranges:

- Process rule.

Applies when:

- Developing a shoe pattern.

Does not apply when:

- Static educational diagram only.

Confidence: `source-backed` for process importance, `needs-master-validation` for checklist details.

Pattern Engine automation: partial, as workflow metadata/checklist.

## Universal Knowledge

- material behavior matters;
- units and dimensions must be explicit;
- geometry must be derived from normalized inputs;
- source-backed facts must be separated from craft tolerances;
- PDF/preview/export should not invent construction logic;
- validation is part of the product, not an afterthought.

## Shoe-Specific Knowledge

- shoe patterning depends on the last;
- foot length, inner cavity length, and last length are different;
- fit width and arch length can matter;
- left/right geometry may differ;
- pattern creation involves 3D-to-2D surface flattening;
- prototypes are part of the engineering loop;
- professional shoe knowledge is less extractable from open sources than belts/cardholders.

## Algorithmizable Immediately

- collect foot length/width inputs;
- measure both feet and use max dimensions for mass-fit;
- separate foot/cavity/last dimensions in the data model;
- compute typical toe allowance warning ranges;
- validate selected last vs target size;
- mirror or separate left/right pattern entities;
- store prototype/revision workflow metadata;
- require explicit construction method before any pattern generation.

## Requires Expert Validation

- last-to-pattern flattening;
- seam allowances by shoe type;
- lasting allowance;
- material stretch/shrink compensation;
- vamp/quarter/tongue drafting rules;
- heel counter and toe reinforcement rules;
- lining allowances;
- grading rules across sizes;
- comfort/fit tolerances by category.

## Not Extractable Reliably From Open Sources

- complete professional upper drafting method;
- exact last shell flattening algorithm;
- validated allowances for leather thickness and stretch;
- construction-specific bottoming allowances;
- factory-grade tolerances;
- complete size grading formulas for all shoe components;
- quality checklist for pullover prototype review.

## Knowledge Needed From Masters Or Professional Literature

- footwear pattern-making textbooks;
- CAD last flattening methodology;
- last measurement standards;
- upper pattern drafting rules by shoe type;
- production grading rules;
- material-specific lasting behavior;
- factory process constraints;
- fit testing protocols.

## Phase 2 Conclusion

Shoe knowledge can use the same knowledge-record structure as Cardholder and Belt, but the engineering content is much deeper and less openly available. A future shoe Pattern Engine should not start from freehand 2D parameters. It must start from last data, construction method, and validated professional pattern-making rules.
