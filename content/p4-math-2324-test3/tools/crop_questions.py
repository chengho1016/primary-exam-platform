from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/cheng/.codex/tmp/math-paper-hires")
OUTPUT = ROOT / "assets" / "questions"

# Coordinates are based on the 180 dpi, 1339 x 1893 PNG render of the clean
# (unanswered) first 12 pages.  A small overlap is intentional so mathematical
# notation and diagrams are never clipped.
CROPS = {
    1: (1, 250, 620),
    2: (1, 700, 820),
    3: (1, 900, 1080),
    4: (1, 1160, 1490),
    5: (1, 1570, 1770),
    6: (2, 20, 330),
    7: (2, 400, 760),
    8: (2, 870, 1260),
    9: (2, 1370, 1800),
    10: (3, 120, 320),
    11: (3, 400, 620),
    12: (3, 680, 920),
    13: (3, 1000, 1230),
    14: (3, 1300, 1530),
    15: (3, 1600, 1830),
    16: (4, 30, 160),
    17: (4, 200, 410),
    18: (4, 460, 590),
    19: (4, 650, 770),
    20: (4, 830, 1020),
    21: (4, 1090, 1400),
    22: (4, 1490, 1720),
    23: (5, 70, 610),
    24: (5, 680, 960),
    25: (5, 1050, 1740),
    26: (6, 130, 320),
    27: (6, 400, 800),
    28: (6, 900, 1300),
    29: (6, 1420, 1740),
    30: (7, 50, 530),
    31: (7, 680, 800),
    32: (7, 1000, 1200),
    33: (7, 1390, 1780),
    34: (8, 70, 360),
    35: (8, 500, 880),
    36: (8, 1070, 1170),
    37: (8, 1290, 1540),
    38: (9, 1160, 1240),
    39: (9, 1300, 1390),
    40: (9, 1460, 1535),
    41: (9, 1590, 1670),
    42: (9, 1730, 1820),
    43: (10, 80, 930),
    44: (10, 980, 1830),
    45: (11, 60, 1460),
    46: (12, 40, 1000),
}


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for question, (page_number, top, bottom) in CROPS.items():
        page_path = SOURCE / f"page-{page_number:02d}.png"
        with Image.open(page_path) as page:
            crop = page.crop((25, top, page.width - 25, bottom))
            crop.save(OUTPUT / f"q{question:02d}.png", optimize=True)

    with Image.open(SOURCE / "page-09.png") as page:
        stimulus = page.crop((120, 40, page.width - 120, 1120))
        stimulus.save(OUTPUT / "stimulus-q38-q42.png", optimize=True)


if __name__ == "__main__":
    main()
