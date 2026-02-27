"""
local_server.py — simple HTTP server for FabVocabMaster.

Serves the current directory on PORT. Runs until you press Ctrl+C.
The /ping endpoint is kept so the browser heartbeat doesn't cause 404s,
but it no longer triggers an auto-shutdown.

Usage:
    python3 local_server.py
    python3 local_server.py --port 8080
"""
import argparse
import http.server
import os
import socketserver

# ── Configuration ──────────────────────────────────────────────────────────
DEFAULT_PORT = 8000


# ── Request handler ────────────────────────────────────────────────────────
class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/ping':
            # Accept pings from the browser heartbeat — just reply OK
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(b'ok')
        else:
            super().do_GET()

    def log_message(self, fmt, *args):
        # Suppress noisy /ping log lines; keep everything else
        if args and '/ping' in str(args[0]):
            return
        super().log_message(fmt, *args)


# ── Entry point ────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='FabVocabMaster local server')
    parser.add_argument('--port', '-p', type=int, default=DEFAULT_PORT,
                        help=f'Port to listen on (default: {DEFAULT_PORT})')
    args = parser.parse_args()

    # Always serve from the directory that contains this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', args.port), Handler) as httpd:
        print(f'Serving at http://localhost:{args.port}')
        print(f'Open:    http://localhost:{args.port}/russian_app.html')
        print('Press Ctrl+C to stop.\n')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nStopped.')


if __name__ == '__main__':
    main()