$set_font(Tahoma,12,bold;)$rgb(255,255,255)
$if(%artist%,> %artist% <)
$crlf()
%title%
$crlf()
$if(%rating%,$set_font(Tahoma,12,bold;)$rgb(255,215,0)$repeat(★,%rating%)$repeat(☆,$sub(5,%rating%))$rgb()$crlf())

$set_font(Tahoma,10,bold;)$rgb(200,200,200)
$if(%album%,Album: %album%)
$if(%date%, $rgb(180,180,180)Rok: $left(%date%,4))
$crlf()$crlf()

$set_font(Tahoma,9,bold;)$rgb(200,200,200)
%play_count% 

$set_font(Tahoma,12,bold;)$rgb()
$if(%isplaying%,$rgb(0,255,0)▶,$if(%ispaused%,$rgb(255,255,0)⏸,$rgb(255,0,0)■)) $rgb()

$progress2(%_time_elapsed_seconds%,%_time_total_seconds%,30,'█','░')
 
$set_font(Tahoma,12,bold;)$rgb(255,255,0)
%playback_time% / %length%
$crlf()
$crlf()

$set_font(Tahoma,12,bold;)$rgb()
$rgb()bitrate: %bitrate% $rgb(110,110,110) | $rgb()samplerate: %samplerate% $rgb(110,110,110) | $rgb()%filesize_natural% $rgb(110,110,110) | $rgb()%channels% $rgb(110,110,110) | $if(%codec%,$rgb(180,255,180)%codec% $rgb())
$crlf()
$crlf()

$set_font(Tahoma,12,bold;)$rgb()
$if(%replaygain_track_gain%,
Gain: %replaygain_track_gain%$rgb(110,110,110) | $rgb()
$ifgreater(%replaygain_track_peak%,1,'UWAGA! Szczyt > 1: '$muldiv(%replaygain_track_peak%,100,1)'%','Szczyt: '$muldiv(%replaygain_track_peak%,100,1)'%'),
$rgb(255,80,80)Brak ReplayGain!$rgb()
)
$crlf()
$crlf()

$set_font(Courier New,10;)
path: %path%