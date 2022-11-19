// rhythm game

// key refs
let dkey;
let fkey;
let jkey;
let kkey;

let notes = []; // list of notes
let song; // Audio

// generic Note Class
class Note{
    /*
     * @param {string} key - key to check
     */
    constructor(key){
        this.key = key;
        this.hit = false;

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
        //loadMap();

        const note = new Note("d");
    }
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

function start(){
    // start the game
    song.play();
}

function cleanNotes(){
    // if note is below the screen, remove it
    for(let note of notes){
        let y = parseInt(note.style.top);
        note.style.top = y + 5 + 'px';
        if(y > 500){
            note.remove();
        }
    }
}

function keyDownHandler(e){
    // console.log(`${e.key} pressed`);
    switch(e.key){
        case 'd':
            setBrightness(dkey, 50);
            popElement(dkey, 1.1);
            hitCheck(dkey);
            break;
        case 'f':
            setBrightness(fkey, 50);
            popElement(fkey, 1.1);
            hitCheck(fkey);
            break;
        case 'j':
            setBrightness(jkey, 50);
            popElement(jkey, 1.1);
            hitCheck(jkey);
            break;
        case 'k':
            setBrightness(kkey, 50);
            popElement(kkey, 1.1);
            hitCheck(kkey);
            break;
        case ";":
            // spawn note
            new Note();
            break;
        default:
            break;
    }
}

function hitCheck(key){
    const key_pos = key.getBoundingClientRect();

    // for all notes, check if the key collides with the note
    for(let i = 0; i < notes.length; i++){
        let note = notes[i];
        const note_pos = note.note.getBoundingClientRect();

        if(isCollision(key_pos, note_pos)){
            note.note.remove();
            notes.splice(i, 1);
            console.log("hit");
        }
        else{
            console.log("miss");
        }
    }
}

function isCollision(rect1, rect2){
    return !(rect1.right < rect2.left || 
        rect1.left > rect2.right || 
        rect1.bottom < rect2.top || 
        rect1.top > rect2.bottom);
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
