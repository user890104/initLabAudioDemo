import { SineOscillator } from "./SineOscillator.js"
import { SquareOscillator } from "./SquareOscillator.js";
import { SawOscillator } from "./SawOscillator.js";

class Note {
    osc;
    _isFinished = false;
    constructor(oscillator) {
        this.osc = oscillator;
        this.sampleIndex = 0;
    }
    nextSample() {
        this.sampleIndex++;
        const envelopeValue = Math.pow(0.9999, this.sampleIndex);
        if(envelopeValue < 0.0001)
            this._isFinished = true;
        return this.osc.nextSample()*envelopeValue;
    }
    isFinished() {
        return this._isFinished;
    }
}

class DrumHit extends Note {
    frequencyStep;
    constructor(frequency, configuration) {
        const osc = new SquareOscillator(frequency, configuration)
        super(osc);
        this.frequencyStep = frequency / 10000;
    }

    nextSample() {
        this.osc.frequency -= this.frequencyStep;
        if(this.osc.frequency <= 0)
            this._isFinished = true;
        return this.osc.nextSample();
    }
}

class SnareHit extends Note {
    constructor() {
        super(null);
        this.sampleIndex = 0;
    }

    nextSample() {
        this.sampleIndex++;
        if(this.sampleIndex > 4000)
            this._isFinished = true;

        return Math.random()*2-1;
    }
}

class MyAudioProcessor extends AudioWorkletProcessor {
    configuration = null;
    notes = [];
    constructor() {
        super();

        this.port.onmessage = (e) => {
            if(e.data.name == "setConfiguration")
                this.configuration = e.data.value;
            console.log(e.data);
            //this.port.postMessage("pong");
            if(e.data.name == "playNote") {
                const osc = new (eval(this.configuration.oscillatorClass))(e.data.frequency, this.configuration);
                this.notes.push(new Note(osc));
            }
            if(e.data.name == "playDrum") {
                this.notes.push(new DrumHit(e.data.frequency, this.configuration));
            }
            if(e.data.name == "playSnare") {
                this.notes.push(new SnareHit());
            }
        };

        this.filterState = 0;
    }

    process(inputs, outputs, parameters) {
        this.removeFinishedNotes();

        const outputChannels = outputs[0];
        for (let i = 0; i < outputChannels[0].length; i++) {
            let sample = 0;
            for(const note of this.notes)
                sample += note.nextSample();
            this.filterState = sample;
            //this.filterState += (sample-this.filterState)*.009;
            for (let channel = 0; channel < outputChannels.length; channel++) {
                const outputChannel = outputChannels[channel];
                outputChannel[i] = this.filterState;
            }
        }
    
        // Keep the processor alive
        return true;
    }
    removeFinishedNotes() {
        this.notes = this.notes.filter(note => !note.isFinished())
    }
}

registerProcessor('MyAudioProcessor', MyAudioProcessor);
