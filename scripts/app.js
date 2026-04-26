// ── app.js – Podaci o projekcijama ──
// Sjedišta se generišu automatski u kinoSala.js na osnovu naziva filma i vremena.
// Ovdje definišemo samo metapodatke projekcija.

const kinoData = {
  "projekcije": [
    // ── Ponedjeljak ──
    { "film": "Thunder Road",    "vrijeme": "14:00", "sala": "Sala 1" },
    { "film": "The Last Letter", "vrijeme": "16:30", "sala": "Sala 2" },
    { "film": "Banana Republic", "vrijeme": "19:00", "sala": "Sala 1" },

    // ── Utorak ──
    { "film": "Sky Wanderers",   "vrijeme": "13:30", "sala": "Sala 3" },
    { "film": "Iron Fury",       "vrijeme": "17:00", "sala": "Sala 1" },
    { "film": "Still Waters",    "vrijeme": "20:00", "sala": "Sala 2" },

    // ── Srijeda ──
    { "film": "Deep Blue World", "vrijeme": "15:00", "sala": "Sala 3" },
    { "film": "Thunder Road",    "vrijeme": "18:00", "sala": "Sala 1" },
    { "film": "Banana Republic", "vrijeme": "20:30", "sala": "Sala 2" },

    // ── Četvrtak ──
    { "film": "The Last Letter", "vrijeme": "14:30", "sala": "Sala 2" },
    { "film": "Iron Fury",       "vrijeme": "17:30", "sala": "Sala 1" },
    { "film": "Sky Wanderers",   "vrijeme": "19:45", "sala": "Sala 3" },

    // ── Petak ──
    { "film": "Deep Blue World", "vrijeme": "15:00", "sala": "Sala 3" },
    { "film": "Thunder Road",    "vrijeme": "18:30", "sala": "Sala 1" },
    { "film": "The Last Letter", "vrijeme": "21:00", "sala": "Sala 2" },

    // ── Subota ──
    { "film": "Sky Wanderers",   "vrijeme": "12:00", "sala": "Sala 3" },
    { "film": "Banana Republic", "vrijeme": "15:30", "sala": "Sala 2" },
    { "film": "Iron Fury",       "vrijeme": "18:00", "sala": "Sala 1" },
    { "film": "Thunder Road",    "vrijeme": "21:00", "sala": "Sala 1" },

    // ── Nedjelja ──
    { "film": "Deep Blue World", "vrijeme": "13:00", "sala": "Sala 3" },
    { "film": "The Last Letter", "vrijeme": "16:00", "sala": "Sala 2" },
    { "film": "Iron Fury",       "vrijeme": "19:30", "sala": "Sala 1" }
  ]
};