import io
import os
import sys
from PIL import Image

IMG_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")
MAX_DIM = 1000
JPEG_QUALITY = 78

# Source JPEGs were already batch-compressed to ~quality 66 by a prior tool.
# Re-encoding at a similar/higher quality without resizing just inflates
# file size (different Huffman/subsampling choices), so only touch files
# that are actually larger than anything the layout will ever display, and
# always keep whichever of (original bytes, re-encoded bytes) is smaller.
SKIP = {"Introduction-of-S.E.A.T.S-Farm-1.jpg"}  # full-bleed hero fallback background

# Small logos/icons displayed at well under 100px in CSS (.sdg-row img: 84x84,
# .clients-strip img: 46px tall, .cert-card img: 110px wide) - the 1500px+
# sources are 15-30x oversized for their on-page footprint.
PNG_CAPS = {
    "E_WEB_08.png": 220,
    "E_WEB_12.png": 220,
    "E_SDG_logo_UN_emblem_horizontal_trans_WEB-2048x320-1.png": 600,
    "Cpsf-logo.png": 300,
    "clients-1.png": 300,
}

def encode_jpeg(path):
    im = Image.open(path)
    w, h = im.size
    if max(w, h) <= MAX_DIM:
        return None
    if im.mode != "RGB":
        im = im.convert("RGB")
    scale = MAX_DIM / max(w, h)
    im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    return buf.getvalue()

def encode_png(path, cap):
    im = Image.open(path)
    w, h = im.size
    if max(w, h) <= cap:
        return None
    scale = cap / max(w, h)
    im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return buf.getvalue()

def main():
    total_before = 0
    total_after = 0
    for f in sorted(os.listdir(IMG_DIR)):
        if f in SKIP:
            continue
        ext = os.path.splitext(f)[1].lower()
        if ext not in (".jpg", ".jpeg", ".png"):
            continue
        p = os.path.join(IMG_DIR, f)
        with open(p, "rb") as fh:
            original = fh.read()
        try:
            if ext in (".jpg", ".jpeg"):
                new_bytes = encode_jpeg(p)
            else:
                new_bytes = encode_png(p, PNG_CAPS.get(f, MAX_DIM))
        except Exception as e:
            print(f"ERROR {f}: {e}", file=sys.stderr)
            continue
        if new_bytes is None or len(new_bytes) >= len(original):
            continue
        with open(p, "wb") as fh:
            fh.write(new_bytes)
        total_before += len(original)
        total_after += len(new_bytes)
        print(f"{f}: {len(original)/1024:.1f}K -> {len(new_bytes)/1024:.1f}K")
    if total_before:
        print(f"\nTOTAL (changed files): {total_before/1024:.1f}K -> {total_after/1024:.1f}K "
              f"({(1 - total_after/total_before)*100:.1f}% reduction)")
    else:
        print("No files changed.")

if __name__ == "__main__":
    main()
