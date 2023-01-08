function startBackgroundLoop(){
    setInterval(cleanNotes, 250);
}

function attachEventHandlers(){
    // for game
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

function updateScore(score){
    // update the score
    scoreElement.innerHTML = parseInt(scoreElement.innerHTML) + score;
}

function incrementStat(str){
    const stats_element = document.getElementById(str);
    stats_element.innerHTML = parseInt(stats_element.innerHTML) + 1;
}

function zeroStat(str){
    const stats_element = document.getElementById(str);
    stats_element.innerHTML = 0;
}

function resetCombo(){
    // reset the combo
    missSound.currentTime = 0;
    missSound.play();
    comboElement.innerHTML = 0;
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
            continue;
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

function removeKeyHints(){
    document.getElementsByClassName("d")[0].innerHTML = "";
    document.getElementsByClassName("f")[0].innerHTML = "";
    document.getElementsByClassName("j")[0].innerHTML = "";
    document.getElementsByClassName("k")[0].innerHTML = "";
}

function getKeys(){
    // assign elements to keys
    dkey = document.querySelector('.d');
    fkey = document.querySelector('.f');
    jkey = document.querySelector('.j');
    kkey = document.querySelector('.k');

    dkey.addEventListener('touchstart', () => {
        keyDownHandler({key: 'd'})
    });
    dkey.addEventListener('touchend', () => {
        keyUpHandler({key: 'd'})
    });

    fkey.addEventListener('touchstart', () => {
        keyDownHandler({key: 'f'})
    });

    fkey.addEventListener('touchend', () => {
        keyUpHandler({key: 'f'})
    });

    jkey.addEventListener('touchstart', () => {
        keyDownHandler({key: 'j'})
    });

    jkey.addEventListener('touchend', () => {
        keyUpHandler({key: 'j'})
    });

    kkey.addEventListener('touchstart', () => {
        keyDownHandler({key: 'k'})
    });

    kkey.addEventListener('touchend', () => {
        keyUpHandler({key: 'k'})
    });
}

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

function updateAccuracy(accVal){
    // get current accuracy
    maxAcc += 100.0;
    currAcc += accVal;

    // update accuracy
    const acc = currAcc / maxAcc;
    
    // update accuracy text
    accuracyElement.innerHTML = `${(acc * 100).toFixed(2)}`;
}

function resetAndPauseSong(){
    song.currentTime = 0;
    song.pause();
}

function disableButtons(){
    // disable retry and stop buttons
    document.getElementById("retry").disabled = true;
    document.getElementById("stop").disabled = true;

    setTimeout(function(){
        // re-enable retry and stop buttons
        document.getElementById("retry").disabled = false;
        document.getElementById("stop").disabled = false;
    }, 500);
}

function storageAvailable(type) {
    let storage;
    try {
        storage = window[type];
        const x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch (e) {
        return e instanceof DOMException && (
            e.name === 'QuotaExceededError' ||
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            (storage && storage.length !== 0);
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

// judge
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

    // check if hit timing is enabled
    if(displayHitTimingBox.checked){
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
        updateAccuracy(75.0);
        return 75;
    }
    else if(distance < good){
        hitTimingElement.className = "";
        hitTimingElement.classList.add("good-colour");
        incrementStat("good");
        updateAccuracy(50.0);
        return 50;
    }
    else if(distance < bad){
        hitTimingElement.className = "";
        hitTimingElement.classList.add("bad-colour");
        incrementStat("bad");
        updateAccuracy(25.0);
        return 25;
    }
    else{
        hitTimingElement.className = "";
        hitTimingElement.classList.add("miss-colour");
        incrementStat("misses");
        updateAccuracy(0.0);
        return 0;
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

function turnOffFlash(){
    if(flashID != -1) {
        clearInterval(flashID);
        flashID = -1;
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