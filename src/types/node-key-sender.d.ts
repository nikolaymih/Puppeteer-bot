interface KeySender {
  /**
   * Starts a batch for queuing multiple key actions.
   * @returns {KeySender} Returns the same instance for chaining additional methods.
   */
  startBatch(): KeySender;

  /**
   * Queues a single key press event in the batch.
   * @param key - The key to type (e.g., 'N', 'o', 'd', 'e').
   * @param delayMs - Optional delay in milliseconds before the key press is executed.
   * @returns {KeySender} Returns the same instance for chaining.
   */
  batchTypeKey(key: string, delayMs?: number): KeySender;

  /**
   * Queues multiple key press events in the batch.
   * @param keys - An array of keys to type (e.g., ['N', 'o', 'd', 'e']).
   * @returns {KeySender} Returns the same instance for chaining.
   */
  batchTypeKeys(keys: string[]): KeySender;

  /**
   * Queues a sequence of characters as a string in the batch.
   * @param text - The text to type (e.g., 'Node').
   * @returns {KeySender} Returns the same instance for chaining.
   */
  batchTypeText(text: string): KeySender;

  /**
   * Sends all queued actions in the batch.
   * @returns {Promise<void>} Resolves when all batched actions are completed.
   */
  sendBatch(): Promise<void>;
}

declare module 'node-key-sender' {
  const keySender: {
    startBatch(): KeySender;
    sendKey: (key: string) => Promise<void>;
    sendKeys: (keys: string[]) => Promise<void>;
    sendText: (text: string) => Promise<void>;
    sendCombination: (keys: string[]) => Promise<void>;
    releaseKey: (key: string) => Promise<void>;
    runBatch: () => Promise<void>;
  };
  export default keySender;
}