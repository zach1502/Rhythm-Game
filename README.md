# Rhythm Game
~~I don't have a name for it so a generic name will do for now.~~

## Notes About Device Support
Mobile and other keyboard-less devices are completely unsupported.

## How to Play
Play Here! https://zach1502.github.io/Rhythm-Game/

1. Tap corresponding keys on your keyboard to the beat of the music.
2. The Keys are as follows:
    * `D` - Far Left
    * `F` - Left
    * `J` - Right
    * `K` - Far Right
3. The game will start when you hit the `Play` button.
4. You may choose to enable Autoplay to let the game play itself.

## Want to Help Develop?
Thank You for the interest! Here's how to do it:

`git clone https://github.com/zach1502/Rhythm-Game.git`

`cd Rhythm-Game`

`npm install`

`npm test`

Then go to one of the IP addresses listed in the console.

## How to Customize Songs
Currently, it is a little bit janky.

Replace the value of `songFile` in `index.js` with the path to the song you want to play.

Change the contents of map.txt to the map you want to play.

## Mapping documentation

### To create a note:

`note <time> <key>`
* `<time>` is the time in miliseconds (ms) that the note will **spawn**.
* `<key>` is the key that the note will be on. The keys are as follows:
    * `d` - Far Left
    * `f` - Left
    * `j` - Right
    * `k` - Far Right
Multiple notes may be created at the same time, they will be automatically converted to chords.
Notes must be in chronological order.

### To create a flashing effect:

`flash <frequency> <initial delay>`
This will toggle the flashing effect.
* `<frequency>` is the frequency of the flashing effect relative to the song's BPM.
* `<initial delay>` is the time delay in miliseconds (ms) before the flashing effect will start.

### To toggle rainbow notes:

`effect`

This will convert all notes to rainbow notes.
Nothing special about them, except that they're rainbow.

### To signal an end to the song:

`end`

This will signal the end of the song.
An applause will play.

## Credits
Hit and Miss Sounds are from Osu!

Demo Song is Il Vento d'Oro by Yugo Kanno

Applause Sound is from https://www.youtube.com/watch?v=DpQpf71sY6I

Assets used under Fair Dealing for Educational and Private Study purposes
