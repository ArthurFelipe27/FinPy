# 💰 FinPy – Gerenciador Financeiro Pessoal Inteligente

![GitHub repo size](https://img.shields.io/github/repo-size/ArthurFelipe27/finpy?style=for-the-badge)
![GitHub language count](https://img.shields.io/github/languages/count/ArthurFelipe27/finpy?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/ArthurFelipe27/finpy?style=for-the-badge)
![License](https://img.shields.io/github/license/seu-usuario/finpy?style=for-the-badge)

> **FinPy** é uma aplicação desktop moderna para **gerenciamento e planejamento financeiro inteligente**, desenvolvida em **Python** com interface Web integrada via **PyWebView**.  
> Agora com recursos de **Inteligência Artificial**, previsão de gastos e simulação de investimentos.

---

# 🚀 Versão 2.5 – Inteligência Financeira Aplicada

## 🧠 Inteligência & Previsão (IA)

🔮 **Previsão de Gastos**  
Utiliza **Regressão Linear** com base no seu histórico financeiro (mínimo de 3 meses) para projetar quanto você gastará no próximo mês.

📊 **Análise de Tendência**  
Indica automaticamente se seus gastos estão em:

- 📈 Alta  
- 📉 Queda  
- ➖ Estabilidade  

⚠️ **Alertas Inteligentes**

O sistema avisa proativamente se:

- Você está gastando **15% acima da previsão**
- Sua **taxa de economia** está baixa
- Você atingiu **90% da meta**
- Você **estourou o orçamento** de uma categoria

---

# ✨ Funcionalidades Principais

## 📊 Dashboard Executivo

- 💰 Saldo Total (com **Saldo Acumulado Real**)
- 📉 Taxa de Economia em tempo real
- 🏆 Categoria de Maior Gasto
- 📈 Gráficos interativos (Receita × Despesa)
- 🍩 Distribuição por categorias
- 📜 Histórico recente de transações
- 🔔 Alertas inteligentes integrados

---

## 💳 Gestão Avançada de Transações

- 📝 Cadastro, edição e exclusão de receitas e despesas  
- ✏️ **Edição de lançamentos** sem precisar excluir e recriar  
- 📅 **Controle de Parcelamentos**

Exemplo:
```
12x no cartão
```

O sistema gera automaticamente os lançamentos futuros nos meses corretos.

---

## 🎯 Metas e Orçamento

- Definição de limites por categoria
- Barras de progresso visuais:

  - 🟢 Verde — dentro da meta  
  - 🟡 Amarelo — atenção  
  - 🔴 Vermelho — meta estourada  

---

## 🐽 Planejamento Futuro

💹 **Simulador de Juros Compostos**

Calcule quanto terá no futuro investindo mensalmente com uma taxa definida.

📉 **Taxa de Economia**

Acompanhe em tempo real quanto % da sua renda você está poupando.

---

## 🏷️ Categorias Personalizáveis

Criação e remoção de categorias de Receita e Despesa conforme sua necessidade.

---

## 🖨️ Relatórios e Exportação

- Exportação em **CSV**
- Impressão otimizada:
  - Semanal
  - Mensal
  - Anual

---

## 💡 Onboarding Inteligente

Cards explicativos em cada seção para facilitar o uso por novos usuários.

---

# 💻 Pré-requisitos

- 🐍 **Python 3.x**
- 📦 **Pip**
- 💻 Windows, Linux ou macOS

---

# 🚀 Tecnologias Utilizadas

## 🧩 Backend

- 🐍 **Python 3**
- 🪟 **PyWebView**
- 📁 **JSON**
- 🧮 Regressão Linear (estatística)
- 🧰 uuid, csv, datetime

---

## 🎨 Frontend

- 🧱 **HTML5**
- 💅 **CSS3** (Variáveis, Flexbox e Grid)
- ⚡ **JavaScript (Vanilla)**
- 📈 **Chart.js**
- 🎨 **FontAwesome**
- 🔤 **Google Fonts – Outfit**

---

# ⚙️ Instalação e Execução

## 1️⃣ Clone o repositório

```bash
git clone https://github.com/seu-usuario/finpy.git
cd finpy
```

## 2️⃣ Instale as dependências

```bash
pip install pywebview
```

> ⚠️ Em alguns sistemas (especialmente Linux), pode ser necessário instalar dependências adicionais como `python3-tk`, GTK ou QT.

## 3️⃣ Execute a aplicação

```bash
python app_financeiro.py
```

Na primeira execução, o arquivo `dados_financeiros.json` será criado automaticamente.

---

# 📂 Estrutura de Pastas

```text
finpy/
├── app_financeiro.py
├── dados_financeiros.json
├── favicon.ico
└── web/
    ├── index.html
    ├── style.css
    └── script.js
```

---

# 🎨 Layout e Design

- 🎨 Tema moderno com tons de roxo (#3c096c)
- 📐 Layout responsivo
- 📂 Sidebar de navegação
- 🔔 Modais personalizados
- 🎯 Feedback visual por cores

---

# 📸 Demonstração

## 📊 Dashboard Principal
<img width="1905" height="944" src="https://github.com/user-attachments/assets/f8c316b1-f8d1-43a9-8195-57160bc87ba2" />

## 🎯 Metas e Orçamento
<img width="1906" height="992" src="https://github.com/user-attachments/assets/23cd0290-623d-4317-a1ba-42b28199bfee" />

---

# 🤝 Contribuição

1. Faça um **Fork**
2. Crie uma branch:
```bash
git checkout -b feature/NovaFeature
```
3. Commit:
```bash
git commit -m "Adicionando nova feature"
```
4. Push:
```bash
git push origin feature/NovaFeature
```
5. Abra um Pull Request 🚀

---

# 🧑‍💻 Autor

**Arthur Felipe**  
🌐 GitHub: https://github.com/ArthurFelipe27  

---

# 📝 Licença

Este projeto está licenciado sob a **Licença MIT**.

---

💡 Projeto desenvolvido para demonstrar um gerenciador financeiro pessoal moderno, unindo Python, Web Technologies e Inteligência Financeira aplicada.
