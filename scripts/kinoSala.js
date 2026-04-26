// ── kinoSala.js – Spirala 2 ──
// Čisti JavaScript, bez biblioteka.
// Ovisi o kinoData objektu definisanom u app.js.

(function () {

  // ── Konstante ──
  const REDOVI     = ['A','B','C','D','E','F','G','H'];
  const KOLONE     = 10;
  const VIP_ROWS   = ['C', 'D'];
  const PRICE_STD  = 8;
  const PRICE_VIP  = 14;
  const VALID_STATUSES = ['slobodno', 'zauzeto', 'rezervisano'];

  // ── Stanje ──
  let trenutnaProjekcija = 0;   // indeks aktivne projekcije
  const kosarica = new Map();   // seatId → { price, type }

  // ─────────────────────────────────────────
  // 1. VALIDACIJA PODATAKA
  // ─────────────────────────────────────────
  function validirajPodatke(data) {
    if (!data || !Array.isArray(data.projekcije) || data.projekcije.length === 0) {
      return false;
    }
    for (const p of data.projekcije) {
      if (!p.film || !p.vrijeme) return false;
      // Ako projekcija ima ručno definisana sjedišta, validiraj ih
      if (Array.isArray(p.sjedista)) {
        for (const s of p.sjedista) {
          if (!VALID_STATUSES.includes(s.status)) return false;
        }
      }
    }
    return true;
  }

  // ─────────────────────────────────────────
  // 2. GENERATOR SJEDIŠTA
  // Deterministički pseudo-random na osnovu
  // naziva filma + vremena kao seed.
  // Ista projekcija → uvijek ista sjedišta.
  // ─────────────────────────────────────────
  function seedHash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }

  function seededRandom(seed) {
    // Mulberry32 – brz i jednostavan PRNG
    return function () {
      seed = (seed + 0x6D2B79F5) >>> 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function generišiSjedista(film, vrijeme) {
    const seed   = seedHash(film + '|' + vrijeme);
    const rng    = seededRandom(seed);
    const sjedista = [];

    REDOVI.forEach(red => {
      for (let col = 1; col <= KOLONE; col++) {
        const r = rng();
        let status;
        if (r < 0.20) {
          status = 'zauzeto';
        } else if (r < 0.30) {
          status = 'rezervisano';
        } else {
          status = 'slobodno';
        }
        sjedista.push({ red, broj: col, status });
      }
    });

    return sjedista;
  }

  // ─────────────────────────────────────────
  // 3. DOHVATI ILI GENERIŠI SJEDIŠTA
  // Ako projekcija ima ručno definisana sjedišta
  // u app.js, koristi ih; inače generiši.
  // ─────────────────────────────────────────
  function dohvatiSjedista(projekcija) {
    if (Array.isArray(projekcija.sjedista) && projekcija.sjedista.length > 0) {
      return projekcija.sjedista;
    }
    // Generiši i keširaj na objekt projekcije (trajno za tu sesiju)
    projekcija.sjedista = generišiSjedista(projekcija.film, projekcija.vrijeme);
    return projekcija.sjedista;
  }

  // ─────────────────────────────────────────
  // 4. PRIKAZ SALE (briše i iscrtava iznova)
  // ─────────────────────────────────────────
  function prikaziSalu() {
    const projekcija = kinoData.projekcije[trenutnaProjekcija];
    const sjedista   = dohvatiSjedista(projekcija);

    const filmName = projekcija.film;
    const filmTime = projekcija.vrijeme;
    const filmSala = projekcija.sala || 'Sala 1';

    // — Ažuriraj naslove —
    _setText('sala-film-name', filmName);
    _setText('sb-film-name',   filmName);
    _setText('sala-vrijeme',   filmTime);
    _setText('sb-vrijeme',     filmTime);
    _setText('sala-broj',      filmSala);
    _setText('sb-sala',        filmSala);
    document.title = `CineMinimum – ${filmSala}`;

    // — Navigacijska dugmad —
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    if (btnPrev) btnPrev.disabled = (trenutnaProjekcija === 0);
    if (btnNext) btnNext.disabled = (trenutnaProjekcija === kinoData.projekcije.length - 1);

    // — Indikator projekcije —
    _setText('proj-indicator', `${trenutnaProjekcija + 1} / ${kinoData.projekcije.length}`);

    // — Grupiši sjedišta po redovima —
    const redovi = {};
    sjedista.forEach(s => {
      if (!redovi[s.red]) redovi[s.red] = [];
      redovi[s.red].push(s);
    });

    const sortiraniRedovi = Object.keys(redovi).sort();
    const maxKol = Math.max(...sjedista.map(s => s.broj));

    // — Iscrtaj brojeve kolona —
    const colNumsEl = document.getElementById('col-numbers');
    colNumsEl.innerHTML = '';
    for (let c = 1; c <= maxKol; c++) {
      if (c === 6) {
        const gap = document.createElement('div');
        gap.className = 'col-num-gap';
        colNumsEl.appendChild(gap);
      }
      const n = document.createElement('div');
      n.className = 'col-num';
      n.textContent = c;
      colNumsEl.appendChild(n);
    }

    // — Iscrtaj mrežu sjedišta (briše prethodni sadržaj) —
    const grid = document.getElementById('seat-grid');
    grid.innerHTML = '';

    sortiraniRedovi.forEach(red => {
      const rowEl = document.createElement('div');
      rowEl.className = 'seat-row';

      const label = document.createElement('div');
      label.className = 'row-label';
      label.textContent = red;
      rowEl.appendChild(label);

      const popunjeno = new Map(
        redovi[red].sort((a, b) => a.broj - b.broj).map(s => [s.broj, s])
      );

      for (let col = 1; col <= maxKol; col++) {
        if (col === 6) {
          const gap = document.createElement('div');
          gap.className = 'seat-gap';
          rowEl.appendChild(gap);
        }

        const sjediste = popunjeno.get(col);
        if (!sjediste) {
          const empty = document.createElement('div');
          empty.className = 'seat taken';
          rowEl.appendChild(empty);
          continue;
        }

        const vip   = VIP_ROWS.includes(red);
        const price = vip ? PRICE_VIP : PRICE_STD;
        const id    = `${red}${col}`;
        const uKosarici = kosarica.has(id);

        const seat = document.createElement('button');
        seat.id = `seat-${id}`;

        // CSS klase
        let klase = 'seat';
        if (uKosarici) {
          klase += ' selected';
        } else if (sjediste.status === 'slobodno') {
          klase += ' free';
          if (vip) klase += ' vip';
        } else if (sjediste.status === 'zauzeto') {
          klase += ' taken';
        } else {
          klase += ' reserved';
        }
        seat.className = klase;

        // Tooltip
        if (uKosarici) {
          seat.title = `${id} – Odabrano`;
        } else if (sjediste.status === 'slobodno') {
          seat.title = `${id} – ${vip ? 'VIP' : 'Standard'} – ${price} KM`;
        } else if (sjediste.status === 'zauzeto') {
          seat.title = `${id} – Zauzeto`;
        } else {
          seat.title = `${id} – Rezervisano`;
        }
        seat.setAttribute('aria-label', seat.title);

        // Klik samo na slobodna
        if (sjediste.status === 'slobodno') {
          seat.addEventListener('click', () => klikniSjediste(sjediste, id, red, price, vip));
        }

        rowEl.appendChild(seat);
      }

      grid.appendChild(rowEl);
    });

    osveziKosaricu();
  }

  // ─────────────────────────────────────────
  // 5. KLIK NA SJEDIŠTE
  // slobodno → odabrano (u košaricu)
  // odabrano → slobodno (van košarice)
  // ─────────────────────────────────────────
  function klikniSjediste(sjediste, id, red, price, vip) {
    if (kosarica.has(id)) {
      kosarica.delete(id);
    } else {
      kosarica.set(id, { price, type: vip ? 'VIP' : 'Standard' });
    }
    prikaziSalu();
  }

  // ─────────────────────────────────────────
  // 6. KOŠARICA
  // ─────────────────────────────────────────
  function osveziKosaricu() {
    const cartItemsEl  = document.getElementById('cart-items');
    const cartEmptyEl  = document.getElementById('cart-empty');
    const cartTotalRow = document.getElementById('cart-total-row');
    const cartTotalEl  = document.getElementById('cart-total');
    const btnConfirm   = document.getElementById('btn-confirm');

    cartItemsEl.innerHTML = '';

    if (kosarica.size === 0) {
      cartEmptyEl.style.display  = 'block';
      cartTotalRow.style.display = 'none';
      if (btnConfirm) btnConfirm.disabled = true;
      return;
    }

    cartEmptyEl.style.display  = 'none';
    cartTotalRow.style.display = 'flex';
    if (btnConfirm) btnConfirm.disabled = false;

    let total = 0;
    kosarica.forEach(({ price, type }, id) => {
      total += price;
      const item = document.createElement('div');
      item.className = 'cart-item';
      item.innerHTML = `
        <div class="cart-seat-info">
          <div class="cart-seat-id">Sjedište ${id}</div>
          <div class="cart-seat-type">${type}</div>
        </div>
        <div class="cart-seat-price">${price} KM</div>
        <button class="cart-remove" title="Ukloni" data-id="${id}">✕</button>
      `;
      item.querySelector('.cart-remove').addEventListener('click', () => {
        kosarica.delete(id);
        prikaziSalu();
      });
      cartItemsEl.appendChild(item);
    });

    cartTotalEl.textContent = `${total} KM`;
  }

  // ─────────────────────────────────────────
  // 7. POTVRDI REZERVACIJU
  // ─────────────────────────────────────────
  function potvrdiRezervaciju() {
    if (kosarica.size === 0) return;

    const projekcija = kinoData.projekcije[trenutnaProjekcija];
    const sjedista   = dohvatiSjedista(projekcija);
    const seats      = [...kosarica.keys()].join(', ');
    const total      = [...kosarica.values()].reduce((s, { price }) => s + price, 0);

    // Promijeni status u podacima → rezervisano
    kosarica.forEach((_, id) => {
      const red  = id.charAt(0);
      const broj = parseInt(id.slice(1));
      const s = sjedista.find(x => x.red === red && x.broj === broj);
      if (s) s.status = 'rezervisano';
    });

    kosarica.clear();
    prikaziSalu();

    prikaziToast(
      `✓ Rezervacija potvrđena! Sjedišta: <strong>${seats}</strong> • Ukupno: <strong>${total} KM</strong>`
    );
  }

  // ─────────────────────────────────────────
  // 8. NAVIGACIJA IZMEĐU PROJEKCIJA
  // ─────────────────────────────────────────
  function prethodnaProjekcija() {
    if (trenutnaProjekcija === 0) return;
    kosarica.clear();
    trenutnaProjekcija--;
    prikaziSalu();
  }

  function sljedecaProjekcija() {
    if (trenutnaProjekcija === kinoData.projekcije.length - 1) return;
    kosarica.clear();
    trenutnaProjekcija++;
    prikaziSalu();
  }

  // ─────────────────────────────────────────
  // 9. TOAST NOTIFIKACIJA
  // ─────────────────────────────────────────
  function prikaziToast(html) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = html;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4500);
  }

  // ─────────────────────────────────────────
  // 10. POMOĆNA FUNKCIJA
  // ─────────────────────────────────────────
  function _setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ─────────────────────────────────────────
  // 11. INICIJALIZACIJA
  // ─────────────────────────────────────────
  function init() {
    // Validacija
    if (!validirajPodatke(kinoData)) {
      const sala = document.getElementById('sala');
      if (sala) {
        sala.innerHTML =
          '<p style="color:#e74c3c;font-weight:700;padding:40px;text-align:center;">Podaci nisu validni!</p>';
      }
      return;
    }

    // Poveži dugmad
    const btnPrev    = document.getElementById('btn-prev');
    const btnNext    = document.getElementById('btn-next');
    const btnConfirm = document.getElementById('btn-confirm');

    if (btnPrev)    btnPrev.addEventListener('click', prethodnaProjekcija);
    if (btnNext)    btnNext.addEventListener('click', sljedecaProjekcija);
    if (btnConfirm) btnConfirm.addEventListener('click', potvrdiRezervaciju);

    // URL parametri – pronađi projekciju iz rasporeda
    const params       = new URLSearchParams(window.location.search);
    const urlFilm      = params.get('film');
    const urlVrijeme   = params.get('vrijeme');

    if (urlFilm || urlVrijeme) {
      const idx = kinoData.projekcije.findIndex(p =>
        (!urlFilm    || p.film    === urlFilm) &&
        (!urlVrijeme || p.vrijeme === urlVrijeme)
      );
      if (idx !== -1) trenutnaProjekcija = idx;
      // Ako film postoji ali to konkretno vrijeme nije u listi,
      // prikaži prvu projekciju tog filma
      else if (urlFilm) {
        const filmIdx = kinoData.projekcije.findIndex(p => p.film === urlFilm);
        if (filmIdx !== -1) trenutnaProjekcija = filmIdx;
      }
    }

    prikaziSalu();
  }

  // Pokreni kad je DOM spreman
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// ═══════════════════════════════════════════
// FILMOVI.HTML – logika (globalne funkcije)
// showPage, openModal, closeModal,
// loadFeaturedFilms, povratak iz sale
// ═══════════════════════════════════════════

// ── Navigacija između stranica (SPA) ──
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) target.classList.add('active');
  const lb = document.getElementById('legend-filmovi');
  if (lb) lb.style.display = (name === 'filmovi') ? 'block' : 'none';
  document.querySelectorAll('nav ul li a').forEach(a => a.classList.remove('active'));
  const navEl = document.getElementById('nav-' + name);
  if (navEl) navEl.classList.add('active');
  window.scrollTo(0, 0);
}

// ── Film modal ──
function openModal(card) {
  const d = card.dataset;
  const poster = document.getElementById('modal-poster');
  const img    = card.querySelector('.poster');
  if (poster && img) { poster.src = img.src; poster.alt = d.title; }
  document.getElementById('modal-title').textContent    = d.title;
  document.getElementById('modal-genre').textContent    = d.genre;
  document.getElementById('modal-duration').textContent = d.duration;
  document.getElementById('modal-year').textContent     = d.year;
  document.getElementById('modal-rating').textContent   = d.rating;
  document.getElementById('modal-desc').textContent     = d.desc;
  const badge = document.getElementById('modal-badge');
  if (badge) { badge.textContent = d.badge; badge.className = 'modal-badge ' + d.status; }
  document.getElementById('film-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(event, force) {
  const modal = document.getElementById('film-modal');
  if (!modal) return;
  if (force || (event && event.target === modal)) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ── Istaknuti filmovi (početna) ──
function loadFeaturedFilms() {
  const container = document.getElementById('featured-grid');
  if (!container) return;
  const allFilms = [
    { title: 'Thunder Road',    duration: '2h 18min', img: 'https://placehold.co/200x260/1a1a2e/e8b24a?text=THUNDER+ROAD',    status: 'now'  },
    { title: 'Iron Fury',       duration: '2h 05min', img: 'https://placehold.co/200x260/16213e/e8b24a?text=IRON+FURY',       status: 'now'  },
    { title: 'Deep Blue World', duration: '1h 40min', img: 'https://placehold.co/200x260/0a2030/80d0f0?text=DEEP+BLUE+WORLD', status: 'soon' },
    { title: 'Steel Horizon',   duration: '2h 32min', img: 'https://placehold.co/200x260/0f3460/b8dde8?text=STEEL+HORIZON',   status: 'soon' },
    { title: 'Banana Republic', duration: '1h 48min', img: 'https://placehold.co/200x260/2e1a00/ffd080?text=BANANA+REPUBLIC', status: 'now'  },
    { title: 'Sky Wanderers',   duration: '1h 28min', img: 'https://placehold.co/200x260/0d1a2e/60b8ff?text=SKY+WANDERERS',   status: 'now'  }
  ];
  const selected = [...allFilms].sort(() => 0.5 - Math.random()).slice(0, 3);
  container.innerHTML = '';
  selected.forEach(film => {
    const badge = film.status === 'now' ? 'U kinu' : 'Uskoro';
    const div = document.createElement('div');
    div.className = `film-card ${film.status}`;
    div.innerHTML = `
      <span class="card-badge">${badge}</span>
      <img class="poster" src="${film.img}" alt="${film.title}"/>
      <div class="card-info">
        <div class="card-title">${film.title}</div>
        <div class="card-duration">⏱ ${film.duration}</div>
      </div>`;
    container.appendChild(div);
  });
}

// ── Inicijalizacija filmovi.html ──
document.addEventListener('DOMContentLoaded', function () {
  // Postoji li featured-grid → znači da smo na filmovi.html
  if (!document.getElementById('featured-grid')) return;

  // Povratak iz sale.html
  const savedPage = sessionStorage.getItem('cinePage');
  if (savedPage) { sessionStorage.removeItem('cinePage'); showPage(savedPage); }

  // ESC zatvara modal
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(null, true); });

  // Učitaj istaknute filmove
  loadFeaturedFilms();
});