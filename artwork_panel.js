// COVER PANEL (SMP) — lewy = next art, prawy = prev art
// Poprawka: brak popupów "No other album art found", dodany cooldown kliknięć

var ww = 0, wh = 0;
var coverImg = null;
var coverFade = 0;
var isStopped = false;

// hold previous cover briefly when new one doesn't exist
var coverClearTimer = null;
var COVER_HOLD_MS = 700; // ms

// cover index handling (front/back/other)
var coverIndex = 0;
var MAX_COVERS = 10; // search indexes 0..9
var coverRect = null; // last drawn cover rectangle (for click detection)

// click cooldown to avoid spamming
var lastCoverAction = 0;
var COVER_CLICK_COOLDOWN_MS = 600; // ms

// disposal helper
function disposeCover(img) {
    try {
        if (img && typeof img.Dispose === "function") img.Dispose();
    } catch (e) {}
}

function scheduleClearCover() {
    if (coverClearTimer) window.ClearTimeout(coverClearTimer);
    coverClearTimer = window.SetTimeout(function () {
        coverClearTimer = null;
        if (coverImg) {
            disposeCover(coverImg);
            coverImg = null;
        }
        coverFade = 0;
        window.Repaint();
    }, COVER_HOLD_MS);
}

// Try to load a specific index. Returns true if loaded.
function loadCoverIndex(index) {
    var metadb = fb.GetNowPlaying();
    if (!metadb) {
        scheduleClearCover();
        return false;
    }

    // cancel pending clear if any
    if (coverClearTimer) {
        window.ClearTimeout(coverClearTimer);
        coverClearTimer = null;
    }

    var img = null;
    try {
        img = utils.GetAlbumArtV2(metadb, index);
    } catch (e) {
        img = null;
    }

    if (!img) {
        return false;
    }

    try {
        if (coverImg && coverImg !== img) disposeCover(coverImg);
    } catch (e) {}

    coverImg = img;
    coverIndex = index;
    coverFade = 0; // start fade-in
    window.Repaint();
    return true;
}

// Find first available album art (starting from 0 up to MAX_COVERS-1)
function findAndLoadFirstAvailable() {
    var metadb = fb.GetNowPlaying();
    if (!metadb) {
        scheduleClearCover();
        return;
    }

    if (coverClearTimer) {
        window.ClearTimeout(coverClearTimer);
        coverClearTimer = null;
    }

    for (var i = 0; i < MAX_COVERS; i++) {
        try {
            var img = utils.GetAlbumArtV2(metadb, i);
            if (img) {
                if (coverImg && coverImg !== img) disposeCover(coverImg);
                coverImg = img;
                coverIndex = i;
                coverFade = 0;
                window.Repaint();
                return;
            }
        } catch (e) {}
    }
    // none found -> keep old for COVER_HOLD_MS
    scheduleClearCover();
}

// find next available index (direction 1 forward, -1 backward). Returns found index or -1.
function findNextAvailableIndex(direction) {
    var metadb = fb.GetNowPlaying();
    if (!metadb) return -1;
    var start = coverIndex;
    for (var step = 1; step < MAX_COVERS; step++) {
        var idx = (start + direction * step) % MAX_COVERS;
        if (idx < 0) idx += MAX_COVERS;
        try {
            var img = utils.GetAlbumArtV2(metadb, idx);
            if (img) return idx;
        } catch (e) {}
    }
    return -1;
}

function nextCover() {
    if (!coverImg) {
        findAndLoadFirstAvailable();
        return;
    }
    var idx = findNextAvailableIndex(1);
    if (idx >= 0) {
        loadCoverIndex(idx);
    } else {
        // brak kolejnej okładki — nie pokazujemy popupu, po prostu nic
        return;
    }
}

function prevCover() {
    if (!coverImg) {
        findAndLoadFirstAvailable();
        return;
    }
    var idx = findNextAvailableIndex(-1);
    if (idx >= 0) {
        loadCoverIndex(idx);
    } else {
        // brak poprzedniej okładki — nie pokazujemy popupu
        return;
    }
}

// original loadCover behaviour: attempt index 0 first, else search any
function loadCover() {
    coverIndex = 0;
    if (!loadCoverIndex(0)) {
        findAndLoadFirstAvailable();
    }
}

// playback events
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
    if (coverClearTimer) { window.ClearTimeout(coverClearTimer); coverClearTimer = null; }
    if (coverImg) { disposeCover(coverImg); coverImg = null; }
    coverFade = 0;
    window.Repaint();
}

function on_size() {
    ww = window.Width;
    wh = window.Height;
}

// painting
function on_paint(gr) {
    gr.FillSolidRect(0, 0, ww, wh, 0xFF000000);

    // If we have a cover and not stopped -> show fullscreen cover
    if (coverImg && !isStopped) {
        // subtle music note behind
        var font = gdi.Font("Segoe UI Symbol", Math.max(64, Math.floor(Math.min(ww, wh) / 3)), 0);
        var char = "♪";
        var m = gr.MeasureString(char, font, 0, 0, ww, wh);
        var nx = Math.floor((ww - m.Width) / 2);
        var ny = Math.floor((wh - m.Height) / 2) - Math.floor(m.Height * 0.04);

        gr.GdiDrawText(char, font, 0x40FFFF00, nx - 1, ny - 1, m.Width, m.Height, 0);
        gr.GdiDrawText(char, font, 0xFFFFFFFF, nx, ny, m.Width, m.Height, 0);

        // scale to fill
        var iw = coverImg.Width;
        var ih = coverImg.Height;
        var scale = Math.max(ww / iw, wh / ih);
        var w = Math.floor(iw * scale);
        var h = Math.floor(ih * scale);
        var x = Math.floor((ww - w) / 2);
        var y = Math.floor((wh - h) / 2);

        // draw with alpha coverFade (fallback to non-alpha if DrawImage fails)
        try {
            gr.DrawImage(coverImg, x, y, w, h, 0, 0, iw, ih, 0, coverFade);
        } catch (e) {
            try { gr.DrawImage(coverImg, x, y, w, h, 0, 0, iw, ih); } catch (e2) {}
        }

        // increment fade
        if (coverFade < 255) {
            coverFade = Math.min(255, coverFade + 15);
            window.Repaint();
        }

        // remember draw rect for click detection
        coverRect = { x: x, y: y, w: w, h: h };
        return;
    }

    // no cover -> gradient + big note
    coverRect = null;

    var steps = 40;
    for (var i = 0; i < steps; i++) {
        var alpha = Math.floor(180 * (i / steps));
        gr.FillSolidRect(0, Math.floor((wh / steps) * i), ww, Math.ceil(wh / steps), (alpha << 24));
    }

    var fontBig = gdi.Font("Segoe UI Symbol", Math.max(64, Math.floor(Math.min(ww, wh) / 3)), 0);
    var char2 = "♪";
    var m2 = gr.MeasureString(char2, fontBig, 0, 0, ww, wh);
    var x2 = Math.floor((ww - m2.Width) / 2);
    var y2 = Math.floor((wh - m2.Height) / 2) - Math.floor(m2.Height * 0.04);

    if (isStopped) {
        gr.GdiDrawText(char2, fontBig, 0x30FF0000, x2 - 2, y2 - 2, m2.Width, m2.Height, 0);
        gr.GdiDrawText(char2, fontBig, 0x60FF0000, x2 - 1, y2 - 1, m2.Width, m2.Height, 0);
        gr.GdiDrawText(char2, fontBig, 0xA0FF0000, x2, y2, m2.Width, m2.Height, 0);
    } else {
        gr.GdiDrawText(char2, fontBig, 0x20FFFF00, x2 - 1, y2 - 1, m2.Width, m2.Height, 0);
    }

    gr.GdiDrawText(char2, fontBig, 0xFFFFFFFF, x2, y2, m2.Width, m2.Height, 0);
}

// helper: allow action only if cooldown expired
function canDoCoverAction() {
    var now = Date.now();
    if (now - lastCoverAction < COVER_CLICK_COOLDOWN_MS) return false;
    lastCoverAction = now;
    return true;
}

// mouse: left click = next cover (if clicked inside cover), right click = prev
function on_mouse_lbtn_up(x, y) {
    if (!canDoCoverAction()) return;
    if (coverRect && x >= coverRect.x && x <= coverRect.x + coverRect.w &&
        y >= coverRect.y && y <= coverRect.y + coverRect.h) {
        nextCover();
    }
}

function on_mouse_rbtn_up(x, y) {
    if (!canDoCoverAction()) return;
    if (coverRect && x >= coverRect.x && x <= coverRect.x + coverRect.w &&
        y >= coverRect.y && y <= coverRect.y + coverRect.h) {
        prevCover();
    }
}

// init
currentTrack = fb.GetNowPlaying();
coverFade = 0;
coverIndex = 0;
lastCoverAction = 0;
