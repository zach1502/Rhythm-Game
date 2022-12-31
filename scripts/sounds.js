function loadSfx(){
    // load song
    hitSound = new Audio("hit.wav");
    missSound = new Audio("miss.wav");
    applauseSound = new Audio("applause.mp3");

    missSound.volume = sfxVolumeSlider.value / 400;
    hitSound.volume = sfxVolumeSlider.value / 400;
    applauseSound.volume = sfxVolumeSlider.value / 400;
}

function loadSong(songFile){
    // load song
    song = new Audio(songFile);
    song.volume = songVolumeSlider.value / 100;
}
