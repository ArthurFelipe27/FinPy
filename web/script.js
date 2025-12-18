let allTransactions = [];
let allGoals = {};
let categories = { expense: [], income: [] };

let currentFilter = 'all';
let currentChartMode = 'balance';
let currentView = 'dashboard';
let chartInstance = null;

// Variável para armazenar a resolução da Promise de confirmação
let confirmResolver = null;

const categoryColors = [
    '#3c096c', '#7b2cbf', '#9d4edd', '#c77dff',
    '#e0aaff', '#ff9e00', '#ff006e', '#3a86ff',
    '#2ec4b6', '#00b4d8', '#e63946', '#fb8500'
];

// --- INICIALIZAÇÃO ---

window.addEventListener('pywebviewready', function () {
    refreshData();
});

window.onload = function () {
    startClock();
    const dateInput = document.getElementById('t-date');
    if (dateInput) dateInput.valueAsDate = new Date();

    if (!window.pywebview) {
        console.log("Modo navegador (teste sem backend)");
        categories = { expense: ['Alimentação', 'Teste'], income: ['Salário'] };
        updateCategories();
    }
};

function startClock() {
    function update() {
        const now = new Date();
        document.getElementById('clock').innerText = now.toLocaleTimeString('pt-BR');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').innerText = now.toLocaleDateString('pt-BR', options);
    }
    update();
    setInterval(update, 1000);
}

function updateCategories(selectedCategory = null) {
    const typeSelect = document.getElementById('t-type');
    const catSelect = document.getElementById('t-category');
    if (!typeSelect || !catSelect) return;
    const type = typeSelect.value;
    catSelect.innerHTML = '';
    if (categories[type]) {
        categories[type].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.innerText = cat;
            if (selectedCategory && selectedCategory === cat) option.selected = true;
            catSelect.appendChild(option);
        });
    }
}

async function refreshData() {
    try {
        if (window.pywebview) {
            const data = await pywebview.api.get_data();
            allTransactions = data.transactions;
            allGoals = data.goals || {};
            if (data.categories) categories = data.categories;
            updateCategories();
            if (currentView === 'dashboard') {
                render();
                if (currentChartMode === 'goals') renderGoals();
            } else if (currentView === 'goals') {
                renderDetailedGoalsPage();
            } else if (currentView === 'categories') {
                renderCategoriesPage();
            }
        }
    } catch (e) { console.error(e); }
}

// --- HELPERS DE ALERTAS PERSONALIZADOS ---

function showAlert(message, title = "Atenção") {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    document.getElementById('custom-alert').classList.remove('hidden');
}

function closeAlert() {
    document.getElementById('custom-alert').classList.add('hidden');
}

function showConfirm(message) {
    return new Promise((resolve) => {
        document.getElementById('confirm-message').innerText = message;
        document.getElementById('custom-confirm').classList.remove('hidden');
        confirmResolver = resolve;
    });
}

function resolveConfirm(result) {
    document.getElementById('custom-confirm').classList.add('hidden');
    if (confirmResolver) {
        confirmResolver(result);
        confirmResolver = null;
    }
}

// Subscrição dos Prompts Nativos
async function promptSetGoal(category, currentLimit) {
    // Usamos o prompt nativo aqui pois pedir input num modal custom é mais complexo, 
    // mas se quiser podemos fazer um modal de input depois.
    const newVal = prompt(`Definir limite mensal para ${category} (R$):`, currentLimit || 0);
    if (newVal !== null) {
        const limit = parseFloat(newVal);
        if (!isNaN(limit)) {
            if (window.pywebview) {
                await pywebview.api.set_goal(category, limit);
                refreshData();
            }
        }
    }
}

// --- NAVEGAÇÃO ---

function setFilter(filter) {
    currentFilter = filter;
    currentView = 'dashboard';
    updateNavUI();
    document.getElementById('view-dashboard').classList.remove('hidden');
    document.getElementById('view-goals-page').classList.add('hidden');
    document.getElementById('view-categories-page').classList.add('hidden');
    document.getElementById('page-subtitle').innerText = "Acompanhe suas finanças";
    const titles = { 'all': 'Visão Geral', 'weekly': 'Relatório Semanal', 'monthly': 'Relatório Mensal', 'annual': 'Relatório Anual' };
    document.getElementById('page-title').innerText = titles[filter];
    render();
}

function showGoalsView() {
    currentView = 'goals';
    updateNavUI();
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-categories-page').classList.add('hidden');
    document.getElementById('view-goals-page').classList.remove('hidden');
    document.getElementById('page-title').innerText = "Metas de Gastos";
    document.getElementById('page-subtitle').innerText = "Planejamento mensal por categoria";
    renderDetailedGoalsPage();
}

function showCategoriesView() {
    currentView = 'categories';
    updateNavUI();
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-goals-page').classList.add('hidden');
    document.getElementById('view-categories-page').classList.remove('hidden');
    document.getElementById('page-title').innerText = "Gerenciar Categorias";
    document.getElementById('page-subtitle').innerText = "Adicione ou remova categorias personalizadas";
    renderCategoriesPage();
}

function updateNavUI() {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
}

// --- CRUD CATEGORIAS ---

function renderCategoriesPage() {
    const listExp = document.getElementById('list-cat-expense');
    const listInc = document.getElementById('list-cat-income');
    listExp.innerHTML = '';
    listInc.innerHTML = '';
    categories.expense.forEach(cat => listExp.appendChild(createCategoryItem(cat, 'expense')));
    categories.income.forEach(cat => listInc.appendChild(createCategoryItem(cat, 'income')));
}

function createCategoryItem(name, type) {
    const li = document.createElement('li');
    li.className = 'category-item-row';
    li.innerHTML = `<span>${name}</span><button class="btn-del-cat" onclick="removeCategory('${type}', '${name}')"><i class="fas fa-trash"></i></button>`;
    return li;
}

async function addCategory(type) {
    const inputId = type === 'expense' ? 'new-cat-expense' : 'new-cat-income';
    const input = document.getElementById(inputId);
    const val = input.value.trim();
    if (!val) return;
    const formattedName = val.charAt(0).toUpperCase() + val.slice(1);
    if (categories[type].includes(formattedName)) {
        showAlert("Esta categoria já existe!", "Erro");
        return;
    }
    categories[type].push(formattedName);
    input.value = '';
    await saveCategories();
    renderCategoriesPage();
}

async function removeCategory(type, name) {
    if (await showConfirm(`Remover categoria "${name}"? Transações antigas manterão este nome.`)) {
        categories[type] = categories[type].filter(c => c !== name);
        await saveCategories();
        renderCategoriesPage();
    }
}

async function saveCategories() {
    if (window.pywebview) {
        await pywebview.api.update_categories(categories.income, categories.expense);
        updateCategories();
    }
}

// --- RENDER DASHBOARD ---

function filterTransactions(transactions) {
    const now = new Date();
    return transactions.filter(t => {
        const parts = t.date.split('-');
        const tDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        if (currentFilter === 'all') return true;
        if (currentFilter === 'weekly') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            return tDate >= oneWeekAgo;
        }
        if (currentFilter === 'monthly') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        if (currentFilter === 'annual') return tDate.getFullYear() === now.getFullYear();
        return true;
    });
}

function render() {
    const filtered = filterTransactions(allTransactions);
    const listEl = document.getElementById('transaction-list');
    listEl.innerHTML = '';
    const countBadge = document.getElementById('transaction-count');
    if (countBadge) countBadge.innerText = `${filtered.length} itens`;

    let totalInc = 0;
    let totalExp = 0;
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) listEl.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:30px; font-size:14px;">Nenhum lançamento encontrado.</div>';

    filtered.forEach(t => {
        if (t.type === 'income') totalInc += t.amount; else totalExp += t.amount;
        const parts = t.date.split('-');
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const div = document.createElement('div');
        div.className = 'transaction-item';
        div.innerHTML = `
            <div class="t-info"><div style="display:flex; align-items:center; gap:8px;"><span class="t-desc">${t.description}</span><span class="t-cat-badge">${t.category || 'Geral'}</span></div><span class="t-date">${dateObj.toLocaleDateString('pt-BR')}</span></div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="t-amount ${t.type === 'income' ? 'amount-inc' : 'amount-exp'}">${t.type === 'income' ? '+' : '-'} R$ ${t.amount.toFixed(2)}</span>
                <button class="btn-action btn-edit" onclick="editTransaction('${t.id}')"><i class="fas fa-pencil-alt"></i></button>
                <button class="btn-action btn-delete" onclick="deleteTransaction('${t.id}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
        listEl.appendChild(div);
    });

    document.getElementById('total-income').innerText = `R$ ${totalInc.toFixed(2)}`;
    document.getElementById('total-expense').innerText = `R$ ${totalExp.toFixed(2)}`;
    const balance = totalInc - totalExp;
    const balEl = document.getElementById('total-balance');
    balEl.innerText = `R$ ${balance.toFixed(2)}`;
    balEl.style.color = balance >= 0 ? 'var(--primary-dark)' : 'var(--danger)';

    if (currentChartMode !== 'goals') updateChart(totalInc, totalExp, filtered);
}

// --- RENDER METAS DETALHADAS ---
function renderDetailedGoalsPage() {
    const container = document.getElementById('detailed-goals-grid');
    container.innerHTML = '';
    const now = new Date();
    const currentMonthExpenses = allTransactions.filter(t => {
        const parts = t.date.split('-');
        const tDate = new Date(parts[0], parts[1] - 1, parts[2]);
        return t.type === 'expense' && tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    });
    const spending = {};
    currentMonthExpenses.forEach(t => spending[t.category] = (spending[t.category] || 0) + t.amount);

    categories['expense'].forEach(cat => {
        const spent = spending[cat] || 0;
        const limit = allGoals[cat] || 0;
        const percent = limit > 0 ? (spent / limit) * 100 : (spent > 0 ? 100 : 0);
        let status = 'Dentro da meta', statusColor = 'var(--success)', barClass = 'fill-success';
        if (limit === 0) { status = 'Sem meta definida'; statusColor = 'var(--text-muted)'; }
        else if (percent > 100) { status = 'Meta estourada!'; statusColor = 'var(--danger)'; barClass = 'fill-danger'; }
        else if (percent > 75) { status = 'Atenção'; statusColor = 'var(--warning)'; barClass = 'fill-warning'; }
        const remaining = limit > 0 ? Math.max(0, limit - spent) : 0;

        const card = document.createElement('div');
        card.className = 'goal-card-detailed';
        card.innerHTML = `
            <div class="goal-card-header"><span class="goal-card-title">${cat}</span><button class="btn-icon-small" onclick="promptSetGoal('${cat}', ${limit})"><i class="fas fa-cog"></i></button></div>
            <div class="goal-numbers"><div><span class="goal-label">Gasto</span><span class="goal-amount">R$ ${spent.toFixed(2)}</span></div><div style="text-align:right"><span class="goal-label">Limite</span><span class="goal-amount">R$ ${limit.toFixed(2)}</span></div></div>
            <div class="progress-track large"><div class="progress-fill ${barClass}" style="width: ${Math.min(percent, 100)}%"></div></div>
            <div class="goal-footer"><span style="color: ${statusColor}; font-weight: 500;">${status}</span><span>Restam: <b>R$ ${remaining.toFixed(2)}</b></span></div>
        `;
        container.appendChild(card);
    });
}

// --- CRUD TRANSAÇÕES ---

async function handleTransactionSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('t-id').value;
    const type = document.getElementById('t-type').value;
    const category = document.getElementById('t-category').value;
    const desc = document.getElementById('t-desc').value;
    const amount = document.getElementById('t-amount').value;
    const date = document.getElementById('t-date').value;

    if (window.pywebview) {
        if (id) await pywebview.api.update_transaction(id, type, category, amount, desc, date);
        else await pywebview.api.add_transaction(type, category, amount, desc, date);
        cancelEdit();
        refreshData();
    }
}

function editTransaction(id) {
    const t = allTransactions.find(trans => trans.id === id);
    if (!t) return;
    document.getElementById('t-id').value = t.id;
    document.getElementById('t-type').value = t.type;
    updateCategories(t.category);
    document.getElementById('t-amount').value = t.amount;
    document.getElementById('t-desc').value = t.description;
    document.getElementById('t-date').value = t.date;
    document.getElementById('form-title').innerHTML = '<i class="fas fa-pencil-alt"></i> Editar Transação';
    document.getElementById('btn-submit').innerHTML = 'Atualizar <i class="fas fa-sync-alt"></i>';
    document.getElementById('btn-cancel').classList.remove('hidden');
    document.querySelector('.form-panel').style.borderColor = 'var(--primary)';
}

function cancelEdit() {
    document.getElementById('trans-form').reset();
    document.getElementById('t-id').value = '';
    document.getElementById('t-date').valueAsDate = new Date();
    document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Nova Transação';
    document.getElementById('btn-submit').innerHTML = 'Salvar <i class="fas fa-check"></i>';
    document.getElementById('btn-cancel').classList.add('hidden');
    document.querySelector('.form-panel').style.borderColor = 'rgba(0,0,0,0.03)';
    updateCategories();
}

async function deleteTransaction(id) {
    if (document.getElementById('t-id').value === id) cancelEdit();
    if (await showConfirm('Deseja realmente excluir este registro?')) {
        await pywebview.api.delete_transaction(id);
        refreshData();
    }
}

// --- GRÁFICOS ---
function switchChart(mode) {
    currentChartMode = mode;
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    const index = mode === 'balance' ? 0 : mode === 'category' ? 1 : 2;
    document.querySelectorAll('.toggle-btn')[index].classList.add('active');

    const chartWrapper = document.getElementById('chart-wrapper');
    const goalsContainer = document.getElementById('goals-container');

    if (mode === 'goals') {
        chartWrapper.classList.add('hidden');
        goalsContainer.classList.remove('hidden');
        renderGoals();
    } else {
        goalsContainer.classList.add('hidden');
        chartWrapper.classList.remove('hidden');
        const filtered = filterTransactions(allTransactions);
        let totalInc = 0, totalExp = 0;
        filtered.forEach(t => { if (t.type === 'income') totalInc += t.amount; else totalExp += t.amount; });
        updateChart(totalInc, totalExp, filtered);
    }
}

function renderGoals() {
    const goalsContainer = document.getElementById('goals-container');
    goalsContainer.innerHTML = '';
    const now = new Date();
    const currentMonthExpenses = allTransactions.filter(t => {
        const parts = t.date.split('-');
        const tDate = new Date(parts[0], parts[1] - 1, parts[2]);
        return t.type === 'expense' && tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    });
    const spending = {};
    currentMonthExpenses.forEach(t => spending[t.category] = (spending[t.category] || 0) + t.amount);

    categories['expense'].forEach(cat => {
        const spent = spending[cat] || 0;
        const limit = allGoals[cat] || 0;
        if (limit > 0 || spent > 0) {
            const percent = limit > 0 ? (spent / limit) * 100 : (spent > 0 ? 100 : 0);
            let colorClass = 'fill-success';
            if (percent > 75) colorClass = 'fill-warning';
            if (percent > 100 || (limit === 0 && spent > 0)) colorClass = 'fill-danger';
            const div = document.createElement('div');
            div.className = 'goal-item';
            div.onclick = () => promptSetGoal(cat, limit);
            div.title = "Clique para alterar a meta";
            div.innerHTML = `<div class="goal-header"><span>${cat}</span><span class="goal-limit">R$ ${spent.toFixed(0)} / ${limit > 0 ? 'R$ ' + limit.toFixed(0) : 'Sem limite'}</span></div><div class="progress-track"><div class="progress-fill ${colorClass}" style="width: ${Math.min(percent, 100)}%"></div></div>`;
            goalsContainer.appendChild(div);
        }
    });
    if (!goalsContainer.innerHTML) goalsContainer.innerHTML = `<div class="empty-state"><p>Nenhuma meta ou gasto este mês.</p></div>`;
}

function updateChart(income, expense, transactions) {
    const ctx = document.getElementById('miniChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    let labels, data, colors;
    if (currentChartMode === 'balance') {
        labels = ['Receitas', 'Despesas']; colors = ['#10b981', '#ef4444'];
        if (income === 0 && expense === 0) { data = [1]; colors = ['#e2e8f0']; labels = ['Vazio']; }
        else { data = [income, expense]; }
    } else if (currentChartMode === 'category') {
        const expenses = transactions.filter(t => t.type === 'expense');
        if (expenses.length === 0) { labels = ['Sem despesas']; data = [1]; colors = ['#e2e8f0']; }
        else {
            const catTotals = {};
            expenses.forEach(t => { const cat = t.category || 'Outro'; catTotals[cat] = (catTotals[cat] || 0) + t.amount; });
            labels = Object.keys(catTotals); data = Object.values(catTotals);
            colors = categoryColors.slice(0, labels.length);
        }
    }
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { font: { family: 'Outfit', size: 10 }, usePointStyle: true, boxWidth: 8, padding: 10 } } } }
    });
}

// --- EXPORTAÇÃO E IMPRESSÃO ---

async function exportData() {
    if (window.pywebview) {
        document.body.style.cursor = 'wait';
        try {
            const res = await pywebview.api.export_csv();
            if (res.status === 'success') showAlert('Arquivo exportado com sucesso!\nSalvo em: ' + res.path, "Sucesso");
            else if (res.status === 'error') showAlert('Erro ao exportar: ' + res.message, "Erro");
        } catch (e) { console.error(e); showAlert('Erro de comunicação.'); }
        finally { document.body.style.cursor = 'default'; }
    }
}

function openPrintModal() { document.getElementById('print-modal').classList.remove('hidden'); }
function closePrintModal() { document.getElementById('print-modal').classList.add('hidden'); }

function confirmPrint(type) {
    closePrintModal();
    document.getElementById('printable-list').classList.remove('print-visible');
    document.getElementById('printable-dashboard').classList.remove('print-visible');
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR');
    document.querySelectorAll('.print-date-fill').forEach(el => el.innerText = dateStr);

    if (type === 'weekly' || type === 'monthly') {
        prepareDetailedPrint(type);
        document.getElementById('printable-list').classList.add('print-visible');
    } else {
        prepareDashboardPrint(type);
        document.getElementById('printable-dashboard').classList.add('print-visible');
    }
    setTimeout(() => window.print(), 200);
}

function prepareDetailedPrint(type) {
    const now = new Date();
    let filteredData = allTransactions.filter(t => {
        const parts = t.date.split('-');
        const tDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        if (type === 'weekly') { const d = new Date(); d.setDate(now.getDate() - 7); return tDate >= d; }
        if (type === 'monthly') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        return true;
    });

    document.getElementById('print-list-period').innerText = type === 'weekly' ? 'Últimos 7 dias' : 'Mês Atual';
    const tbody = document.getElementById('print-table-body');
    tbody.innerHTML = '';
    let totalInc = 0, totalExp = 0;
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

    filteredData.forEach(t => {
        if (t.type === 'income') totalInc += t.amount; else totalExp += t.amount;
        const parts = t.date.split('-');
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${parts[2]}/${parts[1]}/${parts[0]}</td><td>${t.type === 'income' ? 'Receita' : 'Despesa'}</td><td>${t.category || '-'}</td><td>${t.description}</td><td style="text-align:right">${t.type === 'income' ? '+' : '-'} R$ ${t.amount.toFixed(2)}</td>`;
        tbody.appendChild(tr);
    });
    document.getElementById('pl-inc').innerText = `R$ ${totalInc.toFixed(2)}`;
    document.getElementById('pl-exp').innerText = `R$ ${totalExp.toFixed(2)}`;
    document.getElementById('pl-bal').innerText = `R$ ${(totalInc - totalExp).toFixed(2)}`;
}

function prepareDashboardPrint(type) {
    const now = new Date();
    let filteredData = allTransactions;
    if (type === 'annual') {
        filteredData = allTransactions.filter(t => parseInt(t.date.split('-')[0]) === now.getFullYear());
        document.getElementById('print-dash-period').innerText = `Resumo Anual (${now.getFullYear()})`;
    } else {
        document.getElementById('print-dash-period').innerText = `Resumo Geral`;
    }

    let totalInc = 0, totalExp = 0;
    const catTotals = {}, monthlyTotals = {};
    filteredData.forEach(t => {
        if (t.type === 'income') totalInc += t.amount;
        else {
            totalExp += t.amount;
            const cat = t.category || 'Outros';
            catTotals[cat] = (catTotals[cat] || 0) + t.amount;
        }
        const monthKey = t.date.substring(0, 7);
        if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = { inc: 0, exp: 0 };
        if (t.type === 'income') monthlyTotals[monthKey].inc += t.amount; else monthlyTotals[monthKey].exp += t.amount;
    });

    document.getElementById('pd-inc').innerText = `R$ ${totalInc.toFixed(2)}`;
    document.getElementById('pd-exp').innerText = `R$ ${totalExp.toFixed(2)}`;
    document.getElementById('pd-bal').innerText = `R$ ${(totalInc - totalExp).toFixed(2)}`;

    const barsContainer = document.getElementById('print-cat-bars');
    barsContainer.innerHTML = '';
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const maxVal = sortedCats.length > 0 ? sortedCats[0][1] : 0;
    if (sortedCats.length === 0) barsContainer.innerHTML = '<p style="text-align:center;color:#999">Sem despesas.</p>';
    sortedCats.forEach(([cat, val]) => {
        const percent = maxVal > 0 ? (val / maxVal) * 100 : 0;
        const div = document.createElement('div');
        div.className = 'print-bar-item';
        div.innerHTML = `<span class="print-bar-label">${cat}</span><div class="print-bar-track"><div class="print-bar-fill" style="width: ${percent}%; background-color: #3c096c;"></div></div><span class="print-bar-value">R$ ${val.toFixed(2)}</span>`;
        barsContainer.appendChild(div);
    });

    const monthBody = document.getElementById('print-month-body');
    monthBody.innerHTML = '';
    const sortedMonths = Object.keys(monthlyTotals).sort();
    if (sortedMonths.length === 0) monthBody.innerHTML = '<tr><td colspan="4" style="text-align:center">Sem dados.</td></tr>';
    sortedMonths.forEach(m => {
        const data = monthlyTotals[m];
        const [ano, mes] = m.split('-');
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${mes}/${ano}</td><td style="text-align:right">R$ ${data.inc.toFixed(2)}</td><td style="text-align:right">R$ ${data.exp.toFixed(2)}</td><td style="text-align:right"><b>R$ ${(data.inc - data.exp).toFixed(2)}</b></td>`;
        monthBody.appendChild(tr);
    });
}