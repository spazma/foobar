// === Dynamic File Info Panel (compact, aligned to longest label, grouped, scrollable) ===
// SMP 1.6.1 compatible

let scroll = 0;
let contentHeight = 0;

function RGB(r, g, b) {
    return (0xff000000 | (r << 16) | (g << 8) | b);
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function on_mouse_wheel(step) {
    scroll -= step * 25;
    scroll = clamp(scroll, 0, Math.max(0, contentHeight - window.Height));
    window.Repaint();
}

function on_playback_new_track() { scroll = 0; window.Repaint(); }
function on_playback_stop() { window.Repaint(); }
function on_playback_seek() { window.Repaint(); }

function on_paint(gr) {
    gr.FillSolidRect(0, 0, window.Width, window.Height, RGB(0, 0, 0));
    gr.SetTextRenderingHint(4);

    const metadb = fb.GetNowPlaying();
    if (!metadb) {
        gr.DrawString("No track playing", gdi.Font("Segoe UI", 14), RGB(200, 200, 200),
            10, 10, window.Width - 20, 30);
        return;
    }

    const fs = metadb.FileStats;
    const fileCreated = fs ? new Date(fs.created).toLocaleString() : "";
    const fileModified = fs ? new Date(fs.modified).toLocaleString() : "";
    const fileSize = fs ? utils.FormatFileSize(fs.size) : "";

    const groups = [
        {
            name: "Audio",
            fields: [
                ["Artist", "%artist%"],
                ["Title", "%title%"],
                ["Album", "%album%"],
                ["Genre", "%genre%"],
                ["Date", "%date%"],
                ["Track", "%tracknumber%"],
                ["Tracks", "%totaltracks%"],
                ["Disc", "%discnumber%"],
                ["Discs", "%totaldiscs%"],
                ["Album Artist", "%album artist%"],
                ["Composer", "%composer%"],
                ["Performer", "%performer%"],
                ["Comment", "%comment%"]
            ]
        },
        {
            name: "File",
            fields: [
                ["Created", fileCreated],
                ["Modified", fileModified],
                ["Size", fileSize],
                ["Folder", "$directory(%path%)"],
                ["Filename", "%filename_ext%"],
                ["Path", "%path%"],
                ["Subsong", "%subsong%"],
                ["Cuesheet", "$if(%cuesheet_embedded%,yes,no)"],
                ["Tag", "%__tagtype%"]
            ]
        },
        {
            name: "ReplayGain",
            fields: [
                ["Album peak", "%__replaygain_album_peak%"],
                ["Album gain", "%__replaygain_album_gain%"],
                ["Track peak", "%__replaygain_track_peak%"],
                ["Track gain", "%__replaygain_track_gain%"]
            ]
        },
        {
            name: "Playback",
            fields: [
                ["Channels", "%channels%"],
                ["Sample rate", "%samplerate% Hz"],
                ["Encoding", "%__encoding%"],
                ["Tool", "%__tool%"],
                ["Profile", "%__codec_profile%"],
                ["Codec", "%__codec%"],
                ["Bitrate", "%bitrate% kbps"],
                ["Duration", "%length%"],
                ["First played", "%first_played%"],
                ["Last played", "%last_played%"],
                ["Played", "%play_count% times"]
            ]
        }
    ];

    const font = gdi.Font("Segoe UI", 12);
    const fontHeader = gdi.Font("Segoe UI", 12, 1);
    const color = RGB(220, 220, 220);
    const labelColor = RGB(170, 170, 170);
    const lineColor = RGB(60, 60, 60);

    const x = 10;

    // === 1) ZNAJDŹ NAJDŁUŻSZY LABEL ===
    let longest = 0;
    groups.forEach(g => g.fields.forEach(([label]) => {
        const w = gr.CalcTextWidth(label + ":", font);
        if (w > longest) longest = w;
    }));

    const valueX = x + longest + gr.CalcTextWidth("   ", font); // +3 spacje

    let y = 10 - scroll;

    groups.forEach(group => {

        // === HEADER WITH LINE ===
        const headerText = group.name + " ";
        const headerWidth = gr.CalcTextWidth(headerText, fontHeader);

        gr.DrawString(headerText, fontHeader, color, x, y, headerWidth, 20);
        gr.FillSolidRect(x + headerWidth + 4, y + 10, window.Width - (x + headerWidth + 14), 1, lineColor);

        y += 22;

        // === FIELDS ===
        group.fields.forEach(([label, pattern]) => {
            let value = pattern;

            if (pattern.startsWith("%") || pattern.startsWith("$"))
                value = fb.TitleFormat(pattern).EvalWithMetadb(metadb).trim();

            if (value && value !== "?" && value !== "0" && value !== "0 times") {

                gr.DrawString(label + ":", font, labelColor,
                    x, y, longest, 18);

                gr.DrawString(value, font, color,
                    valueX, y, window.Width - valueX - 10, 18);

                y += 18;
            }
        });

        y += 8;
    });

    contentHeight = y + scroll;

    // === Scrollbar ===
    if (contentHeight > window.Height) {
        const barHeight = Math.max(20, window.Height * (window.Height / contentHeight));
        const barPos = (scroll / (contentHeight - window.Height)) * (window.Height - barHeight);

        gr.FillSolidRect(window.Width - 6, barPos, 6, barHeight, RGB(120, 120, 120));
    }
}
