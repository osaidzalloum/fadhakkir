#!/usr/bin/env python3
"""تشغيل خادم محلي: python3 serve.py ثم افتح http://localhost:8000"""
import http.server, os, socketserver
os.chdir(os.path.dirname(os.path.abspath(__file__)))
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", 8000), http.server.SimpleHTTPRequestHandler) as s:
    print("http://localhost:8000")
    s.serve_forever()
