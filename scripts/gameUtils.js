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