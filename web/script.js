let allTransactions = [];
let allGoals = {};
let currentFilter = 'all';
let currentChartMode = 'balance'; // 'balance', 'category', 'goals'
let currentView = 'dashboard'; // 'dashboard' ou 'goals'
let chartInstance = null;

// Categorias
const categories = {
    expense: ['Alimentação', 'Lazer', 'Básico', 'Transporte', 'Saúde', 'Educação', 'Moradia', 'Outro'],
    income: ['Salário', 'Freelancer', 'Investimentos', 'Presente', 'Vendas', 'Outro']
};

const categoryColors = [
    '#3c096c', '#7b2cbf', '#9d4edd', '#c77dff',
    '#e0aaff', '#ff9e00', '#ff006e', '#3a86ff'
];

// --- INICIALIZAÇÃO ---

window.addEventListener('pywebviewready', function () {
    refreshData();
});

window.onload = function () {
    startClock();
    updateCategories();

    // Define a data do input para hoje
    const dateInput = document.getElementById('t-date');
    if (dateInput) dateInput.valueAsDate = new Date();

    if (!window.pywebview) {
        console.log("Modo navegador (teste sem backend)");
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
    const type = typeSelect.value;

    catSelect.innerHTML = '';

    categories[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.innerText = cat;
        if (selectedCategory && selectedCategory === cat) {
            option.selected = true;
        }
        catSelect.appendChild(option);
    });
}

async function refreshData() {
    try {
        if (window.pywebview) {
            const data = await pywebview.api.get_data();
            allTransactions = data.transactions;
            allGoals = data.goals || {};

            // Renderiza com base na view atual
            if (currentView === 'dashboard') {
                render();
                // Se o widget de metas estiver ativo no dashboard, atualiza ele também
                if (currentChartMode === 'goals') renderGoals();
            } else {
                renderDetailedGoalsPage();
            }
        }
    } catch (e) {
        console.error("Erro ao buscar dados", e);
    }
}

// --- NAVEGAÇÃO E FILTROS ---

function setFilter(filter) {
    currentFilter = filter;
    currentView = 'dashboard';

    // UI Updates
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    document.getElementById('view-dashboard').classList.remove('hidden');
    document.getElementById('view-goals-page').classList.add('hidden');
    document.getElementById('page-subtitle').innerText = "Acompanhe suas finanças";

    const titles = {
        'all': 'Visão Geral',
        'weekly': 'Relatório Semanal',
        'monthly': 'Relatório Mensal',
        'annual': 'Relatório Anual'
    };
    document.getElementById('page-title').innerText = titles[filter];
    render();
}

function showGoalsView() {
    currentView = 'goals';

    // UI Updates
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-goals-page').classList.remove('hidden');

    document.getElementById('page-title').innerText = "Metas de Gastos";
    document.getElementById('page-subtitle').innerText = "Planejamento mensal por categoria";

    renderDetailedGoalsPage();
}

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
        if (currentFilter === 'monthly') {
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        }
        if (currentFilter === 'annual') {
            return tDate.getFullYear() === now.getFullYear();
        }
        return true;
    });
}

// --- RENDERIZAÇÃO (DASHBOARD) ---

function render() {
    const filtered = filterTransactions(allTransactions);
    const listEl = document.getElementById('transaction-list');
    listEl.innerHTML = '';

    const countBadge = document.getElementById('transaction-count');
    if (countBadge) countBadge.innerText = `${filtered.length} itens`;

    let totalInc = 0;
    let totalExp = 0;

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:30px; font-size:14px;">Nenhum lançamento encontrado.</div>';
    }

    filtered.forEach(t => {
        if (t.type === 'income') totalInc += t.amount;
        else totalExp += t.amount;

        const parts = t.date.split('-');
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);

        const div = document.createElement('div');
        div.className = 'transaction-item';
        div.innerHTML = `
            <div class="t-info">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="t-desc">${t.description}</span>
                    <span class="t-cat-badge">${t.category || 'Geral'}</span>
                </div>
                <span class="t-date">${dateObj.toLocaleDateString('pt-BR')}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="t-amount ${t.type === 'income' ? 'amount-inc' : 'amount-exp'}">
                    ${t.type === 'income' ? '+' : '-'} R$ ${t.amount.toFixed(2)}
                </span>
                <button class="btn-action btn-edit" title="Editar" onclick="editTransaction('${t.id}')">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="btn-action btn-delete" title="Excluir" onclick="deleteTransaction('${t.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        listEl.appendChild(div);
    });

    document.getElementById('total-income').innerText = `R$ ${totalInc.toFixed(2)}`;
    document.getElementById('total-expense').innerText = `R$ ${totalExp.toFixed(2)}`;
    const balance = totalInc - totalExp;
    document.getElementById('total-balance').innerText = `R$ ${balance.toFixed(2)}`;
    document.getElementById('total-balance').style.color = balance >= 0 ? 'var(--primary-dark)' : 'var(--danger)';

    // Atualiza o gráfico se não estiver no modo "Metas"
    if (currentChartMode !== 'goals') {
        updateChart(totalInc, totalExp, filtered);
    }
}

// --- RENDERIZAÇÃO (PÁGINA DE METAS) ---

function renderDetailedGoalsPage() {
    const container = document.getElementById('detailed-goals-grid');
    container.innerHTML = '';

    const now = new Date();
    // Filtra gastos DO MÊS ATUAL
    const currentMonthExpenses = allTransactions.filter(t => {
        const parts = t.date.split('-');
        const tDate = new Date(parts[0], parts[1] - 1, parts[2]);
        return t.type === 'expense' &&
            tDate.getMonth() === now.getMonth() &&
            tDate.getFullYear() === now.getFullYear();
    });

    const spending = {};
    currentMonthExpenses.forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
    });

    const expenseCats = categories['expense'];

    expenseCats.forEach(cat => {
        const spent = spending[cat] || 0;
        const limit = allGoals[cat] || 0;

        const percent = limit > 0 ? (spent / limit) * 100 : (spent > 0 ? 100 : 0);
        let status = 'Dentro da meta';
        let statusColor = 'var(--success)';
        let barClass = 'fill-success';

        if (limit === 0) {
            status = 'Sem meta definida';
            statusColor = 'var(--text-muted)';
            barClass = 'fill-success'; // padrão
        } else if (percent > 100) {
            status = 'Meta estourada!';
            statusColor = 'var(--danger)';
            barClass = 'fill-danger';
        } else if (percent > 75) {
            status = 'Atenção';
            statusColor = 'var(--warning)';
            barClass = 'fill-warning';
        }

        const remaining = limit > 0 ? Math.max(0, limit - spent) : 0;

        const card = document.createElement('div');
        card.className = 'goal-card-detailed';
        card.innerHTML = `
            <div class="goal-card-header">
                <span class="goal-card-title">${cat}</span>
                <button class="btn-icon-small" onclick="promptSetGoal('${cat}', ${limit})"><i class="fas fa-cog"></i></button>
            </div>
            
            <div class="goal-numbers">
                <div>
                    <span class="goal-label">Gasto</span>
                    <span class="goal-amount">R$ ${spent.toFixed(2)}</span>
                </div>
                <div style="text-align:right">
                    <span class="goal-label">Limite</span>
                    <span class="goal-amount">R$ ${limit.toFixed(2)}</span>
                </div>
            </div>

            <div class="progress-track large">
                <div class="progress-fill ${barClass}" style="width: ${Math.min(percent, 100)}%"></div>
            </div>

            <div class="goal-footer">
                <span style="color: ${statusColor}; font-weight: 500;">${status}</span>
                <span>Restam: <b>R$ ${remaining.toFixed(2)}</b></span>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- CRUD TRANSAÇÕES (ADD / EDIT / DELETE) ---

async function handleTransactionSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('t-id').value;
    const type = document.getElementById('t-type').value;
    const category = document.getElementById('t-category').value;
    const desc = document.getElementById('t-desc').value;
    const amount = document.getElementById('t-amount').value;
    const date = document.getElementById('t-date').value;

    if (window.pywebview) {
        if (id) {
            await pywebview.api.update_transaction(id, type, category, amount, desc, date);
        } else {
            await pywebview.api.add_transaction(type, category, amount, desc, date);
        }
        cancelEdit();
        refreshData();
    }
}

function editTransaction(id) {
    const t = allTransactions.find(trans => trans.id === id);
    if (!t) return;
    document.getElementById('t-id').value = t.id;
    document.getElementById('t-type').value = t.type;
    updateCategories(t.category); // Atualiza select e seleciona a categoria certa
    document.getElementById('t-amount').value = t.amount;
    document.getElementById('t-desc').value = t.description;
    document.getElementById('t-date').value = t.date;

    // Ajusta UI para modo edição
    document.getElementById('form-title').innerHTML = '<i class="fas fa-pencil-alt"></i> Editar Transação';
    document.getElementById('btn-submit').innerHTML = 'Atualizar <i class="fas fa-sync-alt"></i>';
    document.getElementById('btn-cancel').classList.remove('hidden');
    document.querySelector('.form-panel').style.borderColor = 'var(--primary)';
}

function cancelEdit() {
    document.getElementById('trans-form').reset();
    document.getElementById('t-id').value = '';
    document.getElementById('t-date').valueAsDate = new Date();

    // Reseta UI para modo criação
    document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Nova Transação';
    document.getElementById('btn-submit').innerHTML = 'Salvar <i class="fas fa-check"></i>';
    document.getElementById('btn-cancel').classList.add('hidden');
    document.querySelector('.form-panel').style.borderColor = 'rgba(0,0,0,0.03)';
    updateCategories(); // Reseta categorias
}

async function deleteTransaction(id) {
    // Se estiver editando este item, cancela primeiro
    if (document.getElementById('t-id').value === id) cancelEdit();

    if (confirm('Deseja excluir este registro?')) {
        await pywebview.api.delete_transaction(id);
        refreshData();
    }
}

// --- GRÁFICOS E WIDGET DE METAS ---

function switchChart(mode) {
    currentChartMode = mode;

    // Atualiza botões
    const buttons = document.querySelectorAll('.toggle-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const index = mode === 'balance' ? 0 : mode === 'category' ? 1 : 2;
    buttons[index].classList.add('active');

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
        filtered.forEach(t => {
            if (t.type === 'income') totalInc += t.amount;
            else totalExp += t.amount;
        });
        updateChart(totalInc, totalExp, filtered);
    }
}

function renderGoals() {
    const goalsContainer = document.getElementById('goals-container');
    goalsContainer.innerHTML = '';

    const now = new Date();
    // Filtra apenas despesas do Mês Atual para o widget
    const currentMonthExpenses = allTransactions.filter(t => {
        const parts = t.date.split('-');
        const tDate = new Date(parts[0], parts[1] - 1, parts[2]);
        return t.type === 'expense' &&
            tDate.getMonth() === now.getMonth() &&
            tDate.getFullYear() === now.getFullYear();
    });

    const spending = {};
    currentMonthExpenses.forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
    });

    const expenseCats = categories['expense'];
    let hasGoals = false;

    expenseCats.forEach(cat => {
        const spent = spending[cat] || 0;
        const limit = allGoals[cat] || 0;

        // Exibe se tiver meta OU se tiver gasto
        if (limit > 0 || spent > 0) {
            hasGoals = true;
            const percent = limit > 0 ? (spent / limit) * 100 : (spent > 0 ? 100 : 0);

            let colorClass = 'fill-success';
            if (percent > 75) colorClass = 'fill-warning';
            if (percent > 100 || (limit === 0 && spent > 0)) colorClass = 'fill-danger';

            const div = document.createElement('div');
            div.className = 'goal-item';
            div.onclick = () => promptSetGoal(cat, limit);
            div.title = "Clique para alterar a meta";

            div.innerHTML = `
                <div class="goal-header">
                    <span>${cat}</span>
                    <span class="goal-limit">
                        R$ ${spent.toFixed(0)} / ${limit > 0 ? 'R$ ' + limit.toFixed(0) : 'Sem limite'}
                    </span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill ${colorClass}" style="width: ${Math.min(percent, 100)}%"></div>
                </div>
            `;
            goalsContainer.appendChild(div);
        }
    });

    if (!hasGoals) {
        goalsContainer.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma meta ou gasto este mês.</p>
                <button onclick="promptSetGoal('Alimentação', 0)" style="margin-top:10px; border:none; color:var(--primary); background:none; cursor:pointer; text-decoration:underline;">
                    Definir meta de Alimentação
                </button>
            </div>
        `;
    }
}

async function promptSetGoal(category, currentLimit) {
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

function updateChart(income, expense, transactions) {
    const ctx = document.getElementById('miniChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    let labels, data, colors;

    if (currentChartMode === 'balance') {
        labels = ['Receitas', 'Despesas'];
        colors = ['#10b981', '#ef4444'];
        if (income === 0 && expense === 0) {
            data = [1]; colors = ['#e2e8f0']; labels = ['Vazio'];
        } else {
            data = [income, expense];
        }
    } else if (currentChartMode === 'category') {
        const expenses = transactions.filter(t => t.type === 'expense');
        if (expenses.length === 0) {
            labels = ['Sem despesas']; data = [1]; colors = ['#e2e8f0'];
        } else {
            const catTotals = {};
            expenses.forEach(t => {
                const cat = t.category || 'Outro';
                catTotals[cat] = (catTotals[cat] || 0) + t.amount;
            });
            labels = Object.keys(catTotals);
            data = Object.values(catTotals);
            colors = categoryColors.slice(0, labels.length);
        }
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'right', labels: { font: { family: 'Outfit', size: 10 }, usePointStyle: true, boxWidth: 8, padding: 10 } }
            }
        }
    });
}

// --- EXPORTAÇÃO (CSV) ---

async function exportData() {
    if (window.pywebview) {
        document.body.style.cursor = 'wait';
        try {
            const res = await pywebview.api.export_csv();
            if (res.status === 'success') {
                alert('Arquivo exportado com sucesso!\nSalvo em: ' + res.path);
            } else if (res.status === 'error') {
                alert('Erro ao exportar: ' + res.message);
            }
        } catch (e) {
            console.error(e);
            alert('Erro de comunicação.');
        } finally {
            document.body.style.cursor = 'default';
        }
    } else {
        alert("Funcionalidade disponível apenas na versão desktop.");
    }
}

// --- IMPRESSÃO (PDF) ---

function printReport() {
    // 1. Prepara cabeçalho
    const dateEl = document.getElementById('print-date');
    dateEl.innerText = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR');

    // 2. Prepara tabela
    // Imprime o que está no filtro atual (ex: mensal, anual)
    const transactionsToPrint = filterTransactions(allTransactions);
    let totalInc = 0, totalExp = 0;

    const tbody = document.getElementById('print-table-body');
    tbody.innerHTML = '';

    // Ordenação Cronológica
    transactionsToPrint.sort((a, b) => new Date(a.date) - new Date(b.date));

    transactionsToPrint.forEach(t => {
        if (t.type === 'income') totalInc += t.amount;
        else totalExp += t.amount;

        const parts = t.date.split('-');
        const dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`; // Formato DD/MM/YYYY

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dateStr}</td>
            <td>${t.type === 'income' ? 'Receita' : 'Despesa'}</td>
            <td>${t.category || '-'}</td>
            <td>${t.description}</td>
            <td style="text-align:right; color: ${t.type === 'income' ? 'green' : 'red'}">
                ${t.type === 'income' ? '+' : '-'} R$ ${t.amount.toFixed(2)}
            </td>
        `;
        tbody.appendChild(tr);
    });

    // 3. Prepara Resumo
    document.getElementById('p-total-inc').innerText = `R$ ${totalInc.toFixed(2)}`;
    document.getElementById('p-total-exp').innerText = `R$ ${totalExp.toFixed(2)}`;
    const bal = totalInc - totalExp;
    document.getElementById('p-total-bal').innerText = `R$ ${bal.toFixed(2)}`;
    document.getElementById('p-total-bal').style.color = bal >= 0 ? 'black' : 'red';

    // 4. Executa Impressão (com pequeno delay para DOM atualizar)
    setTimeout(() => {
        window.print();
    }, 100);
}