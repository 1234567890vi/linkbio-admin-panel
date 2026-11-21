import subprocess
import time
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CLOUDFLARED = os.path.join(BASE_DIR, "cloudflared.exe")
TUNNEL_URL_FILE = os.path.join(BASE_DIR, "tunnel_url.txt")

def start_tunnel():
    print("[Tunnel] Starting Cloudflare Tunnel daemon...", flush=True)
    cmd = [CLOUDFLARED, "tunnel", "--url", "http://127.0.0.1:8000", "--protocol", "http2"]
    
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        stdin=subprocess.PIPE,
        text=True,
        bufsize=1,
        encoding="utf-8",
        errors="replace"
    )
    
    tunnel_url = None
    for line in proc.stdout:
        print(line, end="", flush=True)
        if not tunnel_url:
            m = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
            if m:
                tunnel_url = m.group(0)
                with open(TUNNEL_URL_FILE, "w", encoding="utf-8") as f:
                    f.write(tunnel_url)
                print(f"\n=======================================================\n[TUNNEL ACTIVE] {tunnel_url}\n=======================================================\n", flush=True)

    ret = proc.wait()
    print(f"[Tunnel] Process exited with code {ret}", flush=True)

if __name__ == "__main__":
    while True:
        try:
            start_tunnel()
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"[Tunnel Error] {e}", flush=True)
        time.sleep(2)
