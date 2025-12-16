let allTransactions = [];
let currentFilter = 'all';
let chartInstance = null;

// Definição das Categorias
const categories = {
    expense: ['Alimentação', 'Lazer', 'Básico', 'Transporte', 'Saúde', 'Educação', 'Moradia', 'Outro'],
    income: ['Salário', 'Freelancer', 'Investimentos', 'Presente', 'Vendas', 'Outro']
};

// Inicialização
window.addEventListener('pywebviewready', function () {
    refreshData();
});

window.onload = function () {
    startClock();
    updateCategories(); // Popula categorias iniciais

    // Data padrão hoje
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

// Atualiza o select de categorias baseado no tipo
function updateCategories() {
    const typeSelect = document.getElementById('t-type');
    const catSelect = document.getElementById('t-category');
    const type = typeSelect.value; // 'expense' ou 'income'

    catSelect.innerHTML = ''; // Limpa opções

    categories[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.innerText = cat;
        catSelect.appendChild(option);
    });
}

async function refreshData() {
    try {
        if (window.pywebview) {
            allTransactions = await pywebview.api.get_transactions();
            render();
        }
    } catch (e) {
        console.error("Erro ao buscar dados", e);
    }
}

function setFilter(filter) {
    currentFilter = filter;

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    const titles = {
        'all': 'Visão Geral',
        'weekly': 'Relatório Semanal',
        'monthly': 'Relatório Mensal',
        'annual': 'Relatório Anual'
    };
    document.getElementById('page-title').innerText = titles[filter];
    render();
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
        // Adicionamos a Badge de Categoria aqui
        div.innerHTML = `
            <div class="t-info">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="t-desc">${t.description}</span>
                    <span class="t-cat-badge">${t.category || 'Geral'}</span>
                </div>
                <span class="t-date">${dateObj.toLocaleDateString('pt-BR')}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="t-amount ${t.type === 'income' ? 'amount-inc' : 'amount-exp'}">
                    ${t.type === 'income' ? '+' : '-'} R$ ${t.amount.toFixed(2)}
                </span>
                <button class="btn-delete" title="Excluir" onclick="deleteTransaction('${t.id}')">
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

    updateChart(totalInc, totalExp);
}

async function addTransaction(e) {
    e.preventDefault();
    const type = document.getElementById('t-type').value;
    const category = document.getElementById('t-category').value; // Pega a categoria
    const desc = document.getElementById('t-desc').value;
    const amount = document.getElementById('t-amount').value;
    const date = document.getElementById('t-date').value;

    if (window.pywebview) {
        await pywebview.api.add_transaction(type, category, amount, desc, date);

        // Reset inteligente: mantém a data
        document.getElementById('t-desc').value = '';
        document.getElementById('t-amount').value = '';

        refreshData();
    }
}

async function deleteTransaction(id) {
    if (confirm('Deseja excluir este registro?')) {
        await pywebview.api.delete_transaction(id);
        refreshData();
    }
}

function updateChart(income, expense) {
    const ctx = document.getElementById('miniChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    let data = [income, expense];
    let colors = ['#10b981', '#ef4444']; // Verde e Vermelho

    if (income === 0 && expense === 0) {
        data = [1];
        colors = ['#e2e8f0']; // Cinza se vazio
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: income === 0 && expense === 0 ? ['Vazio'] : ['Receitas', 'Despesas'],
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Outfit', size: 11 },
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: { enabled: (income > 0 || expense > 0) }
            }
        }
    });
}