// Описание одной найденной ошибки
export interface BracketError {
  line: number;     // номер строки
  column: number;   // номер символа в строке
  message: string;  // текст ошибки для пользователя
}

// Описание одной скобки в стеке
interface Bracket {
  symbol: string;
  line: number;
  column: number;
}

// true, если символ - открывающая скобка
function isOpening(c: string): boolean {
  return c === '(' || c === '[' || c === '{';
}

// true, если символ - закрывающая скобка
function isClosing(c: string): boolean {
  return c === ')' || c === ']' || c === '}';
}

// true, если открывающая и закрывающая скобки - пара
function isPair(open: string, close: string): boolean {
  return (open === '(' && close === ')') || (open === '[' && close === ']') || (open === '{' && close === '}');
}

// Главная функция, принимает весь текст файла, возвращает список ошибок.
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

      // next - следующий символ (или пустая строка, если строка кончилась)
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
        // Открывающая: кладём в стек вместе с позицией
        stack.push({ symbol: c, line: lineIndex, column: i });
      } else if (isClosing(c)) {
        if (stack.length === 0) {
          errors.push({
            line: lineIndex,
            column: i,
            message: "Лишняя закрывающая скобка '" + c + "'",
          });
        } else {
          const top = stack[stack.length - 1];  // верхушка стека
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

  // Все, что осталось в стеке, так и не закрыли
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