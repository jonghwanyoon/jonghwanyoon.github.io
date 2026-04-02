# Liquid Biopsy Pictogram Poster Design

## Summary

Create two English-only static infographic posters for the 30DayChartChallenge Day 2 post. Both posters explain the difficulty of detecting a `0.1% VAF` signal in liquid biopsy by using DNA pictograms as the primary visual device.

The main outcome is a reproducible Python script that generates both PNG files from the local DNA icon assets in this directory.

## Goals

- Make the pictogram grid the dominant visual element.
- Keep the look closer to an editorial poster than a clinical figure.
- Preserve scientific meaning while prioritizing readability.
- Generate outputs that can be recreated without manual editing.

## Non-Goals

- Building an interactive graphic
- Embedding the final image into the blog post in this task
- Reproducing every laboratory detail of liquid biopsy workflow
- Optimizing for print production beyond high-resolution PNG export

## Inputs And Constraints

### Source Facts

- Blood sample: `20 mL`
- Plasma yield: `~10 mL`
- cfDNA yield: `~30 ng`
- Total material represented: `~10,000 genome equivalents`
- Variant frequency: `0.1% VAF`

### Local Assets

- `DNA-gray.png`: wild-type / background pictogram
- `DNA-navy.png`: variant pictogram
- `DNA-skyblue.png`: optional supporting DNA icon if a small secondary explainer is needed

### Content Constraints

- All visible text must be English.
- The pictogram grid must be the main visual, not the flow diagram.
- Two separate poster images are required.
- Both images should come from one script.

## Deliverables

- `generate_infographic.py`
- `liquid-biopsy-poster-1000.png`
- `liquid-biopsy-poster-10000.png`

## Recommended Approach

Use one Python script with shared styling helpers and two poster-specific render paths.

This keeps the typography, spacing, colors, and export settings consistent while allowing each poster to tune its own grid size and annotation density.

## Alternatives Considered

### Option 1: One script, two outputs

Pros:
- Single regeneration command
- Shared layout and styling logic
- Low maintenance

Cons:
- Slightly more branching inside one file

### Option 2: Two scripts, two outputs

Pros:
- Each poster can be tuned independently

Cons:
- Duplicate code
- Harder to keep style aligned

### Option 3: Shared module plus multiple scripts

Pros:
- Most extensible

Cons:
- Too heavy for the size of this task

## Visual Direction

### Tone

Poster-like rather than clinical. The design should feel bold and intentional, with strong hierarchy and clear contrast, while still using restrained scientific language.

### Layout Principles

- Let the grid occupy most of the canvas.
- Use a clean white background.
- Use short text blocks only.
- Reserve strong contrast for the variant signal and the headline numbers.
- Avoid clutter, legends, or dense explanatory paragraphs.

### Typography

- English only
- Sans-serif presentation suitable for a poster
- Strong weight for headline and key numbers
- Smaller supporting copy for context

If NanumGothic is already the most reliable installed font, it is acceptable even though the content is English.

## Poster Definitions

### Poster A: 1,000-Icon Readability Poster

Purpose:
Make the rarity intuitive at a glance.

Structure:
- Large title
- Dominant `40 x 25` grid for `1,000` DNA icons
- `999` gray icons and `1` navy icon
- Short supporting line that explains one icon stands for ten genomes

Core message:
The viewer should immediately feel how hard it is to spot a rare signal.

Rationale:
This is the most readable poster and should serve as the primary hero image.

### Poster B: 10,000-Icon Scale Poster

Purpose:
Show the actual scale directly.

Structure:
- Title with the same visual system as Poster A
- Dense `100 x 100` grid for `10,000` DNA icons
- `9,990` gray icons and `10` navy icons
- Very limited annotation so the dense field remains legible

Core message:
Only ten altered molecules exist inside a field of ten thousand.

Rationale:
This poster is less immediately readable from a distance, but it is truer to the stated scale.

## Shared Content Model

### Title Direction

Use a short title centered on the rarity problem, for example:

- `Hunting 10 Variants in 10,000 Genomes`
- `Liquid Biopsy at 0.1% VAF`

Final title selection can be made during implementation if one option is visibly stronger.

### Supporting Copy

Keep copy minimal. Candidate lines:

- `20 mL blood can yield about 10,000 genome equivalents.`
- `At 0.1% VAF, only 10 molecules carry the variant.`
- `In the 1,000-icon poster, each icon represents 10 genomes.`

### Optional Secondary Explainer

A small single-line process cue may be included if it helps:

`20 mL blood -> ~10 mL plasma -> ~30 ng cfDNA -> ~10,000 genomes`

This must remain secondary and should be removed if it competes with the grid.

## Rendering Plan

### Script Responsibilities

- Load local PNG assets
- Configure fonts
- Build a poster canvas with shared margins and export rules
- Render the 1,000-icon version
- Render the 10,000-icon version
- Save both outputs at high resolution

### Technical Direction

- Use Python with `matplotlib`
- Use `OffsetImage` and `AnnotationBbox`, or an equivalent performant placement approach
- Prefer helper functions for repeated tasks such as title rendering, caption placement, and icon grid generation
- Export high-resolution PNGs with tight but safe margins

## Verification Criteria

### Functional

- Running `python generate_infographic.py` completes without errors
- Both PNG outputs are created in the current directory

### Visual

- Poster A clearly highlights one variant among one thousand icons
- Poster B clearly contains ten highlighted variants among ten thousand icons
- The grid is visually dominant in both posters
- All text is in English
- The result feels like a poster, not a lab report figure
- Icons remain readable enough for their intended role at the exported resolution

### Content

- Counts and captions remain numerically consistent with `0.1% VAF`
- Poster A explicitly clarifies the `1 icon = 10 genomes` abstraction
- Poster B does not imply the wrong number of variants

## Risks And Decisions

### Main Risk

The `10,000` icon poster may become visually muddy because each icon must be very small.

### Mitigation

- Keep Poster A as the main readable poster
- Reduce annotation density in Poster B
- Use carefully chosen navy placements so the ten variants are not accidentally hidden

### Decision Log

- Use English only
- Prefer poster tone over clinical tone
- Make the pictogram grid the primary visual
- Produce two separate PNG posters
- Use one Python script to generate both outputs

## Implementation Boundary

This document defines the design only. No implementation starts until the user reviews this written spec and confirms it is acceptable.
