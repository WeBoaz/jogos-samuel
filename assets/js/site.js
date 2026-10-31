/* samuel.tech — interações da interface (o acesso é controlado no servidor). */
'use strict';
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const guardar = {
    ler(k, f) { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } },
    gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  // ---------- Avisos (toast) ----------
  let timer;
  function avisar(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(timer); timer = setTimeout(() => (t.hidden = true), 2400);
  }

  // ---------- Diálogos ----------
  document.addEventListener('click', (e) => {
    const abre = e.target.closest('[data-open]');
    if (abre) { const d = $(abre.dataset.open); if (d && !d.open) d.showModal(); }
    const fecha = e.target.closest('[data-close]');
    if (fecha) fecha.closest('dialog').close();
  });

  // ---------- Biblioteca: favoritos por explorador, filtro e busca ----------
  const bib = $('[data-biblioteca]');
  if (bib) {
    const chave = 'samuel-tech:favoritos:' + bib.dataset.perfil;
    let favoritos = guardar.ler(chave, []);
    if (!Array.isArray(favoritos)) favoritos = [];
    let filtro = 'all';
    const busca = $('#search');

    function desenhar() {
      const q = busca.value.trim().toLocaleLowerCase('pt-BR');
      let algum = false;
      $$('[data-card]').forEach((card) => {
        const id = card.dataset.card;
        const fav = favoritos.includes(id);
        const estrela = $('[data-favorite]', card);
        if (estrela) {
          estrela.setAttribute('aria-pressed', String(fav));
          estrela.textContent = fav ? '★' : '☆';
          estrela.setAttribute('aria-label', (fav ? 'Remover ' : 'Adicionar ') + $('h3', card).textContent + (fav ? ' dos favoritos' : ' aos favoritos'));
        }
        const mostra = (filtro !== 'favorite' || fav) && card.dataset.title.includes(q);
        card.hidden = !mostra;
        if (mostra) algum = true;
      });
      const vazio = $('#vazio');
      if (vazio) vazio.hidden = algum;
    }

    bib.addEventListener('click', (e) => {
      const estrela = e.target.closest('[data-favorite]');
      if (estrela) {
        const id = estrela.dataset.favorite;
        favoritos = favoritos.includes(id) ? favoritos.filter((v) => v !== id) : [...favoritos, id];
        guardar.gravar(chave, favoritos);
        desenhar();
        if (estrela.closest('[data-card]').hidden) $('[data-filter="favorite"]').focus();
        avisar(favoritos.includes(id) ? 'Mundo salvo nos favoritos!' : 'Mundo removido dos favoritos.');
      }
      const f = e.target.closest('[data-filter]');
      if (f) {
        filtro = f.dataset.filter;
        $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === f)));
        desenhar();
      }
    });
    busca.addEventListener('input', desenhar);
    desenhar();
  }

  // ---------- Player ----------
  const jogo = $('#jogo');
  if (jogo) {
    $('[data-recomecar]').addEventListener('click', () => {
      jogo.src = jogo.src;   // recarrega o jogo do zero
      jogo.focus();
    });
    const moldura = $('#moldura');
    const tela = $('[data-tela-cheia]');
    if (document.fullscreenEnabled && moldura.requestFullscreen) {
      tela.hidden = false;
      tela.addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else moldura.requestFullscreen().catch(() => avisar('Tela cheia não disponível aqui.'));
      });
    }
    jogo.addEventListener('load', () => { try { jogo.contentWindow.focus(); } catch {} });
  }
})();
