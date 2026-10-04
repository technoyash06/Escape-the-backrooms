"""Create isolated transparent animation frames from the supplied clean sprite sheets."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
ANIMATIONS = ROOT / "Character form" / "Player" / "Animations"
FRAMES = ANIMATIONS / "Frames"
PADDING = 8
SHEET_WIDTH = 2172
HALF_HEIGHT = 362


def cell_edges(columns: int, index: int) -> tuple[int, int]:
    """Return exact left and right pixel edges for a sheet row."""
    return round(index * SHEET_WIDTH / columns), round((index + 1) * SHEET_WIDTH / columns)


def save_isolated_frame(sheet: Image.Image, box: tuple[int, int, int, int], output: Path) -> None:
    """Crop one cell to its visible alpha bounds, with a small safe transparent border."""
    cell = sheet.crop(box)
    alpha_bounds = cell.getchannel("A").getbbox()
    if alpha_bounds is None:
        raise ValueError(f"No visible pixels in frame: {output.name}")

    left, top, right, bottom = alpha_bounds
    left = max(0, left - PADDING)
    top = max(0, top - PADDING)
    right = min(cell.width, right + PADDING)
    bottom = min(cell.height, bottom + PADDING)

    output.parent.mkdir(parents=True, exist_ok=True)
    cell.crop((left, top, right, bottom)).save(output, "PNG")


def extract_row(sheet: Image.Image, form: str, names: list[str], row: int) -> None:
    """Extract a row whose frames share the sheet width equally."""
    y = row * HALF_HEIGHT
    for index, name in enumerate(names):
        left, right = cell_edges(len(names), index)
        save_isolated_frame(sheet, (left, y, right, y + HALF_HEIGHT), FRAMES / form / f"{name}.png")


def extract_sheet(filename: str, form: str, top: list[str], bottom: list[str]) -> None:
    with Image.open(ANIMATIONS / filename) as source:
        sheet = source.convert("RGBA")
        extract_row(sheet, form, top, 0)
        extract_row(sheet, form, bottom, 1)


def main() -> None:
    extract_sheet(
        "Swift Animation Sheet.png",
        "Swift",
        ["idle-1", "idle-2", "run-1", "run-2", "run-3", "run-4"],
        ["jump", "fall", "dash-1", "dash-2", "dash-3", "dash-4"],
    )
    extract_sheet(
        "Titan Animation Sheet.png",
        "Titan",
        ["idle-1", "idle-2", "walk-1", "walk-2", "walk-3", "walk-4", "jump", "fall"],
        ["ground-slam-1", "ground-slam-2", "ground-slam-3", "ground-slam-4"],
    )
    extract_sheet(
        "Sky Animation Sheet.png",
        "Sky",
        ["float-1", "float-2", "float-3", "float-4", "fly-1", "fly-2", "fly-3"],
        ["ascend", "rise", "hover-1", "hover-2", "hover-3", "hover-4"],
    )


if __name__ == "__main__":
    main()
