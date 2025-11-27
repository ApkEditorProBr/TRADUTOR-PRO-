# 🌎 Tradutor Pro+ — Modo Arquivo  
Ferramenta avançada para tradução assistida de arquivos **HTML**, **XML** e **JSON**, oferecendo pré-visualização segura, integração com IA, dicionário personalizado, bloqueio de strings e exportação completa.

---

## 📌 Funcionalidades Principais

### ✅ 1. Carregamento inteligente de arquivos  
- Detecta automaticamente formato: **HTML**, **XML** ou **JSON**  
- Extrai somente partes textuais realmente traduzíveis  
- Ignora tags proibidas (script, style, code, meta, title etc.)  
- Suporta arquivos grandes (carregamento em lotes)

---

### ✅ 2. Tradução Automática com 3 Camadas  
- **IA OpenAI (opcional)**  
  - Com chave personalizada  
  - Modelos configuráveis  
  - Verificação de formato e fallback automático  

- **Google Translate** (API pública)  
- **MyMemory** (fallback final)

Inclui:
- preservação de múltiplos espaços  
- detecção automática de idioma  
- retry inteligente quando tradução falha  

---

### ✅ 3. Dicionário Personalizado  
- Cada entrada: `"original" → "substituição"`  
- Armazenado em `localStorage`  
- Aplicação manual sobre todas as strings  
- Importar e exportar dicionário  
- Case-sensitive inteligente (mantém maiúsculas)

---

### ✅ 4. Bloqueio de Strings  
- Bloqueio individual com cadeado  
- "Bloquear tudo / Desbloquear tudo"  
- Evita modificar trechos críticos  

---

### ✅ 5. Preview em Tempo Real (seguro)  
O `preview.js` cria um sandbox com:

- Remoção de `<script>`  
- Remoção de atributos `onClick`, `onLoad` etc.  
- Remoção de `<iframe>`  
- Links desativados  
- `iframe sandbox` ativado

Modos:
- **Visualização de código** com highlight  
- **Visualização de página real**  

Highlight para:
- HTML  
- XML  
- JSON  

---

### ✅ 6. Exportação Completa  
- Exporta arquivo traduzido na estrutura original  
- Exporta `Strings.json` com todas as entradas  
- Exporta log de tradução (TXT)  

---

## 🧩 Arquitetura

### **index.html**
Contém:
- Topbar com ações  
- Lista dinâmica de strings  
- Painéis de log, preview e modais  
- Inputs, botões, controle de idioma  

### **estilo.css**
Tema moderno dark:
- Variáveis globais  
- Cards, botões, inputs  
- Toast  
- Painel de log  
- Modal IA/Dicionário  
- Responsividade mobile  

### **script.js (núcleo do app)**
Responsável por:
- Parsing de HTML/XML com DOMParser  
- Parsing profundo de JSON  
- Extração de texto  
- Criação dos itens na lista  
- Tradução automática (IA / Google / MyMemory)  
- Log  
- Dicionário  
- Exportação  
- Bloqueio  
- Busca  
- Indicador de progresso  

### **preview.js**
Responsável por:
- Sanitização segura  
- Geração de preview  
- Syntax Highlight  
- Botão alternar Código ↔ Página  
- Injeção de CSS isolado  

---

## 🧠 Como funciona a tradução?

1. O usuário carrega o arquivo.  
2. O sistema extrai todas as strings.  
3. Cada string vira um campo editável.  
4. O usuário pode:  
   - editar manual  
   - retraduzir individualmente  
   - bloquear  
   - aplicar dicionário  
5. Ao clicar **Traduzir**, todas as entradas são traduzidas mas não às bloqueadas.  
6. O preview atualiza automaticamente.  
7. O usuário exporta o resultado final.

---

## 🔒 Segurança

O preview impede qualquer execução de scripts:

- remove `<script>` inteiro  
- remove `<iframe>`  
- remove atributos iniciados com `on...`  
- substitui links por elementos inativos  
- usa iframe com `sandbox`  

É impossível o arquivo carregado rodar JavaScript dentro da pré-visualização.

---

## 🧰 Tecnologias utilizadas

- 🔹 JavaScript puro (sem frameworks)  
- 🔹 DOMParser  
- 🔹 LocalStorage  
- 🔹 iframe sandbox  
- 🔹 Fetch API  
- 🔹 HTML5 + CSS3
- 
---

link: https://apkeditorprobr.github.io/TRADUTOR-PRO-/

Baixar repositório: https://github.com/ApkEditorProBr/TRADUTOR-PRO-/archive/refs/heads/main.zip
