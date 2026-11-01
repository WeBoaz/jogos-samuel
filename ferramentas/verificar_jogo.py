#!/usr/bin/env python3
"""Confere se a pasta de um jogo pode ir para o site: _privado/jogos/<slug>/.

Uso: python3 ferramentas/verificar_jogo.py <slug> [<slug> ...]   (ou --todos)

Erros (saída 1): arquivo de entrada ausente, extensão que o jogo.php não entrega,
arquivo oculto ou link simbólico, caminho absoluto do site (fora o /jogos/ de saída),
recurso carregado de outro domínio, rastreador/analytics, limites do importador.
Avisos: jogo fora do _app/jogos.json ou com campos faltando."""
import json, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIMITE_ARQUIVOS, LIMITE_BYTES = 3000, 300 * 1024 * 1024
CAMPOS = ["slug", "title", "category", "description", "cover", "entry", "instructions", "input", "status", "version"]
TEXTO = (".html", ".htm", ".js", ".mjs", ".css", ".json", ".svg")

# Recurso carregado de fora (o jogo precisa funcionar só com arquivos locais).
EXTERNO = re.compile(
    r"""(?:\b(?:src|href|action|poster)\s*=\s*["']\s*(?:https?:)?//)"""
    r"""|(?:\bimport\s*(?:[\w*{}\s,]+from\s*)?["'](?:https?:)?//)"""
    r"""|(?:\bimport\(\s*["'](?:https?:)?//)"""
    r"""|(?:\b(?:fetch|new\s+(?:URL|Worker|WebSocket|EventSource)|sendBeacon)\(\s*["'](?:https?|wss?):)"""
    r"""|(?:url\(\s*["']?(?:https?:)?//)"""
    r"""|(?:@import\s+(?:url\()?\s*["']?(?:https?:)?//)""",
    re.I)
# Caminho absoluto do site: quebra quando o jogo é servido em /jogo/<slug>/.
ABSOLUTO = re.compile(
    r"""(?:\b(?:src|href)\s*=\s*["']/(?!/|jogos/))"""
    r"""|(?:\bfrom\s*["']/(?!/))|(?:\bimport\(\s*["']/(?!/))|(?:(?-i:url)\(\s*["']?/(?!/))""",   # url() do CSS; new URL("/x", base) do JS não
    re.I)
RASTREADOR = re.compile(
    r"googletagmanager|google-analytics|\bgtag\s*\(|\bdataLayer\b|connect\.facebook|fbq\(|hotjar|"
    r"plausible\.io|clarity\.ms|mixpanel|segment\.io|amplitude\.com|@amplitude/|amplitude\.getInstance|posthog|sentry\.io|doubleclick|adsbygoogle",
    re.I)


def extensoes_permitidas():
    php = open(os.path.join(RAIZ, "_app", "inicio.php"), encoding="utf-8").read()
    bloco = re.search(r"const EXTENSOES_JOGO = \[(.*?)\];", php, re.S).group(1)
    return set(re.findall(r"'([a-z0-9]+)'\s*=>", bloco))


def catalogo():
    with open(os.path.join(RAIZ, "_app", "jogos.json"), encoding="utf-8") as f:
        return {g["slug"]: g for g in json.load(f)["games"]}


def linha(texto, pos):
    return texto.count("\n", 0, pos) + 1


def verificar(slug, exts, cat):
    erros, avisos = [], []
    pasta = os.path.join(RAIZ, "_privado", "jogos", slug)
    g = cat.get(slug)
    if g is None:
        avisos.append("fora do _app/jogos.json (ok enquanto estiver em desenvolvimento)")
    else:
        faltam = [c for c in CAMPOS if c not in g]
        if faltam and g.get("status") != "em-breve":
            avisos.append("jogos.json sem: " + ", ".join(faltam))
    if not os.path.isdir(pasta):
        return [f"pasta não existe: _privado/jogos/{slug}/"], avisos
    entrada = (g or {}).get("entry", "index.html")
    if not os.path.isfile(os.path.join(pasta, entrada)):
        erros.append(f"arquivo de entrada ausente: {entrada}")

    total, n = 0, 0
    for dirpath, dirnames, filenames in os.walk(pasta):
        for d in list(dirnames):
            if d.startswith(".") or os.path.islink(os.path.join(dirpath, d)):
                erros.append(f"pasta oculta ou link: {os.path.relpath(os.path.join(dirpath, d), pasta)}")
                dirnames.remove(d)
        for nome in filenames:
            arq = os.path.join(dirpath, nome)
            rel = os.path.relpath(arq, pasta)
            n += 1
            if nome.startswith("."):
                erros.append(f"arquivo oculto (o jogo.php não entrega): {rel}")
                continue
            if os.path.islink(arq):
                erros.append(f"link simbólico: {rel}")
                continue
            total += os.path.getsize(arq)
            ext = nome.rsplit(".", 1)[-1].lower() if "." in nome else ""
            if ext not in exts:
                erros.append(f"extensão .{ext} não é entregue pelo jogo.php: {rel}")
            if not nome.lower().endswith(TEXTO):
                continue
            texto = open(arq, encoding="utf-8", errors="replace").read()
            for rx, msg in ((EXTERNO, "recurso de outro domínio"), (ABSOLUTO, "caminho absoluto do site"),
                            (RASTREADOR, "rastreador/analytics")):
                for m in rx.finditer(texto):
                    trecho = texto[m.start():m.start() + 60].splitlines()[0]
                    erros.append(f"{msg}: {rel}:{linha(texto, m.start())}: {trecho}")
    if n > LIMITE_ARQUIVOS:
        erros.append(f"{n} arquivos (limite {LIMITE_ARQUIVOS})")
    if total > LIMITE_BYTES:
        erros.append(f"{total / 1048576:.1f} MB (limite 300 MB)")
    avisos.append(f"{n} arquivos, {total / 1048576:.1f} MB")
    return erros, avisos


def main(args):
    if not args:
        print(__doc__)
        return 2
    exts, cat = extensoes_permitidas(), catalogo()
    if args == ["--todos"]:
        base = os.path.join(RAIZ, "_privado", "jogos")
        args = sorted(d for d in os.listdir(base) if os.path.isdir(os.path.join(base, d)))
    falhou = False
    for slug in args:
        erros, avisos = verificar(slug, exts, cat)
        print(("✗ " if erros else "✓ ") + slug)
        for e in erros:
            print("   erro:", e)
        for a in avisos:
            print("   aviso:", a)
        falhou = falhou or bool(erros)
    return 1 if falhou else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
