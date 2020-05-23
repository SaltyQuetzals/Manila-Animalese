class AlphabetLoader {
  static SILENCE = 0;
  static INITIAL_OFFSET = 44;
  static LOWEST_PITCH = 0.2;
  static HIGHEST_PITCH = 1.0;


  constructor(
    wavFilepath,
    wavSecondsPerLetter,
    outputSecondsPerLetter,
    audioContext
  ) {
    this.wavFilepath = wavFilepath;
    this.wavSecondsPerLetter = wavSecondsPerLetter;
    this.outputSecondsPerLetter = outputSecondsPerLetter;
    this.audioContext = audioContext;
  }

  /**
   * Fetches the provided WAV file from the server.
   */
  async fetchAlphabetBuffer() {
    const response = await fetch(this.wavFilepath, { mode: "no-cors" });
    console.log(response);
    const audioData = await response.arrayBuffer();
    console.log(audioData);
    const audioBuffer = await this.audioContext.decodeAudioData(audioData);
    this.alphabetBuffer = audioBuffer;
  }

  /**
   * Ensures that the alphabet buffer has been loaded into memory.
   */
  ensureAlphabetBufferExists() {
    if (this.alphabetBuffer === undefined) {
      throw new Error(
        'The alphabetBuffer buffer has not been created. Please call "fetchAlphabetBuffer" before calling this function.'
      );
    }
  }

  /**
   * Because the WAV file is expected to be in alphabetical order, calculates the offset for the given alphabetical character within the file.
   */
  calculateStartingOffset(char) {
    this.ensureAlphabetBufferExists();
    const charOffset = char.charCodeAt(0) - 'A'.charCodeAt(0); // The character is "charOffset" letters away from "A"
    const wavSamplesPerLetter =
      this.alphabetBuffer.sampleRate * this.wavSecondsPerLetter; // There are "wavSamplesPerLetter" for each letter
    return wavSamplesPerLetter * charOffset; // Thus, the initial offset will be "charOffset" * "wavSamplesPerLetter".
  }

  /**
   * Ensures that the provided pitch is between LOWEST_PITCH and HIGHEST_PITCH.
   */
  ensurePitchInbounds(pitch) {
    if (
      pitch < AlphabetLoader.LOWEST_PITCH ||
      pitch > AlphabetLoader.HIGHEST_PITCH
    ) {
      throw new RangeError(
        `The pitch is out of bounds. Must be between ${AlphabetLoader.LOWEST_PITCH} and ${AlphabetLoader.HIGHEST_PITCH}`
      );
    }
  }

  /**
   * Takes a slice of the loaded alphabet audiobuffer at a certain character. If the character is not alphabetic (punctuation, numeric), returns silence.
   */
  createAudioBufferForChar(char, pitch) {
    this.ensureAlphabetBufferExists();
    const charFrameCount = Math.floor(
      this.alphabetBuffer.sampleRate * this.outputSecondsPerLetter
    );
    const charAudioBuffer = this.audioContext.createBuffer(
      this.alphabetBuffer.numberOfChannels,
      charFrameCount,
      this.alphabetBuffer.sampleRate
    );
    if (char < 'A' || char > 'Z') {
      // We can't say this character, return a silent buffer (filled with zeros).
      for (
        let channelIdx = 0;
        channelIdx < charAudioBuffer.numberOfChannels;
        ++channelIdx
      ) {
        const channelBuffer = charAudioBuffer.getChannelData(channelIdx);
        channelBuffer.fill(AlphabetLoader.SILENCE);
      }
      return charAudioBuffer;
    }
    const startOffset = this.calculateStartingOffset(char);
    for (
      let channel = 0;
      channel < charAudioBuffer.numberOfChannels;
      ++channel
    ) {
      const channelBuffer = charAudioBuffer.getChannelData(channel);
      const wavChannelArrayBuffer = this.alphabetBuffer.getChannelData(channel);
      // Copy the information from the WAV channel into this channel
      for (let i = 0; i < charFrameCount; ++i) {
        channelBuffer[i] =
          wavChannelArrayBuffer[
          AlphabetLoader.INITIAL_OFFSET + startOffset + Math.floor(i * pitch)
          ];
      }
    }
    return charAudioBuffer;
  }

  /**
   * Retrieves the sound data for a specific character.
   * @param {string} char The character to retrieve sound data for.
   * @param {number} pitch The pitch to use when copying audio data.
   */
  getCharacterAudio(char, pitch) {
    this.ensureAlphabetBufferExists();
    if (char.length > 1) {
      throw new Error(
        `Expected a single character, instead got ${char} (length ${char.length})`
      );
    }
    char = char.toUpperCase();

    return this.createAudioBufferForChar(char, pitch);
  }
}
