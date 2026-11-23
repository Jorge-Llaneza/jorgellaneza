#!/usr/bin/env python3
"""Build MP PRODUCTIONS TEACHING into one self-contained HTML file.

    python3 build.py              build into ./index.html (this folder is served as /teaching/)
    python3 build.py --check      also syntax-check every JS part with node (if installed)
    python3 build.py --out FILE   write the HTML somewhere else
    python3 build.py --assets     also copy assets/ next to the output (standalone use only)

The site ships as ONE html file (so it works offline from a USB stick or a school PC),
but it is written as many small files under src/. This script glues them back together.
It uses only the Python standard library.

Directives (only inside src/index.html and each lab's index.html):
    {{include path}}   paste a file;  {{include dir/}} pastes every file in the folder, sorted by name
    {{json dir/}}      paste a JSON object {name: built index.html of dir/name}, order from dir/_order.json

A folder that contains _wrap.json ({"open": "...", "close": "..."}) is pasted between those two
strings. That is how one big closure ( (function(){ ... })(); ) can live in many files.
Files and folders starting with "_" are never pasted.
"""
import json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
DEFAULT_NAME = 'index.html'


def read(p):
    with open(p, encoding='utf-8', newline='') as f:
        return f.read()


def tree(d):
    """concatenate a folder: files sorted by name, sub-folders recursively, honouring _wrap.json"""
    out = []
    for name in sorted(os.listdir(d)):
        if name.startswith('_'):
            continue
        p = os.path.join(d, name)
        out.append(tree(p) if os.path.isdir(p) else read(p))
    body = ''.join(out)
    w = os.path.join(d, '_wrap.json')
    if os.path.exists(w):
        w = json.loads(read(w))
        body = w['open'] + body + w['close']
    return body


def jdump(obj):
    # ASCII only, and "<" escaped so a "</script>" inside a lab can never end the tag early
    return json.dumps(obj, ensure_ascii=True).replace('<', '\\u003c')


def html_file(path):
    base = os.path.dirname(path)
    text = read(path)

    def inc(m):
        t = os.path.join(base, m.group(1))
        return tree(t) if m.group(1).endswith('/') else read(t)

    def js(m):
        d = os.path.join(base, m.group(1))
        order = json.loads(read(os.path.join(d, '_order.json')))
        return jdump({k: html_file(os.path.join(d, k, 'index.html')) for k in order})

    text = re.sub(r'\{\{include ([^}]+)\}\}', inc, text)
    return re.sub(r'\{\{json ([^}]+)\}\}', js, text)


def check_js():
    """syntax-check JS with node: each plain part alone, wrapped folders and split lab scripts as a whole"""
    node = shutil.which('node')
    if not node:
        print('node not found: skipping JS syntax check')
        return True
    bad = 0
    tmp = os.path.join(ROOT, '.check.js')

    def run(code, label):
        nonlocal bad
        with open(tmp, 'w', encoding='utf-8') as f:
            f.write(code)
        r = subprocess.run([node, '--check', tmp], capture_output=True, text=True)
        if r.returncode:
            bad += 1
            print('SYNTAX ERROR in', label)
            print(r.stderr[:400])

    def walk(d):
        if os.path.exists(os.path.join(d, '_wrap.json')):
            run(tree(d), os.path.relpath(d, ROOT) + ' (whole folder)')
            return
        for name in sorted(os.listdir(d)):
            p = os.path.join(d, name)
            if name.startswith('_'):
                continue
            if os.path.isdir(p):
                if os.path.basename(d) == 'parts':      # a lab script split into several files
                    run(tree(p), os.path.relpath(p, ROOT) + ' (whole script)')
                else:
                    walk(p)
            elif name.endswith('.js'):
                run(read(p), os.path.relpath(p, ROOT))

    walk(os.path.join(SRC, 'js'))
    walk(os.path.join(SRC, 'labs'))
    try:
        os.remove(tmp)
    except OSError:
        pass
    print('JS syntax check:', 'ok' if not bad else '%d problem(s)' % bad)
    return bad == 0


def main():
    args = sys.argv[1:]
    out = args[args.index('--out') + 1] if '--out' in args else None
    if '--check' in args and not check_js():
        sys.exit(1)
    html = html_file(os.path.join(SRC, 'index.html'))
    out = out or os.path.join(ROOT, DEFAULT_NAME)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8', newline='') as f:
        f.write(html)
    if '--assets' in args:  # standalone use only: copies assets/ (manifest, sw.js, icons) next to the output
        for f in os.listdir(os.path.join(ROOT, 'assets')):
            shutil.copy(os.path.join(ROOT, 'assets', f), os.path.join(os.path.dirname(out), f))
    print('built', out, '%.1f MB' % (len(html.encode('utf-8')) / 1e6))


if __name__ == '__main__':
    main()
