const lint = require('../blocksLinter/blocksLinter.js');

import {
  TextDocument,
  Diagnostic,
} from 'vscode-languageserver';

interface LinterErrorLocation {
  start: {
    column: number, 
    line: number,
    offset: number
  },
  end: {
    column: number, 
    line: number,
    offset: number
  }
}

interface LinterError {
  code: string;
  error: string;
  location: LinterErrorLocation;
}

export default function getBlocksErrors(json: string, source: string, textDocument: TextDocument): Diagnostic[] {
  const linterErrors = lint(json);

  const linterDiagnostics = linterErrors.map((error: LinterError) => {
    const errorMessage: string = error.error;

    const severity = 1
    
    let diagnostic: Diagnostic = {
      range: {
          start: textDocument.positionAt(error.location.start.offset),
          end: textDocument.positionAt(error.location.end.offset)
      },
      severity,
      message: errorMessage,
      source
    };

    return diagnostic;
  })

  return linterDiagnostics;
}