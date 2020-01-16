const lint = require('../blocksLinter/blocksLinter.js');

import {
  TextDocument,
  Diagnostic,
} from 'vscode-languageserver';

import {RuleKeys} from './configuration';
import {GetSeverity} from './server';

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

const getCamelCaseError = (errorCode: string): RuleKeys | string => {
  let result = '';

  const errorSplit = errorCode.split('.');

  if (errorSplit.length !== 2) {
    return result;
  }

  const [errorGroup, errorDesc] = errorSplit;
  result += errorGroup.toLowerCase();

  result += errorDesc.split('_').map(descFraction => {
    const withoutFirstLetter = descFraction.slice(1);
    return descFraction.charAt(0) + withoutFirstLetter.toLocaleLowerCase();
  }).join('');

  return result;
}

export default function getBlocksDiagnostics(json: string, source: string, textDocument: TextDocument): Diagnostic[] {
  const linterErrors = lint(json);

  const linterDiagnostics = linterErrors.map((error: LinterError) => {
    const errorMessage: string = error.error;

    const errorCode: RuleKeys = <RuleKeys>getCamelCaseError(error.code)

    const severity = GetSeverity(errorCode);
    
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