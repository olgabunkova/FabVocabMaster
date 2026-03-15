"""
local_server.py — simple HTTP server for FabVocabMaster.

Serves the current directory on PORT. No auto-shutdown logic —
runs until manually stopped with Ctrl+C.

Usage:
    python3 local_server.py
    python3 local_server.py --port 8080
"""
import argparse
import http.server
import json
import os
import socketserver
import threading
from datetime import datetime

WRITE_LOCK = threading.Lock()


# ── Request handler ────────────────────────────────────────────────────────
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Log all requests normally
        super().log_message(fmt, *args)

    def do_POST(self):
        if self.path != '/api/difficult-words':
            self.send_error(404, 'Not Found')
            return

        length = int(self.headers.get('Content-Length', '0'))
        if length <= 0:
            self._write_json(400, {'error': 'Request body required'})
            return

        try:
            raw = self.rfile.read(length)
            payload = json.loads(raw.decode('utf-8'))
        except Exception:
            self._write_json(400, {'error': 'Invalid JSON'})
            return

        eng = _clean(payload.get('eng', ''))
        rus = _clean(payload.get('rus', ''))
        pron = _clean(payload.get('pron', ''))

        if not eng or not rus:
            self._write_json(400, {'error': 'Both eng and rus are required'})
            return

        saved = _append_if_new(eng, rus, pron)
        self._write_json(200, {'saved': saved})

    def do_GET(self):
        if self.path == '/ping':
            self._write_json(200, {'ok': True})
            return
        super().do_GET()

    def _write_json(self, code, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def _clean(value):
    return str(value).replace('\n', ' ').replace('\r', ' ').strip()


def _append_if_new(eng, rus, pron):
    hard_file = _build_difficult_words_path()
    os.makedirs(os.path.dirname(hard_file), exist_ok=True)
    line_prefix = f'{eng},{rus}'

    with WRITE_LOCK:
        existing = set()
        if os.path.exists(hard_file):
            with open(hard_file, 'r', encoding='utf-8') as f:
                for row in f:
                    row = row.strip()
                    if not row:
                        continue
                    first = row.split(',', 2)
                    if len(first) < 2:
                        continue
                    existing.add(f'{first[0].strip()},{first[1].strip()}')

        if line_prefix in existing:
            return False

        with open(hard_file, 'a', encoding='utf-8') as f:
            if pron:
                f.write(f'{eng},{rus},{pron}\n')
            else:
                f.write(f'{eng},{rus}\n')
        _refresh_topic_index()
        return True


def _build_difficult_words_path():
    day_stamp = datetime.now().strftime('%Y-%m-%d')
    filename = f'difficult_words_timestamp_{day_stamp}.txt'
    return os.path.join('topics', filename)


def _refresh_topic_index():
    topics_dir = 'topics'
    index_path = os.path.join(topics_dir, 'index.json')
    files = [
        name for name in os.listdir(topics_dir)
        if os.path.isfile(os.path.join(topics_dir, name)) and name.lower().endswith('.txt')
    ]
    files.sort()
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(files, f, indent=2, ensure_ascii=False)


# ── Entry point ────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='FabVocabMaster local server')
    parser.add_argument('--port', '-p', type=int, default=8000,
                        help='Port to listen on (default: 8000)')
    args = parser.parse_args()

    # Serve from the directory that contains this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', args.port), Handler) as httpd:
        print(f'Serving at http://localhost:{args.port}')
        print(f'Open:    http://localhost:{args.port}/russian_app.html')
        print('Press Ctrl+C to stop.\n')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nStopped by user.')


if __name__ == '__main__':
    main()