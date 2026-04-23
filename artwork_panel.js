// === COVER PANEL (SMP) ===
// === GLOBALNE ===
var ww = 0, wh = 0;
var coverImg = null;
var coverFade = 0;
var isStopped = false;

// === WCZYTYWANIE OKŁADKI ===
function loadCover() {
    var metadb = fb.GetNowPlaying();
    if (!metadb) { coverImg = null; return; }

    var img = utils.GetAlbumArtV2(metadb, 0);
    coverImg = img ? img : null;

    // reset fade-in
    coverFade = 0;
}

// === ZDARZENIA PLAYBACK ===
function on_playback_new_track() {
    isStopped = false;
    loadCover();
    window.Repaint();
}

function on_playback_starting() {
    isStopped = false;
    loadCover();
    window.Repaint();
}

function on_playback_stop() {
    isStopped = true;
    coverImg = null;
    coverFade = 0;
    window.Repaint();
}

// === ZMIANA ROZMIARU ===
function on_size() {
    ww = window.Width;
    wh = window.Height;
}

// === RYSOWANIE PANELU ===
function on_paint(gr) {
    gr.FillSolidRect(0, 0, ww, wh, 0xFF000000);

    // === OKŁADKA FULLSCREEN (bez przyciemnienia) ===
    if (coverImg && !isStopped) {

        // najpierw rysujemy nutkę jako tło fade-in
        var font = gdi.Font("Segoe UI Symbol", 240, 0);
        var char = "♪";
        var m = gr.MeasureString(char, font, 0, 0, ww, wh);
        var nx = Math.floor((ww - m.Width) / 2);
        var ny = Math.floor((wh - m.Height) / 2) - Math.floor(m.Height * 0.04);

        gr.GdiDrawText(char, font, 0x40FFFF00, nx - 1, ny - 1, m.Width, m.Height, 0);
        gr.GdiDrawText(char, font, 0xFFFFFFFF, nx, ny, m.Width, m.Height, 0);

        // teraz okładka fullscreen
        var iw = coverImg.Width;
        var ih = coverImg.Height;

        var scale = Math.max(ww / iw, wh / ih);
        var w = Math.floor(iw * scale);
        var h = Math.floor(ih * scale);

        var x = Math.floor((ww - w) / 2);
        var y = Math.floor((wh - h) / 2);

        gr.DrawImage(coverImg, x, y, w, h, 0, 0, iw, ih, 0, coverFade);

        if (coverFade < 255) {
            coverFade += 15; // płynniejszy fade
            window.Repaint();
        }

        return;
    }

    // === BRAK OKŁADKI → gradient + nutka ===

    var steps = 40;
    for (var i = 0; i < steps; i++) {
        var alpha = Math.floor(180 * (i / steps));
        gr.FillSolidRect(0, Math.floor((wh / steps) * i), ww, Math.ceil(wh / steps), (alpha << 24));
    }

    var font = gdi.Font("Segoe UI Symbol", 240, 0);
    var char = "♪";
    var m = gr.MeasureString(char, font, 0, 0, ww, wh);
    var x = Math.floor((ww - m.Width) / 2);
    var y = Math.floor((wh - m.Height) / 2) - Math.floor(m.Height * 0.04);

    if (isStopped) {
        // STOP — czerwony gruby outline
        gr.GdiDrawText(char, font, 0x30FF0000, x - 2, y - 2, m.Width, m.Height, 0);
        gr.GdiDrawText(char, font, 0x60FF0000, x - 1, y - 1, m.Width, m.Height, 0);
        gr.GdiDrawText(char, font, 0xA0FF0000, x, y, m.Width, m.Height, 0);
    } else {
        // PLAY bez okładki — subtelny żółty outline
        gr.GdiDrawText(char, font, 0x20FFFF00, x - 1, y - 1, m.Width, m.Height, 0);
    }

    gr.GdiDrawText(char, font, 0xFFFFFFFF, x, y, m.Width, m.Height, 0);
}
