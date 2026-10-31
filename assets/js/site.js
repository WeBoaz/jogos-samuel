/* ==========================================================================
   samuel.tech — utilidades compartilhadas (sessão, sons 8-bit, contador)
   Carregue DEPOIS de config.js e catalogo.js.
   ========================================================================== */
(function () {
  "use strict";

  // Raiz do site, descoberta pelo próprio <script src=".../assets/js/site.js">.
  // Assim os caminhos funcionam em samuel.tech/, em subpastas e localmente.
  const script = document.currentScript;
  const BASE = new URL("../../", script.src).href;
  const url = (caminho) => new URL(caminho, BASE).href;

  const guardar = {
    ler(chave, padrao) {
      try { return JSON.parse(localStorage.getItem("samuel." + chave)) ?? padrao; }
      catch { return padrao; }
    },
    gravar(chave, valor) {
      try { localStorage.setItem("samuel." + chave, JSON.stringify(valor)); } catch {}
    },
    apagar(chave) { try { localStorage.removeItem("samuel." + chave); } catch {} },
  };

  // ---------- Jogadores / sessão ------------------------------------------
  const jogadores = window.SAMUEL_JOGADORES || [];
  const sessao = {
    jogador() {
      const s = guardar.ler("sessao", null);
      return s && jogadores.find((j) => j.id === s.id) || null;
    },
    entrar(id) { guardar.gravar("sessao", { id, desde: Date.now() }); },
    sair() { guardar.apagar("sessao"); },
    /** Use nas páginas protegidas: manda para /entrar/ se não tiver ninguém. */
    exigir() {
      const j = sessao.jogador();
      if (!j) location.replace(url("entrar/"));
      return j;
    },
  };

  // ---------- Progresso (XP por jogo jogado) ------------------------------
  const progresso = {
    ler(id) { return guardar.ler("progresso." + id, { xp: 0, jogadas: {}, ultimo: null }); },
    registrarJogada(idJogador, idJogo) {
      const p = progresso.ler(idJogador);
      p.xp += 10;
      p.jogadas[idJogo] = (p.jogadas[idJogo] || 0) + 1;
      p.ultimo = idJogo;
      guardar.gravar("progresso." + idJogador, p);
      return p;
    },
    nivel(xp) { return { nivel: Math.floor(xp / 50) + 1, pct: (xp % 50) * 2 }; },
  };

  // ---------- Sons 8-bit (WebAudio, sem arquivos) -------------------------
  let audio = null;
  const som = {
    ligado() { return guardar.ler("som", true); },
    alternar() { guardar.gravar("som", !som.ligado()); atualizarBotaoSom(); if (som.ligado()) som.tocar("clique"); },
    tocar(tipo) {
      if (!som.ligado()) return;
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        const notas = {
          clique: [[660, 0.05]],
          bloco: [[523, 0.06], [784, 0.06]],
          erro: [[220, 0.12], [165, 0.18]],
          sucesso: [[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.2]],
          moeda: [[988, 0.06], [1319, 0.18]],
        }[tipo] || [[440, 0.05]];
        let t = audio.currentTime;
        notas.forEach(([freq, dur]) => {
          const o = audio.createOscillator();
          const g = audio.createGain();
          o.type = "square";
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.06, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + dur);
          o.connect(g).connect(audio.destination);
          o.start(t); o.stop(t + dur);
          t += dur;
        });
      } catch {}
    },
  };
  function atualizarBotaoSom() {
    document.querySelectorAll("[data-botao-som]").forEach((b) => {
      b.textContent = som.ligado() ? "🔊" : "🔇";
      b.setAttribute("aria-label", som.ligado() ? "Desligar som" : "Ligar som");
    });
  }

  // ---------- Contador de visitas estilo 1998 -----------------------------
  function contador(el) {
    const n = guardar.ler("visitas", 1336) + 1;
    guardar.gravar("visitas", n);
    el.innerHTML = String(n).padStart(6, "0").split("").map((d) => `<b>${d}</b>`).join("");
    el.setAttribute("aria-label", `${n} visitas`);
  }

  // ---------- Liga tudo ---------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    // imagens/links com data-src / data-href relativos à raiz
    document.querySelectorAll("[data-raiz-src]").forEach((el) => (el.src = url(el.dataset.raizSrc)));
    document.querySelectorAll("[data-raiz-href]").forEach((el) => (el.href = url(el.dataset.raizHref)));

    document.querySelectorAll("[data-botao-som]").forEach((b) => b.addEventListener("click", som.alternar));
    atualizarBotaoSom();

    document.addEventListener("click", (e) => {
      const alvo = e.target.closest("[data-som]");
      if (alvo) som.tocar(alvo.dataset.som || "clique");
    });

    document.querySelectorAll("[data-contador]").forEach(contador);
    const ano = document.querySelector("[data-ano]");
    if (ano) ano.textContent = new Date().getFullYear();
  });

  window.Samuel = { BASE, url, guardar, sessao, progresso, som, jogadores, jogos: window.SAMUEL_JOGOS || [] };
})();
