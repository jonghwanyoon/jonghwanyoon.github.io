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
        self.assertEqual(
            spec.variant_indices,
            [909, 1919, 2929, 3939, 4949, 5959, 6969, 7979, 8989, 9999],
        )


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


if __name__ == "__main__":
    unittest.main()
