import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image

from generate_infographic import PosterSpec, build_grid_points, build_specs, render_poster


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
        self.assertEqual(spec.variant_indices, (499,))
        self.assertIn("1 icon = 10 genomes", spec.footer)

    def test_10000_poster_spec_matches_scale_design(self):
        spec = build_specs()[1]
        self.assertEqual(spec.columns, 100)
        self.assertEqual(spec.rows, 100)
        self.assertEqual(spec.total_icons, 10000)
        self.assertEqual(len(spec.variant_indices), 10)
        self.assertEqual(
            spec.variant_indices,
            (909, 1919, 2929, 3939, 4949, 5959, 6969, 7979, 8989, 9999),
        )

    def test_variant_indices_are_immutable(self):
        spec = build_specs()[0]
        self.assertIsInstance(spec.variant_indices, tuple)
        with self.assertRaises(AttributeError):
            spec.variant_indices.append(10)


class GridPointTests(unittest.TestCase):
    def test_build_grid_points_returns_all_cells(self):
        points = build_grid_points(
            columns=4,
            rows=3,
            left=0.10,
            right=0.90,
            bottom=0.20,
            top=0.80,
        )
        self.assertEqual(len(points), 12)

    def test_build_grid_points_spans_bounds(self):
        points = build_grid_points(
            columns=4,
            rows=3,
            left=0.10,
            right=0.90,
            bottom=0.20,
            top=0.80,
        )
        first_x, first_y = points[0]
        last_x, last_y = points[-1]
        self.assertAlmostEqual(first_x, 0.10)
        self.assertAlmostEqual(first_y, 0.80)
        self.assertAlmostEqual(last_x, 0.90)
        self.assertAlmostEqual(last_y, 0.20)

    def test_build_grid_points_rejects_non_positive_dimensions(self):
        with self.assertRaises(ValueError):
            build_grid_points(columns=0, rows=3, left=0.10, right=0.90, bottom=0.20, top=0.80)

        with self.assertRaises(ValueError):
            build_grid_points(columns=4, rows=-1, left=0.10, right=0.90, bottom=0.20, top=0.80)

    def test_build_grid_points_rejects_inverted_bounds(self):
        with self.assertRaises(ValueError):
            build_grid_points(columns=4, rows=3, left=0.90, right=0.10, bottom=0.20, top=0.80)

        with self.assertRaises(ValueError):
            build_grid_points(columns=4, rows=3, left=0.10, right=0.90, bottom=0.80, top=0.20)

    def test_build_grid_points_handles_single_column(self):
        points = build_grid_points(
            columns=1,
            rows=3,
            left=0.50,
            right=0.50,
            bottom=0.20,
            top=0.80,
        )
        self.assertEqual(points, [(0.50, 0.80), (0.50, 0.50), (0.50, 0.20)])

    def test_build_grid_points_handles_single_row(self):
        points = build_grid_points(
            columns=3,
            rows=1,
            left=0.10,
            right=0.90,
            bottom=0.40,
            top=0.40,
        )
        self.assertEqual(points, [(0.10, 0.40), (0.50, 0.40), (0.90, 0.40)])


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


class ScriptExecutionTests(unittest.TestCase):
    def test_main_writes_both_outputs_in_current_directory(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            env = dict(os.environ)
            env["MPLBACKEND"] = "Agg"
            subprocess.run(
                [sys.executable, str(Path(__file__).resolve().parent / "generate_infographic.py")],
                cwd=tmp_dir,
                env=env,
                check=True,
            )
            self.assertTrue((Path(tmp_dir) / "liquid-biopsy-poster-1000.png").exists())
            self.assertTrue((Path(tmp_dir) / "liquid-biopsy-poster-10000.png").exists())


if __name__ == "__main__":
    unittest.main()
