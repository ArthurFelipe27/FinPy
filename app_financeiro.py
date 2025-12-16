import webview
import json
import os
import uuid
from datetime import datetime

# --- CONFIGURAÇÕES E DADOS (BACKEND) ---

DATA_FILE = 'dados_financeiros.json'

class FinanceApi:
    def __init__(self):
        self.ensure_data_file()

    def ensure_data_file(self):
        if not os.path.exists(DATA_FILE):
            initial_data = {
                "transactions": [],
                "settings": {"currency": "BRL"}
            }
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(initial_data, f)

    def get_transactions(self):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                return data["transactions"]
            except json.JSONDecodeError:
                return []

    def add_transaction(self, tipo, categoria, valor, descricao, data):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        nova_transacao = {
            "id": str(uuid.uuid4()),
            "type": tipo, # 'income' ou 'expense'
            "category": categoria,
            "amount": float(valor),
            "description": descricao,
            "date": data
        }
        
        content["transactions"].append(nova_transacao)
        
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(content, f, indent=4)
            
        return nova_transacao

    def delete_transaction(self, t_id):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        content["transactions"] = [t for t in content["transactions"] if t["id"] != t_id]
        
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(content, f, indent=4)
        return {"status": "success", "id": t_id}

# --- INICIALIZAÇÃO ---

if __name__ == '__main__':
    api = FinanceApi()
    
    # Obtém o caminho absoluto para o arquivo index.html dentro da pasta 'web'
    base_dir = os.path.dirname(os.path.abspath(__file__))
    html_path = os.path.join(base_dir, 'web', 'index.html')
    
    # Verifica se o arquivo existe antes de iniciar
    if not os.path.exists(html_path):
        print(f"ERRO: Arquivo não encontrado: {html_path}")
        print("Certifique-se de criar a pasta 'web' e colocar o index.html nela.")
    else:
        window = webview.create_window(
            'FinPy - Gestor Financeiro', 
            url=html_path,  # Carrega do arquivo ao invés de string
            width=1000,
            height=700,
            resizable=True,
            min_size=(900, 600),
            js_api=api
        )
        
        webview.start(debug=True)