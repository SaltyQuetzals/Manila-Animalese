export class AnimaleseSynthesizer {
  /**
   * Creates a synthesizer for Animalese text that allows audio to be generated from text.
   */
  constructor(alphabetLoader, audioContext) {
    this.alphabetLoader = alphabetLoader;
    this.audioContext = audioContext;
  }

  /**
   * Concatenates the provided `AudioBuffer`s together. If the `AudioBuffer`s differ in number of channels, will concatenate all the contents up to the minimum channel.
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
   */
  generateAnimaleseFor(text, pitch) {
    const buffers = [];
    for (const char of text) {
      buffers.push(this.alphabetLoader.getCharacterAudio(char, pitch));
    }
    return this.concatAudioBuffers(buffers);
  }
}
