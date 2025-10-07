import { getSettingsSingletonInstance } from '/imports/ui/services/settings';

// globals, assigned during loadWasmProcessor
const loadedFiles = {
    bbba: {},
    renooice: {},
};
let workletLoaded = false;

// global audio context needed for worklet
let audioContext = null;

// global function for testing purposes
let audioProcessorForTesting = null; // TESTING global access, remove this later
window.set_wasm_enabled = function(module, enabled) {
    audioProcessorForTesting.port.postMessage({type: 'enabled', module: module, enabled: enabled});
}
window.set_wasm_param = function(index, value) {
    audioProcessorForTesting.port.postMessage({type: 'param', index: index, value: value});
}

// check if wasm processing is enabled
const isWasmProcessingEnabled = () => {
    const Settings = getSettingsSingletonInstance();
    if (typeof(Settings.application.audioWasmProcessing) !== 'undefined') {
        return Settings.application.audioWasmProcessing;
    }
    if (typeof(window.meetingClientSettings.public.app.defaultSettings.application.audioWasmProcessing) !== 'undefined') {
        return window.meetingClientSettings.public.app.defaultSettings.application.audioWasmProcessing;
    }
    return true;
};

// create an audio processor on top of a stream, returns a processed stream
const createWasmProcessorStream = (stream) => {
    const contextSource = audioContext.createMediaStreamSource(stream);
    const contextDestination = audioContext.createMediaStreamDestination();

    const audioProcessorOptions = {
        numberOfInputs: 1,
        numberOfOutputs: 1,
    };
    const audioProcessor = new AudioWorkletNode(audioContext, 'mapi-proc', audioProcessorOptions);
    audioProcessor.port.postMessage({ type: 'init', ...loadedFiles });
    // audioProcessor.port.postMessage({type: 'param', index: 9, value: isWasmProcessingEnabled() ? 0.0 : 1.0 });

    contextSource.connect(audioProcessor);
    audioProcessor.connect(contextDestination);

    audioProcessorForTesting = audioProcessor;

    console.log("---------------------------------------------------------------- createWasmProcessorStream ok!");
    return contextDestination.stream;
};

// load processor files, trigger Promise resolve when all done
const loadWasmProcessor = () => {
    return new Promise((resolve, reject) => {
        const checkResolved = () => {
            if (loadedFiles.bbba.js && loadedFiles.bbba.wasm &&
                loadedFiles.renooice.js && loadedFiles.renooice.wasm && workletLoaded) {
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

        // load wasm files
        const loadWasmFiles = (basename, prop) => {
            fetch('/html5client/wasm/' + basename + '-mapi.wasm').then(function(resp) {
                resp.arrayBuffer().then(function(bytes) {
                    loadedFiles[prop].wasm = bytes;
                    checkResolved();
                }).catch(function(error) {
                    reject(error);
                });
            }).catch(function(error) {
                reject(error);
            });
            fetch('/html5client/wasm/' + basename + '-mapi.js').then(function(resp) {
                resp.text().then(function(text) {
                    loadedFiles[prop].js = text;
                    checkResolved();
                }).catch(function(error) {
                    reject(error);
                });
            }).catch(function(error) {
                reject(error);
            });
        };
        loadWasmFiles('BBBA', 'bbba');
        loadWasmFiles('ReNooice', 'renooice');
    });
};

export {
    createWasmProcessorStream,
    loadWasmProcessor,
};
