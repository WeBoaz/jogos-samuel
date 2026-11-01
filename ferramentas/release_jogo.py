#!/usr/bin/env python3
"""Grava o manifesto de release de um jogo: _privado/jogos/<slug>/release.json (ST-040).

Uso: python3 ferramentas/release_jogo.py <slug> <versao> [--ambiente producao]

O manifesto identifica o commit do CÓDIGO (source_commit = HEAD no momento da chamada, que
precisa estar limpo para os arquivos do jogo). Depois: commitar o release.json junto com o
build e empacotar. O hash do zip, a hora real do deploy e o link do Notion ficam no recibo
externo (Notion + comentário SAMUEL_TECH_DEPLOY_READY), nunca dentro do pacote.
Sem dados sensíveis: só slug, versão, commit, ambiente, data e URL pública.
`files` lista o SHA-256 de cada arquivo publicado do jogo (menos o próprio release.json), para quem revisa
conferir os bytes servidos em /jogo/<slug>/<arquivo> sem acesso ao Git."""
import datetime, hashlib, json, os, re, subprocess, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def git(*args):
    return subprocess.run(["git", "-C", RAIZ, *args], check=True, capture_output=True, text=True).stdout.strip()


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    slug, versao = argv[0], argv[1]
    ambiente = argv[argv.index("--ambiente") + 1] if "--ambiente" in argv else "producao"
    if not re.fullmatch(r"[a-z0-9-]+", slug) or not re.fullmatch(r"[0-9]+\.[0-9]+(\.[0-9]+)?", versao):
        print("slug ou versão inválidos")
        return 2
    pasta = os.path.join(RAIZ, "_privado", "jogos", slug)
    if not os.path.isdir(pasta):
        print(f"pasta não existe: {pasta}")
        return 1
    sujos = git("status", "--porcelain", "--", f"_privado/jogos/{slug}", f"desenvolvimento/jogos/{slug}")
    sujos = [l for l in sujos.splitlines() if not l.endswith("release.json")]
    if sujos:
        print("commite o código e o build do jogo antes de gerar o manifesto:\n" + "\n".join(sujos))
        return 1
    commit = git("rev-parse", "HEAD")
    # os mesmos arquivos que o empacotar.sh leva (git archive): os versionados da pasta do jogo
    arquivos = {}
    for rel in git("ls-files", "--", f"_privado/jogos/{slug}").splitlines():
        nome = rel[len(f"_privado/jogos/{slug}/"):]
        if nome == "release.json":
            continue
        with open(os.path.join(RAIZ, rel), "rb") as f:
            arquivos[nome] = hashlib.sha256(f.read()).hexdigest()
    agora = datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat(timespec="seconds")
    manifesto = {
        "schema_version": 1,
        "release_id": f"{slug}@{versao}+{commit[:7]}.{ambiente}",
        "game_slug": slug,
        "version": versao,
        "source_commit": commit,
        "environment": ambiente,
        "built_at": agora,
        "public_url": f"https://samuel.tech/jogar/?jogo={slug}",
        "files_base_url": f"https://samuel.tech/jogo/{slug}/",
        "files": dict(sorted(arquivos.items())),
    }
    with open(os.path.join(pasta, "release.json"), "w", encoding="utf-8") as f:
        json.dump(manifesto, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(json.dumps(manifesto, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
