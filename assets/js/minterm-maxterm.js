const variableCount = document.getElementById('variableCount');
const variableNames = document.getElementById('variableNames');
const rangeText = document.getElementById('rangeText');
const termIndexes = document.getElementById('termIndexes');
const termLabel = document.getElementById('termLabel');
const modeButtons = document.querySelectorAll('.mode-btn');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const statusLine = document.getElementById('statusLine');
const statusText = document.getElementById('statusText');
const summaryValue = document.getElementById('summaryValue');
const mintermNotation = document.getElementById('mintermNotation');
const maxtermNotation = document.getElementById('maxtermNotation');
const sopExpression = document.getElementById('sopExpression');
const posExpression = document.getElementById('posExpression');
const tableHost = document.getElementById('tableHost');

let currentMode = 'minterm';
let outputs = [];

function setStatus(message, isError = false) {
    statusText.textContent = message;
    statusLine.classList.toggle('error', isError);
}

function getTotalRows() {
    return 2 ** Number(variableCount.value);
}

function defaultNames(count) {
    return ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, count);
}

function syncRangeText() {
    rangeText.textContent = `0 to ${getTotalRows() - 1}`;
}

function syncVariableNames() {
    const count = Number(variableCount.value);
    variableNames.value = defaultNames(count).join(', ');
    syncRangeText();
}

function parseVariableNames() {
    const count = Number(variableCount.value);
    const names = variableNames.value
        .split(/[\s,]+/)
        .map((name) => name.trim())
        .filter(Boolean);

    if (names.length !== count) {
        throw new Error(`Enter exactly ${count} variable name${count === 1 ? '' : 's'}.`);
    }

    if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) {
        throw new Error('Variable names must be unique.');
    }

    if (!names.every((name) => /^[A-Za-z][A-Za-z0-9_]*$/.test(name))) {
        throw new Error('Variable names must start with a letter and use letters, numbers, or underscores.');
    }

    return names;
}

function parseIndexes(raw, total) {
    const input = raw.trim();
    if (!input) return [];

    const indexes = new Set();
    const chunks = input.split(/[\s,]+/).filter(Boolean);

    chunks.forEach((chunk) => {
        const rangeMatch = chunk.match(/^(\d+)-(\d+)$/);

        if (rangeMatch) {
            const start = Number(rangeMatch[1]);
            const end = Number(rangeMatch[2]);
            if (start > end) throw new Error(`Invalid range ${chunk}.`);
            for (let index = start; index <= end; index++) indexes.add(index);
            return;
        }

        if (!/^\d+$/.test(chunk)) {
            throw new Error(`Invalid index "${chunk}".`);
        }

        indexes.add(Number(chunk));
    });

    const sorted = [...indexes].sort((a, b) => a - b);
    const invalid = sorted.find((index) => index < 0 || index >= total);

    if (invalid !== undefined) {
        throw new Error(`Index ${invalid} is outside the valid range 0 to ${total - 1}.`);
    }

    return sorted;
}

function bitsForIndex(index, width) {
    return index.toString(2).padStart(width, '0').split('').map(Number);
}

function mintermExpression(index, names) {
    const bits = bitsForIndex(index, names.length);
    return bits.map((bit, i) => bit ? names[i] : `${names[i]}'`).join('');
}

function maxtermExpression(index, names) {
    const bits = bitsForIndex(index, names.length);
    return `(${bits.map((bit, i) => bit ? `${names[i]}'` : names[i]).join(' + ')})`;
}

function formatList(indexes) {
    return indexes.length ? indexes.join(', ') : '-';
}

function expressionOrConstant(parts, operator, indexes, total, whenEmpty, whenFull) {
    if (indexes.length === 0) return whenEmpty;
    if (indexes.length === total) return whenFull;
    return parts.join(operator);
}

function getTermSets() {
    const minterms = [];
    const maxterms = [];

    outputs.forEach((value, index) => {
        if (value) {
            minterms.push(index);
        } else {
            maxterms.push(index);
        }
    });

    return { minterms, maxterms };
}

function renderResults(names) {
    const total = getTotalRows();
    const { minterms, maxterms } = getTermSets();
    const sopParts = minterms.map((index) => mintermExpression(index, names));
    const posParts = maxterms.map((index) => maxtermExpression(index, names));

    mintermNotation.textContent = `F = Σm(${formatList(minterms)})`;
    maxtermNotation.textContent = `F = ΠM(${formatList(maxterms)})`;
    sopExpression.textContent = `F = ${expressionOrConstant(sopParts, ' + ', minterms, total, '0', '1')}`;
    posExpression.textContent = `F = ${expressionOrConstant(posParts, '', maxterms, total, '1', '0')}`;
    summaryValue.textContent = `${names.length} variables, ${minterms.length} ones, ${maxterms.length} zeros`;
}

function renderTable(names) {
    const total = getTotalRows();
    const rows = [];

    for (let index = 0; index < total; index++) {
        const bits = bitsForIndex(index, names.length);
        const output = outputs[index] ? 1 : 0;

        rows.push(`
            <tr>
                <td>${index}</td>
                ${bits.map((bit) => `<td>${bit}</td>`).join('')}
                <td>
                    <button class="output-toggle ${output ? 'is-one' : 'is-zero'}" type="button"
                        data-index="${index}" aria-label="Toggle output for row ${index}">
                        ${output}
                    </button>
                </td>
            </tr>
        `);
    }

    tableHost.innerHTML = `
        <table class="truth-table">
            <thead>
                <tr>
                    <th>Index</th>
                    ${names.map((name) => `<th>${name}</th>`).join('')}
                    <th>F</th>
                </tr>
            </thead>
            <tbody>${rows.join('')}</tbody>
        </table>
    `;
}

function renderAll(message = 'Ready') {
    try {
        const total = getTotalRows();
        if (outputs.length !== total) outputs = Array(total).fill(0);

        const names = parseVariableNames();
        renderResults(names);
        renderTable(names);
        setStatus(message);
    } catch (error) {
        summaryValue.textContent = 'Invalid variables';
        mintermNotation.textContent = '-';
        maxtermNotation.textContent = '-';
        sopExpression.textContent = '-';
        posExpression.textContent = '-';
        tableHost.innerHTML = '<div class="empty-state">Fix the variable names to rebuild the truth table.</div>';
        setStatus(error.message, true);
    }
}

function applyIndexes() {
    try {
        const total = getTotalRows();
        parseVariableNames();
        const indexes = parseIndexes(termIndexes.value, total);
        outputs = Array(total).fill(currentMode === 'maxterm' ? 1 : 0);

        indexes.forEach((index) => {
            outputs[index] = currentMode === 'minterm' ? 1 : 0;
        });

        renderAll('Table updated');
    } catch (error) {
        setStatus(error.message, true);
    }
}

function setMode(mode) {
    currentMode = mode;
    modeButtons.forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
    termLabel.textContent = mode === 'minterm' ? 'Rows to Set to 1' : 'Rows to Set to 0';
    setStatus('Ready');
}

tableHost.addEventListener('click', (event) => {
    const button = event.target.closest('.output-toggle');
    if (!button) return;

    const index = Number(button.dataset.index);
    outputs[index] = outputs[index] ? 0 : 1;
    renderAll(`Row ${index} set to ${outputs[index]}`);
});

modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
});

variableCount.addEventListener('change', () => {
    syncVariableNames();
    outputs = Array(getTotalRows()).fill(0);
    termIndexes.value = '';
    renderAll('Table rebuilt');
});

variableNames.addEventListener('input', () => renderAll('Variables updated'));
generateBtn.addEventListener('click', applyIndexes);

clearBtn.addEventListener('click', () => {
    outputs = Array(getTotalRows()).fill(0);
    termIndexes.value = '';
    renderAll('Table cleared');
});

termIndexes.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        applyIndexes();
    }
});

syncRangeText();
outputs = Array(getTotalRows()).fill(0);
renderAll();
