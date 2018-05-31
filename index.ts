import * as nipplejs from "nipplejs";
import { eOSMD } from "./locator";
import { Fraction } from 'opensheetmusicdisplay'
import * as $ from "jquery";
import * as MidiConvert from "midiconvert";
import * as Tone from "tone";
import * as m21 from "./music21j"

import './styles/osmd.scss'

// import Slider = require("bootstrap-slider");

// // slider
// let sliderContainer: HTMLElement = <HTMLElement>document.createElement("input");
// sliderContainer.id = "#chorale-selection";
// // sliderContainer.setAttribute('type', 'range')
// // sliderContainer.setAttribute('data-slider-min', '0')
// // sliderContainer.setAttribute('data-slider-min', '100')
// // sliderContainer.setAttribute('data-slider-step', '1')
// document.body.appendChild(sliderContainer);

// // let choraleIndex = $('#chorale-selection').slider().on(
// //      'slide', function() { }
// // ).data('slider')

// let slider = new Slider('#chorale-selection',
//     {
//         formatter: function(value: number): string {
//             return '' + value;
//         }
//     })

let playbutton: HTMLElement = <HTMLElement>document.createElement("button");
playbutton.textContent = "START";
playbutton.addEventListener("click", playCallback);

document.body.appendChild(playbutton);

let stopbutton: HTMLElement = <HTMLElement>document.createElement("button");
stopbutton.textContent = "STOP";
stopbutton.addEventListener("click", (event) => {
    Tone.Transport.stop();
    nowPlayingCallback(0, 0);
    playbutton.textContent = "START";
});

document.addEventListener("keydown", (event) => {
    const keyName = event.key
    switch (keyName) {
        case 'p': {playbutton.click(); break}
        case 's': {stopbutton.click(); break}
    }});

document.body.appendChild(stopbutton);

let granularitySelect : HTMLSelectElement = document.createElement("select")
granularitySelect.id = 'select-granularity'
for (const granularity of ['quarter-note', 'half-note', 'whole-note']) {
    let granularityOption = document.createElement("option");
    granularityOption.value = granularityOption.textContent = granularity;
    granularitySelect.appendChild(granularityOption)
};
function granularityOnChange(ev) {
    console.log(this.value)
    $('.notebox').removeClass('active');
    $(`.${this.value}`).addClass('active');
};
granularitySelect.addEventListener('change', granularityOnChange)
granularitySelect.value = 'whole-note'

document.body.appendChild(document.createElement("br"))
document.body.appendChild(granularitySelect)

document.body.appendChild(document.createElement("div"))

let serverUrl = 'http://0.0.0.0:5000/';
// let serverUrl = 'http://10.0.1.208:5000/';

let osmd: eOSMD;
/*
 * Create a container element for OpenSheetMusicDisplay...
 */
let osmdContainer: HTMLElement = (
    <HTMLElement>document.createElement("div"));
osmdContainer.classList.add('osmd-container')
/*
 * ... and attach it to our HTML document's body. The document itself is a HTML5
 * stub created by Webpack, so you won't find any actual .html sources.
 */
document.body.appendChild(osmdContainer);
/*
 * Create a new instance of OpenSheetMusicDisplay and tell it to draw inside
 * the container we've created in the steps before. The second parameter tells OSMD
 * not to redraw on resize.
 */
osmd = new eOSMD(osmdContainer, false);

var options = {
    zone: osmd.renderingBackend.getInnerElement(),
    color: "blue"
};
// var manager = nipplejs.create(options);
// var joystick_data: {};
// var last_click = [];
//
// manager.on('start', function(event: Event, joystick) {
//     disableChanges();
// })
//
// manager.on('end', function(event: Event, joystick) {
//     // console.log(joystick_data);
//     // console.log(osmd.boundingBoxes);
//     let clickedDiv = event.target; // FIXME
//     // console.log(clickedDiv);
//     let measureIndex = findMeasureIndex(last_click);
//     // console.log(measureIndex);
//
//     let argsGenerationUrl = ("one-measure-change" +
//         ('?measureIndex=' + measureIndex)
//     );
//     let argsMidiUrl = "get-midi";
//
//     //    url += '?choraleIndex=' + choraleIndex;
//     loadMusicXMLandMidi(serverUrl + argsGenerationUrl,
//         serverUrl + argsMidiUrl);
//     enableChanges();
// }, true);
//
// manager.on('move', function(evt, joystick) {
//     joystick_data = joystick;
//     last_click = joystick.position;
// }, true);

// uncomment the following for testing
//loadMusicXMLandAudio('musicXmlSample.xml', '');
loadMusicXMLandMidi(serverUrl + 'ex', serverUrl + 'get-midi');

function removeMusicXMLHeaderNodes(xmlDocument: XMLDocument): void{
    // Strip MusicXML document of title/composer tags
    let titleNode = xmlDocument.getElementsByTagName('work-title')[0]
    let movementTitleNode = xmlDocument.getElementsByTagName('movement-title')[0]
    let composerNode = xmlDocument.getElementsByTagName('creator')[0]

    titleNode.textContent = movementTitleNode.textContent = composerNode.textContent = ""
}

function onClickTimestampBoxFactory(timeStart: Fraction, timeEnd: Fraction) {
    const  [sixteenthnoteStart, sixteenthnoteEnd] = ([timeStart, timeEnd].map(
        timeFrac => Math.round(16 * timeFrac.RealValue)))

    const argsGenerationUrl = ("timerange-change" +
        (`?sixteenthnoteStart=${sixteenthnoteStart}&sixteenthnoteEnd=${sixteenthnoteEnd}`)
    );
    const argsMidiUrl = "get-midi";

    return (function (this, event) {
        // this.style.opacity = '0.3';
        loadMusicXMLandMidi(serverUrl + argsGenerationUrl,
            serverUrl + argsMidiUrl);
    ;})
}

function blockall(e) {
    // block propagation of events in bubbling/capturing
    e.stopPropagation();
    e.preventDefault();}

function toggleBusyClass(toggleBusy: boolean): void{
    // set
    if (toggleBusy) {
        $('.notebox').addClass('busy');
        $('.notebox').removeClass('available');
    }
    else {
        $('.notebox').removeClass('busy');
        $('.notebox').addClass('available');
    }
}

function disableChanges(): void {
    toggleBusyClass(true);
    osmdContainer.addEventListener("click", blockall, true);
}

function enableChanges(): void {
    // osmdContainer.style.opacity = '1';
    osmdContainer.removeEventListener("click", blockall, true);
    toggleBusyClass(false);
}


/**
 * Load a MusicXml file via xhttp request, and display its contents.
 */
function loadMusicXMLandMidi(urlXML: string, urlMidi: string) {
    disableChanges();
    $.get({
        url: urlXML,
        success: (xmldata: XMLDocument) => {
            removeMusicXMLHeaderNodes(xmldata);
            osmd.load(xmldata)
                .then(
                    () => {
                        osmd.render();
                        osmd.drawTimestampBoxes(onClickTimestampBoxFactory);
                        enableChanges()
                    },
                    (err) => {console.log(err); enableChanges()}
                );
            loadMidi(urlMidi);
        }
    });
}

var chorus = new Tone.Chorus(2, 1.5, 0.5).toMaster();
var reverb = new Tone.Reverb(1.5).connect(chorus);
reverb.generate();
var synth = new Tone.PolySynth(8).connect(reverb);

function playNote(time, event){
	synth.triggerAttackRelease(event.name, event.duration, time, event.velocity);
}

function nowPlayingCallback(time, step){
    $('.notebox').removeClass('playing');
    $('.notebox').filter(`[containedQuarterNotes~='${step}']`).addClass('playing');
}

// quarter-note aligned steps
var steps = [];
for (let i = 0; i < 16; i++) {   // FIXME hardcoded piece duration
    steps.push(i);
}

function loadMidi(url: string) {
    MidiConvert.load(url, function(midi) {
        Tone.Transport.cancel()  // remove all scheduled events

        // make sure you set the tempo before you schedule the events
        Tone.Transport.bpm.value = midi.header.bpm;
        Tone.Transport.timeSignature = midi.header.timeSignature;
        
        // schedule quarter-notes clock
        new Tone.Sequence(nowPlayingCallback, steps, '4n').start(0);

        for (let track of midi.tracks) {
            let notes = track.notes
            let part = new Tone.Part(playNote, notes);
            part.start(0)  // schedule events on the Tone timeline
            part.loop = true;
            part.loopEnd = '4m';  // FIXME hardcoded duration
        }
    })
}

function playCallback(){
    Tone.context.resume().then(() => {
        if (Tone.Transport.state === "started"){
            Tone.Transport.pause();
            this.textContent = "START";
        } else {
            Tone.Transport.start("+0.1");
            this.textContent = "PAUSE";
        }
    })
};

function findMeasureIndex(position): string {
    let boundingBoxes = osmd.boundingBoxes;
    let boundingBox;
    for (let measureIndex in boundingBoxes) {
        boundingBox = boundingBoxes[measureIndex];
        if (position.x <= boundingBox.xmax
            &&
            position.x >= boundingBox.xmin
            &&
            position.y <= boundingBox.ymax
            &&
            position.y >= boundingBox.ymin
        ) {
            return measureIndex;
        }
    }
    return null;
}
