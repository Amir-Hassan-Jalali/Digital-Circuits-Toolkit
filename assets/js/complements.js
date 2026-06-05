        const digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const inputValue = document.getElementById('inputValue');
        const baseSelect = document.getElementById('baseSelect');
        const widthInput = document.getElementById('widthInput');
        const baseDisplay = document.getElementById('baseDisplay');
        const minusOneOutput = document.getElementById('minusOneOutput');
        const radixOutput = document.getElementById('radixOutput');
        const minusOneTitle = document.getElementById('minusOneTitle');
        const radixTitle = document.getElementById('radixTitle');
        const minusOneFormula = document.getElementById('minusOneFormula');
        const radixFormula = document.getElementById('radixFormula');
        const normalizedValue = document.getElementById('normalizedValue');
        const statusLine = document.getElementById('statusLine');
        const statusText = document.getElementById('statusText');

        function populateBases() {
            for (let base = 2; base <= 36; base++) {
                baseSelect.add(new Option(`Base ${base}`, base));
            }
            baseSelect.value = "2";
        }

        function getDigitValue(char) {
            const code = char.charCodeAt(0);

            if (code >= 48 && code <= 57) return code - 48;
            if (code >= 65 && code <= 90) return code - 55;

            return -1;
        }

        function parseBigIntFromBase(value, base) {
            const bigBase = BigInt(base);
            let total = 0n;

            for (const char of value) {
                total = total * bigBase + BigInt(getDigitValue(char));
            }

            return total;
        }

        function formatBigIntToBase(value, base, width) {
            if (value === 0n) return "0".padStart(width, "0");

            const bigBase = BigInt(base);
            let remaining = value;
            let result = "";

            while (remaining > 0n) {
                result = digits[Number(remaining % bigBase)] + result;
                remaining /= bigBase;
            }

            return result.padStart(width, "0");
        }

        function setStatus(message, isError = false) {
            statusText.textContent = message;
            statusLine.classList.toggle('error', isError);
        }

        function getComplementLabel(base, offset) {
            if (base === 2) return offset === -1 ? "1's complement" : "2's complement";
            if (base === 10) return offset === -1 ? "9's complement" : "10's complement";
            return offset === -1 ? `${base - 1}'s complement` : `${base}'s complement`;
        }

        function isValidForBase(value, base) {
            return [...value].every((char) => {
                const digit = getDigitValue(char);
                return digit >= 0 && digit < base;
            });
        }

        function updatePresetButtons() {
            document.querySelectorAll('.preset-btn').forEach((button) => {
                button.classList.toggle('active', button.dataset.base === baseSelect.value);
            });
        }

        function clearOutputs() {
            minusOneOutput.value = "";
            radixOutput.value = "";
            normalizedValue.textContent = "Padded input: -";
        }

        function calculate() {
            const base = parseInt(baseSelect.value, 10);
            const rawValue = inputValue.value.trim().toUpperCase();
            const width = parseInt(widthInput.value, 10);

            baseDisplay.textContent = `Base ${base}`;
            minusOneTitle.textContent = getComplementLabel(base, -1);
            radixTitle.textContent = getComplementLabel(base, 0);
            minusOneFormula.textContent = `${base}^n - 1 - x`;
            radixFormula.textContent = `${base}^n - x`;
            updatePresetButtons();

            inputValue.classList.remove('invalid');
            widthInput.classList.remove('invalid');

            if (!Number.isInteger(width) || width < 1 || width > 256) {
                widthInput.classList.add('invalid');
                clearOutputs();
                setStatus('Width must be 1 to 256', true);
                return;
            }

            if (rawValue === "") {
                clearOutputs();
                normalizedValue.textContent = `Padded input: ${"0".repeat(width)}`;
                setStatus('Ready');
                return;
            }

            if (!isValidForBase(rawValue, base)) {
                inputValue.classList.add('invalid');
                clearOutputs();
                setStatus(`Invalid digit for base ${base}`, true);
                return;
            }

            if (rawValue.length > width) {
                widthInput.classList.add('invalid');
                clearOutputs();
                setStatus('Width is smaller than the number', true);
                return;
            }

            const normalized = rawValue.padStart(width, "0");
            const value = parseBigIntFromBase(normalized, base);
            const modulus = BigInt(base) ** BigInt(width);
            const minusOneComplement = (modulus - 1n) - value;
            const radixComplement = value === 0n ? 0n : modulus - value;

            minusOneOutput.value = formatBigIntToBase(minusOneComplement, base, width);
            radixOutput.value = formatBigIntToBase(radixComplement, base, width);
            normalizedValue.textContent = `Padded input: ${normalized}`;
            setStatus(`${width} digit${width === 1 ? '' : 's'} in base ${base}`);
        }

        function copyValue(id) {
            const field = document.getElementById(id);

            if (!field.value) return;

            if (!navigator.clipboard) {
                field.select();
                return;
            }

            navigator.clipboard.writeText(field.value).then(showToast).catch(() => {
                field.select();
            });
        }

        function showToast() {
            const toast = document.getElementById('toast');
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 1800);
        }

        inputValue.addEventListener('input', calculate);
        baseSelect.addEventListener('change', calculate);
        widthInput.addEventListener('input', calculate);

        document.querySelectorAll('.preset-btn').forEach((button) => {
            button.addEventListener('click', () => {
                baseSelect.value = button.dataset.base;
                calculate();
            });
        });

        document.querySelectorAll('.copy-btn').forEach((button) => {
            button.addEventListener('click', () => copyValue(button.dataset.copy));
        });

        minusOneOutput.addEventListener('click', () => copyValue('minusOneOutput'));
        radixOutput.addEventListener('click', () => copyValue('radixOutput'));

        populateBases();
        calculate();
