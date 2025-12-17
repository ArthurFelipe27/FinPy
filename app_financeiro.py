import webview
import json
import os
import uuid
import csv  # <--- Adicionado
from datetime import datetime

# --- CONFIGURAÇÕES E DADOS (BACKEND) ---

DATA_FILE = 'dados_financeiros.json'

class FinanceApi:
    def __init__(self):
        self.ensure_data_file()

    def ensure_data_file(self):
        # Verifica se arquivo existe
        if not os.path.exists(DATA_FILE):
            initial_data = {
                "transactions": [],
                "goals": {},
                "settings": {"currency": "BRL"}
            }
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(initial_data, f)
        else:
            # Migração simples: garante que a chave 'goals' existe em arquivos antigos
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                except:
                    data = {}
            
            changed = False
            if "goals" not in data:
                data["goals"] = {}
                changed = True
            if "transactions" not in data:
                data["transactions"] = []
                changed = True
                
            if changed:
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=4)

    def get_data(self):
        # Retorna tudo de uma vez para reduzir chamadas
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except:
                return {"transactions": [], "goals": {}}

    def get_transactions(self):
        data = self.get_data()
        return data.get("transactions", [])

    def add_transaction(self, tipo, categoria, valor, descricao, data_transacao):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        nova_transacao = {
            "id": str(uuid.uuid4()),
            "type": tipo,
            "category": categoria,
            "amount": float(valor),
            "description": descricao,
            "date": data_transacao
        }
        
        content["transactions"].append(nova_transacao)
        
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(content, f, indent=4)
            
        return nova_transacao

    def update_transaction(self, t_id, tipo, categoria, valor, descricao, data_transacao):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        found = False
        for t in content["transactions"]:
            if t["id"] == t_id:
                t["type"] = tipo
                t["category"] = categoria
                t["amount"] = float(valor)
                t["description"] = descricao
                t["date"] = data_transacao
                found = True
                break
        
        if found:
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(content, f, indent=4)
            return {"status": "success"}
        return {"status": "error", "message": "Transaction not found"}

    def delete_transaction(self, t_id):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        content["transactions"] = [t for t in content["transactions"] if t["id"] != t_id]
        
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(content, f, indent=4)
        return {"status": "success", "id": t_id}

    # --- Novas Funções de Metas ---

    def set_goal(self, category, limit):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        content["goals"][category] = float(limit)
        
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(content, f, indent=4)
        return {"status": "success"}

    # --- Função de Exportação ---
    def export_csv(self):
        try:
            # Pega a janela ativa para abrir o diálogo de salvar
            if len(webview.windows) > 0:
                active_window = webview.windows[0]
                file_path = active_window.create_file_dialog(
                    webview.SAVE_DIALOG, 
                    directory='', 
                    save_filename='relatorio_financeiro.csv'
                )
            else:
                return {"status": "error", "message": "Janela não encontrada"}
            
            if file_path:
                # Em algumas versões/OS retorna tupla/lista
                if isinstance(file_path, (tuple, list)):
                    file_path = file_path[0]
                
                data = self.get_transactions()
                
                # Escreve o CSV
                with open(file_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
                    # 'utf-8-sig' ajuda o Excel a reconhecer acentos corretamente
                    writer = csv.writer(csvfile, delimiter=';') # Ponto e vírgula é melhor para Excel BR
                    
                    # Cabeçalho Limpo e Bonito
                    writer.writerow(['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor (R$)'])
                    
                    for t in data:
                        # 1. Formatar Data (YYYY-MM-DD -> DD/MM/YYYY)
                        data_raw = t.get('date', '')
                        data_formatada = data_raw
                        try:
                            if data_raw:
                                dt = datetime.strptime(data_raw, '%Y-%m-%d')
                                data_formatada = dt.strftime('%d/%m/%Y')
                        except:
                            pass # Mantém original se falhar a conversão

                        # 2. Traduzir Tipo
                        tipo_raw = t.get('type', '')
                        tipo_traduzido = 'Receita' if tipo_raw == 'income' else ('Despesa' if tipo_raw == 'expense' else tipo_raw)
                        
                        # 3. Formatar Valor (R$ 0,00)
                        valor = float(t.get('amount', 0))
                        valor_formatado = f"{valor:.2f}".replace('.', ',')

                        # 4. Escrever linha (Sem ID)
                        writer.writerow([
                            data_formatada,
                            tipo_traduzido,
                            t.get('category', '').title(), # Capitaliza primeira letra
                            t.get('description', ''),
                            valor_formatado
                        ])
                        
                return {"status": "success", "path": file_path}
            return {"status": "cancelled"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

# --- INICIALIZAÇÃO ---

if __name__ == '__main__':
    api = FinanceApi()
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    html_path = os.path.join(base_dir, 'web', 'index.html')
    
    if not os.path.exists(html_path):
        print(f"ERRO: Arquivo não encontrado: {html_path}")
    else:
        window = webview.create_window(
            'FinPy - Gestor Financeiro', 
            url=html_path,
            width=1100,
            height=750,
            resizable=True,
            min_size=(950, 650),
            js_api=api
        )
        webview.start(debug=True)