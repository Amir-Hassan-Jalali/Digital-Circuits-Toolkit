        const expressionInput = document.getElementById('expressionInput');
        const generateBtn = document.getElementById('generateBtn');
        const clearBtn = document.getElementById('clearBtn');
        const tableHost = document.getElementById('tableHost');
        const statusLine = document.getElementById('statusLine');
        const statusText = document.getElementById('statusText');
        const expressionSummary = document.getElementById('expressionSummary');

        const precedence = {
            NOT: 5,
            AND: 4,
            XOR: 3,
            OR: 2,
            IMPLIES: 1,
            IFF: 0
        };

        const rightAssociative = new Set(['NOT', 'IMPLIES']);
        const unary = new Set(['NOT']);

        function setStatus(message, isError = false) {
            statusText.textContent = message;
            statusLine.classList.toggle('error', isError);
        }

        function normalizeOperator(word) {
            const upper = word.toUpperCase();
            if (upper === 'NOT') return 'NOT';
            if (upper === 'AND') return 'AND';
            if (upper === 'OR') return 'OR';
            if (upper === 'XOR') return 'XOR';
            if (upper === 'TRUE') return 'TRUE';
            if (upper === 'FALSE') return 'FALSE';
            return null;
        }

        function tokenize(expression) {
            const tokens = [];
            let index = 0;

            while (index < expression.length) {
                const char = expression[index];

                if (/\s/.test(char)) {
                    index++;
                    continue;
                }

                if (expression.startsWith('<->', index) || expression.startsWith('<=>', index)) {
                    tokens.push({ type: 'op', value: 'IFF' });
                    index += 3;
                    continue;
                }

                if (expression.startsWith('->', index) || expression.startsWith('=>', index)) {
                    tokens.push({ type: 'op', value: 'IMPLIES' });
                    index += 2;
                    continue;
                }

                if (char === '(' || char === ')') {
                    tokens.push({ type: 'paren', value: char });
                    index++;
                    continue;
                }

                if (char === '!' || char === '~' || char === '¬') {
                    tokens.push({ type: 'op', value: 'NOT' });
                    index++;
                    continue;
                }

                if (char === '&' || char === '∧') {
                    tokens.push({ type: 'op', value: 'AND' });
                    index++;
                    continue;
                }

                if (char === '|' || char === '∨') {
                    tokens.push({ type: 'op', value: 'OR' });
                    index++;
                    continue;
                }

                if (char === '^' || char === '⊕') {
                    tokens.push({ type: 'op', value: 'XOR' });
                    index++;
                    continue;
                }

                if (/[A-Za-z_]/.test(char)) {
                    let word = char;
                    index++;

                    while (index < expression.length && /[A-Za-z0-9_]/.test(expression[index])) {
                        word += expression[index];
                        index++;
                    }

                    const operator = normalizeOperator(word);

                    if (operator === 'TRUE' || operator === 'FALSE') {
                        tokens.push({ type: 'const', value: operator === 'TRUE' });
                    } else {
                        tokens.push(operator ? { type: 'op', value: operator } : { type: 'var', value: word });
                    }
                    continue;
                }

                if (char === '0' || char === '1') {
                    tokens.push({ type: 'const', value: char === '1' });
                    index++;
                    continue;
                }

                throw new Error(`Unexpected character "${char}"`);
            }

            return tokens;
        }

        function toRpn(tokens) {
            const output = [];
            const operators = [];

            tokens.forEach((token) => {
                if (token.type === 'var' || token.type === 'const') {
                    output.push(token);
                    return;
                }

                if (token.type === 'paren' && token.value === '(') {
                    operators.push(token);
                    return;
                }

                if (token.type === 'paren' && token.value === ')') {
                    while (operators.length && operators[operators.length - 1].value !== '(') {
                        output.push(operators.pop());
                    }

                    if (!operators.length) throw new Error('Mismatched parentheses');
                    operators.pop();
                    return;
                }

                if (token.type === 'op') {
                    while (operators.length) {
                        const top = operators[operators.length - 1];
                        if (top.type === 'paren') break;

                        const higher = precedence[top.value] > precedence[token.value];
                        const equalAndLeft = precedence[top.value] === precedence[token.value] && !rightAssociative.has(token.value);

                        if (!higher && !equalAndLeft) break;
                        output.push(operators.pop());
                    }

                    operators.push(token);
                }
            });

            while (operators.length) {
                const token = operators.pop();
                if (token.type === 'paren') throw new Error('Mismatched parentheses');
                output.push(token);
            }

            return output;
        }

        function evaluateRpn(rpn, assignment) {
            const stack = [];

            rpn.forEach((token) => {
                if (token.type === 'const') {
                    stack.push(token.value);
                    return;
                }

                if (token.type === 'var') {
                    stack.push(Boolean(assignment[token.value]));
                    return;
                }

                if (unary.has(token.value)) {
                    if (stack.length < 1) throw new Error('Missing operand');
                    stack.push(!stack.pop());
                    return;
                }

                if (stack.length < 2) throw new Error('Missing operand');
                const right = stack.pop();
                const left = stack.pop();

                if (token.value === 'AND') stack.push(left && right);
                if (token.value === 'OR') stack.push(left || right);
                if (token.value === 'XOR') stack.push(left !== right);
                if (token.value === 'IMPLIES') stack.push(!left || right);
                if (token.value === 'IFF') stack.push(left === right);
            });

            if (stack.length !== 1) throw new Error('Invalid expression');
            return stack[0];
        }

        function getVariables(tokens) {
            return [...new Set(tokens.filter((token) => token.type === 'var').map((token) => token.value))]
                .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        }

        function makeRows(variables, rpn) {
            const total = 2 ** variables.length;
            const rows = [];

            for (let mask = 0; mask < total; mask++) {
                const assignment = {};

                variables.forEach((variable, index) => {
                    assignment[variable] = Boolean((mask >> (variables.length - index - 1)) & 1);
                });

                rows.push({ assignment, result: evaluateRpn(rpn, assignment) });
            }

            return rows;
        }

        function renderTable(variables, rows, expression) {
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');
            const headerRow = document.createElement('tr');

            [...variables, 'F'].forEach((heading) => {
                const th = document.createElement('th');
                th.textContent = heading === 'F' ? expression : heading;
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);

            rows.forEach((row) => {
                const tr = document.createElement('tr');

                variables.forEach((variable) => {
                    const td = document.createElement('td');
                    td.textContent = row.assignment[variable] ? '1' : '0';
                    tr.appendChild(td);
                });

                const resultCell = document.createElement('td');
                resultCell.className = 'result';
                resultCell.textContent = row.result ? '1' : '0';
                tr.appendChild(resultCell);
                tbody.appendChild(tr);
            });

            table.appendChild(thead);
            table.appendChild(tbody);

            tableHost.className = 'table-wrap';
            tableHost.replaceChildren(table);
        }

        function generate() {
            const expression = expressionInput.value.trim();
            expressionInput.classList.remove('invalid');

            if (!expression) {
                tableHost.className = 'empty-state';
                tableHost.textContent = 'Enter a Boolean function to generate a truth table.';
                expressionSummary.textContent = '-';
                setStatus('Ready');
                return;
            }

            try {
                const tokens = tokenize(expression);
                const variables = getVariables(tokens);

                if (variables.length === 0) throw new Error('Use at least one variable');
                if (variables.length > 8) throw new Error('Use 8 variables or fewer');

                const rpn = toRpn(tokens);
                const rows = makeRows(variables, rpn);
                renderTable(variables, rows, expression);
                expressionSummary.textContent = expression;
                setStatus(`${rows.length} rows, ${variables.length} variable${variables.length === 1 ? '' : 's'}`);
            } catch (error) {
                expressionInput.classList.add('invalid');
                tableHost.className = 'empty-state';
                tableHost.textContent = error.message;
                expressionSummary.textContent = expression || '-';
                setStatus(error.message, true);
            }
        }

        function insertToken(token) {
            const start = expressionInput.selectionStart;
            const end = expressionInput.selectionEnd;
            const before = expressionInput.value.slice(0, start);
            const after = expressionInput.value.slice(end);
            const padded = token.length > 1 ? ` ${token} ` : ` ${token} `;

            expressionInput.value = before + padded + after;
            expressionInput.focus();
            expressionInput.selectionStart = expressionInput.selectionEnd = before.length + padded.length;
            generate();
        }

        document.querySelectorAll('.token-btn').forEach((button) => {
            button.addEventListener('click', () => insertToken(button.dataset.token));
        });

        generateBtn.addEventListener('click', generate);
        clearBtn.addEventListener('click', () => {
            expressionInput.value = '';
            generate();
            expressionInput.focus();
        });
        expressionInput.addEventListener('input', generate);

        expressionInput.value = '(A & B) -> C';
        generate();
