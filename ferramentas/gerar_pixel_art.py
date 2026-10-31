#!/usr/bin/env python3
"""
Gerador de pixel art do samuel.tech
===================================

Gera TODAS as imagens do site (personagens, avatares, blocos, ícones, logo,
favicon e imagem de compartilhamento) a partir de grades de pixels escritas
aqui mesmo. Nada de foto real vai para o site: só a versão em blocos.

Uso:
    python3 ferramentas/gerar_pixel_art.py

Saída: assets/img/**  (SVG nítido + alguns PNG)

Para mudar um personagem, edite as grades ASCII abaixo (cada letra = 1 pixel,
"." = transparente) e rode o script de novo.
"""
from __future__ import annotations

import os
import random

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(RAIZ, "assets", "img")

# ---------------------------------------------------------------------------
# Paleta oficial (mesma de assets/css/samuel.css e marca/MARCA.md)
# ---------------------------------------------------------------------------
NOITE = "#1B1036"      # contorno / fundo noturno
TINTA = "#140B26"

GRAMA = "#5DBB3F"
GRAMA_ESC = "#3E8E2A"
TERRA = "#8B5A2B"
TERRA_ESC = "#5E3A1A"
PEDRA = "#8C8C8C"
PEDRA_ESC = "#5C5C5C"
DIAMANTE = "#4EE6E0"
DIAMANTE_ESC = "#1FA7B5"
OURO = "#FFC93C"
OURO_ESC = "#D9901A"
MADEIRA = "#B98A4E"
MADEIRA_ESC = "#8A6232"
FOLHA = "#3F9B3A"
FOLHA_ESC = "#2A6E27"
NEON_ROSA = "#FF4FD8"
NEON_ROXO = "#8A4FFF"
CEU = "#7EC8F5"
BRANCO = "#FFFFFF"


# ---------------------------------------------------------------------------
# Utilitários
# ---------------------------------------------------------------------------
def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def rgb_hex(r: float, g: float, b: float) -> str:
    c = lambda v: max(0, min(255, int(round(v))))
    return f"#{c(r):02X}{c(g):02X}{c(b):02X}"


def tom(h: str, f: float) -> str:
    """Clareia (f>1) ou escurece (f<1) uma cor."""
    r, g, b = hex_rgb(h)
    return rgb_hex(r * f, g * f, b * f)


class Tela:
    """Uma grade de pixels simples (None = transparente)."""

    def __init__(self, w: int, h: int):
        self.w, self.h = w, h
        self.px: list[list[str | None]] = [[None] * w for _ in range(h)]

    def set(self, x: int, y: int, c: str | None):
        if 0 <= x < self.w and 0 <= y < self.h and c:
            self.px[y][x] = c

    def get(self, x: int, y: int):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.px[y][x]
        return None

    def ret(self, x, y, w, h, c, ruido=0.0, seed=0, sombra_dir=None):
        """Retângulo com textura leve de 'bloco' e sombra opcional à direita."""
        rnd = random.Random(seed)
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                cor = c
                if ruido:
                    cor = tom(c, rnd.choice([1 - ruido, 1, 1, 1 + ruido]))
                if sombra_dir and xx == x + w - 1:
                    cor = tom(c, sombra_dir)
                self.set(xx, yy, cor)

    def ascii(self, linhas: list[str], legenda: dict, x0=0, y0=0, ruido=None, seed=1):
        rnd = random.Random(seed)
        ruido = ruido or {}
        for y, linha in enumerate(linhas):
            for x, ch in enumerate(linha):
                if ch in (".", " "):
                    continue
                cor = legenda[ch]
                if ch in ruido:
                    cor = tom(cor, rnd.choice([1 - ruido[ch], 1, 1, 1 + ruido[ch]]))
                self.set(x0 + x, y0 + y, cor)

    def contorno(self, cor=NOITE) -> "Tela":
        """Devolve uma nova tela 2px maior com contorno de 1px ao redor da silhueta."""
        t = Tela(self.w + 2, self.h + 2)
        for y in range(self.h):
            for x in range(self.w):
                t.px[y + 1][x + 1] = self.px[y][x]
        base = [row[:] for row in t.px]
        for y in range(t.h):
            for x in range(t.w):
                if base[y][x]:
                    continue
                viz = [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
                if any(0 <= a < t.w and 0 <= b < t.h and base[b][a] for a, b in viz):
                    t.px[y][x] = cor
        return t

    def recorte(self, x, y, w, h) -> "Tela":
        t = Tela(w, h)
        for yy in range(h):
            for xx in range(w):
                t.px[yy][xx] = self.get(x + xx, y + yy)
        return t

    def colar(self, outra: "Tela", x0: int, y0: int):
        for y in range(outra.h):
            for x in range(outra.w):
                if outra.px[y][x]:
                    self.set(x0 + x, y0 + y, outra.px[y][x])

    # -- exportação --------------------------------------------------------
    def svg(self, escala=8, titulo="") -> str:
        rects = []
        for y in range(self.h):
            x = 0
            while x < self.w:
                c = self.px[y][x]
                if not c:
                    x += 1
                    continue
                x1 = x
                while x1 + 1 < self.w and self.px[y][x1 + 1] == c:
                    x1 += 1
                rects.append(f'<rect x="{x}" y="{y}" width="{x1 - x + 1}" height="1" fill="{c}"/>')
                x = x1 + 1
        t = f"<title>{titulo}</title>" if titulo else ""
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" '
            f'width="{self.w * escala}" height="{self.h * escala}" shape-rendering="crispEdges" '
            f'role="img" aria-label="{titulo}">{t}' + "".join(rects) + "</svg>\n"
        )

    def png(self, caminho: str, escala=8, fundo=None):
        from PIL import Image

        img = Image.new("RGBA", (self.w * escala, self.h * escala), fundo or (0, 0, 0, 0))
        px = img.load()
        for y in range(self.h):
            for x in range(self.w):
                c = self.px[y][x]
                if not c:
                    continue
                rgb = hex_rgb(c) + (255,)
                for yy in range(escala):
                    for xx in range(escala):
                        px[x * escala + xx, y * escala + yy] = rgb
        img.save(caminho)
        return img


def salvar(t: Tela, rel: str, escala=8, titulo=""):
    caminho = os.path.join(IMG, rel)
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(t.svg(escala, titulo))
    print("  ✓", os.path.relpath(caminho, RAIZ))


# ---------------------------------------------------------------------------
# PERSONAGENS
# Proporção "bloco": cabeça 16x16, tronco 16 de largura, braços 6, pernas 8.
# ---------------------------------------------------------------------------
PELE = "#F2C9A5"
PELE_SOMBRA = "#DDA982"

# --- SAMUEL (7 anos) — cabelo castanho-escuro arrepiado pra cima, olhos
#     castanhos, sorrisão com a janelinha do dente, polo azul-claro,
#     calça azul-marinho e tênis azul com detalhe laranja.
SAMUEL_TOPETE = [
    "....H..H..H.....",
    "...HHhHHHHHH.H..",
]
SAMUEL_CABECA = [
    "HHHhHHHHHHhHHHHH",
    "HhHHHHHhHHHHHHhH",
    "HHHHHHHHHHHHHHHH",
    "HHSSSSSSSSSSSSHH",
    "HSSKKSSSSSSKKSSH",
    "SSSSSSSSSSSSSSSS",
    "SSSWESSSSSSEWSSS",
    "SSSWESSSSSSEWSSS",
    "SSSSSSSssSSSSSSS",
    "SPPSSSSSSSSSSPPS",
    "SSSSMTTTTTTMSSSS",
    "SSSSSMTMTTMSSSSS",
    "SSSSSSMMMMSSSSSS",
    "SSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSSSS",
    "sssSSSSSSSSSSsss",
]
SAMUEL_LEG = {
    "H": "#2E1B10", "h": "#4A2E1C", "K": "#2A170C",
    "S": PELE, "s": PELE_SOMBRA, "P": "#EFA08C",
    "W": BRANCO, "E": "#5A3416", "M": "#7A2E2A", "T": BRANCO,
}

POLO = "#8FD3F0"
POLO_GOLA = "#C4ECFB"
CALCA = "#22305A"
TENIS = "#5F86C0"
TENIS_ESC = "#2B4478"
LARANJA = "#FF7A2E"


def desenhar_samuel() -> Tela:
    t = Tela(28, 56)
    # cabeça
    t.ascii(SAMUEL_TOPETE, SAMUEL_LEG, 6, 0, ruido={"H": 0.08, "h": 0.08}, seed=3)
    t.ascii(SAMUEL_CABECA, SAMUEL_LEG, 6, 2, ruido={"H": 0.08, "h": 0.08}, seed=4)
    # tronco (polo)
    t.ret(6, 18, 16, 20, POLO, ruido=0.04, seed=10, sombra_dir=0.88)
    # gola + botões
    for x, y in [(9, 18), (10, 18), (11, 18), (16, 18), (17, 18), (18, 18),
                 (10, 19), (11, 19), (12, 19), (15, 19), (16, 19), (17, 19)]:
        t.set(x, y, POLO_GOLA)
    for y in (19, 20, 21, 22):
        t.set(13, y, tom(POLO, 0.82)); t.set(14, y, tom(POLO, 0.82))
    t.set(13, 20, BRANCO); t.set(14, 22, BRANCO)
    # barra da camiseta
    t.ret(6, 36, 16, 2, tom(POLO, 0.86))
    # bolsinho/logo no peito
    t.set(18, 23, "#2B4478"); t.set(19, 23, "#2B4478")
    # braços: manga curta + pele
    for bx, sd in ((0, None), (22, 0.88)):
        t.ret(bx, 18, 6, 6, POLO, ruido=0.04, seed=11 + bx, sombra_dir=sd)
        t.ret(bx, 23, 6, 1, tom(POLO, 0.8))
        t.ret(bx, 24, 6, 14, PELE, ruido=0.02, seed=12 + bx, sombra_dir=sd and 0.92)
        t.ret(bx, 35, 6, 3, PELE_SOMBRA)
    # pernas (calça azul-marinho)
    t.ret(6, 38, 8, 14, CALCA, ruido=0.06, seed=20)
    t.ret(14, 38, 8, 14, CALCA, ruido=0.06, seed=21, sombra_dir=0.8)
    for y in range(40, 52):
        t.set(13, y, tom(CALCA, 0.7))
    # tênis
    for lx in (6, 14):
        t.ret(lx, 52, 8, 4, TENIS, ruido=0.05, seed=30 + lx)
        t.ret(lx, 55, 8, 1, "#EEEEEE")
        t.set(lx + 2, 52, BRANCO); t.set(lx + 4, 52, BRANCO)
        t.set(lx + 3, 53, BRANCO); t.set(lx + 5, 53, BRANCO)
        t.set(lx + 1, 54, LARANJA); t.set(lx + 6, 54, LARANJA)
        t.set(lx, 54, TENIS_ESC); t.set(lx + 7, 54, TENIS_ESC)
    return t


# --- HELOÍSA (4 anos) — cabelo castanho trançado com elásticos roxos,
#     óculos de coração rosa na cabeça, brilhinhos no rosto, vestido
#     degradê pastel (rosa → pêssego → amarelo → menta → azul) e sandálias.
HELO_CABECA = [
    "HhHHhHHhHHhHHhHH",
    "HhHHhHHhHHhHHhHH",
    "HhHHhHHhHHhHHhHH",
    "HVHHVHHVHHVHHVHH",
    "HHSSSSSSSSSSSSHH",
    "HSSbbSSSSSSbbSSH",
    "HSSSSSSSSSSSSSSH",
    "HSKWESSSSSSEWKSH",
    "HSSWESSSSSSEWSSH",
    "HSGSSSSssSSSSGSH",
    "HSPPSSSSSSSSPPSH",
    "HSSSMTTTTTTMSSSH",
    "HSSSSMTTTTMSSSSH",
    "HSSSSSMMMMSSSSSH",
    "HSSSSSSSSSSSSSSH",
    "HsSSSSSSSSSSSSsH",
]
HELO_LEG = {
    "H": "#5C3820", "h": "#80553A", "V": "#9B5CFF", "K": "#2A170C", "b": "#4A2C18",
    "S": "#F5D0B0", "s": "#E2B48F", "P": "#FF9AAE",
    "W": BRANCO, "E": "#5A3416", "M": "#9A3A3A", "T": BRANCO, "G": "#FFE3F6",
}
OCULOS = [
    ".X.X.....X.X.",
    "XLXLXXXXXLXLX",
    "XBLLX...XBLLX",
    ".XLX.....XLX.",
    "..X.......X..",
]
OCULOS_LEG = {"X": "#FF3E9A", "L": "#3A0F2A", "B": "#FF9AD0"}
VESTIDO = ["#FFB3D9", "#FFC9C2", "#FFE4A8", "#C9F2CF", "#BFE3FF"]


def desenhar_heloisa() -> Tela:
    t = Tela(28, 50)
    # tranças compridas (atrás dos ombros, por cima do vestido)
    # cabeça
    t.ascii(HELO_CABECA, HELO_LEG, 6, 2, ruido={"H": 0.07, "h": 0.07}, seed=5)
    t.ascii(OCULOS, OCULOS_LEG, 7, 0)
    # tronco (corpete rosa)
    t.ret(6, 18, 16, 12, VESTIDO[0], ruido=0.03, seed=40, sombra_dir=0.9)
    # laço/cintura
    t.ret(6, 28, 16, 2, "#F58CC4")
    t.set(13, 28, "#FF5FB0"); t.set(14, 28, "#FF5FB0"); t.set(13, 29, "#FF5FB0"); t.set(14, 29, "#FF5FB0")
    # saia rodada em faixas pastel
    faixa_y = 30
    for i, cor in enumerate(VESTIDO):
        alt = 2
        larg = 18 + (2 if i >= 2 else 0)
        x0 = 14 - larg // 2
        t.ret(x0, faixa_y, larg, alt, cor, ruido=0.03, seed=50 + i)
        faixa_y += alt
    # estampa de bolinhas na saia
    for x, y in [(7, 31), (12, 33), (18, 31), (9, 35), (16, 36), (20, 34), (5, 37), (22, 38)]:
        t.set(x, y, "#7FB4FF" if (x + y) % 2 else "#FF8A5C")
    # barra da saia
    t.ret(4, 40, 20, 1, tom(VESTIDO[-1], 0.85))
    # braços: manga bufante + pele
    for bx, sd in ((0, None), (22, 0.9)):
        t.ret(bx, 18, 6, 5, VESTIDO[0], ruido=0.04, seed=60 + bx, sombra_dir=sd)
        t.ret(bx, 22, 6, 1, "#F58CC4")
        t.ret(bx, 23, 6, 9, "#F5D0B0", ruido=0.02, seed=61 + bx, sombra_dir=sd and 0.93)
        t.ret(bx, 30, 6, 2, "#E2B48F")
    # tranças laterais
    for bx in (5, 20):
        for y in range(18, 30):
            for x in range(bx, bx + 3):
                t.set(x, y, HELO_LEG["h"] if (y + x) % 3 == 0 else HELO_LEG["H"])
        t.ret(bx, 27, 3, 1, HELO_LEG["V"])
        t.ret(bx, 28, 3, 2, HELO_LEG["h"])
    # pernas
    t.ret(8, 41, 5, 6, "#F5D0B0")
    t.ret(15, 41, 5, 6, "#F5D0B0", sombra_dir=0.92)
    # sandálias
    for lx in (8, 15):
        t.ret(lx - 1, 47, 7, 3, "#FFB3D9")
        t.ret(lx - 1, 49, 7, 1, "#C68A55")
        t.ret(lx - 1, 47, 7, 1, "#8FE3D0")
        t.set(lx + 2, 48, "#FF5FB0")
    return t


# ---------------------------------------------------------------------------
# BLOCOS (16x16, texturas originais procedurais)
# ---------------------------------------------------------------------------
def bloco_terra(seed=1) -> Tela:
    t = Tela(16, 16)
    rnd = random.Random(seed)
    for y in range(16):
        for x in range(16):
            t.set(x, y, rnd.choice([TERRA, TERRA, TERRA, tom(TERRA, 1.12), TERRA_ESC, "#9C6B3A"]))
    return t


def bloco_grama(seed=2) -> Tela:
    t = bloco_terra(seed)
    rnd = random.Random(seed + 7)
    for x in range(16):
        prof = rnd.choice([3, 4, 4, 5, 6])
        for y in range(prof):
            t.set(x, y, rnd.choice([GRAMA, GRAMA, tom(GRAMA, 1.1), GRAMA_ESC]))
    return t


def bloco_pedra(seed=3) -> Tela:
    t = Tela(16, 16)
    rnd = random.Random(seed)
    for y in range(16):
        for x in range(16):
            t.set(x, y, rnd.choice([PEDRA, PEDRA, tom(PEDRA, 1.1), PEDRA_ESC, "#7A7A7A"]))
    return t


def bloco_minerio(cor, cor_esc, seed) -> Tela:
    t = bloco_pedra(seed)
    rnd = random.Random(seed + 99)
    for _ in range(5):
        cx, cy = rnd.randint(1, 12), rnd.randint(1, 12)
        for dx, dy in [(0, 0), (1, 0), (0, 1), (1, 1), (2, 1)]:
            t.set(cx + dx, cy + dy, cor if (dx + dy) % 2 == 0 else cor_esc)
        t.set(cx, cy, tom(cor, 1.25))
    return t


def bloco_madeira(seed=4) -> Tela:
    t = Tela(16, 16)
    rnd = random.Random(seed)
    for y in range(16):
        for x in range(16):
            c = MADEIRA if (y % 4) else MADEIRA_ESC
            if y % 4 and rnd.random() < 0.15:
                c = tom(MADEIRA, 0.9)
            t.set(x, y, c)
    for y, xs in ((1, (7,)), (5, (2, 12)), (9, (9,)), (13, (4, 14))):
        for yy in range(y, y + 3):
            for x in xs:
                t.set(x, yy, MADEIRA_ESC)
    return t


def bloco_folhas(seed=5) -> Tela:
    t = Tela(16, 16)
    rnd = random.Random(seed)
    for y in range(16):
        for x in range(16):
            t.set(x, y, rnd.choice([FOLHA, FOLHA, FOLHA_ESC, tom(FOLHA, 1.2), "#245F22"]))
    return t


def bloco_neon(seed=6) -> Tela:
    """Bloco 'fliperama anos 90' — xadrez neon (exclusivo da marca)."""
    t = Tela(16, 16)
    for y in range(16):
        for x in range(16):
            t.set(x, y, NEON_ROXO if ((x // 4) + (y // 4)) % 2 else "#2A1858")
    for i in range(16):
        t.set(i, i, NEON_ROSA)
        t.set(15 - i, i, DIAMANTE)
    return t


# ---------------------------------------------------------------------------
# ÍCONES 16x16
# ---------------------------------------------------------------------------
ICONES = {
    "coracao": ([
        "................",
        "..XXX....XXX....",
        ".XRRRX..XRRRX...",
        "XRWRRRXXRRRRRX..",
        "XRWRRRRRRRRRRX..",
        "XRRRRRRRRRRRRX..",
        ".XRRRRRRRRRRX...",
        "..XRRRRRRRRX....",
        "...XRRRRRRX.....",
        "....XRRRRX......",
        ".....XRRX.......",
        "......XX........",
    ], {"X": NOITE, "R": "#FF3B5C", "W": "#FFC2CF"}),
    "estrela": ([
        ".......XX.......",
        "......XYYX......",
        "......XYYX......",
        ".....XYWYYX.....",
        "XXXXXXYWYYXXXXXX",
        "XYYYYYYYYYYYYYYX",
        ".XYYYYYYYYYYYYX.",
        "..XYYYYYYYYYYX..",
        "...XYYYYYYYYX...",
        "...XYYYOOYYYX...",
        "..XYYYOXXOYYYX..",
        "..XYYOX..XOYYX..",
        ".XYYOX....XOYYX.",
        ".XYOX......XOYX.",
        ".XXX........XXX.",
    ], {"X": NOITE, "Y": OURO, "O": OURO_ESC, "W": "#FFF3B8"}),
    "moeda": ([
        ".....XXXXXX.....",
        "...XXYYYYYYXX...",
        "..XYYWWYYYYYYX..",
        ".XYYWYYOOOOYYYX.",
        ".XYWYYOYYYYOYYX.",
        "XYYWYYOYYYYYYYYX",
        "XYYYYYYOOOYYYYYX",
        "XYYYYYYYYYOYYYYX",
        "XYYYYYYYYYYOYYYX",
        "XYYYYYOYYYYOYYYX",
        ".XYYYYYOOOOYYYX.",
        ".XYYYYYYYYYYYOX.",
        "..XYYYYYYYYYOX..",
        "...XXOYYYYOXX...",
        ".....XXXXXX.....",
    ], {"X": NOITE, "Y": OURO, "O": OURO_ESC, "W": "#FFF3B8"}),
    "controle": ([
        "................",
        "................",
        "..XXXXXXXXXXXX..",
        ".XGGGGGGGGGGGGX.",
        "XGGDGGGGGGGGRGGX",
        "XGDDDGGGGGGRGBGX",
        "XGGDGGWWGWWGYGGX",
        "XGGGGGGGGGGGGGGX",
        "XGGGGXXXXXXGGGGX",
        ".XGGX......XGGX.",
        "..XX........XX..",
    ], {"X": NOITE, "G": "#B7B2C9", "D": "#3A3350", "R": "#FF3B5C", "B": "#3BA4FF",
        "Y": "#5DBB3F", "W": "#7A7590"}),
    "trofeu": ([
        "..XXXXXXXXXXXX..",
        "XXXYYWYYYYYYOXXX",
        "XY.XYWYYYYYYOX.Y",
        "XY.XYWYYYYYYOX.Y",
        ".XY.XYYYYYYOX.YX",
        "..XXXYYYYYYOXXX.",
        "....XYYYYYYOX...",
        ".....XYYYYOX....",
        "......XYYOX.....",
        ".......XYX......",
        ".......XYX......",
        ".....XXYYOXX....",
        "....XYYYYYYOX...",
        "....XXXXXXXXX...",
    ], {"X": NOITE, "Y": OURO, "O": OURO_ESC, "W": "#FFF3B8"}),
    "cadeado": ([
        ".....XXXXX......",
        "....XGGGGGX.....",
        "...XGX...XGX....",
        "...XGX...XGX....",
        "...XGX...XGX....",
        ".XXXXXXXXXXXXX..",
        ".XYYYYYYYYYYYX..",
        ".XYWYYYXXYYYOX..",
        ".XYWYYXXXXYYOX..",
        ".XYYYYYXXYYYOX..",
        ".XYYYYYXXYYYOX..",
        ".XYYYYYYYYYYOX..",
        ".XOOOOOOOOOOOX..",
        ".XXXXXXXXXXXXX..",
    ], {"X": NOITE, "G": PEDRA, "Y": OURO, "O": OURO_ESC, "W": "#FFF3B8"}),
    "chave": ([
        "................",
        "..XXXX..........",
        ".XYYYYX.........",
        "XYYXXYYX........",
        "XYX..XYXXXXXXXX.",
        "XYX..XYYYYYYYYYX",
        "XYYXXYYXXXXYXYX.",
        ".XYYYYX....X.X..",
        "..XXXX..........",
    ], {"X": NOITE, "Y": OURO}),
    "casa": ([
        ".......XX.......",
        "......XRRX......",
        ".....XRRRRX.....",
        "....XRRRRRRX....",
        "...XRRRRRRRRX...",
        "..XRRRRRRRRRRX..",
        ".XXXXXXXXXXXXXX.",
        "..XMMMMMMMMMMX..",
        "..XMWWMMMMDDMX..",
        "..XMWWMMMMDDMX..",
        "..XMMMMMMMDDMX..",
        "..XMMMMMMMDDMX..",
        "..XXXXXXXXXXXX..",
    ], {"X": NOITE, "R": "#E8333A", "M": MADEIRA, "W": CEU, "D": MADEIRA_ESC}),
    "dragao": ([
        "..........XX....",
        ".........XGGX...",
        "....XX..XGGGGX..",
        "...XGGXXGGWKGGX.",
        "...XGGGGGGGGGGGX",
        "....XGGGGGGGRRRX",
        ".X...XGGGGGXXXX.",
        "XGX.XGGGGGGX....",
        "XGGXGGLLGGGGX...",
        ".XGGGLLLLGGGGX..",
        "..XGGLLLLGGXGX..",
        "...XXGGGGXX.X...",
        ".....XGXGX......",
        ".....XXXXX......",
    ], {"X": NOITE, "G": GRAMA, "L": "#C8F27A", "W": BRANCO, "K": NOITE, "R": "#FF7A2E"}),
}


# ---------------------------------------------------------------------------
# NUVEM e SOL
# ---------------------------------------------------------------------------
def nuvem() -> Tela:
    t = Tela(32, 10)
    t.ret(8, 0, 10, 3, BRANCO)
    t.ret(4, 3, 22, 3, BRANCO)
    t.ret(0, 6, 32, 4, BRANCO)
    t.ret(0, 9, 32, 1, "#DDEEFA")
    t.ret(20, 2, 8, 4, BRANCO)
    return t


def sol() -> Tela:
    t = Tela(16, 16)
    t.ret(0, 0, 16, 16, "#FFE36E")
    t.ret(2, 2, 12, 12, "#FFF3B0")
    t.ret(4, 4, 8, 8, "#FFFBE0")
    return t


# ---------------------------------------------------------------------------
# LOGO — fonte bitmap própria "Bloquinho" 5x7
# ---------------------------------------------------------------------------
FONTE = {
    "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "C": [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
    "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
    "E": ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
    "G": [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
    "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "J": ["..###", "...#.", "...#.", "...#.", "#..#.", "#..#.", ".##.."],
    "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
    "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "S": [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
    "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    ".": [".", ".", ".", ".", ".", ".", "#"],
    " ": ["...", "...", "...", "...", "...", "...", "..."],
}


def texto_mascara(txt: str) -> list[list[bool]]:
    cols: list[list[bool]] = [[] for _ in range(7)]
    for i, ch in enumerate(txt):
        g = FONTE[ch]
        for y in range(7):
            cols[y].extend(c == "#" for c in g[y])
            if i < len(txt) - 1:
                cols[y].append(False)
    return cols


def texto_bloco(txt: str, b: int, estilo: str, seed=7) -> Tela:
    """Renderiza texto onde cada pixel da fonte vira um mini-bloco b×b,
    com extrusão 3D e contorno."""
    m = texto_mascara(txt)
    w, h = len(m[0]), 7
    prof = max(2, b // 2)
    t = Tela(w * b + prof, h * b + prof)
    rnd = random.Random(seed)
    # extrusão
    ext = {"grama": TERRA_ESC, "diamante": DIAMANTE_ESC, "ouro": OURO_ESC, "neon": "#5A1FA8"}[estilo]
    for d in range(prof, 0, -1):
        for fy in range(h):
            for fx in range(w):
                if m[fy][fx]:
                    t.ret(fx * b + d, fy * b + d, b, b, tom(ext, 0.75 + 0.05 * (prof - d)))
    # face
    for fy in range(h):
        for fx in range(w):
            if not m[fy][fx]:
                continue
            topo_livre = fy == 0 or not m[fy - 1][fx]
            for yy in range(b):
                for xx in range(b):
                    if estilo == "grama":
                        if topo_livre and yy < max(2, b // 2) - (1 if rnd.random() < 0.25 and yy > 0 else 0):
                            c = rnd.choice([GRAMA, GRAMA, tom(GRAMA, 1.12), GRAMA_ESC])
                        else:
                            c = rnd.choice([TERRA, TERRA, tom(TERRA, 1.12), TERRA_ESC, "#9C6B3A"])
                    elif estilo == "diamante":
                        c = rnd.choice([DIAMANTE, DIAMANTE, tom(DIAMANTE, 1.15), DIAMANTE_ESC])
                        if xx == 0 and yy == 0:
                            c = BRANCO
                    elif estilo == "ouro":
                        c = rnd.choice([OURO, OURO, tom(OURO, 1.1), OURO_ESC])
                    else:
                        c = rnd.choice([NEON_ROSA, NEON_ROSA, tom(NEON_ROSA, 1.1), NEON_ROXO])
                    t.set(fx * b + xx, fy * b + yy, c)
    return t


def logo_horizontal() -> Tela:
    a = texto_bloco("SAMUEL", 4, "grama", seed=11)
    b = texto_bloco(".TECH", 3, "diamante", seed=12)
    t = Tela(a.w + 2 + b.w, a.h)
    t.colar(a, 0, 0)
    t.colar(b, a.w + 2, a.h - b.h)
    return t.contorno()


def logo_empilhado() -> Tela:
    topo = texto_bloco("JOGOS DO", 2, "ouro", seed=13)
    a = texto_bloco("SAMUEL", 4, "grama", seed=11)
    b = texto_bloco(".TECH", 2, "diamante", seed=12)
    w = max(topo.w, a.w, b.w)
    t = Tela(w, topo.h + 3 + a.h + 3 + b.h)
    t.colar(topo, (w - topo.w) // 2, 0)
    t.colar(a, (w - a.w) // 2, topo.h + 3)
    t.colar(b, (w - b.w) // 2, topo.h + 3 + a.h + 3)
    return t.contorno()


def icone_marca() -> Tela:
    """'S' de grama dentro de um bloco — favicon / app icon."""
    t = Tela(32, 32)
    fundo = bloco_neon()
    for y in range(32):
        for x in range(32):
            t.set(x, y, fundo.get(x // 2, y // 2))
    s = texto_bloco("S", 4, "grama", seed=21).contorno()
    t.colar(s, (32 - s.w) // 2, (32 - s.h) // 2)
    return t


# ---------------------------------------------------------------------------
# Imagem de compartilhamento (Open Graph 1200x630)
# ---------------------------------------------------------------------------
def og_image(samuel: Tela, helo: Tela, logo: Tela):
    from PIL import Image

    W, H = 1200, 630
    img = Image.new("RGBA", (W, H))
    px = img.load()
    topo, base = hex_rgb("#4FA8F0"), hex_rgb("#BFE6FF")
    for y in range(H):
        f = y / H
        c = tuple(int(topo[i] + (base[i] - topo[i]) * f) for i in range(3)) + (255,)
        for x in range(W):
            px[x, y] = c

    def colar(t: Tela, x0, y0, e):
        for y in range(t.h):
            for x in range(t.w):
                c = t.px[y][x]
                if c:
                    rgb = hex_rgb(c) + (255,)
                    for yy in range(e):
                        for xx in range(e):
                            X, Y = x0 + x * e + xx, y0 + y * e + yy
                            if 0 <= X < W and 0 <= Y < H:
                                px[X, Y] = rgb

    colar(sol(), 1030, 40, 6)
    colar(nuvem(), 80, 60, 5)
    colar(nuvem(), 760, 120, 4)
    # chão de blocos
    e = 5
    chao_y = H - 16 * e * 2 + 30
    for i in range(W // (16 * e) + 1):
        colar(bloco_grama(i), i * 16 * e, chao_y, e)
        colar(bloco_terra(i + 50), i * 16 * e, chao_y + 16 * e, e)
    sam = samuel.contorno()
    hel = helo.contorno()
    es = 6
    colar(sam, 760, chao_y - sam.h * es + es, es)
    colar(hel, 960, chao_y - hel.h * es + es, es)
    colar(logo, 60, 150, 4)
    caminho = os.path.join(IMG, "marca", "og-samuel-tech.png")
    img.convert("RGB").save(caminho)
    print("  ✓", os.path.relpath(caminho, RAIZ))


# ---------------------------------------------------------------------------
def main():
    print("Gerando pixel art do samuel.tech…")
    samuel = desenhar_samuel()
    helo = desenhar_heloisa()

    # Personagens de corpo inteiro (com contorno)
    salvar(samuel.contorno(), "personagens/samuel.svg", 8, "Samuel em blocos")
    salvar(helo.contorno(), "personagens/heloisa.svg", 8, "Heloísa em blocos")

    # Dupla lado a lado (pés alinhados)
    s, h = samuel.contorno(), helo.contorno()
    dupla = Tela(s.w + h.w + 2, s.h)
    dupla.colar(s, 0, 0)
    dupla.colar(h, s.w + 2, s.h - h.h)
    salvar(dupla, "personagens/dupla.svg", 8, "Samuel e Heloísa em blocos")

    # Avatares (só a cabeça, num fundo de bloco) para a tela de login
    for nome, corpo, fundo, alt in (
        ("samuel", samuel, bloco_grama(9), "Avatar do Samuel"),
        ("heloisa", helo, bloco_neon(), "Avatar da Heloísa"),
    ):
        cab = corpo.recorte(6, 0, 16, 18).contorno()
        av = Tela(24, 24)
        for y in range(24):
            for x in range(24):
                av.set(x, y, tom(fundo.get(x * 16 // 24, y * 16 // 24), 0.85))
        av.colar(cab, (24 - cab.w) // 2, 24 - cab.h + 1)
        salvar(av, f"personagens/avatar-{nome}.svg", 8, alt)

    # Blocos
    blocos = {
        "grama": bloco_grama(), "terra": bloco_terra(), "pedra": bloco_pedra(),
        "diamante": bloco_minerio(DIAMANTE, DIAMANTE_ESC, 31),
        "ouro": bloco_minerio(OURO, OURO_ESC, 32),
        "madeira": bloco_madeira(), "folhas": bloco_folhas(), "neon": bloco_neon(),
    }
    for nome, b in blocos.items():
        salvar(b, f"blocos/{nome}.svg", 4, f"Bloco de {nome}")

    # Ícones
    for nome, (linhas, leg) in ICONES.items():
        t = Tela(16, 16)
        alt = len(linhas)
        t.ascii(linhas, leg, 0, (16 - alt) // 2)
        salvar(t, f"icones/{nome}.svg", 4, nome)
    salvar(nuvem(), "icones/nuvem.svg", 6, "nuvem")
    salvar(sol(), "icones/sol.svg", 6, "sol")

    # Marca
    lh = logo_horizontal()
    salvar(lh, "marca/logo-horizontal.svg", 4, "samuel.tech")
    salvar(logo_empilhado(), "marca/logo-empilhado.svg", 4, "Jogos do Samuel — samuel.tech")
    ic = icone_marca()
    salvar(ic, "marca/icone.svg", 8, "samuel.tech")
    ic.png(os.path.join(IMG, "marca", "icone-512.png"), 16)
    ic.png(os.path.join(IMG, "marca", "icone-180.png"), 6)  # apple-touch-icon (192px)
    print("  ✓ assets/img/marca/icone-512.png, icone-180.png")
    og_image(samuel, helo, logo_empilhado())

    # PNG grandes dos personagens (para usar fora do site / mandar pro Claude)
    samuel.contorno().png(os.path.join(IMG, "personagens", "samuel.png"), 16)
    helo.contorno().png(os.path.join(IMG, "personagens", "heloisa.png"), 16)
    print("  ✓ assets/img/personagens/samuel.png, heloisa.png")
    print("Pronto!")


if __name__ == "__main__":
    main()
