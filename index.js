// rhythm game

// key refs
let dkey;
let fkey;
let jkey;
let kkey;

let notes = []; // list of notes on screen
let song; // Audio

let map = [];
 
let combo = 0;
let maxAcc = 0;
let currAcc = 0;

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
        loadSong();
        startBackgroundLoop();
        loadMap();
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
        if(line == "") continue; // ignore empty lines
        if(line[0] == "/" && line[1] == "/") continue; // comment

        const tokens = line.split(" ");

        let time = parseInt(tokens[0]);
        let key = tokens[1];

        // wait
        let wait = time - prev_time;
        if(wait === 0){
            let prevNote = map.pop();
            let newNote = createChord(prevNote, key);
            newNote[0] = 1; // chord

            map.push(newNote);
        }
        else{
            map.push([0, wait, key]);
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
function loadSong(){
    // load song
    song = new Audio("Giorno's theme.mp3");
}

async function start(){
    // hide start button, show stats
    document.getElementById("play").style.display = "none";
    document.getElementById("game-stats").style.display = "block";

    // start the game
    await sleep(2000);
    song.play();

    for(let mapNote of map){
        const id = mapNote[0];
        const time = mapNote[1];

        switch(id){
            case 0:
                // regular note
                const key = mapNote[2];
                await sleep(time);
                new Note(key);
                break;
            case 1:
                // chord
                // mapNote[2] to mapNote[n] are keys
                await sleep(time);
                for(let i = 2; i < mapNote.length; i++){
                    const key = mapNote[i];
                    new Note(key);
                }
                break;
            default:
                // do nothing
                break;
        }
    }
}

function cleanNotes(){
    // if note is below the screen, remove it
    for(let i = 0; i < notes.length; i++){
        const note = notes[i];
        if(isOffScreen(note.note.getBoundingClientRect())){
            note.note.remove();
            notes.splice(i, 1);

            incrementStat("misses");
            updateAccuracy(0.0);
        }
        if(aboveKeys(note.note.getBoundingClientRect())){
            break;
        }
    }

    console.log("finished cleaning");
}

function keyDownHandler(e){
    // console.log(`${e.key} pressed`);
    switch(e.key){
        case 'd':
            setBrightness(dkey, 50);
            popElement(dkey, 1.1);
            hitCheck(e.key, dkey);
            break;
        case 'f':
            setBrightness(fkey, 50);
            popElement(fkey, 1.1);
            hitCheck(e.key, fkey);
            break;
        case 'j':
            setBrightness(jkey, 50);
            popElement(jkey, 1.1);
            hitCheck(e.key, jkey);
            break;
        case 'k':
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

        // this cleans up old missed notes early!
        if(isBelow(note_pos, key_pos)){
            note.note.remove();
            notes.splice(i, 1);

            incrementStat("misses");
            updateAccuracy(0.0);
            continue;
        }

        // check if the note hit the key
        if(note.key != key){
            continue;
        }

        if(isCollision(key_pos, note_pos)){
            // remove all references to the note (can be garbage collected)
            note.note.remove();
            notes.splice(i, 1);

            // add score
            handleHit(key_pos, note_pos);
            return;
        }
        else{
            note.note.remove();
            notes.splice(i, 1);

            incrementStat("misses");
            resetCombo();
            updateAccuracy(0.0);
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
    accElement.innerHTML = `${acc.toFixed(4) * 100}`;
}

function handleHit(key_pos, note_pos){
    // add score
    const points = calculatePoints(key_pos, note_pos);
    updateScore(points);

    // add combo
    incrementStat("combo");
}

function calculatePoints(key_pos, note_pos){
    // calculate the score based on the distance between the note and the key
    const key_height = note_pos.height;
    const distance = Math.abs(key_pos.y - note_pos.y);
    
    // perfect hits are n% of the key height
    const perfect = key_height - key_height * 0.80;
    const excellent = key_height - key_height * 0.60;
    const good = key_height - key_height * 0.30;
    // bad is everything else

    console.log(distance);

    if(distance < perfect){
        incrementStat("perfect");
        updateAccuracy(100.0);
        return 100;
    }
    else if(distance < excellent){
        incrementStat("excellent");
        updateAccuracy(75.0);
        return 75;
    }
    else if(distance < good){
        incrementStat("good");
        updateAccuracy(50.0);
        return 50;
    }
    else{
        incrementStat("bad");
        updateAccuracy(25.0);
        return 25;
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
    const combo_element = document.getElementById("combo");
    combo_element.innerHTML = 0;
}

// on key press
function keyUpHandler(e){
    // console.log(`${e.key} released`);
    switch(e.key){
        case 'd':
            setBrightness(dkey, 100);
            popElement(dkey, 1.0);
            break;
        case 'f':
            setBrightness(fkey, 100);
            popElement(fkey, 1.0);
            break;
        case 'j':
            setBrightness(jkey, 100);
            popElement(jkey, 1.0);
            break;
        case 'k':
            setBrightness(kkey, 100);
            popElement(kkey, 1.0);
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

function isCollision(rect1, rect2){
    return !(rect1.right < rect2.left || 
        rect1.left > rect2.right || 
        rect1.bottom < rect2.top || 
        rect1.top > rect2.bottom);
}