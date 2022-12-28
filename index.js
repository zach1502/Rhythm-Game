// rhythm game

// key refs
let dkey;
let fkey;
let jkey;
let kkey;

let notes = []; // list of notes on screen

// Audio
let song;
let hitSound;
let missSound;

let songVolumeSlider;
let songVolumeOutput;
let sfxVolumeSlider;
let sfxVolumeOutput;
let autoplayBox;
let autoplayOutput;

let map = [];
 
let combo = 0;
let maxAcc = 0;
let currAcc = 0;

let speed = (window.innerHeight / 1.4)*(1/1000);
// px per ms

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
    constructor(key){
        this.key = key;

        // create the note
        this.note = document.createElement("div");
        document.getElementById("game-area").appendChild(this.note);
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
        notes.push(this);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// on page load
window.onload = function(){
    // check for readyState
    if(document.readyState == "complete"){
        // initialize game
        attachEventHandlers();
        getKeys();
        getOptions();
        loadSounds();
        startBackgroundLoop();
        loadMap();
    }
}

function getOptions(){
    // get slider elements
    songVolumeSlider = document.getElementById("song-volume");
    songVolumeOutput = document.getElementById("song-volume-value");
    sfxVolumeSlider = document.getElementById("sfx-volume");
    sfxVolumeOutput = document.getElementById("sfx-volume-value");
    autoplayBox = document.getElementById("autoplay-checkbox");
    autoplayOutput = document.getElementById("autoplay-value");

    // set slider value
    songVolumeOutput.innerHTML = songVolumeSlider.value;
    sfxVolumeOutput.innerHTML = sfxVolumeSlider.value;

    // capitalize first letter
    let val = autoplayBox.checked;
    val = val.toString();
    val = val.charAt(0).toUpperCase() + val.slice(1);
    autoplayOutput.innerHTML = val;



    // attach listeners
    songVolumeSlider.oninput = function(){
        songVolumeOutput.innerHTML = this.value;
        song.volume = this.value / 100;
    }
    
    sfxVolumeSlider.oninput = function(){
        sfxVolumeOutput.innerHTML = this.value;
        hitSound.volume = this.value / 400; // THESE SOUNDS ARE TOO LOUD
        missSound.volume = this.value / 400;
    }

    autoplayBox.oninput = function(){
        // capitalize first letter
        let val = this.checked;
        val = val.toString();
        val = val.charAt(0).toUpperCase() + val.slice(1);
        autoplayOutput.innerHTML = val;
    }
}

function loadMap(){
    // get map from map.txt
    // parse map line by line
    // put each line into map
    
    // load from iframe
    let map_text = document.getElementById("map").contentDocument.body.innerText;
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

function startBackgroundLoop(){
    setInterval(cleanNotes, 250);
}

function attachEventHandlers(){
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
}

function getKeys(){
    // assign elements to keys
    dkey = document.querySelector('.d');
    fkey = document.querySelector('.f');
    jkey = document.querySelector('.j');
    kkey = document.querySelector('.k');
}
function loadSounds(){
    // load song
    song = new Audio("Giorno's theme.mp3");
    hitSound = new Audio("hit.wav");
    missSound = new Audio("miss.wav");

    song.volume = songVolumeSlider.value / 100;
    missSound.volume = sfxVolumeSlider.value / 400;
    hitSound.volume = sfxVolumeSlider.value / 400;
}

async function start(){
    // hide start button, show stats
    document.getElementById("play").style.visibility = "hidden";

    // Remove Key Hints
    removeKeyHints();

    // check if autoplay is checked
    if(autoplayBox.checked){
        setInterval(autoHit, 1);
    }

    // start the game
    await sleep(1000); 
    song.play();
    for(let mapNote of map){
        const id = mapNote[0];
        const time = mapNote[1];
        let key = "";

        switch(id){
            case 0:
                // regular note
                key = mapNote[2];
                await sleep(time);
                new Note(key);
                break;
            case 1:
                // chord
                // mapNote[2] to mapNote[n] are keys
                await sleep(time);
                for(let i = 2; i < mapNote.length; i++){
                    key = mapNote[i];
                    new Note(key);
                }
                break;
            case 2:
                // hold
                // mapNote[2] is the length of hold
                // mapNote[3] is the key
                await sleep(time);
                key = mapNote[2];
                new Note(key);
                break;
            default:
                // do nothing
                break;
        }
    }
}

function removeKeyHints(){
    document.getElementsByClassName("d")[0].innerHTML = "";
    document.getElementsByClassName("f")[0].innerHTML = "";
    document.getElementsByClassName("j")[0].innerHTML = "";
    document.getElementsByClassName("k")[0].innerHTML = "";
}

function cleanNotes(){
    // if note is below the screen, remove it
    let cleaned = false;
    for(let i = 0; i < notes.length; i++){
        const note = notes[i];
        if(isOffScreen(note.note.getBoundingClientRect())){
            note.note.remove();
            notes.splice(i, 1);

            cleaned = true;
            incrementStat("misses");
            updateAccuracy(0.0);
        }
        if(aboveKeys(note.note.getBoundingClientRect())){
            break;
        }
    }

    if(cleaned){
        // play once for a large amount of notes
        resetCombo();
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

function updateAccuracy(accVal){
    // get current accuracy
    maxAcc += 100.0;
    currAcc += accVal;

    // update accuracy
    const acc = currAcc / maxAcc;
    
    // update accuracy text
    const accElement = document.getElementById("accuracy");
    accElement.innerHTML = `${(acc * 100).toFixed(2)}`;
}

let fontSize = 16;
function handleHit(key_pos, note_pos){
    // add score
    const points = calculatePoints(key_pos, note_pos);
    updateScore(points);

    if(points > 0){
        // add combo
        incrementStat("combo");
        // increase #game-stats font size
        fontSize += 0.10;
        document.getElementById("game-stats").style.fontSize = `${fontSize}pt`;
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

    // update timing text
    const hit_timing = document.getElementById("hit-timing");
    hit_timing.innerHTML = `${(timing>0)?"+":""}${timing.toFixed(2)} ms`;

    // tilted a bit into the player's favor
    if(distance <= perfect){
        hit_timing.className = "";
        hit_timing.classList.add("perfect-colour");
        incrementStat("perfect");
        updateAccuracy(100.0);
        return 100;
    }
    else if(distance <= excellent){
        hit_timing.className = "";
        hit_timing.classList.add("excellent-colour");
        incrementStat("excellent");
        updateAccuracy(75.0);
        return 75;
    }
    else if(distance < good){
        hit_timing.className = "";
        hit_timing.classList.add("good-colour");
        incrementStat("good");
        updateAccuracy(50.0);
        return 50;
    }
    else if(distance < bad){
        hit_timing.className = "";
        hit_timing.classList.add("bad-colour");
        incrementStat("bad");
        updateAccuracy(25.0);
        return 25;
    }
    else{
        hit_timing.className = "";
        hit_timing.classList.add("miss-colour");
        incrementStat("misses");
        updateAccuracy(0.0);
        return 0;
    }
}

function updateScore(score){
    // update the score
    const score_element = document.getElementById("score");
    score_element.innerHTML = parseInt(score_element.innerHTML) + score;
}

function incrementStat(str){
    // update the stats
    const stats_element = document.getElementById(str);
    stats_element.innerHTML = parseInt(stats_element.innerHTML) + 1;
}

function resetCombo(){
    // reset the combo
    missSound.currentTime = 0;
    missSound.play();
    const combo_element = document.getElementById("combo");
    combo_element.innerHTML = 0;
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

function setBrightness(e, bright){
    e.style.filter = `brightness(${bright}%)`;
}

function popElement(e, size){
    e.style.transform = `scale(${size})`;
}

function isBelow(rect1, rect2){
    return rect1.top > rect2.bottom;
}

function aboveKeys(rect){
    return rect.bottom < dkey.getBoundingClientRect().top;
}

function isOffScreen(rect){
    return rect.top >= window.innerHeight;
}

function isInHitZone(key, note){
    // check if the note is within the hit zone
    // hit zone is +200% of the key height including the key
    const hit_zone = key.height << 2;
    const distance = Math.abs(key.y - note.y);
    return distance < hit_zone;
}