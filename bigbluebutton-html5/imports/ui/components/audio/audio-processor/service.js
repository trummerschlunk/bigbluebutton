import { getSettingsSingletonInstance } from '/imports/ui/services/settings';

// store loaded wasm files so we can download in parallel
// but only resolve the load Promise after we fetch everything
const loadedFiles = {};
let workletFileLoaded = false;

// Whether the worklet module has fully loaded, requires user interaction
let workletModuleLoaded = false;

// Callback in case we need the worklet module but it is not loaded yet
let workletModuleLoadCb = null;

// global audio context used for the worklet
let audioContext = null;

// global function for testing purposes
let audioProcessorForTesting = null; // TESTING global access, remove this later
window.set_wasm_enabled = function(enable) {
    audioProcessorForTesting.port.postMessage({type: 'enable', enable: enable});
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
    if (! isWasmProcessingEnabled()) {
        return stream;
    }

    const contextSource = audioContext.createMediaStreamSource(stream);
    const contextDestination = audioContext.createMediaStreamDestination();

    const createProcessorFn = () => {
        const opts = {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            channels: 1,
        };
        audioProcessor = new AudioWorkletNode(audioContext, 'mapi-proc', opts);
        audioProcessor.port.postMessage({ type: 'init', ...loadedFiles });

        contextSource.connect(audioProcessor);
        audioProcessor.connect(contextDestination);

        audioProcessorForTesting = audioProcessor;
    };

    if (workletModuleLoaded) {
        createProcessorFn();
    } else {
        workletModuleLoadCb = createProcessorFn;
    }

    console.log("---------------------------------------------------------------- createWasmProcessorStream ok!");
    return contextDestination.stream;
};

// load processor files, trigger Promise resolve when all done
const loadWasmProcessor = () => {
    return new Promise((resolve, reject) => {
        if (typeof(WebAssembly) === 'undefined') {
            reject('WASM processing is not available');
            return;
        }

        const checkResolved = () => {
            if (loadedFiles.js && loadedFiles.wasm && workletFileLoaded) {
                resolve(true);
                return true;
            }
            return false;
        };
        console.log("---------------------------------- loadWasmProcessor start");

        // return early if already loaded before
        if (checkResolved()) {
            console.log("---------------------------------- loadWasmProcessor end early");
            return;
        }

        // create audio context if needed
        if (!audioContext) {
            audioContext = new AudioContext();
        }

        // load audio worklet
        fetch('/html5client/wasm/mapi-proc.js').then(function(resp) {
            resp.text().then(function(text) {
                // NOTE it's not quite loaded yet,
                // but we cannot wait for `audioWorklet.addModule` as that requires use interaction
                workletFileLoaded = true;
                checkResolved();

                // function to load audio worklet
                const loadAudioWorklet = () => {
                    // some browsers fail to add worklet module, force things here
                    // see https://stackoverflow.com/questions/52760219/use-audioworklet-within-electron-domexception-the-user-aborted-a-request/
                    const processorBlob = new Blob([text], { type: 'text/javascript' });
                    const processorURL = URL.createObjectURL(processorBlob);
                    audioContext.audioWorklet.addModule(processorURL);
                    workletModuleLoaded = true;
                    if (workletModuleLoadCb) {
                        workletModuleLoadCb();
                        workletModuleLoadCb = null;
                    }
                };

                // can't load worklet while audio context is suspended
                // resuming audio context requires user interaction
                if (audioContext.state === 'suspended') {
                    const resume = () => {
                        console.log("---------------------------------- clicked document, trying to resume audio context");
                        audioContext.resume().then(loadAudioWorklet).catch(reject);
                        document.removeEventListener('click', resume);
                    };
                    document.addEventListener('click', resume);
                } else {
                    loadAudioWorklet();
                }
            }).catch(reject);
        }).catch(reject);

        // load wasm files
        fetch('/html5client/wasm/BBBA-mapi.wasm').then(function(resp) {
            resp.arrayBuffer().then(function(bytes) {
                loadedFiles.wasm = bytes;
                checkResolved();
            }).catch(reject);
        }).catch(reject);
        fetch('/html5client/wasm/BBBA-mapi.js').then(function(resp) {
            resp.text().then(function(text) {
                loadedFiles.js = text;
                checkResolved();
            }).catch(reject);
        }).catch(reject);

        console.log("---------------------------------- loadWasmProcessor end");
    });
};

export {
    createWasmProcessorStream,
    loadWasmProcessor,
};
