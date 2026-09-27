"""Static server for the screenshot harness. /hold.css answers after a delay so the page's load event (which headless Chrome screenshots on) waits for the async render."""
import sys, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/hold.css'):
            time.sleep(2)
            self.send_response(200); self.send_header('Content-Type', 'text/css'); self.end_headers()
            return
        super().do_GET()
    def log_message(self, *a): pass

ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), Handler).serve_forever()
