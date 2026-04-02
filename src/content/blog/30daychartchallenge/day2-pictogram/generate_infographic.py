from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont

CANVAS_WIDTH = 3600
CANVAS_HEIGHT = 4800
GRID_LEFT = 240
GRID_TOP = 880
GRID_SIZE = 3120
GRID_RIGHT = GRID_LEFT + GRID_SIZE
GRID_BOTTOM = GRID_TOP + GRID_SIZE
HEADER_CENTER_X = CANVAS_WIDTH // 2
DEFAULT_BACKGROUND = "white"
TEXT_DARK = "#0f172a"
TEXT_MUTED = "#475569"
TEXT_LIGHT = "#64748b"
ACCENT = "#16324f"
DIVIDER = "#cbd5e1"
BASE_DIR = Path(__file__).resolve().parent
GRAY_ICON_PATH = BASE_DIR / "DNA-gray.png"
NAVY_ICON_PATH = BASE_DIR / "DNA-navy.png"


@dataclass(frozen=True)
class PosterSpec:
    slug: str
    title: str
    subtitle: str
    footer: str
    output_name: str
    columns: int
    rows: int
    variant_indices: tuple[int, ...]

    def __post_init__(self) -> None:
        object.__setattr__(self, "variant_indices", tuple(self.variant_indices))

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
            variant_indices=(499,),
        ),
        PosterSpec(
            slug="poster-10000",
            title="Only 10 Molecules Carry the Variant",
            subtitle="The full 10,000-genome view at 0.1% VAF",
            footer="20 mL blood -> ~10 mL plasma -> ~30 ng cfDNA -> ~10,000 genomes",
            output_name="liquid-biopsy-poster-10000.png",
            columns=100,
            rows=100,
            variant_indices=(909, 1919, 2929, 3939, 4949, 5959, 6969, 7979, 8989, 9999),
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
    if left > right or bottom > top:
        raise ValueError("grid bounds must not be inverted")

    x_step = 0.0 if columns == 1 else (right - left) / (columns - 1)
    y_step = 0.0 if rows == 1 else (top - bottom) / (rows - 1)
    points: list[tuple[float, float]] = []

    for row in range(rows):
        y = bottom if row == rows - 1 else top - (row * y_step)
        for col in range(columns):
            x = right if col == columns - 1 else left + (col * x_step)
            points.append((x, y))

    return points


def get_resampling_filter() -> int:
    if hasattr(Image, "Resampling"):
        return Image.Resampling.LANCZOS
    return Image.LANCZOS


def load_icon(path: Path) -> Image.Image:
    with Image.open(path) as image:
        return image.convert("RGBA")


def load_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = []
    if bold:
        candidates.extend(
            [
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
            ]
        )
    else:
        candidates.extend(
            [
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
            ]
        )

    for candidate in candidates:
        font_path = Path(candidate)
        if font_path.exists():
            return ImageFont.truetype(str(font_path), size=size)

    return ImageFont.load_default()


def measure_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> tuple[int, int]:
    left, top, right, bottom = draw.textbbox((0, 0), text=text, font=font)
    return right - left, bottom - top


def wrap_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.ImageFont,
    max_width: int,
) -> list[str]:
    words = text.split()
    if not words:
        return [""]

    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        candidate_width, _ = measure_text(draw, candidate, font)
        if candidate_width <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def draw_centered_lines(
    draw: ImageDraw.ImageDraw,
    lines: Iterable[str],
    font: ImageFont.ImageFont,
    center_x: int,
    top: int,
    fill: str,
    line_gap: int,
) -> int:
    current_top = top
    for line in lines:
        width, height = measure_text(draw, line, font)
        draw.text((center_x - (width / 2), current_top), line, font=font, fill=fill)
        current_top += height + line_gap
    return current_top


def fit_icon_to_cell(icon: Image.Image, cell_width: int, cell_height: int) -> Image.Image:
    source_width, source_height = icon.size
    scale = min((cell_width * 0.92) / source_width, (cell_height * 0.92) / source_height)
    resized_width = max(1, int(source_width * scale))
    resized_height = max(1, int(source_height * scale))
    return icon.resize((resized_width, resized_height), resample=get_resampling_filter())


def paste_centered(canvas: Image.Image, icon: Image.Image, center_x: float, center_y: float) -> None:
    paste_x = int(round(center_x - (icon.width / 2)))
    paste_y = int(round(center_y - (icon.height / 2)))
    canvas.paste(icon, (paste_x, paste_y), icon)


def draw_header(draw: ImageDraw.ImageDraw, spec: PosterSpec) -> None:
    kicker_font = load_font(42, bold=True)
    title_font = load_font(112, bold=True)
    subtitle_font = load_font(42, bold=False)
    stat_font = load_font(54, bold=True)

    kicker_text = "LIQUID BIOPSY"
    kicker_width, _ = measure_text(draw, kicker_text, kicker_font)
    draw.text((HEADER_CENTER_X - (kicker_width / 2), 150), kicker_text, font=kicker_font, fill=ACCENT)

    title_lines = wrap_text(draw, spec.title, title_font, 2800)
    after_title = draw_centered_lines(
        draw,
        title_lines,
        font=title_font,
        center_x=HEADER_CENTER_X,
        top=240,
        fill=TEXT_DARK,
        line_gap=10,
    )

    subtitle_lines = wrap_text(draw, spec.subtitle, subtitle_font, 2400)
    after_subtitle = draw_centered_lines(
        draw,
        subtitle_lines,
        font=subtitle_font,
        center_x=HEADER_CENTER_X,
        top=after_title + 28,
        fill=TEXT_MUTED,
        line_gap=8,
    )

    stat_text = f"{len(spec.variant_indices)} highlighted out of {spec.total_icons:,} pictograms"
    stat_width, stat_height = measure_text(draw, stat_text, stat_font)
    stat_left = HEADER_CENTER_X - (stat_width / 2) - 32
    stat_top = after_subtitle + 34
    stat_right = HEADER_CENTER_X + (stat_width / 2) + 32
    stat_bottom = stat_top + stat_height + 20
    draw.rounded_rectangle((stat_left, stat_top, stat_right, stat_bottom), radius=28, outline=DIVIDER, width=4)
    draw.text((HEADER_CENTER_X - (stat_width / 2), stat_top + 10), stat_text, font=stat_font, fill=TEXT_DARK)

    draw.line((GRID_LEFT, GRID_TOP - 70, GRID_RIGHT, GRID_TOP - 70), fill=DIVIDER, width=4)


def draw_footer(draw: ImageDraw.ImageDraw, spec: PosterSpec) -> None:
    footer_font = load_font(38, bold=False)
    note_font = load_font(32, bold=False)
    footer_lines = wrap_text(draw, spec.footer, footer_font, 3000)
    footer_bottom = draw_centered_lines(
        draw,
        footer_lines,
        font=footer_font,
        center_x=HEADER_CENTER_X,
        top=4180,
        fill=TEXT_DARK,
        line_gap=8,
    )

    note_text = "Gray = wild-type | Navy = variant"
    note_width, _ = measure_text(draw, note_text, note_font)
    draw.text((HEADER_CENTER_X - (note_width / 2), footer_bottom + 22), note_text, font=note_font, fill=TEXT_LIGHT)


def render_poster(spec: PosterSpec, output_path: Path) -> None:
    canvas = Image.new("RGBA", (CANVAS_WIDTH, CANVAS_HEIGHT), DEFAULT_BACKGROUND)
    draw = ImageDraw.Draw(canvas)
    gray_icon = load_icon(GRAY_ICON_PATH)
    navy_icon = load_icon(NAVY_ICON_PATH)

    draw_header(draw, spec)

    cell_width = max(1, GRID_SIZE // spec.columns)
    cell_height = max(1, GRID_SIZE // spec.rows)
    gray_resized = fit_icon_to_cell(gray_icon, cell_width, cell_height)
    navy_resized = fit_icon_to_cell(navy_icon, cell_width, cell_height)
    local_points = build_grid_points(
        columns=spec.columns,
        rows=spec.rows,
        left=cell_width / 2,
        right=GRID_SIZE - (cell_width / 2),
        bottom=cell_height / 2,
        top=GRID_SIZE - (cell_height / 2),
    )
    points = [(GRID_LEFT + x, GRID_TOP + (GRID_SIZE - y)) for x, y in local_points]
    variant_lookup = set(spec.variant_indices)

    for index, (center_x, center_y) in enumerate(points):
        icon = navy_resized if index in variant_lookup else gray_resized
        paste_centered(canvas, icon, center_x, center_y)

    draw_footer(draw, spec)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output_path, format="PNG")


def main() -> None:
    output_dir = Path.cwd()
    for spec in build_specs():
        render_poster(spec, output_dir / spec.output_name)
        print(f"wrote {spec.output_name}")


if __name__ == "__main__":
    main()
