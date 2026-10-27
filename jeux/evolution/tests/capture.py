"""
============================================================================
Captures d'écran du jeu en temps réel (outil de dev, sans Node) : pilote Edge
sans fenêtre par son protocole DevTools. Plus fiable que --screenshot, qui
fige les écrans de jeu animés.

    python jeux/evolution/tests/capture.py <largeur> <hauteur> <dossier> nom=url[@ms][#js] ...

  ms : attente avant la capture (temps réel, 2500 par défaut)
  js : code exécuté dans la page avant l'attente (ex. cliquer un bouton)
Exemple (avec un serveur local sur le port 8000) :
    python jeux/evolution/tests/capture.py 844 390 captures "etape2=http://localhost:8000/jeux/evolution/?debug&etape=nucleus@3000"
============================================================================
"""
import base64, json, os, socket, struct, subprocess, sys, tempfile, time, urllib.request, shutil

EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
PORT = 9339


class WS:
    def __init__(self, url):
        rest = url.split('://', 1)[1]
        hostport, path = rest.split('/', 1)
        host, port = hostport.split(':')
        self.s = socket.create_connection((host, int(port)))
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall((f'GET /{path} HTTP/1.1\r\nHost: {hostport}\r\nUpgrade: websocket\r\n'
                        f'Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n').encode())
        buf = b''
        while b'\r\n\r\n' not in buf:
            buf += self.s.recv(4096)
        self.buf = buf.split(b'\r\n\r\n', 1)[1]
        self.id = 0

    def _recv(self, n):
        while len(self.buf) < n:
            self.buf += self.s.recv(1 << 20)
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def send(self, method, params=None):
        self.id += 1
        data = json.dumps({'id': self.id, 'method': method, 'params': params or {}}).encode()
        mask = os.urandom(4)
        hdr = bytearray([0x81])
        n = len(data)
        if n < 126: hdr.append(0x80 | n)
        elif n < 65536: hdr += bytes([0x80 | 126]) + struct.pack('>H', n)
        else: hdr += bytes([0x80 | 127]) + struct.pack('>Q', n)
        self.s.sendall(bytes(hdr) + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))
        want = self.id
        while True:
            msg = self.read()
            if msg.get('id') == want:
                return msg

    def read(self):
        payload = b''
        while True:
            b0, b1 = self._recv(2)
            n = b1 & 0x7f
            if n == 126: n = struct.unpack('>H', self._recv(2))[0]
            elif n == 127: n = struct.unpack('>Q', self._recv(8))[0]
            payload += self._recv(n)
            if b0 & 0x80: break
        return json.loads(payload.decode('utf-8'))


def main():
    w, h, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
    os.makedirs(out, exist_ok=True)
    prof = tempfile.mkdtemp(prefix='cdpshot-')
    subprocess.Popen([EDGE, '--headless', f'--user-data-dir={prof}', f'--remote-debugging-port={PORT}',
                      f'--window-size={w},{h}', '--no-first-run', 'about:blank'],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(60):
            try:
                tabs = json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json'))
                page = next(t for t in tabs if t['type'] == 'page')
                break
            except Exception:
                time.sleep(0.5)
        ws = WS(page['webSocketDebuggerUrl'])
        ws.send('Emulation.setDeviceMetricsOverride', {'width': w, 'height': h, 'deviceScaleFactor': 1, 'mobile': False})
        for spec in sys.argv[4:]:
            name, rest = spec.split('=', 1)
            js = None
            if '#' in rest: rest, js = rest.split('#', 1)
            ms = 2500
            if '@' in rest: rest, ms = rest.rsplit('@', 1); ms = int(ms)
            ws.send('Page.navigate', {'url': rest})
            time.sleep(1.5)
            if js:
                r = ws.send('Runtime.evaluate', {'expression': js, 'awaitPromise': True})
                if 'exceptionDetails' in r.get('result', {}): print(name, 'JS error', r['result']['exceptionDetails'].get('text'))
            time.sleep(ms / 1000)
            r = ws.send('Page.captureScreenshot', {'format': 'png'})
            with open(os.path.join(out, name + '.png'), 'wb') as f:
                f.write(base64.b64decode(r['result']['data']))
            print('ok', name)
    finally:
        subprocess.run(['powershell', '-NoProfile', '-Command',
                        "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | "
                        f"Where-Object {{ $_.CommandLine -like '*{os.path.basename(prof)}*' }} | "
                        "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1)
        shutil.rmtree(prof, ignore_errors=True)


main()
