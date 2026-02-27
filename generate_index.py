#!/usr/bin/env python3
"""
generate_index.py

Scans the `topics/` directory for .txt files and writes `topics/index.json`.
Run once:
    python3 generate_index.py

Run in watch mode (polling every 2s):
    python3 generate_index.py --watch

This avoids adding external deps and works cross-platform.
"""
import argparse
import json
import os
import time

HERE = os.path.dirname(os.path.abspath(__file__))
TOPICS_DIR = os.path.join(HERE, 'topics')
INDEX_PATH = os.path.join(TOPICS_DIR, 'index.json')


def generate_index():
    if not os.path.isdir(TOPICS_DIR):
        print(f"Topics directory not found: {TOPICS_DIR}")
        return False
    files = [f for f in os.listdir(TOPICS_DIR) if os.path.isfile(os.path.join(TOPICS_DIR, f)) and f.lower().endswith('.txt')]
    files.sort()
    # write atomically
    temp_path = INDEX_PATH + '.tmp'
    try:
        with open(temp_path, 'w', encoding='utf-8') as fh:
            json.dump(files, fh, indent=2, ensure_ascii=False)
        os.replace(temp_path, INDEX_PATH)
        print(f"Wrote {len(files)} entries to {INDEX_PATH}")
        return True
    except Exception as e:
        print('Failed to write index.json:', e)
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        return False


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--watch', '-w', action='store_true', help='Watch the topics folder and update index.json when files change (polling)')
    parser.add_argument('--interval', '-i', type=float, default=2.0, help='Polling interval in seconds for watch mode')
    args = parser.parse_args()

    ok = generate_index()
    if args.watch:
        last_state = set(os.listdir(TOPICS_DIR)) if os.path.isdir(TOPICS_DIR) else set()
        try:
            while True:
                time.sleep(args.interval)
                try:
                    current = set(os.listdir(TOPICS_DIR))
                except FileNotFoundError:
                    current = set()
                if current != last_state:
                    print('Change detected in topics/, regenerating index.json...')
                    generate_index()
                    last_state = current
        except KeyboardInterrupt:
            print('\nWatch stopped by user')
