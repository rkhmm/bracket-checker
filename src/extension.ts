import * as vscode from 'vscode';
import { checkBrackets } from './bracketChecker';

// VS Code вызывает эту функцию, когда расширение включается
export function activate(context: vscode.ExtensionContext) {
  // Коллекция красных подчеркиваний
  const diagnostics = vscode.languages.createDiagnosticCollection('bracket-checker');
  // Надпись в строке состояния внизу
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

  const command = vscode.commands.registerCommand('bracket-checker.check', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor === undefined) {
      vscode.window.showWarningMessage('Сначала откройте файл');
      return;
    }

    const document = editor.document;
    const errors = checkBrackets(document.getText());  // наша логика

    // Превращаем каждую ошибку в красное подчеркивание
    const problems: vscode.Diagnostic[] = [];
    for (let i = 0; i < errors.length; i++) {
      const e = errors[i];
      const range = new vscode.Range(e.line, e.column, e.line, e.column + 1);
      problems.push(new vscode.Diagnostic(range, e.message, vscode.DiagnosticSeverity.Error));
    }
    diagnostics.set(document.uri, problems);

    // Пишем итог внизу и в сообщении
    statusBar.text = 'Ошибок скобок: ' + errors.length;
    statusBar.show();
    if (errors.length === 0) {
      vscode.window.showInformationMessage('Все скобки расставлены правильно');
    }
  });

  // Говорим VS Code убрать все это при выключении расширения
  context.subscriptions.push(command, diagnostics, statusBar);
}

export function deactivate() {}