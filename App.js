import { AudioThreadManager } from "./AudioThreadManager.js";

class Configuration {
    filterCutoff = 1;
    oscillatorClassName = "SineOscillator";
    filterClassName = "ExpLowPassFilter"
    sampleRate;
}

// https://stackoverflow.com/questions/951021
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class App {
    audioThreadRunning = false;
    audioThreadManager = new AudioThreadManager();
    configuration = new Configuration();

    constructor() {
        document.getElementById("filterCutoff").oninput = (e) => {
            this.configuration.filterCutoff = Number(e.target.value);
            console.log("slider val = ", e.target.value)
            this.onConfigurationChanged();
        };

        document.getElementById("oscillatorSelection").onchange = (e) => {
            this.configuration.oscillatorClassName = e.target.value;
            this.onConfigurationChanged();
        };
        document.getElementById("filterSelection").onchange = (e) => {
            this.configuration.filterClassName = e.target.value;
            this.onConfigurationChanged();
        };

        document.addEventListener("keydown", async (e) => {
            if(e.key == " ") {
                if(!this.audioThreadRunning) {
                    await this.audioThreadManager.launchThread();
                    this.configuration.sampleRate = this.audioThreadManager.sampleRate();
                    this.onConfigurationChanged();
                
                    this.audioThreadRunning = true;

                    this.runDrumLoop();
                    console.log("launched")
                }
            }
            const noteIndex = this.characterToNoteIndex(e.key)
            if(noteIndex != null) {
                const powerBase = Math.pow(2, 1/12);
                this.audioThreadManager.postMessage({
                    name: "playNote",
                    frequency: 440 * Math.pow(powerBase, noteIndex)
                });
            }
        });
    }

    sendDrum(frequency) {
        this.audioThreadManager.postMessage({
            name: "playDrum",
            frequency: frequency
        });
    }

    async runDrumLoop() {
        while(true) {
            this.sendDrum(120);
            await sleep(500);
            this.audioThreadManager.postMessage({
                name: "playSnare",
            });
            await sleep(500);
            this.sendDrum(120);
            await sleep(500);
            this.audioThreadManager.postMessage({
                name: "playSnare",
            });
            await sleep(500);
        }
    }
    
    onConfigurationChanged() {
        this.audioThreadManager.postMessage({
            name: "setConfiguration",
            value: this.configuration
        });
    }

    characterToNoteIndex(char) {
        const mapping = {
            z: 0,
            s: 1,
            x: 2,
            d: 3,
            c: 4,
            v: 5,
            g: 6,
            b: 7,
            h: 8,
            n: 9,
            j: 10,
            m: 11,
            ",": 12,
            l: 13,
            ".": 14,
            ";": 15,
            "/": 16
        };
        if(char in mapping) {
            return mapping[char];
        }
        return null;
    }
}
