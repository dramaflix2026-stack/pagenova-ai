#!/usr/bin/env python3
"""Build a validated, same-source TacoLab scroll sequence from ONE turntable video.

Usage:
  python3 scripts/tacolab/build_sequence.py input-turntable.mp4 \
    --output frontend/public/tacolab-sequence --frames 72

Requires ffmpeg and ffprobe installed. Never mix unrelated photographs.
"""
import argparse
import json
import shutil
import subprocess
from pathlib import Path

def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video", type=Path)
    parser.add_argument("--output", type=Path, default=Path("frontend/public/tacolab-sequence"))
    parser.add_argument("--frames", type=int, default=72)
    parser.add_argument("--width", type=int, default=960)
    args = parser.parse_args()
    if not args.video.is_file():
        parser.error("Input video does not exist")
    if args.frames < 24 or args.frames > 180:
        parser.error("Use 24–180 sequential frames")
    for executable in ("ffmpeg", "ffprobe"):
        if not shutil.which(executable):
            parser.error(f"{executable} is required")
    probe = json.loads(run("ffprobe", "-v", "error", "-show_entries",
                           "format=duration", "-of", "json", str(args.video)))
    duration = float(probe["format"]["duration"])
    if duration <= 0:
        parser.error("Video duration must be positive")
    args.output.mkdir(parents=True, exist_ok=True)
    for old in args.output.glob("frame-*.webp"):
        old.unlink()
    # Trim a single continuous turntable recording. fps produces evenly spaced
    # images without blending adjacent frames or changing taco geometry.
    fps = args.frames / duration
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(args.video),
        "-vf", f"fps={fps:.8f},scale={args.width}:-2:flags=lanczos",
        "-frames:v", str(args.frames), "-c:v", "libwebp",
        "-quality", "84", "-compression_level", "5",
        str(args.output / "frame-%04d.webp"))
    frames = sorted(args.output.glob("frame-*.webp"))
    if len(frames) != args.frames:
        raise RuntimeError(f"Expected {args.frames} frames, got {len(frames)}")
    manifest = {
        "source": "single-continuous-turntable-video",
        "frameCount": len(frames),
        "frames": ["/tacolab-sequence/" + f.name for f in frames],
    }
    (args.output / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Created {len(frames)} frames and manifest at {args.output}")

if __name__ == "__main__":
    main()
