        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
            });
        });

        // K-Map toggle
        document.querySelectorAll('.kmap-table td[data-idx]').forEach(cell => {
            cell.addEventListener('click', () => {
                const isOne = cell.textContent.trim() === '1';
                cell.textContent = isOne ? '0' : '1';
                cell.classList.toggle('v1', !isOne);
                cell.classList.toggle('v0', isOne);
            });
        });
