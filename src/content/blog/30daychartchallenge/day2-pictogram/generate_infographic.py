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
