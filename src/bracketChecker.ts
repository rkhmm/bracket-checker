/**
 * Описание одной найденной ошибки в расстановке скобок.
 */
export interface BracketError {
  line: number;     
  column: number;   
  message: string;  
}

/**
 * Одна открывающая скобка, которая хранится в стеке.
 * Позиция нужна, чтобы потом сообщить, где скобка осталась незакрытой.
 */
interface Bracket {
  symbol: string;
  line: number;
  column: number;
}

/**
 * Проверяет, является ли символ открывающей скобкой.
 * @param c - проверяемый символ
 * @returns true, если это одна из скобок ( [ {
 */
function isOpening(c: string): boolean {
  return c === '(' || c === '[' || c === '{';
}

/**
 * Проверяет, является ли символ закрывающей скобкой.
 * @param c - проверяемый символ
 * @returns true, если это одна из скобок ) ] }
 */
function isClosing(c: string): boolean {
  return c === ')' || c === ']' || c === '}';
}

/**
 * Проверяет, подходят ли две скобки друг к другу.
 * @param open - открывающая скобка
 * @param close - закрывающая скобка
 * @returns true, если это пара: () или [] или {}
 */
function isPair(open: string, close: string): boolean {
  return (open === '(' && close === ')') || (open === '[' && close === ']') || (open === '{' && close === '}');
}

/**
 * Проверяет парность скобок в тексте с помощью стека.
 *
 * Алгоритм: открывающие скобки кладутся в стек, а каждая закрывающая
 * сравнивается со скобкой на верхушке стека. Скобки внутри строк и
 * комментариев пропускаются. Всё, что осталось в стеке после прохода
 * по тексту, считается незакрытым.
 *
 * @param text - весь текст проверяемого файла
 * @returns список найденных ошибок; пустой список, если ошибок нет
 */
export function checkBrackets(text: string): BracketError[] {
  const errors: BracketError[] = [];  // сюда складываем ошибки
  const stack: Bracket[] = [];        // стек
  const lines = text.split('\n');     // режем текст на строки
  let inBlockComment = false;         // мы внутри /* ... */ ?

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    let inString = false;  // мы внутри "..." ?
    let inChar = false;    // мы внутри '...' ?

    for (let i = 0; i < line.length; i++) {
      const c = line[i];

      let next = '';
      if (i + 1 < line.length) {
        next = line[i + 1];
      }

      if (inBlockComment) {
        if (c === '*' && next === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }
      if (inString) {
        if (c === '\\') {
          i++;
        } else if (c === '"') {
          inString = false;
        }
        continue;
      }
      if (inChar) {
        if (c === '\\') {
          i++;
        } else if (c === '\'') {
          inChar = false;
        }
        continue;
      }
      if (c === '/' && next === '/') {
        break;
      }
      if (c === '/' && next === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
      if (c === '"') {
        inString = true;
        continue;
      }
      if (c === '\'') {
        inChar = true;
        continue;
      }

      if (isOpening(c)) {
        stack.push({ symbol: c, line: lineIndex, column: i });
      } else if (isClosing(c)) {
        if (stack.length === 0) {
          errors.push({
            line: lineIndex,
            column: i,
            message: "Лишняя закрывающая скобка '" + c + "'",
          });
        } else {
          const top = stack[stack.length - 1];  
          if (isPair(top.symbol, c)) {
            stack.pop();
          } else {
            errors.push({
              line: lineIndex,
              column: i,
              message: "Скобка '" + c + "' не подходит к '" + top.symbol + "' из строки " + (top.line + 1),
            });
            stack.pop();
          }
        }
      }
    }
  }

  while (stack.length > 0) {
    const top = stack.pop();
    if (top !== undefined) {
      errors.push({
        line: top.line,
        column: top.column,
        message: "Не закрыта скобка '" + top.symbol + "'",
      });
    }
  }

  return errors;
}