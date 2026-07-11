# Utilities Directory (`client/src/utils/`)

This directory houses the client-side helper scripts and utility functions.

## Purpose
Maintains helper scripts that implement standalone formatting, math, or device buffer conversions.

## Responsibilities
* **Audio Buffer Processing**: Converts live voice micro-buffers between Float32 (web standard) and Int16 PCM (Gemini Live standard).
* **Binary Encoding Helpers**: Offers base64 to byte-array transformations to support streaming data transfer.

## Dependencies
* Uses standard browser Web Audio API definitions.

## Important Files
* [audioUtils.js](file:///d:/campus_media/client/src/utils/audioUtils.js): Hosts audio formatting and normalization algorithms.

## Important Classes / Functions
* `base64ToUint8Array(base64)`: Conversions supporting model responses.
* `arrayBufferToBase64(buffer)`: Formats mic arrays into serializable text data.
* `decodeAudioData(data, ctx)`: Transposes model PCM frames into web playback structures.
* `float32ToInt16(float32Array)`: Compresses float data for streaming.

## Used By
* Exclusively imported by [MockInterview.jsx](file:///d:/campus_media/client/src/pages/MockInterview.jsx) to coordinate live voice exchanges.

## Future Improvements
* Refactor converters to utilize modern Web Assembly scripts to accelerate large sound buffer processing.
* Incorporate noise reduction filters directly inside microphone capture flows.

## Common Errors
* **Audio Underflow / Clicks**: Caused by network jitter and delay in buffer playback loops. Handled by tracking audio node scheduling times.
