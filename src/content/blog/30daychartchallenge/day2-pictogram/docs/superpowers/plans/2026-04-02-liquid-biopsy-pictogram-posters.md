# Liquid Biopsy Pictogram Posters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one reproducible Python script that generates two English-only liquid biopsy pictogram posters, one optimized for readability at 1,000 icons and one optimized for scale at 10,000 icons.

**Architecture:** Keep everything in a single `generate_infographic.py` file with small helper functions so the script is easy to rerun from this directory. Use a `PosterSpec` data model plus shared rendering helpers so both outputs share one visual system while varying only grid density, captions, and highlighted variant counts. Use standard-library `unittest` for TDD because this directory does not have an existing Python test harness.

**Tech Stack:** Python 3, matplotlib, Pillow, pathlib, dataclasses, unittest

---

## File Structure

- Create: `src/content/blog/30daychartchallenge/day2-pictogram/generate_infographic.py`
  Responsibility: own poster specs, font setup, asset loading, grid placement, poster rendering, and CLI entry point.
- Create: `src/content/blog/30daychartchallenge/day2-pictogram/test_generate_infographic.py`
  Responsibility: verify poster specs, helper behavior, and file-output smoke checks using `MPLBACKEND=Agg`.
- Create at runtime: `src/content/blog/30daychartchallenge/day2-pictogram/liquid-biopsy-poster-1000.png`
  Responsibility: readable hero poster with one highlighted variant in a 1,000-icon field.
- Create at runtime: `src/content/blog/30daychartchallenge/day2-pictogram/liquid-biopsy-poster-10000.png`
  Responsibility: dense scale poster with ten highlighted variants in a 10,000-icon field.

## Task 1: Define Poster Specs And Grid Helpers

**Files:**
- Create: `src/content/blog/30daychartchallenge/day2-pictogram/test_generate_infographic.py`
- Create: `src/content/blog/30daychartchallenge/day2-pictogram/generate_infographic.py`

- [ ] **Step 1: Write the failing tests for poster specs and grid math**

```python
import unittest

from generate_infographic import PosterSpec, build_grid_points, build_specs


class PosterSpecTests(unittest.TestCase):
    def test_build_specs_returns_two_named_posters(self):
        specs = build_specs()
        self.assertEqual([spec.slug for spec in specs], ["poster-1000", "poster-10000"])

    def test_1000_poster_spec_matches_readability_design(self):
        spec = build_specs()[0]
        self.assertIsInstance(spec, PosterSpec)
        self.assertEqual(spec.columns, 40)
        self.assertEqual(spec.rows, 25)
        self.assertEqual(spec.total_icons, 1000)
        self.assertEqual(spec.variant_indices, [499])
        self.assertIn("1 icon = 10 genomes", spec.footer)

    def test_10000_poster_spec_matches_scale_design(self):
        spec = build_specs()[1]
        self.assertEqual(spec.columns, 100)
        self.assertEqual(spec.rows, 100)
        self.assertEqual(spec.total_icons, 10000)
        self.assertEqual(len(spec.variant_indices), 10)
        self.assertEqual(spec.variant_indices, [909, 1919, 2929, 3939, 4949, 5959, 6969, 7979, 8989, 9999])


class GridPointTests(unittest.TestCase):
    def test_build_grid_points_returns_all_cells(self):
        points = build_grid_points(columns=4, rows=3, left=0.10, right=0.90, bottom=0.20, top=0.80)
        self.assertEqual(len(points), 12)

    def test_build_grid_points_spans_bounds(self):
        points = build_grid_points(columns=4, rows=3, left=0.10, right=0.90, bottom=0.20, top=0.80)
        first_x, first_y = points[0]
        last_x, last_y = points[-1]
        self.assertAlmostEqual(first_x, 0.10)
        self.assertAlmostEqual(first_y, 0.80)
        self.assertAlmostEqual(last_x, 0.90)
        self.assertAlmostEqual(last_y, 0.20)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test file to verify it fails**

Run: `python -m unittest test_generate_infographic.py -v`
Expected: `ImportError` or `AttributeError` because `PosterSpec`, `build_specs`, and `build_grid_points` do not exist yet.

- [ ] **Step 3: Write the minimal implementation for specs and grid generation**

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class PosterSpec:
    slug: str
    title: str
    subtitle: str
    footer: str
    output_name: str
    columns: int
    rows: int
    variant_indices: list[int]

    @property
    def total_icons(self) -> int:
        return self.columns * self.rows


def build_specs() -> list[PosterSpec]:
    return [
        PosterSpec(
            slug="poster-1000",
            title="Hunting 10 Variants in 10,000 Genomes",
            subtitle="A readable proxy for 0.1% VAF",
            footer="20 mL blood can yield about 10,000 genome equivalents. 1 icon = 10 genomes.",
            output_name="liquid-biopsy-poster-1000.png",
            columns=40,
            rows=25,
            variant_indices=[499],
        ),
        PosterSpec(
            slug="poster-10000",
            title="Only 10 Molecules Carry the Variant",
            subtitle="The full 10,000-genome view at 0.1% VAF",
            footer="20 mL blood -> ~10 mL plasma -> ~30 ng cfDNA -> ~10,000 genomes",
            output_name="liquid-biopsy-poster-10000.png",
            columns=100,
            rows=100,
            variant_indices=[909, 1919, 2929, 3939, 4949, 5959, 6969, 7979, 8989, 9999],
        ),
    ]


def build_grid_points(
    columns: int,
    rows: int,
    left: float,
    right: float,
    bottom: float,
    top: float,
) -> list[tuple[float, float]]:
    if columns < 1 or rows < 1:
        raise ValueError("columns and rows must be positive")

    x_step = 0.0 if columns == 1 else (right - left) / (columns - 1)
    y_step = 0.0 if rows == 1 else (top - bottom) / (rows - 1)
    points: list[tuple[float, float]] = []

    for row in range(rows):
        y = top - (row * y_step)
        for col in range(columns):
            x = left + (col * x_step)
            points.append((x, y))

    return points
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python -m unittest test_generate_infographic.py -v`
Expected: all spec and grid tests pass.

- [ ] **Step 5: Commit the helper baseline**

```bash
git add test_generate_infographic.py generate_infographic.py
git commit -m "test: define infographic poster specs"
```

## Task 2: Render The 1,000-Icon Poster First

**Files:**
- Modify: `src/content/blog/30daychartchallenge/day2-pictogram/test_generate_infographic.py`
- Modify: `src/content/blog/30daychartchallenge/day2-pictogram/generate_infographic.py`

- [ ] **Step 1: Write the failing smoke test for the readable poster output**

```python
import tempfile
from pathlib import Path
from PIL import Image

from generate_infographic import render_poster


class RenderPosterTests(unittest.TestCase):
    def test_render_poster_creates_1000_icon_png(self):
        spec = build_specs()[0]
        with tempfile.TemporaryDirectory() as tmp_dir:
            output_path = Path(tmp_dir) / spec.output_name
            render_poster(spec, output_path)
            self.assertTrue(output_path.exists())
            with Image.open(output_path) as rendered:
                self.assertEqual(rendered.format, "PNG")
                self.assertGreaterEqual(rendered.size[0], 3000)
                self.assertGreaterEqual(rendered.size[1], 4200)
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `MPLBACKEND=Agg python -m unittest test_generate_infographic.RenderPosterTests.test_render_poster_creates_1000_icon_png -v`
Expected: `ImportError` or `AttributeError` because `render_poster` does not exist yet.

- [ ] **Step 3: Implement shared rendering, asset loading, and the 1,000-icon poster path**

```python
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.offsetbox import AnnotationBbox, OffsetImage
from PIL import Image


BASE_DIR = Path(__file__).resolve().parent
GRAY_ICON_PATH = BASE_DIR / "DNA-gray.png"
NAVY_ICON_PATH = BASE_DIR / "DNA-navy.png"
DEFAULT_DPI = 300
FIGURE_SIZE = (12, 16)


def load_icon(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def add_icon(ax, icon_array, x: float, y: float, zoom: float) -> None:
    image_box = OffsetImage(icon_array, zoom=zoom)
    annotation = AnnotationBbox(image_box, (x, y), frameon=False, box_alignment=(0.5, 0.5))
    ax.add_artist(annotation)


def render_poster(spec: PosterSpec, output_path: Path) -> None:
    gray_icon = load_icon(GRAY_ICON_PATH)
    navy_icon = load_icon(NAVY_ICON_PATH)
    gray_array = gray_icon.copy()
    navy_array = navy_icon.copy()

    fig, ax = plt.subplots(figsize=FIGURE_SIZE, dpi=DEFAULT_DPI)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")

    fig.text(0.5, 0.95, spec.title, ha="center", va="top", fontsize=28, fontweight="bold", color="#0f172a")
    fig.text(0.5, 0.91, spec.subtitle, ha="center", va="top", fontsize=14, color="#475569")
    fig.text(0.5, 0.06, spec.footer, ha="center", va="bottom", fontsize=11, color="#334155")

    points = build_grid_points(
        columns=spec.columns,
        rows=spec.rows,
        left=0.08,
        right=0.92,
        bottom=0.12,
        top=0.82,
    )
    variant_lookup = set(spec.variant_indices)
    zoom = 0.20 if spec.total_icons == 1000 else 0.06

    for index, (x, y) in enumerate(points):
        icon = navy_array if index in variant_lookup else gray_array
        add_icon(ax, icon, x, y, zoom=zoom)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=DEFAULT_DPI, bbox_inches="tight", facecolor="white")
    plt.close(fig)
```

- [ ] **Step 4: Run the full test file to verify the readable poster path works**

Run: `MPLBACKEND=Agg python -m unittest test_generate_infographic.py -v`
Expected: previous helper tests still pass, and the 1,000-icon render smoke test passes.

- [ ] **Step 5: Commit the first working poster renderer**

```bash
git add test_generate_infographic.py generate_infographic.py
git commit -m "feat: render 1000 icon biopsy poster"
```

## Task 3: Finish The 10,000-Icon Poster And CLI Output Flow

**Files:**
- Modify: `src/content/blog/30daychartchallenge/day2-pictogram/test_generate_infographic.py`
- Modify: `src/content/blog/30daychartchallenge/day2-pictogram/generate_infographic.py`

- [ ] **Step 1: Write the failing tests for the 10,000-icon output and script entry point**

```python
import subprocess
import sys


class ScriptExecutionTests(unittest.TestCase):
    def test_render_poster_creates_10000_icon_png(self):
        spec = build_specs()[1]
        with tempfile.TemporaryDirectory() as tmp_dir:
            output_path = Path(tmp_dir) / spec.output_name
            render_poster(spec, output_path)
            self.assertTrue(output_path.exists())
            with Image.open(output_path) as rendered:
                self.assertEqual(rendered.format, "PNG")
                self.assertGreaterEqual(rendered.size[0], 3000)
                self.assertGreaterEqual(rendered.size[1], 4200)

    def test_main_writes_both_outputs_in_current_directory(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            subprocess.run(
                [sys.executable, str(Path(__file__).resolve().parent / "generate_infographic.py")],
                cwd=tmp_dir,
                env={"MPLBACKEND": "Agg"},
                check=True,
            )
            self.assertTrue((Path(tmp_dir) / "liquid-biopsy-poster-1000.png").exists())
            self.assertTrue((Path(tmp_dir) / "liquid-biopsy-poster-10000.png").exists())
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `MPLBACKEND=Agg python -m unittest test_generate_infographic.ScriptExecutionTests -v`
Expected: failure because `main()` does not write both posters yet or because the subprocess environment is incomplete.

- [ ] **Step 3: Implement the CLI entry point and make output generation directory-aware**

```python
def main() -> None:
    output_dir = Path.cwd()
    for spec in build_specs():
        render_poster(spec, output_dir / spec.output_name)
        print(f"wrote {spec.output_name}")


if __name__ == "__main__":
    main()
```

Add this small subprocess fix in the test so the child process keeps the existing environment:

```python
env = dict(os.environ)
env["MPLBACKEND"] = "Agg"
subprocess.run(
    [sys.executable, str(Path(__file__).resolve().parent / "generate_infographic.py")],
    cwd=tmp_dir,
    env=env,
    check=True,
)
```

- [ ] **Step 4: Run the full test file and then generate the real outputs**

Run: `MPLBACKEND=Agg python -m unittest test_generate_infographic.py -v`
Expected: all tests pass.

Run: `MPLBACKEND=Agg python generate_infographic.py`
Expected:
- stdout contains `wrote liquid-biopsy-poster-1000.png`
- stdout contains `wrote liquid-biopsy-poster-10000.png`
- both PNG files appear in the current directory

- [ ] **Step 5: Commit the finished script and generated outputs**

```bash
git add generate_infographic.py test_generate_infographic.py liquid-biopsy-poster-1000.png liquid-biopsy-poster-10000.png
git commit -m "feat: generate liquid biopsy pictogram posters"
```

## Task 4: Final Visual QA And Post Copy Sanity Check

**Files:**
- Modify if needed: `src/content/blog/30daychartchallenge/day2-pictogram/generate_infographic.py`
- Regenerate if needed: `src/content/blog/30daychartchallenge/day2-pictogram/liquid-biopsy-poster-1000.png`
- Regenerate if needed: `src/content/blog/30daychartchallenge/day2-pictogram/liquid-biopsy-poster-10000.png`

- [ ] **Step 1: Run a manual inspection pass against the spec**

Checklist:
- `liquid-biopsy-poster-1000.png` reads as the hero poster from a quick glance.
- `liquid-biopsy-poster-10000.png` still shows ten navy variants without turning into visual noise.
- All text is English only.
- The 1,000-icon poster explicitly states `1 icon = 10 genomes`.
- The 10,000-icon poster does not imply the wrong variant count.
- The grid occupies most of the poster area in both images.

- [ ] **Step 2: If any caption, spacing, or zoom values need adjustment, make one minimal change set**

```python
# Example of the only kind of acceptable polish change here:
fig.text(0.5, 0.91, spec.subtitle, ha="center", va="top", fontsize=13, color="#475569")
zoom = 0.19 if spec.total_icons == 1000 else 0.055
```

- [ ] **Step 3: Re-run tests and regenerate outputs after polish**

Run: `MPLBACKEND=Agg python -m unittest test_generate_infographic.py -v`
Expected: all tests still pass.

Run: `MPLBACKEND=Agg python generate_infographic.py`
Expected: both poster files are rewritten successfully.

- [ ] **Step 4: Capture the final commit**

```bash
git add generate_infographic.py test_generate_infographic.py liquid-biopsy-poster-1000.png liquid-biopsy-poster-10000.png
git commit -m "chore: polish biopsy pictogram poster layout"
```
