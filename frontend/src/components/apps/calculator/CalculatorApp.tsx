import { useState, useEffect } from 'react';

// --- Types ---
interface HistoryEntry {
  expression: string;
  result: string;
}

type CalcMode = 'standard' | 'programmer';
type ProgrammerBase = 'HEX' | 'DEC' | 'OCT' | 'BIN';

// --- O(n) stack-based expression parser (no eval) ---
function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let num = '';
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === ' ') continue;
    if (/[\d.]/.test(ch)) {
      num += ch;
    } else {
      if (num) { tokens.push(num); num = ''; }
      tokens.push(ch);
    }
  }
  if (num) tokens.push(num);
  return tokens;
}

function precedence(op: string): number {
  if (op === '+' || op === '-') return 1;
  if (op === '*' || op === '/' || op === '%') return 2;
  return 0;
}

function applyOp(a: number, b: number, op: string): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? NaN : a / b;
    case '%': return a % b;
    default: return NaN;
  }
}

function evaluate(expr: string): number {
  // Replace display symbols with parseable ones
  const normalized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-');

  const tokens = tokenize(normalized);
  const values: number[] = [];
  const ops: string[] = [];

  const processTop = () => {
    const op = ops.pop()!;
    const b = values.pop()!;
    const a = values.pop()!;
    values.push(applyOp(a, b, op));
  };

  let expectUnary = true;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    if (tok === '(') {
      ops.push('(');
      expectUnary = true;
    } else if (tok === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') processTop();
      ops.pop(); // pop '('
      expectUnary = false;
    } else if (!isNaN(Number(tok))) {
      values.push(Number(tok));
      expectUnary = false;
    } else if (tok === '-' && expectUnary) {
      // Unary minus — push a 0 and '-' so it negates next value
      values.push(0);
      ops.push('-');
      expectUnary = true;
    } else if (['+', '-', '*', '/', '%'].includes(tok)) {
      while (
        ops.length &&
        ops[ops.length - 1] !== '(' &&
        precedence(ops[ops.length - 1]) >= precedence(tok)
      ) {
        processTop();
      }
      ops.push(tok);
      expectUnary = true;
    }
  }

  while (ops.length) processTop();
  return values[0] ?? NaN;
}

// Bitwise operations (integer mode)
function bitwiseOp(a: number, b: number, op: string): number {
  const ia = a | 0;
  const ib = b | 0;
  switch (op) {
    case 'AND': return ia & ib;
    case 'OR':  return ia | ib;
    case 'XOR': return ia ^ ib;
    case '<<':  return ia << ib;
    case '>>':  return ia >> ib;
    default: return NaN;
  }
}

// --- Programmer base converter ---
function toBase(value: number, base: ProgrammerBase): string {
  const n = Math.trunc(value);
  if (!isFinite(n)) return 'Error';
  switch (base) {
    case 'HEX': return n.toString(16).toUpperCase();
    case 'OCT': return n.toString(8);
    case 'BIN': return n.toString(2);
    default:    return n.toString(10);
  }
}

// --- Component ---
export default function CalculatorApp() {
  const [display, setDisplay]       = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory]       = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mode, setMode]             = useState<CalcMode>('standard');
  const [progBase, setProgBase]     = useState<ProgrammerBase>('DEC');
  const [waitingBitwiseOp, setWaitingBitwiseOp] = useState<string | null>(null);
  const [bitwiseOperand, setBitwiseOperand]     = useState<number | null>(null);
  const [justEvaled, setJustEvaled] = useState(false);

  const MAX_HISTORY = 10;

  const handleDigit = (d: string) => {
    setJustEvaled(false);
    if (justEvaled) {
      setExpression(d);
      setDisplay(d);
      setJustEvaled(false);
      return;
    }
    setExpression(prev => {
      if (prev === '0') return d;
      return prev + d;
    });
    setDisplay(prev => {
      if (prev === '0') return d;
      return prev + d;
    });
  };

  const handleOperator = (op: string) => {
    setJustEvaled(false);
    setExpression(prev => {
      const trimmed = prev.replace(/[+\-×÷%]$/, '');
      return trimmed + op;
    });
    setDisplay(op);
  };

  const handleDecimal = () => {
    setJustEvaled(false);
    setExpression(prev => {
      // Don't add decimal if last number already has one
      const parts = prev.split(/[+\-×÷%]/);
      const last = parts[parts.length - 1];
      if (last.includes('.')) return prev;
      return prev + '.';
    });
    setDisplay(prev => {
      if (prev.includes('.')) return prev;
      return prev + '.';
    });
  };

  const handleEquals = () => {
    if (!expression) return;
    try {
      const result = evaluate(expression);
      const resultStr = isFinite(result)
        ? (Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(10)).toString())
        : 'Error';
      const entry: HistoryEntry = { expression, result: resultStr };
      setHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY));
      setDisplay(resultStr);
      setExpression(resultStr);
      setJustEvaled(true);
    } catch {
      setDisplay('Error');
      setExpression('');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setJustEvaled(false);
    setWaitingBitwiseOp(null);
    setBitwiseOperand(null);
  };

  const handleBackspace = () => {
    setJustEvaled(false);
    setExpression(prev => {
      if (prev.length <= 1) return '';
      return prev.slice(0, -1);
    });
    setDisplay(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handlePercent = () => {
    setJustEvaled(false);
    try {
      const val = evaluate(expression || display);
      const pct = (val / 100).toString();
      setDisplay(pct);
      setExpression(pct);
    } catch {
      setDisplay('Error');
    }
  };

  const handleNegate = () => {
    setJustEvaled(false);
    setExpression(prev => {
      if (prev.startsWith('-')) return prev.slice(1);
      return '-' + prev;
    });
    setDisplay(prev => {
      if (prev.startsWith('-')) return prev.slice(1);
      return '-' + prev;
    });
  };

  // Programmer mode
  const handleBitwiseOp = (op: string) => {
    if (op === 'NOT') {
      const val = parseInt(display, 10);
      const result = (~val).toString();
      setDisplay(result);
      setExpression(result);
      return;
    }
    setBitwiseOperand(parseInt(display, 10));
    setWaitingBitwiseOp(op);
    setDisplay('0');
    setExpression('');
  };

  const handleBitwiseEquals = () => {
    if (waitingBitwiseOp && bitwiseOperand !== null) {
      const b = parseInt(display, 10);
      const result = bitwiseOp(bitwiseOperand, b, waitingBitwiseOp);
      const resultStr = result.toString();
      setDisplay(resultStr);
      setExpression(resultStr);
      setWaitingBitwiseOp(null);
      setBitwiseOperand(null);
      setJustEvaled(true);
    } else {
      handleEquals();
    }
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      const k = e.key;
      if (/^\d$/.test(k)) handleDigit(k);
      else if (k === '.') handleDecimal();
      else if (k === '+') handleOperator('+');
      else if (k === '-') handleOperator('-');
      else if (k === '*') handleOperator('×');
      else if (k === '/') { e.preventDefault(); handleOperator('÷'); }
      else if (k === '%') handlePercent();
      else if (k === 'Enter' || k === '=') handleBitwiseEquals();
      else if (k === 'Backspace') handleBackspace();
      else if (k === 'Escape') handleClear();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const displayValue = mode === 'programmer' && progBase !== 'DEC'
    ? toBase(parseFloat(display) || 0, progBase)
    : display;

  // Button helpers
  const btnBase = 'h-11 rounded-lg font-mono text-sm font-medium transition-all duration-150 active:scale-95 select-none cursor-pointer';
  const btnNum  = `${btnBase} glass-panel text-z-text hover:bg-z-primary/10 hover:text-z-primary`;
  const btnOp   = `${btnBase} bg-z-primary/15 text-z-primary hover:bg-z-primary/25 border border-z-primary/30`;
  const btnEq   = `${btnBase} bg-z-primary text-z-bg hover:brightness-110 font-bold`;
  const btnFunc = `${btnBase} bg-z-secondary/15 text-z-secondary hover:bg-z-secondary/25 border border-z-secondary/30`;
  const btnBit  = `${btnBase} bg-z-warning/10 text-z-warning hover:bg-z-warning/20 border border-z-warning/20 text-xs`;

  return (
    <div className="h-full flex flex-col p-3 gap-2 overflow-hidden">
      {/* Mode toggle */}
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setMode(m => m === 'standard' ? 'programmer' : 'standard')}
          className="text-[10px] font-mono px-2 py-1 rounded border border-z-border text-z-dimmed hover:text-z-primary hover:border-z-primary/40 transition-colors"
        >
          {mode === 'standard' ? 'PROG' : 'STD'}
        </button>
        {mode === 'programmer' && (
          <div className="flex gap-1">
            {(['HEX','DEC','OCT','BIN'] as ProgrammerBase[]).map(b => (
              <button
                key={b}
                onClick={() => setProgBase(b)}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                  progBase === b
                    ? 'border-z-primary text-z-primary bg-z-primary/10'
                    : 'border-z-border text-z-dimmed hover:text-z-text'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setShowHistory(h => !h)}
          className="text-[10px] font-mono px-2 py-1 rounded border border-z-border text-z-dimmed hover:text-z-primary hover:border-z-primary/40 transition-colors"
        >
          {showHistory ? 'CALC' : `HIST (${history.length})`}
        </button>
      </div>

      {showHistory ? (
        /* History panel */
        <div className="flex-1 overflow-y-auto glass-panel rounded-xl p-3 space-y-2">
          {history.length === 0 && (
            <p className="text-xs font-mono text-z-dimmed text-center mt-4">No history yet</p>
          )}
          {history.map((h, i) => (
            <button
              key={i}
              onClick={() => { setDisplay(h.result); setExpression(h.result); setShowHistory(false); }}
              className="w-full text-left glass-panel rounded-lg p-2 hover:border-z-primary/30 transition-colors group"
            >
              <p className="text-[10px] font-mono text-z-dimmed group-hover:text-z-primary transition-colors">{h.expression}</p>
              <p className="text-sm font-mono text-z-text">= {h.result}</p>
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Display */}
          <div className="glass-panel rounded-xl p-3 flex flex-col items-end gap-0.5 min-h-[80px]">
            {waitingBitwiseOp && (
              <p className="text-[10px] font-mono text-z-warning">{bitwiseOperand} {waitingBitwiseOp} ...</p>
            )}
            <p className="text-[10px] font-mono text-z-dimmed truncate max-w-full">{expression || '0'}</p>
            <p className="text-3xl font-mono text-z-primary leading-tight truncate max-w-full">{displayValue}</p>
            {mode === 'programmer' && progBase === 'DEC' && (
              <p className="text-[9px] font-mono text-z-dimmed">
                HEX: {toBase(parseFloat(display)||0,'HEX')} | OCT: {toBase(parseFloat(display)||0,'OCT')} | BIN: {toBase(parseFloat(display)||0,'BIN')}
              </p>
            )}
          </div>

          {/* Standard buttons */}
          <div className="grid grid-cols-4 gap-1.5 flex-1">
            {/* Row 1: Clear, +/-, %, ÷ */}
            <button className={btnFunc} onClick={handleClear}>C</button>
            <button className={btnFunc} onClick={handleNegate}>+/−</button>
            <button className={btnFunc} onClick={handlePercent}>%</button>
            <button className={btnOp}   onClick={() => handleOperator('÷')}>÷</button>

            {/* Row 2: 7, 8, 9, × */}
            <button className={btnNum} onClick={() => handleDigit('7')}>7</button>
            <button className={btnNum} onClick={() => handleDigit('8')}>8</button>
            <button className={btnNum} onClick={() => handleDigit('9')}>9</button>
            <button className={btnOp}  onClick={() => handleOperator('×')}>×</button>

            {/* Row 3: 4, 5, 6, − */}
            <button className={btnNum} onClick={() => handleDigit('4')}>4</button>
            <button className={btnNum} onClick={() => handleDigit('5')}>5</button>
            <button className={btnNum} onClick={() => handleDigit('6')}>6</button>
            <button className={btnOp}  onClick={() => handleOperator('-')}>−</button>

            {/* Row 4: 1, 2, 3, + */}
            <button className={btnNum} onClick={() => handleDigit('1')}>1</button>
            <button className={btnNum} onClick={() => handleDigit('2')}>2</button>
            <button className={btnNum} onClick={() => handleDigit('3')}>3</button>
            <button className={btnOp}  onClick={() => handleOperator('+')}>+</button>

            {/* Row 5: 0 (span 2), ., = */}
            <button className={`${btnNum} col-span-2`} onClick={() => handleDigit('0')}>0</button>
            <button className={btnNum} onClick={handleDecimal}>.</button>
            <button className={btnEq}  onClick={handleBitwiseEquals}>=</button>

            {/* Backspace — extra row */}
            <button
              className={`${btnFunc} col-span-4`}
              onClick={handleBackspace}
            >
              ⌫ Backspace
            </button>
          </div>

          {/* Programmer extra buttons */}
          {mode === 'programmer' && (
            <div className="grid grid-cols-5 gap-1 mt-1">
              {(['AND','OR','XOR','NOT','<<','>>'] as const).map(op => (
                <button
                  key={op}
                  className={btnBit}
                  onClick={() => handleBitwiseOp(op)}
                >
                  {op}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
