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
let currentMap = "goldenWind-hard";

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
        loadMap("goldenWind-hard");
    }
}

function loadLevel(level){
    // load level
    switch(level){
        case "goldenWind-hard":
            loadMap("goldenWind-hard");
            loadSong("./songs/Giorno's theme.mp3");
            console.log("Loaded Golden Wind - hard")
            currentMap = "goldenWind-hard";
            break;
        case "goldenWind-med":
            loadMap("goldenWind-med");
            loadSong("./songs/Giorno's theme.mp3");
            console.log("Loaded Golden Wind - med")
            currentMap = "goldenWind-med";
            break;
        
        default:
            console.log("invalid level");
            break;
    }
}

function getElements(){
    gameAreaElement = document.getElementById("game-area");
    scoreElement = document.getElementById("score");
    accuracyElement = document.getElementById("accuracy");
    comboElement = document.getElementById("combo");
    hitTimingElement = document.getElementById("hit-timing");
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

    // set slider value
    songVolumeOutput.innerHTML = songVolumeSlider.value;
    sfxVolumeOutput.innerHTML = sfxVolumeSlider.value;

    // attach listeners
    songVolumeSlider.oninput = function(){
        songVolumeOutput.innerHTML = this.value;
        song.volume = this.value / 100;
    }
    
    sfxVolumeSlider.oninput = function(){
        sfxVolumeOutput.innerHTML = this.value;
        hitSound.volume = this.value / 400; // THESE SOUNDS ARE TOO LOUD
        missSound.volume = this.value / 400;
        applauseSound.volume = this.value / 400;
    }
}

function loadMap(mapToLoad = "goldenWind-hard"){
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

function createChord(prevNote, key){
    // create a new list
    let newNote = [];
    newNote.push(1); // chord
    newNote.push(prevNote[1]);
    
    // add prev keys
    for(let i = 2; i < prevNote.length; i++){
        newNote.push(prevNote[i]);
    }
    newNote.push(key);

    return newNote;
}

async function retry(){
    restarting = true;

    document.getElementById("hit-timing").innerHTML = "";
    song.currentTime = 0;
    song.pause();

    for(let note of notes){
        note.note.remove();
        delete note;
    }
    notes = [];
    start();
};

async function start(){
    // hide start button and warning and how to play
    document.getElementById("play").style.display = "none";
    document.getElementById("warning").style.display = "none";
    modalTriggerElement.style.display = "none";
    document.getElementById("retry").style.display = "block";

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
    document.getElementById("accuracy").innerHTML = "00.00";

    // reset score
    document.getElementById("score").innerHTML = "0";

    // Remove Key Hints
    removeKeyHints();

    // check if autoplay is checked
    if(autoplayBox.checked){
        setInterval(autoHit, 1);
    }

    // start the game
    await sleep(1000); 
    song.play();
    let vfxOn = false;
    for(let mapNote of map){
        if(restarting) {
            restarting = false;
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
                if (restarting) {
                    restarting = false;
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
                    if (restarting) {
                        restarting = false;
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
                if (restarting) {
                    restarting = false;
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
    document.getElementById("hit-timing").innerHTML = "";

    // show play again button
    document.getElementById("play").style.display = "block";
    document.getElementById("retry").style.display = "none";
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

function hitCheck(key, key_element){
    const key_pos = key_element.getBoundingClientRect();

    // for all notes, check if the key collides with the note
    for(let i = 0; i < notes.length; i++){
        // notes has their elements in the order of old to new
        let note = notes[i];
        const note_pos = note.note.getBoundingClientRect();

        // check if the note hit the key
        if(note.key != key){
            continue;
        }

        if(isInHitZone(key_pos, note_pos)){
            // remove all references to the note (can be garbage collected)
            note.note.remove();
            notes.splice(i, 1);

            // add score
            handleHit(key_pos, note_pos);
            hitSound.currentTime = 0;
            hitSound.play();
            return;
        }
    }
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

function handleHit(key_pos, note_pos){
    // add score
    const points = calculatePoints(key_pos, note_pos);
    updateScore(points);

    if(points > 0){
        // add combo
        incrementStat("combo");
    }
    else{
        // reset combo
        incrementStat("misses");
        resetCombo();
    }
}

let i = 1;
function calculatePoints(key_pos, note_pos){
    // calculate the score based on the distance between the note and the key
    const hit_zone = note_pos.height * 2;
    const distance = Math.abs(key_pos.y - note_pos.y);

    const perfect = hit_zone - hit_zone * 0.70;
    const excellent = hit_zone - hit_zone * 0.50;
    const good = hit_zone - hit_zone * 0.30;
    const bad = hit_zone - hit_zone * 0.10;
    // miss is everything else

    // negative means early, positive means late
    let timing = (note_pos.y - key_pos.y) / speed;
    console.log(`note ${i++}: ${timing}`);

    // check if hit timing is enabled
    if(document.getElementById("timing-display-checkbox").checked){
        hitTimingElement.innerHTML = `${(timing>0)?"+":""}${timing.toFixed(2)} ms`;
    }

    // tilted a bit into the player's favor
    if(distance <= perfect){
        hitTimingElement.className = "";
        hitTimingElement.classList.add("perfect-colour");
        incrementStat("perfect");
        updateAccuracy(100.0);
        return 100;
    }
    else if(distance <= excellent){
        hitTimingElement.className = "";
        hitTimingElement.classList.add("excellent-colour");
        incrementStat("excellent");
        updateAccuracy(67.0);
        return 67;
    }
    else if(distance < good){
        hitTimingElement.className = "";
        hitTimingElement.classList.add("good-colour");
        incrementStat("good");
        updateAccuracy(33.0);
        return 33;
    }
    else if(distance < bad){
        hitTimingElement.className = "";
        hitTimingElement.classList.add("bad-colour");
        incrementStat("bad");
        updateAccuracy(16.0);
        return 16;
    }
    else{
        hitTimingElement.className = "";
        hitTimingElement.classList.add("miss-colour");
        incrementStat("misses");
        updateAccuracy(0.0);
        return 0;
    }
}

// on key press
function keyUpHandler(e){
    switch(e.key){
        case 'd':
            setBrightness(dkey, 100);
            popElement(dkey, 1.0);
            isHold['d'] = false;
            break;
        case 'f':
            setBrightness(fkey, 100);
            popElement(fkey, 1.0);
            isHold['f'] = false;
            break;
        case 'j':
            setBrightness(jkey, 100);
            popElement(jkey, 1.0);
            isHold['j'] = false;
            break;
        case 'k':
            setBrightness(kkey, 100);
            popElement(kkey, 1.0);
            isHold['k'] = false;
            break;
        default:
            break;
    }
}

function keyDownHandler(e){
    switch(e.key){
        case 'd':
            isHold['d'] = true;
            setBrightness(dkey, 50);
            popElement(dkey, 1.1);
            hitCheck(e.key, dkey);
            break;
        case 'f':
            isHold['f'] = true;
            setBrightness(fkey, 50);
            popElement(fkey, 1.1);
            hitCheck(e.key, fkey);
            break;
        case 'j':
            isHold['j'] = true;
            setBrightness(jkey, 50);
            popElement(jkey, 1.1);
            hitCheck(e.key, jkey);
            break;
        case 'k':
            isHold['k'] = true;
            setBrightness(kkey, 50);
            popElement(kkey, 1.1);
            hitCheck(e.key, kkey);
            break;
        case ";":
            // spawn random note
            const keys = ["d", "f", "j", "k"];
            new Note(keys[Math.floor(Math.random() * keys.length)]);
            break;
        default:

            break;
    }
}