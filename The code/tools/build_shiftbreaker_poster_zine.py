from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "Shiftbreaker_Game_Poster_Zine.pdf"
WIDTH, HEIGHT = A4

ART = {
    "background": ROOT / "Background" / "Background.png",
    "swift": ROOT / "Character form" / "Player" / "Swift form.png",
    "titan": ROOT / "Character form" / "Player" / "Titan form.png",
    "sky": ROOT / "Character form" / "Player" / "Sky form.png",
    "null": ROOT / "Character form" / "Enemy" / "Null-Enemy.png",
    "platform": ROOT / "Platforms" / "Platform 3.png",
    "gate": ROOT / "Elements" / "Exit gate.png",
    "key": ROOT / "Elements" / "Key.png",
}

INK = HexColor("#121326")
PANEL = HexColor("#20203a")
TEXT = HexColor("#f6f3ff")
MUTED = HexColor("#b9bbd2")
BLUE = HexColor("#55e3ff")
GREEN = HexColor("#72f5ae")
CYAN = HexColor("#b4faff")
RED = HexColor("#ff6b88")
GOLD = HexColor("#ffd773")


def translucent(color, opacity):
    return Color(color.red, color.green, color.blue, alpha=opacity)


def image(c, path, x, y, width, height, opacity=1):
    if not path.exists():
        return
    source = ImageReader(str(path))
    source_w, source_h = source.getSize()
    scale = min(width / source_w, height / source_h)
    draw_w = source_w * scale
    draw_h = source_h * scale
    c.saveState()
    if opacity != 1:
        c.setFillAlpha(opacity)
    c.drawImage(source, x + (width - draw_w) / 2, y + (height - draw_h) / 2, draw_w, draw_h, mask="auto")
    c.restoreState()


def write_wrapped(c, text, x, y, width, font="Helvetica", size=9, leading=12, color=TEXT):
    c.setFillColor(color)
    c.setFont(font, size)
    line = ""
    for word in text.split():
        proposed = f"{line} {word}".strip()
        if line and c.stringWidth(proposed, font, size) > width:
            c.drawString(x, y, line)
            y -= leading
            line = word
        else:
            line = proposed
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def framed_panel(c, x, y, width, height, accent):
    c.saveState()
    c.setFillColor(translucent(PANEL, 0.94))
    c.setStrokeColor(translucent(accent, 0.94))
    c.setLineWidth(1.2)
    c.roundRect(x, y, width, height, 8, fill=1, stroke=1)
    c.setFillColor(accent)
    c.roundRect(x + 4, y + height - 6, width - 8, 3, 1.5, fill=1, stroke=0)
    c.restoreState()


def gameplay_card(c, x, y, width, height, form, title, caption, accent, object_art=None):
    framed_panel(c, x, y, width, height, accent)
    c.saveState()
    c.roundRect(x + 7, y + 32, width - 14, height - 42, 5, fill=0, stroke=0)
    c.clipPath(c.beginPath(), fill=0, stroke=0)
    c.restoreState()
    c.saveState()
    c.setFillColor(translucent(INK, 0.66))
    c.rect(x + 7, y + 32, width - 14, height - 42, fill=1, stroke=0)
    c.restoreState()
    image(c, ART["background"], x + 7, y + 32, width - 14, height - 42, 0.62)
    image(c, form, x + 18, y + 34, width * 0.48, height - 50)
    if object_art:
        image(c, object_art, x + width * 0.58, y + 34, width * 0.3, height - 50)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(x + 10, y + 17, title)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawRightString(x + width - 10, y + 17, caption)


def form_row(c, x, y, label, role, art, accent):
    framed_panel(c, x, y, 158, 83, accent)
    image(c, art, x + 6, y + 21, 70, 52)
    c.setFillColor(accent)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x + 78, y + 54, label)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(x + 78, y + 40, role)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.2)
    c.drawString(x + 78, y + 24, "One form. One clear job.")


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4)
    c.setTitle("Shiftbreaker - Game Poster Zine")

    image(c, ART["background"], 0, 0, WIDTH, HEIGHT)
    c.saveState()
    c.setFillColor(translucent(INK, 0.85))
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    c.setStrokeColor(translucent(BLUE, 0.13))
    c.setLineWidth(0.6)
    for position in range(-50, int(WIDTH + 100), 32):
        c.line(position, 0, position, HEIGHT)
    for position in range(0, int(HEIGHT + 1), 32):
        c.line(0, position, WIDTH, position)
    c.restoreState()

    c.setFillColor(RED)
    c.rect(0, HEIGHT - 15, WIDTH, 15, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 6.8)
    c.drawCentredString(WIDTH / 2, HEIGHT - 10, "MY 2D ACTION-PLATFORMER GAME DESIGN PROJECT")

    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 34)
    c.drawString(36, HEIGHT - 65, "SHIFTBREAKER")
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(39, HEIGHT - 81, "MY GAME: RUN. TRANSFORM. BREAK THE NULL ENGINE.")
    c.setStrokeColor(BLUE)
    c.setLineWidth(1.2)
    c.line(37, HEIGHT - 88, WIDTH - 37, HEIGHT - 88)

    c.setFillColor(translucent(PANEL, 0.95))
    c.roundRect(36, HEIGHT - 174, WIDTH - 72, 67, 8, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(51, HEIGHT - 127, "THE STORY")
    write_wrapped(c, "In my game, a young spirit wakes in a fractured world controlled by the Null. To escape, the player shifts between speed, power, and flight - using momentum to overcome each obstacle.", 51, HEIGHT - 143, WIDTH - 102, size=9, leading=12)

    c.setFillColor(CYAN)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(36, HEIGHT - 201, "THREE FORMS. ONE ESCAPE.")
    form_row(c, 36, HEIGHT - 292, "SWIFT", "BLUE - SPEED", ART["swift"], BLUE)
    form_row(c, 218, HEIGHT - 292, "TITAN", "GREEN - POWER", ART["titan"], GREEN)
    form_row(c, 400, HEIGHT - 292, "SKY", "CYAN - FLIGHT", ART["sky"], CYAN)

    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(36, HEIGHT - 323, "MY SIGNATURE MECHANIC: MOMENTUM SHIFTS")
    gameplay_card(c, 36, HEIGHT - 462, 251, 122, ART["titan"], "IMPACT SHIFT", "SWIFT -> TITAN", GREEN, ART["platform"])
    gameplay_card(c, 309, HEIGHT - 462, 251, 122, ART["sky"], "SOAR SHIFT", "SWIFT -> SKY", CYAN, ART["gate"])

    c.setFillColor(translucent(PANEL, 0.95))
    c.setStrokeColor(translucent(GOLD, 0.95))
    c.roundRect(36, HEIGHT - 585, WIDTH - 72, 89, 8, fill=1, stroke=1)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(51, HEIGHT - 521, "WHAT MAKES MY GAME SPECIAL?")
    write_wrapped(c, "I designed the player to combine forms at the right moment: sprint into Titan to smash a wall, jump into Sky to soar across a ravine, or fall from Sky into Titan for a Meteor Shift.", 51, HEIGHT - 539, WIDTH - 102, size=8.8, leading=11)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(51, HEIGHT - 572, "6 LEVELS  |  QUESTS  |  CHECKPOINTS  |  SHIFTER CRYSTALS  |  THE NULL ENGINE FINALE")

    c.setFillColor(CYAN)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(36, HEIGHT - 613, "HOW TO PLAY MY GAME")
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(36, HEIGHT - 630, "1 / 2 / 3")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawString(92, HEIGHT - 630, "Transform into Swift, Titan, or Sky.")
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(36, HEIGHT - 647, "MOVE + SPACE")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawString(104, HEIGHT - 647, "Run, jump, fly, and preserve your momentum.")
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(36, HEIGHT - 664, "SHIFT SMART")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawString(101, HEIGHT - 664, "Save energy and discover the strongest combo for each challenge.")

    c.saveState()
    c.setFillColor(translucent(RED, 0.16))
    c.roundRect(365, HEIGHT - 694, 195, 76, 8, fill=1, stroke=0)
    c.restoreState()
    image(c, ART["null"], 386, HEIGHT - 689, 74, 64)
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(472, HEIGHT - 646, "THE NULL")
    write_wrapped(c, "A copied enemy that turns your own forms into a puzzle.", 472, HEIGHT - 661, 75, size=7.4, leading=9, color=MUTED)

    c.setFillColor(RED)
    c.rect(0, 0, WIDTH, 20, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(WIDTH / 2, 7, "SHIFTBREAKER - CREATED BY: [YOUR NAME] - A GAME ABOUT MASTERING CHANGE")
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
