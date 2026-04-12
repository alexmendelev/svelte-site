from pathlib import Path
from PIL import Image

SRC_ROOT = Path("assets")
DEST_ROOT = SRC_ROOT / "mobile"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_DIMENSION = 768

print(f"Scanning images under {SRC_ROOT.resolve()}")

files_to_process = []
for path in SRC_ROOT.rglob("*"):
    if not path.is_file():
        continue
    if DEST_ROOT in path.parents:
        continue
    if path.suffix.lower() not in IMAGE_EXTENSIONS:
        continue
    files_to_process.append(path)

print(f"Found {len(files_to_process)} image files to process.")

for source_path in sorted(files_to_process):
    relative_path = source_path.relative_to(SRC_ROOT)
    target_path = DEST_ROOT / relative_path
    target_path.parent.mkdir(parents=True, exist_ok=True)

    source_size = source_path.stat().st_size
    if target_path.exists() and target_path.stat().st_mtime >= source_path.stat().st_mtime:
        print(f"Skipping existing mobile version: {relative_path}")
        continue

    print(f"Processing {relative_path}")
    with Image.open(source_path) as image:
        image_format = image.format
        image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

        if source_path.suffix.lower() in {".jpg", ".jpeg"}:
            image = image.convert("RGB")
            image.save(target_path, format="JPEG", quality=70, optimize=True, progressive=True)
        elif source_path.suffix.lower() == ".png":
            if image.mode not in {"RGBA", "RGB", "P"}:
                image = image.convert("RGBA")
            image.save(target_path, format="PNG", optimize=True)
        elif source_path.suffix.lower() == ".webp":
            image.save(target_path, format="WEBP", quality=70, method=6)
        else:
            image.save(target_path, format=image_format)

print("Mobile image generation complete.")
