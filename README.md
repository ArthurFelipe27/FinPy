# FinPy - Gerenciador Financeiro 💰

FinPy é uma aplicação desktop leve e moderna para gerenciamento de finanças pessoais. Desenvolvido com uma combinação poderosa de Python no backend (para lógica e persistência de dados) e tecnologias web (HTML5, CSS3, JavaScript) no frontend, renderizados através do pywebview.

O objetivo do FinPy é oferecer uma experiência de usuário fluida, com uma interface bonita e funcionalidades práticas para o dia a dia, sem a necessidade de configurar bancos de dados complexos.

## ✨ Funcionalidades

### 📊 Dashboard Interativo

Visão Geral: Cards com Saldo Total, Receitas e Despesas.

Gráficos Dinâmicos: Visualização de despesas por categoria ou balanço (Receita vs Despesa) usando Chart.js.

Histórico Recente: Lista das últimas transações com fácil acesso para edição ou exclusão.

### 📝 Gestão de Transações

Adicione receitas e despesas com descrição, valor, data e categoria.

Edição e remoção de lançamentos existentes.

Interface de formulário limpa e intuitiva.

### 🎯 Metas e Orçamento

Defina limites de gastos (metas) por categoria.

Barras de Progresso: Acompanhe visualmente o quanto você já gastou de cada meta (verde, amarelo e vermelho conforme o limite se aproxima).

### 🏷️ Categorias Personalizáveis

O sistema já vem com categorias padrão, mas você pode criar ou excluir categorias de Receita e Despesa conforme sua necessidade.

### 🖨️ Relatórios e Exportação

Exportação CSV: Exporte todos os seus dados para usar em planilhas (Excel/Google Sheets).

Modo de Impressão: Layouts CSS específicos para impressão de relatórios Semanais, Mensais ou Anuais.

## 🛠️ Tecnologias Utilizadas

**Backend: Python 3**

pywebview: Para criar a janela da aplicação e comunicar Python com JS.

json: Para persistência de dados local (banco de dados em arquivo).

uuid, csv, datetime: Bibliotecas padrão.

**Frontend:**

HTML5 & CSS3 (Variáveis CSS, Flexbox, Grid).

JavaScript (Vanilla).

Chart.js: Para renderização dos gráficos.

FontAwesome: Para ícones.

Google Fonts: Fonte 'Outfit'.

## 🚀 Instalação e Uso

**Pré-requisitos**

Certifique-se de ter o Python 3.x instalado em sua máquina.

**Passo a Passo**

1. Clone o repositório:

``git clone [https://github.com/seu-usuario/finpy.git](https://github.com/seu-usuario/finpy.git)
cd finpy``


2. Instale as dependências:
O projeto utiliza principalmente o pywebview. Dependendo do seu sistema operacional, pode ser necessário instalar dependências de GUI específicas (no Windows geralmente instala direto).
``
pip install pywebview
``

3. Execute a aplicação:
``
python app_financeiro.py
``

A janela do aplicativo se abrirá e um arquivo dados_financeiros.json será criado automaticamente na primeira execução para salvar seus dados.

## 📂 Estrutura do Projeto

finpy/  
│  
├── app_financeiro.py    # Backend principal (Lógica, API e Inicialização)  
├── dados_financeiros.json # Banco de dados local (gerado automaticamente)  
├── favicon.ico          # Ícone da aplicação  
│  
└── web/                 # Interface do Usuário  
    ├── index.html       # Estrutura HTML  
    ├── style.css        # Estilos e temas  
    └── script.js        # Lógica de frontend e comunicação com Python  


## 🎨 Layout e Design

O FinPy utiliza um tema moderno com tons de roxo (#3c096c) e layouts responsivos que se adaptam ao tamanho da janela.

Sidebar: Navegação rápida entre Dashboard, Metas e Configurações.

Modais: Alertas e confirmações personalizados (substituindo os popups nativos do navegador).

Feedback Visual: Cores para indicar status financeiro (Verde para receitas/dentro da meta, Vermelho para despesas/meta estourada).

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir Issues ou enviar Pull Requests.

1. Faça um Fork do projeto.

2. Crie uma Branch para sua Feature (``git checkout -b feature/NovaFeature``).

3. Faça o Commit (``git commit -m 'Adicionando nova feature'``).

4. Faça o Push (``git push origin feature/NovaFeature``).

5. Abra um Pull Request.

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se livre para usar e modificar.

Desenvolvido por Arthur Felipe.
