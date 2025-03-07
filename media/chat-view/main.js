/** @typedef {import('vscode-webview').WebviewApi} WebviewApi */
class ChatView {
  /** @type {WebviewApi} */
  vscode = acquireVsCodeApi();

  constructor() {
    this.chatScreen = document.getElementById("chat-screen");
    this.setupScreen = document.getElementById("setup-screen");
    this.chatHistoryList = document.getElementById("chat-history");
    this.agentName = document.getElementById("agent-name-header");

    /** @type {HTMLTextAreaElement} */
    // @ts-ignore - Ignored because we know its not null and its a textarea
    this.userTextArea = document.getElementById("user-message"); // textarea
    
    // Initialize state manager
    this.stateManager = new StateManager(this.vscode);
    
    // Recover the previous state
    this.state = this.stateManager.getState();
  }

  init() {
    this.#addEventListeners();
    this.#setupAutosize();
    this.#handleSetupSerenity();
    this.#handleNewChat();
    this.#setupSyntaxHighlight();
    
    // Restore Webview state
    this.#restoreState();
  }

  #addEventListeners() {
    this.userTextArea?.addEventListener(
      "keydown",
      this.#handleKeyDown.bind(this)
    );

    // Add event listeners for state restoration events
    window.addEventListener('serenity:set-screen', (e) => {
      this.#handleScreenVisibility(e.detail.screen);
    });
    
    window.addEventListener('serenity:set-agent-name', (e) => {
      this.agentName.textContent = e.detail.name;
    });
    
    window.addEventListener('serenity:clear-messages', () => {
      this.chatHistoryList.innerHTML = '';
    });
    
    window.addEventListener('serenity:render-message', (e) => {
      if (e.detail.role === 'error') {
        this.#addErrorMessage(e.detail.message);
      } else {
        this.#addMessage(e.detail.role, e.detail.message);
      }
    });
    
    window.addEventListener('serenity:highlight-syntax', () => {
      this.#applySyntaxHighlight();
    });
    
    window.addEventListener('serenity:enable-user-input', () => {
      this.userTextArea.disabled = false;
      this.userTextArea.focus();
    });

    window.addEventListener("message", (event) => {
      const data = event.data; // The json data that the extension sent
      switch (data.type) {
        case "add-message":
          this.#addMessage(data.content.role, data.content.message);
          this.stateManager.saveMessage(data.content.role, data.content.message);
          break;
        case "add-error-message":
          this.#addErrorMessage(data.content.message);
          this.stateManager.saveMessage("error", data.content.message);
          break;
        case "update-last-message":
          this.#updateLastMessage(data.content);
          this.stateManager.saveUpdatedMessage(data.content);
          break;
        case "show-screen":
          this.#handleScreenVisibility(data.content.screen);
          this.stateManager.saveScreen(data.content.screen);
          break;
        case "enable-user-input":
          this.userTextArea.disabled = false;
          break;
        case "disable-user-input":
          this.userTextArea.disabled = true;
          break;
        case "focus-user-input":
          this.userTextArea.focus();
          break;
        case "clear-messages":
          this.chatHistoryList.innerHTML = "";
          this.stateManager.clearMessages();
          break;
        case "clear-state":
          this.stateManager.clearState();
          break;
        case "set-agent-name":
          this.agentName.textContent = data.content.agentName;
          this.stateManager.saveAgentName(data.content.agentName);
          break;
        case "set-chat-id":
          this.stateManager.saveChatId(data.content.chatId);
      }
    });
  }

  #restoreState() {
    return this.stateManager.restoreState();
  }

  #handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.vscode.postMessage({
        type: "send-message",
        content: {
          message: this.userTextArea.value,
        },
      });
      this.userTextArea.value = "";
      autosize.update(this.userTextArea);
    }
  }

  async #handleSetupSerenity() {
    const setupBtn = document.getElementById("setup-serenity");
    setupBtn.addEventListener("click", async () => {
      this.vscode.postMessage({
        type: "setup-serenity",
      });
    });
  }

  async #handleNewChat() {
    const newChatBtn = document.getElementById("new-chat");
    newChatBtn.addEventListener("click", async () => {
      this.vscode.postMessage({
        type: "new-chat",
      });
    });
  }

  #handleScreenVisibility(screen) {
    switch (screen) {
      case "chat":
        this.chatScreen.classList.remove("hidden");
        this.setupScreen.classList.add("hidden");
        break;
      case "setup":
        this.chatScreen.classList.add("hidden");
        this.setupScreen.classList.remove("hidden");
        break;
    }
  }

  #addMessage(role, message = null) {
    const messageElement = document.createElement("div");
    messageElement.className = `message-box ${role}-message-box`;
    const messageContent = document.createElement("p");
    messageContent.className = `message-content`;
    messageContent.innerHTML = message;
    messageElement.appendChild(messageContent);
    this.chatHistoryList?.appendChild(messageElement);
  }

  #addErrorMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.className = "message-box error-message-box";
    const messageContent = document.createElement("p");
    messageContent.className = "message-content";
    messageContent.textContent = message;
    messageElement.appendChild(messageContent);

    this.chatHistoryList?.appendChild(messageElement);
  }

  #updateLastMessage({ isComplete, message }) {
    const lastMessage = this.chatHistoryList.lastElementChild;
    if (!lastMessage) {
      return;
    }

    const messageContent = lastMessage.querySelector(".message-content");
    if (!messageContent) {
      return;
    }

    messageContent.innerHTML = message.value;

    this.#applySyntaxHighlight();

    if (isComplete) {
      // TODO: add metadata if needed
    }
  }

  #setupAutosize() {
    autosize(this.userTextArea);
  }

  #setupSyntaxHighlight() {
    hljs.configure({
      ignoreUnescapedHTML: true,
    });
  }

  #applySyntaxHighlight() {
    document.querySelectorAll("#chat-history .bot-message-box code").forEach((block) => {
      if (block.dataset.highlighted) {return;}
      hljs.highlightElement(block);
    });
  }
}

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const chatView = new ChatView();
  chatView.init();
})();
