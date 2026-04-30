"""Process Gemini-generated sprite strip into game-ready spritesheet.

Input:  1024x1024 PNG with 4 frames horizontal, near-white background
Output: 256x64 PNG, 4 frames @ 64x64, transparent background, nearest-neighbor scaled
"""
from PIL import Image
import sys

src_path = sys.argv[1]
out_path = sys.argv[2]
n_frames = int(sys.argv[3]) if len(sys.argv) > 3 else 4
frame_size = int(sys.argv[4]) if len(sys.argv) > 4 else 64

img = Image.open(src_path).convert('RGBA')
W, H = img.size

# Color-key: pixels where R,G,B all > 220 → alpha 0 (smooth edge with luminance)
px = img.load()
for y in range(H):
    for x in range(W):
        r, g, b, a = px[x, y]
        # near-white background
        m = min(r, g, b)
        if m > 220:
            # softer edge: linear alpha falloff between 220 and 250
            alpha = max(0, int((250 - m) * (255 / 30)))
            px[x, y] = (r, g, b, alpha)

# Crop into N frames (assumes single row, equal width)
frame_w = W // n_frames
frames = []
for i in range(n_frames):
    f = img.crop((i * frame_w, 0, (i + 1) * frame_w, H))
    # Trim transparent margins to find character bbox
    bbox = f.getbbox()
    if bbox:
        f = f.crop(bbox)
    # Pad to square (centered) before scaling, so character keeps proportions
    fw, fh = f.size
    side = max(fw, fh)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(f, ((side - fw) // 2, (side - fh) // 2), f)
    # Nearest-neighbor downscale to target frame size
    sq = sq.resize((frame_size, frame_size), Image.NEAREST)
    frames.append(sq)

# Assemble horizontal strip
sheet = Image.new('RGBA', (frame_size * n_frames, frame_size), (0, 0, 0, 0))
for i, f in enumerate(frames):
    sheet.paste(f, (i * frame_size, 0), f)

sheet.save(out_path)
print(f'Saved {out_path}: {sheet.size}, {n_frames} frames @ {frame_size}px')
