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
import os
import socketserver


# ── Request handler ────────────────────────────────────────────────────────
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Log all requests normally
        super().log_message(fmt, *args)


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