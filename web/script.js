let allTransactions = [];
let allGoals = {};
let categories = { expense: [], income: [] };
let chartInstance = null;

// Estados
let currentFilter = 'monthly';
let currentChartMode = 'balance';
let editingId = null; // Controla se estamos editando

const purplePalette = [
    '#3c096c', '#5a189a', '#7b2cbf', '#9d4edd', '#c77dff', '#e0aaff', '#f3d9fa'
];

window.addEventListener('pywebviewready', refreshData);
window.onload = () => {
    startClock();
    document.getElementById('t-date').valueAsDate = new Date();
    if (!window.pywebview) {
        categories = { expense: ['Lazer', 'Casa'], income: ['Salário'] };
        updateCategories();
    }
};

function startClock() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('clock').innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('current-date').innerText = now.toLocaleDateString('pt-BR');
    }, 1000);
}

function setView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.getElementById('view-' + viewId).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');

    const titles = { 'dashboard': 'Visão Geral', 'analysis': 'Análise & IA', 'simulation': 'Simulação', 'goals': 'Metas', 'categories': 'Categorias' };
    document.getElementById('page-title').innerText = titles[viewId] || 'FinPy';

    // Reset ao mudar de tela
    cancelEdit();

    if (viewId === 'dashboard') renderDashboard();
    if (viewId === 'analysis') renderAnalysis();
    if (viewId === 'goals') renderGoalsPage();
    if (viewId === 'categories') renderCategoriesPage();
}

async function refreshData() {
    if (window.pywebview) {
        const data = await pywebview.api.get_data();
        allTransactions = data.transactions;
        allGoals = data.goals || {};
        categories = data.categories;

        const insights = await pywebview.api.get_dashboard_insights();
        updateExecutiveCards(insights);
        renderAlerts(insights.alerts);
        window.currentInsights = insights;

        updateCategories();

        if (!document.getElementById('view-dashboard').classList.contains('hidden')) renderDashboard();
        if (!document.getElementById('view-goals').classList.contains('hidden')) renderGoalsPage();
    }
}

function updateExecutiveCards(data) {
    // CORREÇÃO 1: Usa o saldo acumulado total vindo do Backend
    const totalBal = data.cumulative_balance;
    document.getElementById('total-balance').innerText = `R$ ${totalBal.toFixed(2)}`;
    document.getElementById('total-balance').style.color = totalBal >= 0 ? 'var(--primary-dark)' : 'var(--danger)';

    const sr = data.savings_rate;
    document.getElementById('savings-rate').innerText = `${sr.toFixed(1)}%`;
    document.getElementById('savings-rate').style.color = sr > 20 ? 'var(--success)' : (sr > 0 ? 'var(--warning)' : 'var(--danger)');
    document.getElementById('top-category').innerText = data.top_category;
}

function renderAlerts(alerts) {
    const area = document.getElementById('alerts-area');
    area.innerHTML = '';
    if (!alerts || alerts.length === 0) { area.classList.add('hidden'); return; }
    area.classList.remove('hidden');
    alerts.forEach(a => {
        const div = document.createElement('div');
        div.className = `alert-box alert-${a.type}`;
        div.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${a.msg}`;
        area.appendChild(div);
    });
}

function renderDashboard() {
    const list = document.getElementById('transaction-list');
    list.innerHTML = '';

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let filtered = allTransactions.filter(t => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'monthly') return t.date.startsWith(currentMonthStr);
        return true;
    });

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) list.innerHTML = '<div style="text-align:center; padding:20px; color:#999">Sem lançamentos neste período.</div>';

    filtered.forEach(t => {
        const parts = t.date.split('-');
        const isInst = t.installment_index ? `<span class="badge-inst">${t.installment_index}/${t.installment_total}</span>` : '';
        const div = document.createElement('div');
        div.className = 'transaction-item';
        div.innerHTML = `
            <div><div style="font-weight:600">${t.description} ${isInst}</div><div style="font-size:11px; color:#999">${parts[2]}/${parts[1]} • ${t.category}</div></div>
            <div style="display:flex; gap:10px; align-items:center">
                <span class="${t.type === 'income' ? 'val-inc' : 'val-exp'}">${t.type === 'income' ? '+' : '-'} R$ ${parseFloat(t.amount).toFixed(2)}</span>
                <button onclick="editTransaction('${t.id}')" class="btn-icon edit" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                <button onclick="delTrans('${t.id}')" class="btn-icon del" title="Excluir"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.appendChild(div);
    });

    renderChartWidget(filtered);
}

// --- EDIÇÃO DE TRANSAÇÃO (NOVO) ---
function editTransaction(id) {
    const t = allTransactions.find(item => item.id === id);
    if (!t) return;

    editingId = id;

    // Preenche o formulário
    document.getElementById('t-type').value = t.type;
    updateCategories(); // Atualiza lista baseada no tipo
    document.getElementById('t-category').value = t.category;
    document.getElementById('t-amount').value = t.amount;
    document.getElementById('t-desc').value = t.description.replace(/\s\(\d+\/\d+\)$/, ''); // Remove texto da parcela se houver
    document.getElementById('t-date').value = t.date;

    // UI Changes
    document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Editar Lançamento';
    document.getElementById('btn-submit').innerText = 'Atualizar';
    document.getElementById('btn-cancel').classList.remove('hidden');

    // Desabilita parcelamento na edição (complexidade extra de backend)
    document.getElementById('installment-group').classList.add('hidden');

    // Scroll para o form
    document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editingId = null;
    document.getElementById('trans-form').reset();
    document.getElementById('t-date').valueAsDate = new Date();

    // UI Reset
    document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Novo Lançamento';
    document.getElementById('btn-submit').innerText = 'Salvar';
    document.getElementById('btn-cancel').classList.add('hidden');

    // Restaura checkbox de parcelamento
    document.getElementById('installment-group').classList.remove('hidden');
    document.getElementById('is-installment').checked = false;
    toggleInstallmentInput();
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('t-type').value;
    const cat = document.getElementById('t-category').value;
    const amount = document.getElementById('t-amount').value;
    const desc = document.getElementById('t-desc').value;
    const date = document.getElementById('t-date').value;

    if (window.pywebview) {
        if (editingId) {
            // MODO EDIÇÃO
            await pywebview.api.update_transaction(editingId, type, cat, amount, desc, date);
            showAlert("Lançamento atualizado!");
        } else {
            // MODO CRIAÇÃO
            const isInstallment = document.getElementById('is-installment').checked;
            const installments = isInstallment ? document.getElementById('t-installments').value : 1;
            await pywebview.api.add_transaction(type, cat, amount, desc, date, installments);
            showAlert("Lançamento salvo!");
        }

        cancelEdit(); // Reseta tudo
        refreshData();
    }
}

// --- GRÁFICOS ---
function switchChart(mode) {
    currentChartMode = mode;
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    const btns = document.querySelectorAll('.toggle-btn');
    if (mode === 'balance') btns[0].classList.add('active');
    if (mode === 'category') btns[1].classList.add('active');
    if (mode === 'goals') btns[2].classList.add('active');
    renderDashboard();
}

function renderChartWidget(transactions) {
    const wrapper = document.getElementById('chart-wrapper');
    const goalsList = document.getElementById('goals-summary-list');

    if (currentChartMode === 'goals') {
        wrapper.classList.add('hidden');
        goalsList.classList.remove('hidden');
        renderGoalsSummary();
    } else {
        goalsList.classList.add('hidden');
        wrapper.classList.remove('hidden');
        updateChartCanvas(transactions);
    }
}

function updateChartCanvas(transactions) {
    const ctx = document.getElementById('miniChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    let labels = [], dataPoints = [], bgColors = [];

    if (currentChartMode === 'balance') {
        let inc = 0, exp = 0;
        transactions.forEach(t => t.type === 'income' ? inc += parseFloat(t.amount) : exp += parseFloat(t.amount));
        labels = ['Receita', 'Despesa']; dataPoints = [inc, exp]; bgColors = ['#10b981', '#ef4444'];
        if (inc === 0 && exp === 0) { dataPoints = [1]; bgColors = ['#eee']; labels = ['Vazio']; }

    } else if (currentChartMode === 'category') {
        const expenses = transactions.filter(t => t.type === 'expense');
        const catTotals = {};
        expenses.forEach(t => {
            const c = t.category.trim();
            catTotals[c] = (catTotals[c] || 0) + parseFloat(t.amount);
        });
        labels = Object.keys(catTotals); dataPoints = Object.values(catTotals);
        bgColors = labels.map((_, i) => purplePalette[i % purplePalette.length]);
        if (dataPoints.length === 0) { labels = ['Sem Despesas']; dataPoints = [1]; bgColors = ['#eee']; }
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: dataPoints, backgroundColor: bgColors, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels: { boxWidth: 10, usePointStyle: true, font: { size: 10 } } } } }
    });
}

function renderGoalsSummary() {
    const list = document.getElementById('goals-summary-list');
    list.innerHTML = '';

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const spending = {};
    allTransactions.forEach(t => {
        if (t.type === 'expense' && t.date.startsWith(currentMonthStr)) {
            const c = t.category.trim();
            spending[c] = (spending[c] || 0) + parseFloat(t.amount);
        }
    });

    let hasGoal = false;
    categories.expense.forEach(cat => {
        const limit = parseFloat(allGoals[cat] || 0);
        if (limit > 0) {
            hasGoal = true;
            const spent = spending[cat] || 0;
            const percent = (spent / limit) * 100;
            let barClass = 'fill-success';
            if (percent > 75) barClass = 'fill-warning';
            if (percent > 100) barClass = 'fill-danger';

            const div = document.createElement('div');
            div.className = 'goal-item-summary';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                    <span>${cat}</span>
                    <span style="color:${percent > 100 ? 'var(--danger)' : '#666'}">${Math.min(percent, 999).toFixed(0)}%</span>
                </div>
                <div class="progress-track"><div class="progress-fill ${barClass}" style="width:${Math.min(percent, 100)}%"></div></div>
            `;
            list.appendChild(div);
        }
    });
    if (!hasGoal) list.innerHTML = '<div class="empty-state">Nenhuma meta definida.</div>';
}

// --- ANÁLISE ---
function renderAnalysis() {
    if (!window.currentInsights) return;
    const data = window.currentInsights;

    // IA Previsão
    const fEl = document.getElementById('forecast-value');
    fEl.innerText = `R$ ${data.forecast_next_month.toFixed(2)}`;
    const tEl = document.getElementById('trend-indicator');

    if (data.forecast_next_month > 0) {
        if (data.trend === 'up') {
            tEl.innerHTML = '<i class="fas fa-arrow-trend-up"></i> Tendência de Alta';
            tEl.style.color = 'var(--danger)';
        } else if (data.trend === 'down') {
            tEl.innerHTML = '<i class="fas fa-arrow-trend-down"></i> Tendência de Queda';
            tEl.style.color = 'var(--success)';
        } else {
            tEl.innerHTML = '<i class="fas fa-minus"></i> Gastos Estáveis';
            tEl.style.color = 'var(--text-muted)';
        }
    } else {
        tEl.innerHTML = 'Dados insuficientes (mín. 3 meses)';
        tEl.style.color = '#999';
    }

    // Comparativo CORRETO (Mês atual vs Mês Passado)
    const currExp = data.current_month.expense;
    const lastExp = data.last_month.expense;

    document.getElementById('comp-last-month').innerText = `R$ ${lastExp.toFixed(2)}`;
    document.getElementById('comp-curr-month').innerText = `R$ ${currExp.toFixed(2)}`;

    const diff = currExp - lastExp;
    const compText = document.getElementById('comp-text');

    if (lastExp === 0) {
        compText.innerText = `Gastos atuais: R$ ${currExp.toFixed(2)}.`;
        compText.style.color = 'var(--text-muted)';
    } else if (diff > 0) {
        const pct = (diff / lastExp) * 100;
        compText.innerHTML = `Você gastou <b style="color:var(--danger)">R$ ${diff.toFixed(2)} (+${pct.toFixed(0)}%)</b> a mais que no mês anterior.`;
    } else if (diff < 0) {
        const absDiff = Math.abs(diff);
        const pct = (absDiff / lastExp) * 100;
        compText.innerHTML = `Parabéns! Você economizou <b style="color:var(--success)">R$ ${absDiff.toFixed(2)} (-${pct.toFixed(0)}%)</b>.`;
    } else {
        compText.innerText = "Seus gastos estão iguais ao mês anterior.";
        compText.style.color = 'var(--text-muted)';
    }
}

async function delTrans(id) {
    if (await showConfirm("Excluir lançamento?")) {
        await pywebview.api.delete_transaction(id);
        refreshData();
    }
}

function toggleInstallmentInput() {
    const chk = document.getElementById('is-installment');
    const div = document.getElementById('installment-inputs');
    if (chk.checked) div.classList.remove('hidden'); else div.classList.add('hidden');
}

function updateCategories() {
    const t = document.getElementById('t-type').value;
    const s = document.getElementById('t-category');
    s.innerHTML = '';
    if (categories[t]) categories[t].forEach(c => { const o = document.createElement('option'); o.value = c; o.innerText = c; s.appendChild(o); });
}

async function addCategory(t) {
    const v = document.getElementById(`new-cat-${t}`).value.trim();
    if (v && !categories[t].includes(v)) {
        categories[t].push(v);
        await pywebview.api.update_categories(categories.income, categories.expense);
        document.getElementById(`new-cat-${t}`).value = '';
        refreshData();
        renderCategoriesPage();
    }
}

function renderCategoriesPage() {
    ['expense', 'income'].forEach(t => {
        const l = document.getElementById(`list-cat-${t}`);
        l.innerHTML = '';
        categories[t].forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${c}</span><button onclick="remCat('${t}','${c}')" class="btn-del-cat"><i class="fas fa-trash"></i></button>`;
            l.appendChild(li);
        });
    });
}
async function remCat(t, n) {
    if (await showConfirm(`Excluir categoria "${n}"?`)) {
        categories[t] = categories[t].filter(c => c !== n);
        await pywebview.api.update_categories(categories.income, categories.expense);
        refreshData();
        renderCategoriesPage();
    }
}

function renderGoalsPage() {
    const grid = document.getElementById('goals-grid');
    grid.innerHTML = '';
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const spending = {};
    allTransactions.forEach(t => {
        if (t.type === 'expense' && t.date.startsWith(currentMonthStr)) {
            const c = t.category.trim();
            spending[c] = (spending[c] || 0) + parseFloat(t.amount);
        }
    });

    categories.expense.forEach(cat => {
        const limit = parseFloat(allGoals[cat] || 0);
        const spent = spending[cat] || 0;
        const pct = limit > 0 ? (spent / limit) * 100 : (spent > 0 ? 100 : 0);
        let cls = 'fill-success'; if (pct > 75) cls = 'fill-warning'; if (pct > 100) cls = 'fill-danger';

        const d = document.createElement('div');
        d.className = 'goal-card-detailed';
        d.innerHTML = `
            <div class="goal-card-header"><span>${cat}</span><button onclick="promptGoal('${cat}', ${limit})" class="btn-icon-small"><i class="fas fa-cog"></i></button></div>
            <div class="goal-numbers"><span>Gasto: R$ ${spent.toFixed(2)}</span><span>Meta: R$ ${limit.toFixed(2)}</span></div>
            <div class="progress-track large"><div class="progress-fill ${cls}" style="width:${Math.min(pct, 100)}%"></div></div>
        `;
        grid.appendChild(d);
    });
}

async function promptGoal(cat, curr) {
    const val = prompt(`Definir meta para ${cat}:`, curr);
    if (val !== null) {
        await pywebview.api.set_goal(cat, val);
        await refreshData();
    }
}

function calculateSimulation() {
    const m = parseFloat(document.getElementById('sim-monthly').value);
    const r = parseFloat(document.getElementById('sim-rate').value) / 100;
    const y = parseInt(document.getElementById('sim-years').value);
    let total = 0, inv = 0;
    for (let i = 0; i < y * 12; i++) { total = (total + m) * (1 + r); inv += m; }
    document.getElementById('sim-result').classList.remove('hidden');
    document.getElementById('res-total').innerText = `R$ ${total.toFixed(2)}`;
    document.getElementById('res-invested').innerText = `R$ ${inv.toFixed(2)}`;
    document.getElementById('res-interest').innerText = `+ R$ ${(total - inv).toFixed(2)}`;
}

function setFilter(f) { currentFilter = f; renderDashboard(); document.querySelectorAll('.pill').forEach(p => p.classList.remove('active')); event.target.classList.add('active'); }
function showAlert(m) { document.getElementById('alert-message').innerText = m; document.getElementById('custom-alert').classList.remove('hidden'); }
function closeAlert() { document.getElementById('custom-alert').classList.add('hidden'); }
let cr = null;
function showConfirm(m) { return new Promise(r => { document.getElementById('confirm-message').innerText = m; document.getElementById('custom-confirm').classList.remove('hidden'); cr = r; }); }
function resolveConfirm(v) { document.getElementById('custom-confirm').classList.add('hidden'); if (cr) cr(v); }
function exportData() { if (window.pywebview) pywebview.api.export_csv().then(r => showAlert(r.status === 'success' ? 'Salvo!' : 'Erro')); }
function openPrintModal() { document.getElementById('print-modal').classList.remove('hidden'); }
function closePrintModal() { document.getElementById('print-modal').classList.add('hidden'); }
function confirmPrint() { closePrintModal(); window.print(); }