/**
 * Takes text, and synthesizes it as something similar to Animalese.
 */
class AnimaleseSynthesizer {
  /**
   * @param {AlphabetLoader} alphabetLoader The @type {AlphabetLoader} to use in retrieving character audio data.
   * @param {AudioContext} audioContext The @type {AudioContext} to use when constructing @type {AudioBuffer}s.
   */
  constructor(alphabetLoader, audioContext) {
    this.alphabetLoader = alphabetLoader;
    this.audioContext = audioContext;
  }

  /**
   * Concatenates the provided @type {AudioBuffer}s together. If the @type {AudioBuffer}s differ in number of channels, will concatenate all the contents up to the minimum channel.
   * @param {Array<AudioBuffer>} buffers The @type {AudioBuffer}s to concatenate. 
   */
  concatAudioBuffers(buffers) {
    const minNumberOfChannels = buffers
      .map(buf => buf.numberOfChannels)
      .reduce((a, b) => Math.min(a, b)); // Can only concatenate on the minimum number of channels.
    const totalDuration = buffers
      .map(buf => buf.duration)
      .reduce((a, b) => a + b); // The combined duration of each buffer.
    const megaBuffer = this.audioContext.createBuffer(
      minNumberOfChannels,
      this.audioContext.sampleRate * totalDuration,
      this.audioContext.sampleRate
    );

    for (let channelIdx = 0; channelIdx < minNumberOfChannels; ++channelIdx) {
      let dataIdx = 0;
      for (const buffer of buffers) {
        megaBuffer.copyToChannel(
          buffer.getChannelData(channelIdx),
          channelIdx,
          dataIdx
        ); // Copy the contents of this buffer's channel at this offset to the mega buffer.
        dataIdx += buffer.length;
      }
    }
    return megaBuffer;
  }

  /**
   * Generates an @type {AudioBuffer} containing an Animalese facsimile for the given text.
   * @param {string} text The text to create Animalese audio for
   * @param {number} pitch The pitch at which the audio should be generated.
   */
  generateAnimaleseFor(text, pitch) {
    const buffers = [];
    for (const char of text) {
      buffers.push(this.alphabetLoader.getCharacterAudio(char, pitch));
    }
    return this.concatAudioBuffers(buffers);
  }
}
