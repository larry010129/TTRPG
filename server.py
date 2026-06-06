# server.py — optional static file server (no API, game runs in browser)
import http.server
import socketserver
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class StaticHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()


if __name__ == "__main__":
    print(f"Serving static files on http://localhost:{PORT}")
    print("Open index.html — all game logic runs in the browser.")
    print("Press Ctrl+C to stop.")
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), StaticHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down.")
            httpd.server_close()
