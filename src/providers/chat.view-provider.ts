import * as vscode from "vscode";
import { SerenityChatService } from "../serenity/serenity-chat.service";
import * as path from "path";
import * as fs from "fs";
import { checkSetupComplete, getApiConfiguration } from "../configuration";
import { commands, window } from "vscode";
import constants from "../constants";
import { AgentItemRes } from "../serenity/types";

export class ChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  private serenity?: SerenityChatService;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "send-message": {
          this.sendMessage(data.content);
          break;
        }
        case "setup-serenity": {
          const completed = await commands.executeCommand<boolean>(
            constants.commands.setup
          );
          completed && (await this.restartConversation());
          break;
        }
        case "new-chat": {
          await commands.executeCommand(constants.commands["new-chat"]);
          break;
        }
        case "set-chat-id": {
          this.serenity?.setChatId(data.content.chatId);
          break;
        }
      }
    });

    this.serenity = new SerenityChatService();
    this.handleSSEEvents();

    const isSetupComplete = await checkSetupComplete();

    if (!isSetupComplete) {
      this._view.webview.postMessage({
        type: "show-screen",
        content: {
          screen: "setup",
        },
      });
      this._view.webview.postMessage({
        type: "clear-state"
      });
    
      const selection = await window.showWarningMessage(
        "Please, complete the setup to continue using Serenity* Star",
        "Setup",
        "Cancel"
      );

      if (selection === "Setup") {
        // trigger setup command
        const completed = await commands.executeCommand<boolean>(constants.commands.setup);
        completed && (await this.restartConversation());
        return;
      } 
    }
  }

  async restartConversation() {
    this._view?.webview.postMessage({
      type: "clear-messages",
    });
    await this.initConversation();
  }

  private async initConversation() {
    if (!this.serenity) {
      return;
    }

    try {
      const response = await this.serenity.initConversation();
      this._view?.webview.postMessage({
        type: "set-agent-name",
        content: {
          agentName: getApiConfiguration().agents.active,
        },
      });
      this._view?.webview.postMessage({
        type: "add-message",
        content: {
          role: "bot",
          message: response.content,
        },
      });
      this._view?.webview.postMessage({
        type: "show-screen",
        content: {
          screen: "chat",
        },
      });
      this._view?.webview.postMessage({
        type: "enable-user-input",
      });
      this._view?.webview.postMessage({
        type: "focus-user-input",
      });
    } catch (error) {
      this._view?.webview.postMessage({
        type: "show-screen",
        content: {
          screen: "chat",
        },
      });
      this._view?.webview.postMessage({
        type: "add-error-message",
        content: {
          message: "There was an error initializing the conversation.",
        },
      });
    }
  }

  async sendMessage(data: { message: string }) {
    if (!this.serenity) {
      return;
    }

    try {
      this._view?.webview.postMessage({
        type: "disable-user-input",
      });
      this._view?.webview.postMessage({
        type: "add-message",
        content: {
          role: "user",
          message: data.message,
        },
      });
      await this.serenity.executeAgent({
        message: data.message,
      });
    } catch (error) {
      this._view?.webview.postMessage({
        type: "add-error-message",
        content: {
          message: "There was an error sending the message.",
        },
      });
    }
  }

  async getAgents(): Promise<AgentItemRes[]> {
    if (!this.serenity) {
      return [];
    }

    const result = await this.serenity.getAgents();
    return result;
  }

  private handleSSEEvents() {
    if (!this.serenity) {
      return;
    }
    const _self = this;

    this.serenity
      .on("sse-start", () => {
        _self._view?.webview.postMessage({
          type: "add-message",
          content: {
            role: "bot",
          },
        });
      })
      .on("sse-error", (data) => {
        _self._view?.webview.postMessage({
          type: "add-error-message",
          content: {
            message: data.message,
          },
        });
      })
      .on("sse-content", (message, isComplete) => {
        _self._view?.webview.postMessage({
          type: "update-last-message",
          content: {
            message: message,
            isComplete: isComplete,
          },
        });

        if (isComplete) {
          this._view?.webview.postMessage({
            type: "enable-user-input",
          });
          this._view?.webview.postMessage({
            type: "focus-user-input",
          });
        }
      })
      .on("new-chat-id", (chatId) => {
        this._view?.webview.postMessage({
          type: "set-chat-id",
          content: {
            chatId,
          },
        });
      });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const mainScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "chat-view", "main.js")
    );

    const stateManagerScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "chat-view", "state-manager.js")
    );

    // Do the same for the stylesheet.
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "chat-view", "main.css")
    );
    const highlightStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        "chat-view",
        "highlight.css"
      )
    );

    const autosizeScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        "chat-view",
        "autosize.min.js"
      )
    );

    const nonce = getNonce();

    const htmlFilePath = path.join(
      this._extensionUri.fsPath,
      "media",
      "chat-view",
      "index.html"
    );
    let htmlContent = fs.readFileSync(htmlFilePath, "utf8");

    htmlContent = htmlContent
      .replaceAll("{{nonce}}", nonce)
      .replace("{{mainScriptUri}}", mainScriptUri.toString())
      .replace("{{stateManagerScriptUri}}", stateManagerScriptUri.toString())
      .replace("{{styleVSCodeUri}}", styleVSCodeUri.toString())
      .replace("{{styleMainUri}}", styleMainUri.toString())
      .replace("{{highlightStyleUri}}", highlightStyleUri.toString())
      .replace("{{cspSource}}", webview.cspSource)
      .replace("{{autosizeScriptUri}}", autosizeScriptUri.toString());

    return htmlContent;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
