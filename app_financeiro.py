import webview
import json
import os
import uuid
import csv
from datetime import datetime, timedelta
import calendar

# --- CONFIGURAÇÕES E DADOS (BACKEND) ---

DATA_FILE = 'dados_financeiros.json'

DEFAULT_CATEGORIES = {
    "expense": ['Alimentação', 'Lazer', 'Básico', 'Transporte', 'Saúde', 'Educação', 'Moradia', 'Outro'],
    "income": ['Salário', 'Freelancer', 'Investimentos', 'Presente', 'Vendas', 'Outro']
}

class FinanceApi:
    def __init__(self):
        self.ensure_data_file()

    def ensure_data_file(self):
        if not os.path.exists(DATA_FILE):
            initial_data = {
                "transactions": [],
                "goals": {},
                "categories": DEFAULT_CATEGORIES,
                "settings": {"currency": "BRL"}
            }
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(initial_data, f, indent=4)
        else:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                except:
                    data = {}
            
            changed = False
            if "categories" not in data:
                data["categories"] = DEFAULT_CATEGORIES
                changed = True
            if "transactions" not in data:
                data["transactions"] = []
                changed = True
            if "goals" not in data:
                data["goals"] = {}
                changed = True

            if changed:
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=4)

    def get_data(self):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except:
                return {"transactions": [], "goals": {}, "categories": DEFAULT_CATEGORIES}

    def save_data(self, data):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)

    # --- CRUD TRANSAÇÕES ---

    def add_transaction(self, tipo, categoria, valor, descricao, data_transacao, parcelas=1):
        data = self.get_data()
        try:
            parcelas = int(parcelas)
            valor_float = float(valor)
        except ValueError:
            return {"status": "error", "message": "Valores inválidos"}
        
        try:
            data_base = datetime.strptime(data_transacao, '%Y-%m-%d')
        except ValueError:
            data_base = datetime.now()

        if parcelas > 1:
            valor_parcela = valor_float / parcelas
            group_id = str(uuid.uuid4())
            
            for i in range(parcelas):
                # Lógica de virada de mês/ano
                mes_idx = data_base.month - 1 + i
                ano = data_base.year + (mes_idx // 12)
                mes = (mes_idx % 12) + 1
                ultimo_dia_do_mes = calendar.monthrange(ano, mes)[1]
                dia = min(data_base.day, ultimo_dia_do_mes)
                data_parcela = f"{ano:04d}-{mes:02d}-{dia:02d}"
                
                nova_transacao = {
                    "id": str(uuid.uuid4()),
                    "type": tipo,
                    "category": categoria,
                    "amount": valor_parcela,
                    "description": f"{descricao} ({i+1}/{parcelas})",
                    "date": data_parcela,
                    "installment_group": group_id,
                    "installment_index": i + 1,
                    "installment_total": parcelas
                }
                data["transactions"].append(nova_transacao)
        else:
            nova_transacao = {
                "id": str(uuid.uuid4()),
                "type": tipo,
                "category": categoria,
                "amount": valor_float,
                "description": descricao,
                "date": data_transacao
            }
            data["transactions"].append(nova_transacao)
        
        self.save_data(data)
        return {"status": "success"}

    def update_transaction(self, t_id, tipo, categoria, valor, descricao, data_transacao):
        data = self.get_data()
        found = False
        for t in data["transactions"]:
            if t["id"] == t_id:
                t["type"] = tipo
                t["category"] = categoria
                t["amount"] = float(valor)
                t["description"] = descricao
                t["date"] = data_transacao
                found = True
                break
        
        if found:
            self.save_data(data)
            return {"status": "success"}
        return {"status": "error", "message": "Transação não encontrada"}

    def delete_transaction(self, t_id):
        data = self.get_data()
        original_len = len(data["transactions"])
        data["transactions"] = [t for t in data["transactions"] if t["id"] != t_id]
        
        if len(data["transactions"]) < original_len:
            self.save_data(data)
            return {"status": "success"}
        return {"status": "error", "message": "Item não encontrado"}

    # --- METAS E CATEGORIAS ---

    def set_goal(self, category, limit):
        data = self.get_data()
        data["goals"][category] = float(limit)
        self.save_data(data)
        return {"status": "success"}

    def update_categories(self, income_cats, expense_cats):
        data = self.get_data()
        data["categories"] = {"income": income_cats, "expense": expense_cats}
        self.save_data(data)
        return {"status": "success"}

    # --- INTELLIGENCE & DASHBOARD ---

    def get_dashboard_insights(self):
        data = self.get_data()
        transactions = data.get("transactions", [])
        goals = data.get("goals", {})
        
        now = datetime.now()
        current_month_str = now.strftime('%Y-%m')
        last_month_str = (now.replace(day=1) - timedelta(days=1)).strftime('%Y-%m')
        
        # 1. Cálculo do Saldo ACUMULADO (Total Geral)
        total_income_all_time = sum(t['amount'] for t in transactions if t['type'] == 'income')
        total_expense_all_time = sum(t['amount'] for t in transactions if t['type'] == 'expense')
        cumulative_balance = total_income_all_time - total_expense_all_time

        # 2. Agrupamento Mensal
        monthly_data = {}
        for t in transactions:
            mes = t['date'][:7]
            if mes not in monthly_data:
                monthly_data[mes] = {"income": 0.0, "expense": 0.0, "details": {}}
            
            val = float(t['amount'])
            if t['type'] == 'income':
                monthly_data[mes]["income"] += val
            else:
                monthly_data[mes]["expense"] += val
                cat = t.get('category', 'Outro')
                monthly_data[mes]["details"][cat] = monthly_data[mes]["details"].get(cat, 0) + val

        curr = monthly_data.get(current_month_str, {"income": 0, "expense": 0, "details": {}})
        last = monthly_data.get(last_month_str, {"income": 0, "expense": 0})
        
        # 3. Taxa de Economia (Mês Atual)
        savings_rate = 0
        if curr["income"] > 0:
            savings_rate = ((curr["income"] - curr["expense"]) / curr["income"]) * 100
            
        top_category = "Nenhuma"
        top_value = 0
        for cat, val in curr["details"].items():
            if val > top_value:
                top_value = val
                top_category = cat

        # 4. Regressão Linear Simples (Mínimo 3 meses)
        sorted_months = sorted(monthly_data.keys())
        # Filtra apenas meses com despesas > 0 para não distorcer a curva com meses vazios futuros
        valid_months = [m for m in sorted_months if monthly_data[m]["expense"] > 0]
        last_n_months = valid_months[-6:] # Tenta pegar 6, mas aceita o que tiver
        
        forecast_val = 0
        trend = "stable"
        
        if len(last_n_months) >= 3:
            n = len(last_n_months)
            # X = 0, 1, 2... (tempo)
            # Y = valor da despesa
            sum_x = sum(range(n))
            sum_y = sum(monthly_data[m]["expense"] for m in last_n_months)
            sum_xy = sum(i * monthly_data[last_n_months[i]]["expense"] for i in range(n))
            sum_xx = sum(i*i for i in range(n))
            
            denominator = (n * sum_xx - sum_x * sum_x)
            if denominator != 0:
                slope = (n * sum_xy - sum_x * sum_y) / denominator
                intercept = (sum_y - slope * sum_x) / n
                forecast_val = slope * n + intercept
                if slope > 50: trend = "up"
                elif slope < -50: trend = "down"
            else:
                forecast_val = sum_y / n
        elif len(last_n_months) > 0:
            # Fallback média simples
            forecast_val = sum(monthly_data[m]["expense"] for m in last_n_months) / len(last_n_months)

        # 5. Alertas
        alerts = []
        for cat, limit in goals.items():
            gasto_atual = curr["details"].get(cat, 0)
            if limit > 0 and gasto_atual > limit:
                alerts.append({"type": "danger", "msg": f"Meta de {cat} estourada em R$ {gasto_atual - limit:.2f}!"})
            elif limit > 0 and gasto_atual > (limit * 0.9):
                alerts.append({"type": "warning", "msg": f"Atenção: 90% da meta de {cat} atingida."})
        
        if forecast_val > 0 and curr["expense"] > forecast_val * 1.15:
             alerts.append({"type": "warning", "msg": "Gastos atuais 15% acima da previsão."})

        return {
            "cumulative_balance": cumulative_balance, # NOVO: Saldo acumulado
            "current_month": curr,
            "last_month": last,
            "savings_rate": savings_rate,
            "top_category": top_category,
            "forecast_next_month": max(0, forecast_val),
            "trend": trend,
            "alerts": alerts
        }

    def export_csv(self):
        try:
            if len(webview.windows) > 0:
                active_window = webview.windows[0]
                file_path = active_window.create_file_dialog(webview.SAVE_DIALOG, directory='', save_filename='relatorio_finpy.csv')
            else:
                return {"status": "error", "message": "Janela não encontrada"}
            
            if file_path:
                if isinstance(file_path, (tuple, list)): file_path = file_path[0]
                data = self.get_data().get("transactions", [])
                
                with open(file_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
                    writer = csv.writer(csvfile, delimiter=';')
                    writer.writerow(['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor (R$)', 'Parcela'])
                    
                    for t in data:
                        tipo = 'Receita' if t['type'] == 'income' else 'Despesa'
                        val = f"{float(t['amount']):.2f}".replace('.', ',')
                        dt_str = t.get('date', '')
                        try:
                            dt_str = datetime.strptime(dt_str, '%Y-%m-%d').strftime('%d/%m/%Y')
                        except: pass
                        parc = f"{t['installment_index']}/{t['installment_total']}" if "installment_index" in t else ""
                        writer.writerow([dt_str, tipo, t.get('category',''), t.get('description',''), val, parc])
                return {"status": "success", "path": file_path}
            return {"status": "cancelled"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

if __name__ == '__main__':
    api = FinanceApi()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    html_path = os.path.join(base_dir, 'web', 'index.html')
    
    if os.path.exists(html_path):
        window = webview.create_window('FinPy - Gestor Inteligente', url=html_path, width=1200, height=800, resizable=True, js_api=api)
        webview.start(debug=True)
    else:
        print("Arquivo index.html não encontrado.")