import http.server
import socketserver
import threading
import time
import sys

PORT = 8000
last_ping = time.time()

class HeartbeatHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        global last_ping
        if self.path == '/ping':
            # Update the last seen time whenever the browser says hello
            last_ping = time.time()
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
        else:
            # Handle normal file requests
            super().do_GET()

    # Hide the ping messages so they don't spam your terminal
    def log_message(self, format, *args):
        if '/ping' not in args[0]:
            super().log_message(format, *args)

# Allow port reuse
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(("", PORT), HeartbeatHandler)

def monitor_heartbeat():
    global last_ping
    # Wait a few seconds initially so the browser has time to open
    time.sleep(3) 
    while True:
        time.sleep(2)
        # If 5 seconds pass without a ping, the tab must be closed!
        if time.time() - last_ping > 5:
            print("\nBrowser tab closed (heartbeat lost). Shutting down server...")
            httpd.shutdown()
            break

# Start the monitor in the background
threading.Thread(target=monitor_heartbeat, daemon=True).start()

print(f"Serving at http://localhost:{PORT}")
httpd.serve_forever()