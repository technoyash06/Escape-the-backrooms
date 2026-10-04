from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A5, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "Shiftbreaker_Zine.pdf"
PAGE_W, PAGE_H = landscape(A5)

ASSETS = {
    "background": ROOT / "Background" / "Background.png",
    "swift": ROOT / "Character form" / "Player" / "Swift form.png",
    "titan": ROOT / "Character form" / "Player" / "Titan form.png",
    "sky": ROOT / "Character form" / "Player" / "Sky form.png",
    "null": ROOT / "Character form" / "Enemy" / "Null-Enemy.png",
    "key": ROOT / "Elements" / "Key.png",
    "gate": ROOT / "Elements" / "Exit gate.png",
}

NAVY = HexColor("#071722")
INK = HexColor("#dffcff")
MUTED = HexColor("#8bbcc6")
BLUE = HexColor("#40d7ff")
GREEN = HexColor("#55f29c")
CYAN = HexColor("#9bfbff")
RED = HexColor("#ff5e78")
GOLD = HexColor("#ffd56a")


def alpha(c, opacity):
    return Color(c.red, c.green, c.blue, alpha=opacity)


def add_image(c, path, x, y, width, height, opacity=1):
    """Draw an asset inside its rectangle while preserving its proportions."""
    if not path.exists():
        return
    image = ImageReader(str(path))
    source_w, source_h = image.getSize()
    scale = min(width / source_w, height / source_h)
    draw_w = source_w * scale
    draw_h = source_h * scale
    draw_x = x + (width - draw_w) / 2
    draw_y = y + (height - draw_h) / 2
    c.saveState()
    if opacity != 1:
        c.setFillAlpha(opacity)
    c.drawImage(image, draw_x, draw_y, draw_w, draw_h, mask="auto")
    c.restoreState()


def background(c, tint=NAVY, opacity=0.72):
    add_image(c, ASSETS["background"], 0, 0, PAGE_W, PAGE_H)
    c.saveState()
    c.setFillColor(alpha(tint, opacity))
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.restoreState()


def title(c, heading, subtitle=""):
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(25, PAGE_H - 35, heading)
    c.setStrokeColor(BLUE)
    c.setLineWidth(1.5)
    c.line(25, PAGE_H - 43, 150, PAGE_H - 43)
    if subtitle:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8.5)
        c.drawString(25, PAGE_H - 57, subtitle)


def footer(c, page_number):
    c.setFillColor(alpha(INK, 0.72))
    c.setFont("Helvetica-Bold", 7)
    c.drawRightString(PAGE_W - 18, 14, f"SHIFTBREAKER  /  {page_number:02d}")
    c.setStrokeColor(alpha(BLUE, 0.45))
    c.setLineWidth(0.5)
    c.line(18, 20, PAGE_W - 18, 20)


def text_box(c, x, y, width, text, color=INK, size=9.5, leading=13):
    c.setFillColor(color)
    c.setFont("Helvetica", size)
    cursor = y
    words = text.split()
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if c.stringWidth(candidate, "Helvetica", size) > width and line:
            c.drawString(x, cursor, line)
            cursor -= leading
            line = word
        else:
            line = candidate
    if line:
        c.drawString(x, cursor, line)
        cursor -= leading
    return cursor


def card(c, x, y, width, height, heading, body, accent):
    c.saveState()
    c.setFillColor(alpha(NAVY, 0.82))
    c.setStrokeColor(alpha(accent, 0.8))
    c.setLineWidth(1)
    c.roundRect(x, y, width, height, 8, fill=1, stroke=1)
    c.setFillColor(accent)
    c.rect(x, y + height - 4, width, 4, fill=1, stroke=0)
    c.restoreState()
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x + 12, y + height - 22, heading)
    text_box(c, x + 12, y + height - 38, width - 24, body, MUTED, 8.2, 10.5)


def form_panel(c, x, y, width, label, role, body, art, accent):
    c.saveState()
    c.setFillColor(alpha(NAVY, 0.86))
    c.setStrokeColor(alpha(accent, 0.9))
    c.roundRect(x, y, width, 140, 8, fill=1, stroke=1)
    c.restoreState()
    add_image(c, art, x + 8, y + 43, width - 16, 78)
    c.setFillColor(accent)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(x + width / 2, y + 30, label)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(x + width / 2, y + 18, role)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.9)
    c.drawCentredString(x + width / 2, y + 8, body)


def cover(c):
    background(c, NAVY, 0.35)
    c.saveState()
    c.setFillColor(alpha(NAVY, 0.46))
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.restoreState()
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 35, "A 2D ACTION-PLATFORMER")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 78, "SHIFTBREAKER")
    c.setFillColor(CYAN)
    c.setFont("Helvetica", 12)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 99, "Run. Transform. Break the Null Engine.")
    add_image(c, ASSETS["swift"], 22, 36, 120, 105)
    add_image(c, ASSETS["titan"], 155, 27, 120, 118)
    add_image(c, ASSETS["sky"], 287, 38, 120, 106)
    c.setFillColor(alpha(NAVY, 0.82))
    c.roundRect(118, 22, 184, 26, 8, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(PAGE_W / 2, 32, "THE THREE FORMS. ONE MOMENTUM-POWERED ESCAPE.")


def story(c):
    background(c, HexColor("#071e22"), 0.75)
    title(c, "THE WORLD HAS FRACTURED", "A world of ruins, machine corridors, and living energy.")
    card(c, 25, 94, 178, 76, "THE PROBLEM", "A hostile force called the Null copies the player's transformations and turns the world's systems against them.", RED)
    card(c, 217, 94, 178, 76, "THE GOAL", "Travel through six unique zones, restore lost pathways, solve transformation puzzles, and destroy the Null Engine.", BLUE)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(25, 70, "THE PLAYER'S JOURNEY")
    text_box(c, 25, 54, 360, "Shiftbreaker is designed as a fast, readable adventure. Every obstacle teaches a useful idea: speed, strength, flight, energy control, timing, or clever use of the Null.", INK, 9.5, 13)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(25, 28, "CORE QUESTION:")
    c.setFillColor(white)
    c.setFont("Helvetica", 9)
    c.drawString(104, 28, "Can you master the right form at the right moment?")
    footer(c, 2)


def forms(c):
    background(c, NAVY, 0.82)
    title(c, "CHOOSE YOUR FORM", "Each form has a clear strength, control style, and visual color.")
    form_panel(c, 20, 46, 126, "SWIFT", "BLUE - SPEED", "Sprint, dash, and build momentum.", ASSETS["swift"], BLUE)
    form_panel(c, 153, 46, 126, "TITAN", "GREEN - POWER", "Break walls and slam weak floors.", ASSETS["titan"], GREEN)
    form_panel(c, 286, 46, 126, "SKY", "CYAN - FLIGHT", "Reach high routes and cross gaps.", ASSETS["sky"], CYAN)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_W / 2, 27, "Controls: 1 Swift    2 Titan    3 Sky    Arrow keys / WASD Move    Space Jump")
    footer(c, 3)


def combos(c):
    background(c, HexColor("#101322"), 0.82)
    title(c, "MOMENTUM SHIFTING", "The signature mechanic: carry your movement into the next form.")
    combos_data = [
        ("SOAR SHIFT", "SWIFT -> SKY", "Sprint, jump, then become Sky to cross a huge ravine.", CYAN),
        ("IMPACT SHIFT", "SWIFT -> TITAN", "Build speed, transform, then smash through a reinforced wall.", GREEN),
        ("METEOR SHIFT", "SKY -> TITAN", "Fall from above, transform, and ground-slam a weak floor.", GOLD),
    ]
    y = 145
    for name, path, body, accent in combos_data:
        card(c, 32, y, 370, 38, name, body, accent)
        c.setFillColor(accent)
        c.setFont("Helvetica-Bold", 8)
        c.drawRightString(390, y + 25, path)
        y -= 45
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawCentredString(PAGE_W / 2, 29, "Perfect Shifts use less energy and reward good timing.")
    footer(c, 4)


def levels(c):
    background(c, HexColor("#170d1c"), 0.82)
    title(c, "SIX LEVELS. SIX IDEAS.", "Every level introduces a different challenge instead of repeating one route.")
    entries = [
        ("01", "THE OVERGROWTH", "Learn Impact Shift and the first Swift routes.", GREEN),
        ("02", "THE RAVINE", "A huge gap makes Soar Shift necessary.", CYAN),
        ("03", "THE RUINS", "Collect three Energy Cores to restore the lift.", GOLD),
        ("04", "SHATTERED MACHINE", "Timed lasers, crushers, switches, and doors.", RED),
        ("05", "NULL'S DOMAIN", "Lure copied forms onto plates and through gates.", RED),
        ("06", "THE NULL ENGINE", "Disable stabilizers, then finish with Meteor Shift.", BLUE),
    ]
    positions = [(24, 126), (222, 126), (24, 76), (222, 76), (24, 26), (222, 26)]
    for (number, name, body, accent), (x, y) in zip(entries, positions):
        c.setFillColor(alpha(NAVY, 0.88))
        c.setStrokeColor(alpha(accent, 0.9))
        c.roundRect(x, y, 180, 40, 6, fill=1, stroke=1)
        c.setFillColor(accent)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(x + 10, y + 15, number)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 8.4)
        c.drawString(x + 40, y + 25, name)
        text_box(c, x + 40, y + 13, 128, body, MUTED, 6.8, 8)
    footer(c, 5)


def missions(c):
    background(c, HexColor("#0a2526"), 0.82)
    title(c, "ECHO MISSIONS AND DISCOVERY", "Talk to Echoes to choose an optional level quest.")
    add_image(c, ASSETS["key"], 34, 65, 78, 92)
    card(c, 127, 120, 260, 52, "QUESTS", "Each level gives different quest choices. Accept a mission to earn coins, health recovery, or energy rewards.", GOLD)
    card(c, 127, 61, 260, 52, "CHECKPOINTS", "Fast checkpoints let players retry difficult combo sections without replaying the whole level.", BLUE)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(30, 41, "MASTERY REWARDS")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawString(30, 27, "Coins, Shifter Crystals, perfect shifts, health, and completion time affect each level rank.")
    footer(c, 6)


def finale(c):
    background(c, HexColor("#240b1a"), 0.78)
    title(c, "THE NULL ENGINE", "The finale tests every form and every combo learned in the game.")
    add_image(c, ASSETS["null"], 31, 49, 130, 122)
    add_image(c, ASSETS["gate"], 300, 43, 94, 132)
    card(c, 164, 119, 126, 45, "THE NULL", "It copies Swift, Titan, and Sky. Each copied form behaves differently.", RED)
    card(c, 164, 67, 126, 45, "THE FINALE", "Hit the stabilizers, soar above the Core, then Meteor Shift to destroy it.", GOLD)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(PAGE_W / 2, 30, "SHIFTBREAKER - THE NULL ENGINE HAS FALLEN")
    footer(c, 7)


def back_cover(c):
    background(c, NAVY, 0.57)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(PAGE_W / 2, 156, "READY TO SHIFT?")
    c.setFillColor(CYAN)
    c.setFont("Helvetica", 11)
    c.drawCentredString(PAGE_W / 2, 136, "Fast action. Smart puzzles. One powerful transformation system.")
    c.setFillColor(alpha(NAVY, 0.84))
    c.roundRect(70, 59, 292, 47, 10, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(PAGE_W / 2, 89, "SHIFTBREAKER")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_W / 2, 75, "A 2D platformer designed around Momentum Shifting.")
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(PAGE_W / 2, 32, "RUN. SHIFT. BREAK THE ENGINE.")


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=landscape(A5))
    c.setTitle("Shiftbreaker - Game Zine")
    for page in (cover, story, forms, combos, levels, missions, finale, back_cover):
        page(c)
        c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
