"""
============================================================================
Lance les tests d'Évolution dans Edge sans fenêtre (pas de Node sur la
machine) : sert le site en local, ouvre chaque page de test, récupère les
résultats envoyés par POST /__log et les affiche.

    python jeux/evolution/tests/run_tests.py

Code de sortie 0 si tout est vert, 1 sinon.
============================================================================
"""
import http.server
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
PAGES = ['/jeux/evolution/tests/', '/jeux/evolution/tests/smoke.html']
TIMEOUT = 90                       # s par page

results = {}
arrived = threading.Event()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        if self.path != '/__log':
            self.send_error(404)
            return
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        data = json.loads(body.decode('utf-8'))
        results[data['suite']] = data['results']
        self.send_response(204)
        self.end_headers()
        arrived.set()

    def log_message(self, *args):
        pass


def run_page(port, page):
    arrived.clear()
    profile = tempfile.mkdtemp(prefix='evo-edge-')
    proc = subprocess.Popen([
        EDGE, '--headless', f'--user-data-dir={profile}', '--no-first-run',
        '--disable-extensions', '--window-size=1400,900', '--autoplay-policy=no-user-gesture-required',
        f'http://127.0.0.1:{port}{page}',
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    got = arrived.wait(TIMEOUT)
    # on ne ferme que cet Edge-là (jamais le navigateur de l'utilisateur) : Edge
    # détache ses sous-processus, on les retrouve donc par leur dossier de profil
    subprocess.run(['taskkill', '/PID', str(proc.pid), '/T', '/F'],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    tag = os.path.basename(profile)
    subprocess.run(['powershell', '-NoProfile', '-Command',
                    "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | "
                    f"Where-Object {{ $_.CommandLine -like '*{tag}*' }} | "
                    "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    proc.wait(10)
    shutil.rmtree(profile, ignore_errors=True)
    return got


def main():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    port = server.server_address[1]
    threading.Thread(target=server.serve_forever, daemon=True).start()

    failed = 0
    for page in PAGES:
        if not run_page(port, page):
            print(f'✘ {page} : aucun résultat après {TIMEOUT} s (erreur de chargement ?)')
            failed += 1
    server.shutdown()

    for suite, res in results.items():
        bad = [r for r in res if not r['ok']]
        print(f'\n== {suite} : {len(res) - len(bad)} / {len(res)} ✔')
        for r in res:
            print(f"  {'✔' if r['ok'] else '✘'} {r['name']}" + ('' if r['ok'] else f" — {r['error']}"))
        failed += len(bad)

    print('\nTout est vert !' if not failed else f'\n{failed} échec(s).')
    return 0 if not failed else 1


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
