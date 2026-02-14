# 💰 FinPy – Gerenciador Financeiro Pessoal

![GitHub repo size](https://img.shields.io/github/repo-size/ArthurFelipe27/finpy?style=for-the-badge)
![GitHub language count](https://img.shields.io/github/languages/count/ArthurFelipe27/finpy?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/ArthurFelipe27/finpy?style=for-the-badge)
![License](https://img.shields.io/github/license/seu-usuario/finpy?style=for-the-badge)

> **FinPy** é uma aplicação desktop leve e moderna para **gerenciamento de finanças pessoais**, desenvolvida em **Python** com interface Web integrada via **PyWebView**. O sistema oferece controle financeiro prático, visual e sem necessidade de bancos de dados complexos.

---

## ✨ Funcionalidades Principais

* 📊 **Dashboard Interativo**  
  Cards com saldo total, receitas e despesas, além de gráficos dinâmicos (Receita × Despesa e despesas por categoria) e histórico recente de transações.

* 📝 **Gestão de Transações**  
  Cadastro, edição e exclusão de receitas e despesas com descrição, valor, data e categoria, através de formulários simples e intuitivos.

* 🎯 **Metas e Orçamento**  
  Definição de limites de gastos por categoria, com barras de progresso visuais que indicam o consumo da meta (verde, amarelo e vermelho).

* 🏷️ **Categorias Personalizáveis**  
  Criação e remoção de categorias de Receita e Despesa conforme a necessidade do usuário.

* 🖨️ **Relatórios e Exportação**  
  Exportação de dados em **CSV** e layouts otimizados para impressão de relatórios semanais, mensais ou anuais.

---

## 💻 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado:

* 🐍 **Python 3.x**
* 📦 **Pip** (gerenciador de pacotes do Python)
* 💻 Sistema operacional **Windows, Linux ou macOS**

---

## 🚀 Tecnologias Utilizadas

### 🧩 Backend

* 🐍 **Python 3**
* 🪟 **PyWebView** — Janela desktop e ponte Python ↔ JavaScript
* 📁 **JSON** — Persistência de dados local
* 🧰 **uuid, csv, datetime** — Bibliotecas padrão do Python

### 🎨 Frontend

* 🧱 **HTML5**
* 💅 **CSS3** — Variáveis CSS, Flexbox e Grid
* ⚡ **JavaScript (Vanilla)**

### 📊 Visualização e UI

* 📈 **Chart.js** — Gráficos dinâmicos
* 🎨 **FontAwesome** — Ícones
* 🔤 **Google Fonts** — Fonte *Outfit*

---

## ⚙️ Instalação e Execução

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/seu-usuario/finpy.git
cd finpy
```

---

### 2️⃣ Instale as dependências

```bash
pip install pywebview
```

> ⚠️ Dependendo do sistema operacional, pode ser necessário instalar dependências adicionais de GUI.

---

### 3️⃣ Execute a aplicação

```bash
python app_financeiro.py
```

Na primeira execução, o arquivo `dados_financeiros.json` será criado automaticamente para armazenar os dados do usuário.

---

## 📂 Estrutura de Pastas

```text
finpy/
├── app_financeiro.py         # Backend principal (lógica, API e inicialização)
├── dados_financeiros.json   # Banco de dados local (gerado automaticamente)
├── favicon.ico              # Ícone da aplicação
└── web/                     # Interface do usuário
    ├── index.html           # Estrutura HTML
    ├── style.css            # Estilos e temas
    └── script.js            # Lógica frontend e comunicação com Python
```

---

## 🎨 Layout e Design

* 🎨 Tema moderno com tons de roxo (**#3c096c**)
* 📐 Layout responsivo adaptável ao tamanho da janela
* 📂 **Sidebar** para navegação entre Dashboard, Metas e Configurações
* 🔔 **Modais personalizados** para alertas e confirmações
* 🎯 Feedback visual por cores:
  * 🟢 Receitas / dentro da meta  
  * 🔴 Despesas / meta estourada  

---

## 📸 Demonstração

### Dashboard Principal
<img width="1905" height="944" alt="Captura de tela 2026-02-05 230135" src="https://github.com/user-attachments/assets/f8c316b1-f8d1-43a9-8195-57160bc87ba2" />


### Metas e Orçamento
<img width="1906" height="992" alt="Captura de tela 2026-02-05 230242" src="https://github.com/user-attachments/assets/23cd0290-623d-4317-a1ba-42b28199bfee" />


---

## 🤝 Contribuição

Contribuições são bem-vindas!

1. Faça um **Fork** do projeto  
2. Crie uma branch para sua feature  
   ```bash
   git checkout -b feature/NovaFeature
   ```
3. Faça o commit  
   ```bash
   git commit -m "Adicionando nova feature"
   ```
4. Faça o push  
   ```bash
   git push origin feature/NovaFeature
   ```
5. Abra um **Pull Request**

---

## 🧑‍💻 Autor

**Arthur Felipe**  
🌐 GitHub: https://github.com/ArthurFelipe27  

---

## 📝 Licença

Este projeto está licenciado sob a **Licença MIT**.

---

💡 *Projeto desenvolvido para demonstrar um gerenciador financeiro pessoal moderno, utilizando Python e tecnologias web integradas em uma aplicação desktop.*
