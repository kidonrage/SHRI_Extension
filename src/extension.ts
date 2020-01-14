import { readFileSync, readFile } from "fs";
import { join, resolve, basename } from "path";
import { bemhtml } from "bem-xjst";

import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    SettingMonitor,
    DocumentColorRequest
} from 'vscode-languageclient';

const serverBundleRelativePath = join('out', 'server.js');
const previewPath: string = resolve( __dirname, '../preview/index.html');
const previewHtml: string = readFileSync(previewPath).toString();
const template = bemhtml.compile()

let client: LanguageClient;
const PANELS: Record<string, vscode.WebviewPanel> = {};

const createLanguageClient = (context: vscode.ExtensionContext): LanguageClient => {
    const serverModulePath = context.asAbsolutePath(serverBundleRelativePath);

    const serverOptions: ServerOptions = {
        run: {
            module: serverModulePath,
            transport: TransportKind.ipc
        },
        debug: {
            module: serverModulePath,
            transport: TransportKind.ipc,
            options: { execArgv: ['--inspect=6009', '--nolazy'] }
        }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'json' }
        ],
        synchronize: { configurationSection: 'example' }
    };

    client = new LanguageClient('languageServerExample', 'Language Server Example', serverOptions, clientOptions);

    return client;
};

const getPreviewKey = (doc: vscode.TextDocument): string => doc.uri.path;

const getMediaPath = (context: vscode.ExtensionContext) => vscode.Uri
    .file(context.extensionPath)
    .with({ scheme: "resource" })
    .toString() + '/';

const getPathForFileInPreviewCatalogue = (fileName: string, context: vscode.ExtensionContext, panel: vscode.WebviewPanel) => {
  const fileUri = vscode.Uri.file(join(context.extensionPath, 'preview', fileName));
  const webviewUri = panel.webview.asWebviewUri(fileUri);

  return `${webviewUri}`;
}

const initPreviewPanel = (document: vscode.TextDocument, context: vscode.ExtensionContext) => {
    const key = getPreviewKey(document);
    const fileName = basename(document.fileName);

    const panel = vscode.window.createWebviewPanel(
        'example.preview',
        `Preview: ${fileName}`,
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(context.extensionPath),
            vscode.Uri.file(join(context.extensionPath, 'preview'))
          ]
        }
    );

    panel.webview.onDidReceiveMessage(
      message => {
        context.workspaceState.update('previewMode', message.newMode);
        
        switch (message.command) {
          case 'changePreviewMode':
            updateContent(document, context);
            return;
        }
      },
      undefined,
      context.subscriptions
    );

    PANELS[key] = panel;

    const e = panel.onDidDispose(() => 
    {
        delete PANELS[key];
        e.dispose()
    });

    return panel;
};

const updateContent = (doc: vscode.TextDocument, context: vscode.ExtensionContext) => {
    const panel = PANELS[doc.uri.path];

    if (panel) {
      const newMode = context.workspaceState.get('previewMode') as string || 'structure';

      try {
        const json = doc.getText();
        const data = JSON.parse(json);
        const html = template.apply(data);

        panel.webview.html = previewHtml 
          // FIX: Старое рег. выражение - {{\s+(\w+)\s+}}. С ним обязательно нужно было поставить хотя бы один пробел до и после слова "content".
          .replace(/{{\s?(\w+)\s?}}/g, (str, key) => {
              switch (key) {
                  case 'content':
                    return html;
                  case 'mediaPath':
                    return getMediaPath(context);
                  // FIX: Путь до стилей подставляется здесь и в виде WebviewUri, т.к. иначе WebView отказывался грузить файл
                  case 'commonStylesPath':
                    return getPathForFileInPreviewCatalogue('style.css', context, panel);
                  case 'commonScriptsPath':
                    return getPathForFileInPreviewCatalogue('script.js', context, panel)
                  case 'previewModeStylesPath':
                    return getPathForFileInPreviewCatalogue(join('preview-mods', newMode, `${newMode}.css`), context, panel);
                  case 'previewModeScriptsPath':
                    return getPathForFileInPreviewCatalogue(join('preview-mods', newMode, `${newMode}.js`), context, panel);
                  case 'previewModeClass':
                    return newMode;
                  default:
                      return str;
              }
          });
        } catch(e) {}
    }
};

// const getModeStylesPath = (newPreviewMode: string) => {
//   let newPreviewStylesPath = '';

//   const getModeStylesPath = (filename: string) => getPathForFileInPreviewCatalogue(join('preview-mods', filename), context, panel)

//   switch (newPreviewMode) {
//     case 'structure':
//       newPreviewStylesPath = getModeStylesPath('structure.css');
//       break;
//     case 'page':
//       newPreviewStylesPath = getModeStylesPath('page.css');
//       break;
//   }

//   if (panel) {
//     panel.webview.html = previewHtml 
//       .replace("{{previewModeStylesPath}}", newPreviewStylesPath)
//   }
// };

const openPreview = (context: vscode.ExtensionContext) => {
    const editor = vscode.window.activeTextEditor;

    if (editor !== undefined) {
        const document: vscode.TextDocument = editor.document;
        const key = getPreviewKey(document);

        const panel = PANELS[key];

        if (panel) panel.reveal();
        else {
            const panel = initPreviewPanel(document, context);
            updateContent(document, context);
            context.subscriptions.push(panel);
        }
    }
};

export function activate(context: vscode.ExtensionContext) {

    console.info('Congratulations, your extension is now active!');

    client = createLanguageClient(context);

    context.subscriptions.push(new SettingMonitor(client, 'example.enable').start());

    const eventChange: vscode.Disposable = vscode.workspace
        .onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => updateContent(e.document, context));

    const previewCommand = vscode.commands.registerCommand('example.showPreviewToSide', () => openPreview(context));

    context.subscriptions.push(previewCommand, eventChange);
}

export function deactivate() {
    client.stop();
}