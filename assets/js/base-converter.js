        const inputVal = document.getElementById('inputValue');
        const inputBase = document.getElementById('inputBase');
        const outputVal = document.getElementById('outputValue');
        const outputBase = document.getElementById('outputBase');
        const swapBtn = document.getElementById('swapBtn');
        const copyBtn = document.getElementById('copyBtn');
        const inputBaseDisplay = document.getElementById('inputBaseDisplay');
        const outputBaseDisplay = document.getElementById('outputBaseDisplay');
        const statusLine = document.getElementById('statusLine');
        const statusText = document.getElementById('statusText');

        function populateBases() {
            for (let i = 2; i <= 36; i++) {
                const opt1 = new Option(`Base ${i}`, i);
                const opt2 = new Option(`Base ${i}`, i);
                inputBase.add(opt1);
                outputBase.add(opt2);
            }
            inputBase.value = "10";
            outputBase.value = "2";
        }

        function setStatus(message, isError = false) {
            statusText.textContent = message;
            statusLine.classList.toggle('error', isError);
        }

        function updatePresetButtons() {
            document.querySelectorAll('.base-shortcuts').forEach((group) => {
                const select = document.getElementById(group.dataset.target);

                group.querySelectorAll('.preset-btn').forEach((button) => {
                    button.classList.toggle('active', button.dataset.base === select.value);
                });
            });
        }

        function getDigitValue(char) {
            const code = char.charCodeAt(0);

            if (code >= 48 && code <= 57) {
                return code - 48;
            }

            if (code >= 65 && code <= 90) {
                return code - 55;
            }

            return -1;
        }

        function isValidForBase(value, base) {
            return [...value].every((char) => {
                const digit = getDigitValue(char);
                return digit >= 0 && digit < base;
            });
        }

        function parseBigIntFromBase(value, base) {
            const bigBase = BigInt(base);
            let total = 0n;

            for (const char of value) {
                total = total * bigBase + BigInt(getDigitValue(char));
            }

            return total;
        }

        function formatBigIntToBase(value, base) {
            const digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

            if (value === 0n) {
                return "0";
            }

            const bigBase = BigInt(base);
            let remaining = value;
            let result = "";

            while (remaining > 0n) {
                const digit = Number(remaining % bigBase);
                result = digits[digit] + result;
                remaining /= bigBase;
            }

            return result;
        }

        function convert() {
            const val = inputVal.value.trim().toUpperCase();
            const baseIn = parseInt(inputBase.value);
            const baseOut = parseInt(outputBase.value);

            inputBaseDisplay.textContent = `Base ${baseIn}`;
            outputBaseDisplay.textContent = `Base ${baseOut}`;

            if (val === "") {
                outputVal.value = "";
                inputVal.classList.remove('invalid');
                setStatus('Ready');
                updatePresetButtons();
                return;
            }

            if (!isValidForBase(val, baseIn)) {
                inputVal.classList.add('invalid');
                outputVal.value = "";
                setStatus(`Invalid digit for base ${baseIn}`, true);
                updatePresetButtons();
                return;
            } else {
                inputVal.classList.remove('invalid');
            }

            try {
                const decimalValue = parseBigIntFromBase(val, baseIn);
                outputVal.value = formatBigIntToBase(decimalValue, baseOut);
                setStatus(`${val.length} digit${val.length === 1 ? '' : 's'} converted`);
                updatePresetButtons();

            } catch (e) {
                console.error("Conversion error:", e);
                outputVal.value = "Error";
                setStatus('Conversion error', true);
            }
        }

        swapBtn.addEventListener('click', () => {
            const currentOutput = outputVal.value;
            if (currentOutput && currentOutput !== "Error" && currentOutput !== "") {
                inputVal.value = currentOutput;
                const tempBase = inputBase.value;
                inputBase.value = outputBase.value;
                outputBase.value = tempBase;
                convert();
            }
        });

        inputVal.addEventListener('input', convert);
        inputBase.addEventListener('change', convert);
        outputBase.addEventListener('change', convert);

        document.querySelectorAll('.preset-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const group = button.closest('.base-shortcuts');
                const select = document.getElementById(group.dataset.target);

                select.value = button.dataset.base;
                convert();
            });
        });

        function copyOutput() {
            if (outputVal.value && outputVal.value !== "Error") {
                if (!navigator.clipboard) {
                    outputVal.select();
                    return;
                }

                navigator.clipboard.writeText(outputVal.value).then(() => {
                    showToast();
                }).catch(() => {
                    outputVal.select();
                });
            }
        }

        outputVal.addEventListener('click', copyOutput);
        copyBtn.addEventListener('click', copyOutput);

        function showToast() {
            const toast = document.getElementById('toast');
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
        }

        populateBases();
        convert();
