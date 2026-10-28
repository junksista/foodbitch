# Lokaler Testserver ohne Browser-Cache, damit Änderungen beim Neuladen sicher ankommen.
# Start: python3 scripts/serve.py  →  http://localhost:5173
import http.server
import os

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


http.server.ThreadingHTTPServer(('127.0.0.1', 5173), NoCacheHandler).serve_forever()
