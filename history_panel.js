// === Playback History Panel + Playlist Writer (SMP 1.6.1) ===
// Panel: lista 40 utworów z timestampami + session played + total mins
// Playlista: pełna historia (dodaje nawet duplikaty)

const PLAYLIST_NAME = "> History";
const MAX_PLAYLIST_ITEMS = 200;
const MAX_DISPLAY = 40;

let history = [];
let sessionPlayed = 0;
let totalMinutes = 0;

let lastUpdateTime = 0;

// ---------------------------
// PLAYLISTA — zapis historii
// ---------------------------
function add_to_playlist(handle) {
    let pl = plman.FindPlaylist(PLAYLIST_NAME);
    if (pl === -1) {
        pl = plman.CreatePlaylist(plman.PlaylistCount, PLAYLIST_NAME);
    }

    // dodajemy ZAWSZE — real history
    let list = fb.CreateHandleList();
    list.Add(handle);
    plman.InsertPlaylistItems(pl, 0, list);

    // limit
    let count = plman.PlaylistItemCount(pl);
    if (count > MAX_PLAYLIST_ITEMS) {
        plman.RemovePlaylistSelection(pl, count - 1, 1);
    }
}

// ---------------------------
// PANEL — logika
// ---------------------------
function on_playback_time(time) {
    if (fb.IsPlaying) {
        let delta = time - lastUpdateTime;
        if (delta > 0) {
            totalMinutes += delta / 60;
        }
        lastUpdateTime = time;
    }
}

function on_playback_new_track(info) {
    if (!info) return;

    let handle = fb.GetNowPlaying();
    if (!handle) return;

    // timestamp
    let now = new Date();
    let hh = String(now.getHours()).padStart(2, "0");
    let mm = String(now.getMinutes()).padStart(2, "0");
    let ts = `[${hh}:${mm}] `;

    // dodaj do panelu
    history.unshift({ ts: ts, handle: handle });

    if (history.length > MAX_DISPLAY) {
        history.length = MAX_DISPLAY;
    }

    // licznik sesji
    sessionPlayed++;

    // reset czasu
    lastUpdateTime = fb.PlaybackTime;

    // dodaj do playlisty
    add_to_playlist(handle);

    window.Repaint();
}

// ---------------------------
// RYSOWANIE PANELU
// ---------------------------
function on_paint(gr) {
    gr.FillSolidRect(0, 0, window.Width, window.Height, 0xFF141414);

    const lh = 18;
    let y = 5;

    // lista utworów z timestampami
    for (let i = 0; i < history.length; i++) {
        let h = history[i];
        let name = h.handle.RawPath.split("\\").pop();
        let text = h.ts + name;

        gr.GdiDrawText(
            text,
            gdi.Font("Segoe UI", 12, 0),
            0xFFCCCCCC,
            10, y, window.Width - 20, lh
        );

        y += lh;

        // zatrzymaj listę przed blokiem info
        if (y > window.Height - (lh * 4)) break;
    }

    // --- INFO PRZYKLEJONE DO DOŁU PANELU ---
    let infoY = window.Height - (lh * 3) - 5;

    gr.GdiDrawText(
        "---------------",
        gdi.Font("Segoe UI", 12, 0),
        0xFF888888,
        10, infoY, window.Width - 20, lh
    );

    infoY += lh;

    gr.GdiDrawText(
        "session played: " + sessionPlayed,
        gdi.Font("Segoe UI", 12, 0),
        0xFFBBBBBB,
        10, infoY, window.Width - 20, lh
    );

    infoY += lh;

    gr.GdiDrawText(
        "total mins: " + Math.floor(totalMinutes),
        gdi.Font("Segoe UI", 12, 0),
        0xFFBBBBBB,
        10, infoY, window.Width - 20, lh
    );
}
