import { getSettingsSingletonInstance } from '/imports/ui/services/settings';

// globals, assigned during loadWasmProcessor
let moduleJs = null;
let moduleWasm = null;
let workletLoaded = false;

// global audio context needed for worklet
let audioContext = null;

// global function for testing purposes
let audioProcessorForTesting = null; // TESTING global access, remove this later
window.set_wasm_param = function(index, value) {
    audioProcessorForTesting.port.postMessage({type: 'param', index: index, value: value});
}

// check if wasm processing is enabled
const isWasmProcessingEnabled = () => {
    const Settings = getSettingsSingletonInstance();
    if (typeof(Settings.application.audioWasmProcessing) !== 'undefined') {
        console.log("---------------------------------- Settings.application.audioWasmProcessing", Settings.application.audioWasmProcessing);
        return Settings.application.audioWasmProcessing;
    }
    if (typeof(window.meetingClientSettings.public.app.defaultSettings.application.audioWasmProcessing) !== 'undefined') {
        console.log("---------------------------------- window.meetingClientSettings.public.app.defaultSettings.application.audioWasmProcessing", window.meetingClientSettings.public.app.defaultSettings.application.audioWasmProcessing);
        return window.meetingClientSettings.public.app.defaultSettings.application.audioWasmProcessing;
    }
    console.log("---------------------------------- isWasmProcessingEnabled default true");
    return true;
};

// create an audio processor on top of a stream, returns a processed stream
const createWasmProcessorStream = (stream) => {
    const sourceContext = audioContext.createMediaStreamSource(stream);
    const contextDestination = audioContext.createMediaStreamDestination();

    const options = {
        numberOfInputs: sourceContext.channelCount,
        // numberOfOutputs: sourceContext.channelCount,
        // outputChannelCount: [],
    };
    // for (let i = 0; i < sourceContext.channelCount; ++i) {
    //     options.outputChannelCount.push(sourceContext.channelCount);
    // }

    const audioProcessor = new AudioWorkletNode(audioContext, 'mapi-proc', options);
    audioProcessor.port.postMessage({type: 'init', js: moduleJs, wasm: moduleWasm});
    audioProcessor.port.postMessage({type: 'param', index: 9, value: isWasmProcessingEnabled() ? 0.0 : 1.0 });

    sourceContext.connect(audioProcessor);
    audioProcessor.connect(contextDestination);

    audioProcessorForTesting = audioProcessor;

    console.log("---------------------------------------------------------------- createWasmProcessorStream ok!");
    return contextDestination.stream;
};

// load processor files, trigger Promise resolve when all done
const loadWasmProcessor = () => {
    return new Promise((resolve, reject) => {
        const checkResolved = () => {
            if (moduleJs && moduleWasm && workletLoaded) {
                resolve(true);
                return true;
            }
            return false;
        };

        // return early if already loaded before
        if (checkResolved()) {
            return;
        }

        // create audio context if needed
        if (!audioContext) {
            audioContext = new AudioContext();
        }

        // load audio worklet
        audioContext.audioWorklet.addModule('/html5client/wasm/mapi-proc.js').then(function() {
            workletLoaded = true;
            checkResolved();
        }).catch(function(error) {
            reject(error);
        });

        // load mapi js
        fetch('/html5client/wasm/BBBA-mapi.js').then(function(resp) {
            resp.text().then(function(text) {
                moduleJs = text;
                checkResolved();
            }).catch(function(error) {
                reject(error);
            });
        }).catch(function(error) {
            reject(error);
        });

        // load mapi wasm
        fetch('/html5client/wasm/BBBA-mapi.wasm').then(function(resp) {
            resp.arrayBuffer().then(function(bytes) {
                moduleWasm = bytes;
                checkResolved();
            }).catch(function(error) {
                reject(error);
            });
        }).catch(function(error) {
            reject(error);
        });
    });
};

export {
    createWasmProcessorStream,
    loadWasmProcessor,
};
