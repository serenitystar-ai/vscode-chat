/** @typedef {import('vscode-webview').WebviewApi} WebviewApi */

class StateManager {
  /** @type {WebviewApi} */
  #vscode;

  /**
   * @param {WebviewApi} vscode - The VS Code API instance
   */
  constructor(vscode) {
    this.#vscode = vscode;
  }

  /**
   * Get the current state from the webview
   * @returns {Object} The current state
   */
  getState() {
    return (
      this.#vscode.getState() || {
        currentScreen: "setup",
        messages: [],
        agentName: "",
        chatId: null,
      }
    );
  }

  /**
   * Save screen state
   * @param {string} screen - The screen to display
   */
  saveScreen(screen) {
    const state = this.getState();
    this.#vscode.setState({ ...state, currentScreen: screen });
  }

  /**
   * Save a message to state
   * @param {string} role - The role of the message sender
   * @param {string} message - The message content
   */
  saveMessage(role, message) {
    const state = this.getState();
    state.messages = state.messages || [];
    state.messages.push({ role, message });
    this.#vscode.setState(state);
  }

  /**
   * Update the last message in state
   * @param {Object} content - The updated content
   */
  saveUpdatedMessage(content) {
    const state = this.getState();
    if (state.messages && state.messages.length > 0) {
      state.messages[state.messages.length - 1].message = content.message.value;
      state.messages[state.messages.length - 1].isComplete = content.isComplete;
      this.#vscode.setState(state);
    }
  }

  /**
   * Clear all messages from state
   */
  clearMessages() {
    const state = this.getState();
    state.messages = [];
    this.#vscode.setState(state);
  }

  /**
   * Save agent name to state
   * @param {string} name - The agent name
   */
  saveAgentName(name) {
    const state = this.getState();
    this.#vscode.setState({ ...state, agentName: name });
  }

  /**
   * Save chat ID to state
   * @param {string} chatId - The chat ID
   */
  saveChatId(chatId) {
    const state = this.getState();
    this.#vscode.setState({ ...state, chatId });
  }

  /**
   * Clear the entire state
   */
  clearState() {
    this.#vscode.setState({});
  }

  /**
   * Restore the state and emit events for UI updates
   *
   * @returns {boolean} True if state was restored, false if new chat was requested
   */
  restoreState() {
    // Notify the extension that the webview is visible
    this.#vscode.postMessage({
      type: "webview-became-visible",
    });

    const state = this.getState();
    if (this.#isEmptyState()) {
      this.#vscode.postMessage({
        type: "new-chat",
      });
      return false;
    }

    // Emit events to restore UI state

    // Restore current screen
    if (state.currentScreen) {
      window.dispatchEvent(
        new CustomEvent("serenity:set-screen", {
          detail: { screen: state.currentScreen },
        })
      );
    }

    // Restore agent name
    if (state.agentName) {
      window.dispatchEvent(
        new CustomEvent("serenity:set-agent-name", {
          detail: { name: state.agentName },
        })
      );
    }

    // Restore chat id
    if (state.chatId) {
      this.#vscode.postMessage({
        type: "set-chat-id",
        content: { chatId: state.chatId },
      });
    }

    // Restore messages
    if (state.messages && state.messages.length > 0) {
      window.dispatchEvent(new CustomEvent("serenity:clear-messages"));

      state.messages.forEach((msg) => {
        window.dispatchEvent(
          new CustomEvent("serenity:render-message", {
            detail: { role: msg.role, message: msg.message },
          })
        );
      });

      window.dispatchEvent(new CustomEvent("serenity:highlight-syntax"));
    }

    window.dispatchEvent(new CustomEvent("serenity:enable-user-input"));

    return true;
  }


  #isEmptyState() {
    const state = this.getState();
    return (
      !state ||
      Object.keys(state).length === 0 ||
      (state.currentScreen === "setup" &&
        state.agentName === "" &&
        state.messages.length === 0,
      state.chatId === null)
    );
  }
}

// Export for use in main.js
window.StateManager = StateManager;
