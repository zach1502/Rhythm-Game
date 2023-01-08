// rhythm game

// key refs
let dkey;
let fkey;
let jkey;
let kkey;

let notes = []; // list of notes on screen

// Audio
const defaultSongFile = "./songs/Giorno's theme.mp3";
let song;
let hitSound;
let missSound;
let applauseSound;

// Needed Document Elements
let gameAreaElement;
let scoreElement;
let accuracyElement;
let comboElement;
let hitTimingElement;

// Modal Elements
let modalTriggerElement;
let modalElement;
let closeModalElement;

// sidebar elements
let playButtonElement;
let warningElement;
let retryButtonElement;
let stopButtonElement;

// Options
let songVolumeSlider;
let songVolumeOutput;
let sfxVolumeSlider;
let sfxVolumeOutput;
let autoplayBox;
let autoplayOutput;
let vfxBox;
let vfxOutput;
let displayHitTimingBox;
let displayHitTimingOutput;

// the map
let map = [];
 
// game state
let combo = 0;
let maxAcc = 0;
let currAcc = 0;
let restarting = false;
let stopping = false;
let loading = false;
let playing = false;
let currentMap = "goldenWind-med"; // default map
let loadedSong = defaultSongFile; // default song

// Metadata
let bpm = -1; // Needed for well timed flashes

// data to run
let flashID = -1;
let speed = (window.innerHeight / 1.4)*(1/1000);

let isHold = {
    'd': false,
    'f': false,
    'j': false,
    'k': false
};

let expectedHold = {
    'd': false,
    'f': false,
    'j': false,
    'k': false
};

// generic Note Class
class Note{
    /*
     * @param {string} key - key to check
     */
    constructor(key, bonus = false){
        this.key = key;

        // create the note
        this.note = document.createElement("div");
        gameAreaElement.appendChild(this.note);
        this.note.classList.add(key);

        // move note to the same position as the key
        switch(key){
            case "d":
                this.note.style.left = dkey.style.left;
                break;
            case "f":
                this.note.style.left = fkey.style.left;
                break;
            case "j":
                this.note.style.left = jkey.style.left;
                break;
            case "k":
                this.note.style.left = kkey.style.left;
                break;
            default:
                console.log("invalid key");
                // delete the note
                this.note.remove();
                delete this;
                break;
        }

        // apply animation
        this.note.classList.add("note"); // in css
        if(bonus) this.note.classList.add("bonus");
        notes.push(this);
    }
}

// on page load
window.onload = function(){
    // check for readyState
    if(document.readyState == "complete"){
        // initialize game
        launchModal();
        attachEventHandlers();
        getKeys();
        getElements();
        getOptions();
        loadSfx();
        loadSong(defaultSongFile);
        startBackgroundLoop();
        loadMap("goldenWind-med");
    }
}

function loadLevel(level, song){
    if(currentMap == level) return;
    loading = true;

    loadMap(level);
    if(loadedSong != song){
        loadSong(song);
    }
    console.log(level)
    currentMap = level;

    // find the selected song 
    document.getElementById("selected-song").id = "";
    document.getElementsByClassName(level)[0].id = "selected-song";

    loading = false;
}

function getElements(){
    gameAreaElement = document.getElementById("game-area");
    scoreElement = document.getElementById("score");
    accuracyElement = document.getElementById("accuracy");
    comboElement = document.getElementById("combo");
    hitTimingElement = document.getElementById("hit-timing");

    playButtonElement = document.getElementById("play");
    warningElement = document.getElementById("warning");
    retryButtonElement = document.getElementById("retry");
    stopButtonElement = document.getElementById("stop");
}

function getOptions(){
    // get slider elements
    songVolumeSlider = document.getElementById("song-volume");
    songVolumeOutput = document.getElementById("song-volume-value");
    sfxVolumeSlider = document.getElementById("sfx-volume");
    sfxVolumeOutput = document.getElementById("sfx-volume-value");

    autoplayBox = document.getElementById("autoplay-checkbox");
    vfxBox = document.getElementById("vfx-checkbox");
    displayHitTimingBox = document.getElementById("timing-display-checkbox");

    // check if local storage is available
    if(storageAvailable("localStorage")){
        // get values from local storage
        songVolumeSlider.value = localStorage.getItem("songVolume");
        sfxVolumeSlider.value = localStorage.getItem("sfxVolume");
        autoplayBox.checked = localStorage.getItem("autoplay") == "true";
        vfxBox.checked = localStorage.getItem("vfx") == "true";
        displayHitTimingBox.checked = localStorage.getItem("displayHitTiming") == "true";
    }

    // set slider value
    songVolumeOutput.innerHTML = songVolumeSlider.value;
    sfxVolumeOutput.innerHTML = sfxVolumeSlider.value;

    // attach listeners
    songVolumeSlider.oninput = function(){
        songVolumeOutput.innerHTML = this.value;
        song.volume = this.value / 100;

        if(storageAvailable("localStorage")){
            localStorage.setItem("songVolume", this.value);
        }
    }
    
    sfxVolumeSlider.oninput = function(){
        sfxVolumeOutput.innerHTML = this.value;
        hitSound.volume = this.value / 400; // THESE SOUNDS ARE TOO LOUD
        missSound.volume = this.value / 400;
        applauseSound.volume = this.value / 400;

        if(storageAvailable("localStorage")){
            localStorage.setItem("sfxVolume", this.value);
        }
    }

    autoplayBox.onchange = function(){
        if(storageAvailable("localStorage")){
            localStorage.setItem("autoplay", this.checked);
        }
    }

    vfxBox.onchange = function(){
        if(storageAvailable("localStorage")){
            localStorage.setItem("vfx", this.checked);
        }
    }
    
    displayHitTimingBox.onchange = function(){
        if(storageAvailable("localStorage")){
            localStorage.setItem("displayHitTiming", this.checked);
        }
    }
}

function loadMap(mapToLoad){
    // clear map
    map = [];
    
    // load from iframe
    let map_text = document.getElementById(mapToLoad).contentDocument.body.innerText;
    let lines = map_text.split("\n");

    // parse lines
    // each line contains a time and a key
    // the previous' line's time minus the current line's time is the time to wait
    // id = special id for notes 
    // 0: regular notes
    // 1: hold notes (maybe)
    // 2: tbd ... 

    let prev_time = -1;
    for(let line of lines){
        line = line.trim();
        if(line == "") continue; // ignore empty lines
        if(line[0] == "/" && line[1] == "/") continue; // comment

        const tokens = line.split(" ");

        let type = tokens[0];
        let time = parseInt(tokens[1]);
        let key = tokens[2];

        let wait = time - prev_time;
        switch(type){
            case "note":
                // auto create chord
                if(wait === 0){
                    let prevNote = map.pop();
                    let newNote = createChord(prevNote, key);
                    newNote[0] = 1; // chord
        
                    map.push(newNote);
                }
                else{
                    map.push([0, wait, key]);
                }
                break;
            case "hold":
                let length = tokens[3];
                // hold notes are just regular notes but a function will check every so often if the key is still held
                map.push([2, wait, key, length]);
                break;
            case "effect":
                map.push([4]);
                continue; // don't want to effect timing
            case "flash":
                map.push([5, tokens[1], tokens[2]]);
                continue; 
            case "bpm":
                bpm = parseInt(tokens[1]);
                continue;
            case "end":
                map.push([99]);
                break;
            default:
                console.log("invalid type");
                break;
        }

        prev_time = time;
    }
}

async function retry(){
    restarting = true;

    hitTimingElement.innerHTML = "";
    resetAndPauseSong()
    for(let note of notes){
        note.note.remove();
        delete note;
    }
    notes = [];

    disableButtons();
    turnOffFlash();

    start();
};

async function stop(){
    stopping = true;

    hitTimingElement.innerHTML = "";
    resetAndPauseSong()

    for(let note of notes){
        note.note.remove();
        delete note;
    }
    notes = [];

    hitTimingElement.innerHTML = "";
    playButtonElement.style.display = "block";
    modalTriggerElement.style.display = "block";
    retryButtonElement.style.display = "none";
    stopButtonElement.style.display = "none";

    turnOffFlash();
    disableButtons();
}

async function start(){
    if(loading) return;

    // hide start button and warning and how to play
    playButtonElement.style.display = "none";
    warningElement.style.display = "none";
    modalTriggerElement.style.display = "none";
    retryButtonElement.style.display = "block";
    stopButtonElement.style.display = "block";

    // reset combo
    comboElement.innerHTML = 0;

    // reset stats
    zeroStat("misses");
    zeroStat("perfect");
    zeroStat("excellent");
    zeroStat("good");
    zeroStat("bad");

    // reset accuracy
    maxAcc = 0.0;
    currAcc = 0.0;
    accuracyElement.innerHTML = "00.00";

    // reset score
    scoreElement.innerHTML = "0";

    // Remove Key Hints
    removeKeyHints();

    // check if autoplay is checked
    if(autoplayBox.checked){
        setInterval(autoHit, 1);
    }

    // start the game
    await sleep(1000); 
    song.play();

    if(stopping){
        stopping = false;
        resetAndPauseSong()
        return;
    }

    let vfxOn = false;
    for(let mapNote of map){
        if(restarting || stopping) {
            restarting = false;
            stopping = false;
            resetAndPauseSong()
            return;
        }

        const id = mapNote[0];
        const time = mapNote[1];
        let key = "";

        switch(id){
            case 0:
                // regular note
                key = mapNote[2];
                await sleep(time);
                if (restarting || stopping) {
                    restarting = false;
                    stopping = false;
                    resetAndPauseSong()
                    return;
                }
                new Note(key, vfxOn && !vfxBox.checked);
                break;
            case 1:
                // chord
                // mapNote[2] to mapNote[n] are keys
                await sleep(time);
                for(let i = 2; i < mapNote.length; i++){
                    key = mapNote[i];
                    if (restarting || stopping) {
                        restarting = false;
                        stopping = false;
                        resetAndPauseSong()
                        return;
                    }
                    new Note(key, vfxOn && !vfxBox.checked);
                }
                break;
            case 2:
                // hold
                // mapNote[2] is the length of hold
                // mapNote[3] is the key
                await sleep(time);
                key = mapNote[2];
                if (restarting || stopping) {
                    restarting = false;
                    stopping = false;
                    resetAndPauseSong()
                    return;
                }
                new Note(key);
                break;
            case 3:
                // hold chord
                break;
            case 4:
                // toggle rainbow notes
                vfxOn = !vfxOn;
                break;
            case 5:
                // toggle game area colour
                if(vfxBox.checked) continue;
                flash(mapNote[1], mapNote[2]);
                break;
            case 99:
                // execute end of song stuff
                await sleep(1600);
                endOfSong();
                return;
            default:
                // do nothing
                break;
        }
    }
}

function endOfSong(){
    // play applause
    applauseSound.play();
    hitTimingElement.innerHTML = "";

    // show play again button
    playButtonElement.style.display = "block";
    retryButtonElement.style.display = "none";
    stopButtonElement.style.display = "none";
    modalTriggerElement.style.display = "block";

    turnOffFlash();
}

function flash(reciprecalSpeed = 1.0, delayInitialFlash = 1200){
    if(flashID != -1) {
        clearInterval(flashID);
        flashID = -1;
        return;
    }

    setTimeout(function(){
        flashID = setInterval(function(){
            gameAreaElement.style.backgroundColor = "#555";
            setTimeout(function(){
                gameAreaElement.style.backgroundColor = "#333";
            }, 100);
        }, ((60 * 1000)/bpm) * reciprecalSpeed);
    }, delayInitialFlash);
}

function autoHit(){
    // for all notes, check if the key collides with the note
    for(let i = 0; i < notes.length; i++){
        // notes has their elements in the order of old to new
        let note = notes[i];
        const note_pos = note.note.getBoundingClientRect();

        // check if the note will hit
        if(Math.abs(note_pos.bottom - dkey.getBoundingClientRect().bottom) < 5.0){
            // remove all references to the note (can be garbage collected)
            note.note.remove();
            notes.splice(i, 1);

            // add score
            handleHit(dkey.getBoundingClientRect(), note_pos);
            hitSound.currentTime = 0;
            hitSound.play();
            return;
        }
    }
}