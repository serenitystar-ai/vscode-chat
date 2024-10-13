import * as vscode from 'vscode';

export class ChatViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'serenity-star-ai_chat-view';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'colorSelected':
					{
						vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
						break;
					}
			}
		});
	}

	public addColor() {
		if (this._view) {
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.postMessage({ type: 'addColor' });
		}
	}

	public clearColors() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'clearColors' });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Cat Colors</title>
			</head>
			<body>
				<ul class="color-list">
				</ul>

				<button>Add Color!!!</button>

                ${this.getTextArea()}

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

    private getTextArea() {
        return `<div class="interactive-input-part">
            <div class="interactive-input-followups" style="width: 519px;">
            <div class="interactive-session-followups">
            <a class="monaco-button interactive-followup-reply monaco-text-button" tabindex="0" role="button" aria-label="Follow up question: /help What can you do?">/help What can you do?</a></div></div><div class="chat-editing-session" aria-hidden="true" style="display: none;"></div><div class="interactive-input-and-side-toolbar"><div class="chat-input-container" data-keybinding-context="16"><div class="chat-editor-container"><div class="interactive-input-editor" data-keybinding-context="17" data-mode-id="plaintext"><div class="monaco-editor no-user-select  showUnused showDeprecated vs-dark" role="code" data-uri="chatSessionInput:input-0" style="width: 505px; height: 36px;"><div data-mprt="3" class="overflow-guard" style="width: 505px; height: 36px;"><div class="margin" role="presentation" aria-hidden="true" style="position: absolute; transform: translate3d(0px, 0px, 0px); contain: strict; top: 0px; height: 36px; width: 0px;"><div class="glyph-margin" style="left: 0px; width: 0px; height: 36px;"></div><div class="margin-view-zones" role="presentation" aria-hidden="true" style="position: absolute;"></div><div class="margin-view-overlays" role="presentation" aria-hidden="true" style="position: absolute; font-family: &quot;Segoe WPC&quot;, &quot;Segoe UI&quot;, sans-serif, Consolas, &quot;Courier New&quot;, monospace; font-weight: normal; font-size: 13px; font-feature-settings: &quot;liga&quot; 0, &quot;calt&quot; 0; font-variation-settings: normal; line-height: 20px; letter-spacing: 0px; width: 0px; height: 36px;"><div style="top:8px;height:20px;"><div class="current-line" style="width:0px"></div></div></div><div class="glyph-margin-widgets" style="position: absolute; top: 0px;"></div></div><div class="monaco-scrollable-element editor-scrollable vs-dark" role="presentation" data-mprt="6" style="position: absolute; overflow: hidden; left: 0px; width: 505px; height: 36px;"><div class="lines-content monaco-editor-background" style="position: absolute; overflow: hidden; width: 1.67772e+07px; height: 1.67772e+07px; transform: translate3d(0px, 0px, 0px); contain: strict; top: 0px; left: 0px;"><div class="view-overlays" role="presentation" aria-hidden="true" style="position: absolute; font-family: &quot;Segoe WPC&quot;, &quot;Segoe UI&quot;, sans-serif, Consolas, &quot;Courier New&quot;, monospace; font-weight: normal; font-size: 13px; font-feature-settings: &quot;liga&quot; 0, &quot;calt&quot; 0; font-variation-settings: normal; line-height: 20px; letter-spacing: 0px; height: 0px; width: 505px;"><div style="top:8px;height:20px;"></div></div><div role="presentation" aria-hidden="true" class="view-rulers"></div><div class="view-zones" role="presentation" aria-hidden="true" style="position: absolute;"></div><div class="view-lines monaco-mouse-cursor-text" role="presentation" aria-hidden="true" data-mprt="8" style="position: absolute; font-family: &quot;Segoe WPC&quot;, &quot;Segoe UI&quot;, sans-serif, Consolas, &quot;Courier New&quot;, monospace; font-weight: normal; font-size: 13px; font-feature-settings: &quot;liga&quot; 0, &quot;calt&quot; 0; font-variation-settings: normal; line-height: 20px; letter-spacing: 0px; width: 505px; height: 36px;"><div style="top:8px;height:20px;" class="view-line"><span><span class="ced-chat-session-detail--454f5d7f-3 ced-chat-session-detail-3"></span><span class="ced-chat-session-detail--454f5d7f-4 ced-chat-session-detail-4"></span></span></div></div><div data-mprt="1" class="contentWidgets" style="position: absolute; top: 0px;"></div><div role="presentation" aria-hidden="true" class="cursors-layer cursor-line-style cursor-solid"><div class="cursor  monaco-mouse-cursor-text " style="height: 20px; top: 8px; left: 0px; font-family: &quot;Segoe WPC&quot;, &quot;Segoe UI&quot;, sans-serif, Consolas, &quot;Courier New&quot;, monospace; font-weight: normal; font-size: 13px; font-feature-settings: &quot;liga&quot; 0, &quot;calt&quot; 0; font-variation-settings: normal; line-height: 20px; letter-spacing: 0px; display: block; visibility: hidden; padding-left: 0px; width: 1px;"></div></div></div><div role="presentation" aria-hidden="true" class="invisible scrollbar horizontal" style="position: absolute; width: 505px; height: 0px; left: 0px; bottom: 0px;"><div class="slider" style="position: absolute; top: 0px; left: 0px; height: 12px; transform: translate3d(0px, 0px, 0px); contain: strict; width: 505px;"></div></div><canvas class="decorationsOverviewRuler" aria-hidden="true" width="0" height="0" style="position: absolute; transform: translate3d(0px, 0px, 0px); contain: strict; top: 0px; right: 0px; width: 14px; height: 36px; display: none;"></canvas><div role="presentation" aria-hidden="true" class="invisible scrollbar vertical" style="position: absolute; width: 0px; height: 36px; right: 0px; top: 0px;"><div class="slider" style="position: absolute; top: 0px; left: 0px; width: 14px; transform: translate3d(0px, 0px, 0px); contain: strict; height: 36px;"></div></div></div><div role="presentation" aria-hidden="true" style="width: 505px;"></div><textarea data-mprt="7" class="inputarea monaco-mouse-cursor-text" wrap="off" autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false" aria-label="The editor is not accessible at this time. To enable screen reader optimized mode, use Shift+Alt+F1" aria-required="false" tabindex="0" role="textbox" aria-roledescription="editor" aria-multiline="true" aria-autocomplete="both" style="tab-size: 14.25px; font-family: &quot;Segoe WPC&quot;, &quot;Segoe UI&quot;, sans-serif, Consolas, &quot;Courier New&quot;, monospace; font-weight: normal; font-size: 13px; font-feature-settings: &quot;liga&quot; 0, &quot;calt&quot; 0; font-variation-settings: normal; line-height: 20px; letter-spacing: 0px; top: 8px; left: 0px; width: 1px; height: 1px;"></textarea><div class="monaco-editor-background textAreaCover" style="position: absolute; top: 0px; left: 0px; width: 0px; height: 0px;"></div><div data-mprt="4" class="overlayWidgets" style="width: 505px;"><div class="monaco-hover hidden" tabindex="0" role="tooltip" widgetid="editor.contrib.modesGlyphHoverWidget" style="position: absolute;"><div class="monaco-scrollable-element " role="presentation" style="position: relative; overflow: hidden;"><div class="monaco-hover-content" style="overflow: hidden;"></div><div role="presentation" aria-hidden="true" class="invisible scrollbar horizontal" style="position: absolute;"><div class="slider" style="position: absolute; top: 0px; left: 0px; height: 10px; transform: translate3d(0px, 0px, 0px); contain: strict;"></div></div><div role="presentation" aria-hidden="true" class="invisible scrollbar vertical" style="position: absolute;"><div class="slider" style="position: absolute; top: 0px; left: 0px; width: 10px; transform: translate3d(0px, 0px, 0px); contain: strict;"></div></div><div class="shadow"></div><div class="shadow"></div><div class="shadow"></div></div></div></div><div data-mprt="9" class="minimap slider-mouseover" role="presentation" aria-hidden="true" style="position: absolute; left: 0px; width: 0px; height: 36px;"><div class="minimap-shadow-hidden" style="height: 36px;"></div><canvas width="0" height="36" style="position: absolute; left: 0px; width: 0px; height: 36px;"></canvas><canvas class="minimap-decorations-layer" width="0" height="36" style="position: absolute; left: 0px; width: 0px; height: 36px;"></canvas><div class="minimap-slider" style="position: absolute; transform: translate3d(0px, 0px, 0px); contain: strict; width: 0px;"><div class="minimap-slider-horizontal" style="position: absolute; width: 0px; height: 0px;"></div></div></div><div role="presentation" aria-hidden="true" class="blockDecorations-container"></div></div><div data-mprt="2" class="overflowingContentWidgets"><div widgetid="editor.contrib.resizableContentHoverWidget" style="position: fixed; height: 28px; width: 150px; z-index: 50; display: none; visibility: hidden; max-width: 1920px;"><div class="monaco-sash vertical" style="left: 148px;"></div><div class="monaco-sash vertical" style="left: -2px;"></div><div class="monaco-sash orthogonal-edge-north horizontal" style="top: -2px;"><div class="orthogonal-drag-handle start"></div><div class="orthogonal-drag-handle end"></div></div><div class="monaco-sash orthogonal-edge-south horizontal" style="top: 26px;"><div class="orthogonal-drag-handle start"></div><div class="orthogonal-drag-handle end"></div></div><div class="monaco-hover hidden" tabindex="0" role="tooltip"><div class="monaco-scrollable-element " role="presentation" style="position: relative; overflow: hidden;"><div class="monaco-hover-content" style="overflow: hidden;"></div><div role="presentation" aria-hidden="true" class="invisible scrollbar horizontal" style="position: absolute;"><div class="slider" style="position: absolute; top: 0px; left: 0px; height: 10px; transform: translate3d(0px, 0px, 0px); contain: strict;"></div></div><div role="presentation" aria-hidden="true" class="invisible scrollbar vertical" style="position: absolute;"><div class="slider" style="position: absolute; top: 0px; left: 0px; width: 10px; transform: translate3d(0px, 0px, 0px); contain: strict;"></div></div><div class="shadow"></div><div class="shadow"></div><div class="shadow"></div></div></div></div></div><div data-mprt="5" class="overflowingOverlayWidgets"></div><div class="shadow-root-host"></div></div></div></div><div class="chat-attached-context" aria-hidden="true" style="display: none;"></div><div class="chat-input-toolbars"><div class="monaco-toolbar"><div class="monaco-action-bar"><ul class="actions-container" role="toolbar"><li class="action-item menu-entry" role="presentation" custom-hover="true"><a class="action-label codicon codicon-mention" role="button" aria-label="Chat with Extension" tabindex="0"></a></li><li class="action-item menu-entry" role="presentation" custom-hover="true"><a class="action-label codicon codicon-attach" role="button" aria-label="Attach Context (Ctrl+})"></a>
            </li><li class="action-item menu-entry" role="presentation" custom-hover="true"><a class="action-label codicon codicon-mic" role="button" aria-label="Start Voice Chat"></a></li></ul></div></div><div class="monaco-toolbar"><div class="monaco-action-bar"><ul class="actions-container" role="toolbar"><li class="action-item monaco-dropdown-with-primary disabled" role="presentation"><div class="action-container disabled menu-entry" custom-hover="true" tabindex="0"><a class="action-label disabled codicon codicon-send" role="button" aria-label="Send (Enter)" aria-disabled="true"></a></div><div class="dropdown-action-container"><div class="monaco-dropdown"><div class="dropdown-label"><a class="action-label codicon codicon-chevron-down" role="button" aria-haspopup="true" aria-expanded="false" custom-hover="true" aria-label="More..."></a></div></div></div></li></ul></div></div></div></div></div>
            </div>`;
    }
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}