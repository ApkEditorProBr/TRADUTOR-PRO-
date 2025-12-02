/**
 * ------------------------------------------------------------
 * Tradutor Pro+ (script.js)
 * ------------------------------------------------------------
 * Sistema completo para análise, manipulação, tradução e exportação
 * de strings contidas em arquivos HTML, XML ou JSON. O script oferece
 * uma interface interativa para editar textos extraídos, bloquear itens,
 * aplicar dicionário personalizado, visualizar prévia ao vivo e salvar
 * o resultado final.
 *
 * FUNCIONALIDADES PRINCIPAIS
 * ------------------------------------------------------------
 * 1. CARREGAMENTO DE ARQUIVOS
 *    - Detecta automaticamente o tipo de arquivo (HTML, XML, JSON).
 *    - Extrai strings de texto, nós textuais e atributos de eventos.
 *    - Para JSON, mapeia e edita valores mantendo a estrutura original.
 *
 * 2. TRADUÇÃO AUTOMÁTICA
 *    - Suporte à IA via API OpenAI (usando chave personalizada).
 *    - Fallback automático entre Google Translate e MyMemory.
 *    - Preservação inteligente de espaços e caracteres especiais.
 *    - Log detalhado de cada tradução realizada.
 *
 * 3. BLOQUEIO E GERENCIAMENTO DE STRINGS
 *    - Permite bloquear itens individualmente para evitar tradução.
 *    - Botão “Bloquear tudo / Desbloquear tudo”.
 *    - Seleção automática de termos técnicos e palavras reservadas.
 *    - Busca rápida em todas as strings.
 *
 * 4. DICIONÁRIO PERSONALIZADO
 *    - Substituições personalizadas aplicadas automaticamente.
 *    - Importação e exportação de dicionário.
 *    - Interface visual para adicionar, excluir e limpar entradas.
 *
 * 5. PRÉ-VISUALIZAÇÃO AO VIVO DO ARQUIVO
 *    - Renderiza uma versão sanitizada do HTML em um iframe.
 *    - Atualização em tempo real conforme o usuário edita os textos.
 *    - Bloqueia scripts e eventos inseguros para evitar execuções.
 *
 * 6. EXPORTAÇÃO
 *    - Exportação do arquivo traduzido: HTML, XML ou JSON.
 *    - Exportação de strings como JSON.
 *    - Download de logs de tradução.
 *
 * 7. EXPERIÊNCIA DO USUÁRIO
 *    - Sistema de toasts e indicadores de progresso.
    - Modo loading com bloqueio de scroll.
 *    - Animação de feedback visual para todos os botões.
 *
 * NOTAS TÉCNICAS
 * ------------------------------------------------------------
 * - Manipula DOM via DOMParser para HTML e XML.
 * - Mantém espaços usando tokens temporários (__WSn__).
 * - Evita alterações em tags proibidas (script, style, code, etc.).
 * - Armazena chave de IA, modelo e dicionário no localStorage.
 *
 * ------------------------------------------------------------
 * Este script é extenso e modularizado internamente por funções
 * auto-invocadas (IIFE) para evitar poluição global.
 
 * Autor:

**BruMarti – YouTube**  
https://youtube.com/@brumarti-oficial6117
 * ------------------------------------------------------------*/
 
(function () {
  let userDictionary = JSON.parse(localStorage.getItem("userDictionary")) || {};
  function saveUserDictionary() {
    localStorage.setItem("userDictionary", JSON.stringify(userDictionary));
  }

  const fileInput = document.getElementById('fileInput');
  const stringList = document.getElementById('stringList');
  const translateBtn = document.getElementById('translateBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const toLangSelect = document.getElementById('toLang');
  const loadingScreen = document.getElementById('loadingScreen');
  const loadingText = document.getElementById('loadingText');
  const loadingProgress = document.getElementById('loadingProgress');
  const headerProgress = document.getElementById('headerProgress');
  const logPanel = document.getElementById('logPanel');
  const logToggleBtn = document.getElementById('logToggleBtn');
  const closeLogBtn = document.getElementById('closeLogBtn');
  const downloadLogBtn = document.getElementById('downloadLogBtn');
  const logContent = document.getElementById('logContent');
  const searchInput = document.getElementById('searchInput');
  const autoSelectBtn = document.getElementById('autoSelectBtn');
  const fixSpacesBtn = document.getElementById('fixSpacesBtn');
  const fileName = document.getElementById('fileName');
  const cancelTranslateBtn = document.getElementById('cancelTranslateBtn');
  const aiKeyModal = document.getElementById("aiKeyModal");
  const aiKeyInput = document.getElementById("aiKeyInput");
  const saveAiKeyBtn = document.getElementById("saveAiKeyBtn");
  const cancelAiKeyBtn = document.getElementById("cancelAiKeyBtn");
  const clearAiKeyBtn = document.getElementById("clearAiKeyBtn");
  const createAccountBtn = document.getElementById("createAccountBtn");
  const saveAiKeyChk = document.getElementById("saveAiKey");
  const customKeyBtn = document.getElementById("customKeyBtn");
  const aiModelSelect = document.getElementById("aiModelSelect");
  const dictionaryBtn = document.getElementById("dictionaryBtn");
    const modal = document.getElementById("dictionaryModal");
    const dictList = document.getElementById("dictList");
    const dictOriginal = document.getElementById("dictOriginal");
    const dictTranslated = document.getElementById("dictTranslated");
    const saveBtn = document.getElementById("dictSaveBtn");
    const clearBtn = document.getElementById("dictClearBtn");
    const closeBtn = document.getElementById("dictCloseBtn");
    const exportBtn = document.getElementById("dictExportBtn");
    const importBtn = document.getElementById("dictImportBtn");
    const importFile = document.getElementById("dictImportFile");
const applyDictBtn = document.getElementById("applyDictionaryBtn");

applyDictBtn.addEventListener("click", () => {
    const inputs = document.querySelectorAll('#stringList input[type="text"]');

    inputs.forEach(input => {
        if (input.readOnly) return;

        input.value = applyUserDictionary(input.value);
    });

    showToast("✔️ Dicionário aplicado!");
});

  let originalText = '';
  let detectedLanguage = '';
  let doc = null;
  let docTextNodes = [];
  let docAttrEntries = [];
  let logData = '';
  let cancelRequested = false;
  let customIAKey = localStorage.getItem("customIAKey") || "";
  let useCustomIA = false;
  let selectedAIModel = localStorage.getItem("selectedAIModel") || "gpt-3.5-turbo";
  let iaToastShown = false;
  
  if (aiModelSelect) {
    aiModelSelect.value = selectedAIModel;
    aiModelSelect.addEventListener("change", () => {
      selectedAIModel = aiModelSelect.value;
      localStorage.setItem("selectedAIModel", selectedAIModel);
    });
  }
  const el = id => document.getElementById(id);
  const nowTime = () => new Date().toLocaleTimeString();
  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeRegexLiteral(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function replaceFirst(str, search, replace) {
    if (!search) return str;
    const regex = new RegExp(escapeRegexLiteral(search));
    return str.replace(regex, replace);
  }
  function downloadFileFromBlob(name, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function preserveSpacesForTranslate(s) {
    const map = [];
    const tokenized = s.replace(/(?: |\u00A0)+/g, (m) => {
      const id = map.length;
      map.push(m);
      return `__WS${id}__`;
    });
    return { text: tokenized, map };
  }
  function restoreSpacesFromMap(tokenizedTranslated, map) {
    return tokenizedTranslated.replace(/__WS(\d+)__/g, (_, n) => map[Number(n)] ?? '');
  }

  function logTranslation(original, translated) {
    const entryEl = document.createElement('div');
    entryEl.className = 'log-entry';
    const iconHTML = `<div class="log-icons">
      <svg viewBox="0 0 16 16" class="svg-badge svg-badge--orig">
        <circle cx="8" cy="8" r="7" fill="var(--success)" />
        <path d="M6.2 8.6l1.8 1.8L11 7.4l-0.9-0.9-2 2-1.2-1.2z" fill="#fff" />
      </svg>
      <svg viewBox="0 0 16 16" class="svg-badge svg-badge--trans">
        <circle cx="8" cy="8" r="7" fill="var(--accent)" />
        <path d="M5 9h6v1H5zM5 6h6v1H5z" fill="#fff" />
      </svg>
    </div>`;
    entryEl.innerHTML = `${iconHTML}
    <div class="log-body">
      <div class="log-section"><strong>Original:</strong><br>${escapeHtml(original)}</div>
      <div class="log-section"><strong>Traduzido:</strong><br>${escapeHtml(translated)}</div>
    </div>`;

    logData += `Original:\n${original}\n\nTraduzido:\n${translated}\n\n---\n`;

    if (logContent) {
      logContent.appendChild(entryEl);
      logContent.scrollTop = logContent.scrollHeight;
    }
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = 'toast-success';
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 20);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 1800);
  }

  async function detectLanguage(text) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 400))}&langpair=auto|en`);
      const data = await res.json();
      return data.responseData?.detectedSourceLanguage || 'en';
    } catch (e) { return 'en'; }
  }

  async function translateSmart(text, from, to) {

    if (!text.trim()) return "";

    if (useCustomIA && customIAKey) {
      try {
        console.log("💡 Usando modo IA (OpenAI) - modelo:", selectedAIModel);
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customIAKey}`,
          },
          body: JSON.stringify({
            model: selectedAIModel && selectedAIModel.trim() !== "" ? selectedAIModel : "gpt-3.5-turbo",
            response_format: { type: "text" },
            messages: [
              {
                role: "system",
                content: `Traduza o texto fornecido para ${to}, retornando apenas o texto traduzido. Se o texto já estiver no idioma de destino, repita-o sem alterações.`
              },
              { role: "user", content: text }
            ]
          })
        });

        const data = await res.json();

        if (data.error) {
          const msg = data.error.message || "Erro desconhecido da IA";
          console.warn("⚠️ Erro IA:", msg);
          
          if (/quota|billing|credit|exceeded/i.test(msg)) {
            showToast("⚠️ Saldo esgotado — voltando ao tradutor gratuito.");
            useCustomIA = false;
            customKeyBtn.textContent = "🔑 Chave IA";
            iaToastShown = false;
            return await translateSmart(text, from, to);
          }

          throw new Error(msg);
        }

        let translated = data.choices?.[0]?.message?.content?.trim() || "";

const bannedPatterns = [
  /^claro/i,
  /^aqui está/i,
  /^tradução:/i,
  /^explicação/i,
  /desculp/i,
  /como modelo/i,
  /não posso/i,
  /sinto muito/i,
  /não entendi/i,
  /instrução/i,
  /ignore/i
];

if (bannedPatterns.some(rx => rx.test(translated))) {
  console.warn("⚠️ IA quebrou formato — refazendo com tradução gratuita.");
  throw new Error("Formato inválido da IA");
}

translated = translated
  .replace(/^"|"$/g, "")
  .replace(/^'|'$/g, "")
  .trim();
        if (translated) return translated;

        throw new Error("Sem resultado da IA");
      } catch (e) {
        console.error("Erro no modo IA:", e);
        showToast("⚠️ Erro na IA - voltando ao tradutor padrão.");
        customKeyBtn.textContent = "🔴 Desativado";
useCustomIA = false;
iaToastShown = false;
setTimeout(() => {
  customKeyBtn.textContent = "🔑 Chave IA";
}, 6000); 
      }
    }

    useCustomIA = false;
    //customKeyBtn.textContent = "🔑 IA Key";

    const encoded = encodeURIComponent(text);

    async function useMyMemory(showNotice = true) {
      try {
        let fromLang = from && from !== 'auto' ? from : 'en';
        if (from === 'auto') {
          try {
            const detectRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 400))}&langpair=auto|en`);
            const detectData = await detectRes.json();
            if (detectData?.responseData?.detectedSourceLanguage) {
              fromLang = detectData.responseData.detectedSourceLanguage;
            }
          } catch {
            console.warn('Falha ao detectar idioma para fallback, usando en');
          }
        }

        const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${fromLang}|${to}`;
        const res = await fetch(url);
        const data = await res.json();
        let result = data?.responseData?.translatedText || "";

        if (/MYMEMORY WARNING/i.test(result)) {
          console.warn("⚠️ Limite gratuito do MyMemory atingido.");
          if (showNotice) {
            const popup = document.createElement('div');
            popup.textContent = "⚠️ Limite gratuito do MyMemory atingido. Tradução mantida original.";
            popup.style.position = 'fixed';
            popup.style.top = '20px';
            popup.style.left = '50%';
            popup.style.transform = 'translateX(-50%)';
            popup.style.background = '#ff4444';
            popup.style.color = '#fff';
            popup.style.padding = '12px 18px';
            popup.style.borderRadius = '10px';
            popup.style.fontWeight = 'bold';
            popup.style.boxShadow = '0 3px 10px rgba(0,0,0,0.3)';
            popup.style.zIndex = '9999';
            document.body.appendChild(popup);
            setTimeout(() => popup.remove(), 2500);
          }
          return text;
        }

        if (result.trim() === "") throw new Error("MyMemory retornou vazio");
        return result;

      } catch (err) {
        console.error('Erro no MyMemory:', err);
        return text;
      }
    }

    try {
      console.log("🌍 Usando Google Translate");
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encoded}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha no Google');
      const data = await res.json();
      let translated = data[0].map(t => t[0]).join('');
      const normalizedIn = text.toLowerCase().replace(/[^a-zà-ú]/gi, '');
      const normalizedOut = translated.toLowerCase().replace(/[^a-zà-ú]/gi, '');
      if (normalizedOut === normalizedIn || translated.length < 2) {
        return await useMyMemory();
      }
      return translated;
    } catch (err) {
      console.warn('Erro no Google, tentando fallback MyMemory...');
      return await useMyMemory();
    }
  }

function applyUserDictionary(text) {
    if (!text || typeof text !== "string") return text;

    let working = text.replace(/\u00A0/g, " ");

    //Ordena por tamanho da chave (literal)
    const entries = Object.entries(userDictionary)
        .sort((a, b) => b[0].length - a[0].length);

    for (const [key, value] of entries) {

        //Caso 1 → formato antigo
        if (typeof value === "string") {
            applyLiteralReplace(key, value);
            continue;
        }

        // Caso 2 → formato novo
        if (typeof value === "object" && value !== null) {
            const dictEntry = value;

            const original   = dictEntry.original   ?? key;
            const translated = dictEntry.translated ?? "";
            const attrName   = dictEntry.attrName   ?? null;
            const isRegex    = !!dictEntry.regex;

            //Se houver attrName, só aplicar se aparecer no HTML
            if (attrName) {
                //
                const attrCheck1 = new RegExp(`${attrName}\\s*=`, "i");
                const attrCheck2 = new RegExp(`${attrName}\\s*\\(`, "i");

                if (!attrCheck1.test(working) && !attrCheck2.test(working)) {
                    continue; //Atributo não associado → ignora
                }
            }

            //REGEX
            if (isRegex) {
                try {
                    const rx = new RegExp(original, "gi");
                    working = working.replace(rx, translated);
                } catch (err) {
                    console.warn("Regex inválido no dicionário:", original);
                }
                continue;
            }

            //Literal com metadados
            applyLiteralReplace(original, translated);
            continue;
        }
    }

    return working;
    
    // ====================================================
    // Função auxiliar antiga
    // ====================================================
    function applyLiteralReplace(original, translated) {
        if (!original || !translated) return;

        const cleanOriginal = original
            .replace(/\u00A0/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const escaped = cleanOriginal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const pattern = new RegExp(
            "(?<=^|[\\s.,!?;:\"'’”»()\\[\\]])" +
            escaped.replace(/\s+/g, "\\s+") +
            "(?=$|[\\s.,!?;:\"'’”»()\\[\\]])",
            "giu"
        );

        working = working.replace(pattern, (match) => {
            //Mantém capitalização
            if (match[0] === match[0].toUpperCase()) {
                return translated.charAt(0).toUpperCase() + translated.slice(1);
            }
            return translated;
        });
    }
}

  function showLoading(txt = 'Carregando...') {
    if (loadingText) loadingText.textContent = txt;
    if (loadingProgress) loadingProgress.textContent = '0%';
    if (headerProgress) {
      headerProgress.textContent = '0%';
      headerProgress.style.display = 'none';
    }
    if (loadingScreen) loadingScreen.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function hideLoading() {
    if (loadingScreen) loadingScreen.style.display = 'none';
    document.body.style.overflow = '';
  }

  const languages = {
    "en": "Inglês","pt":"Português","es":"Espanhol","fr":"Francês","de":"Alemão","ja":"Japonês",
    "zh":"Chinês","ar":"Árabe","af":"Africâner","ru":"Rússo","it":"Italiano","nl":"Neerlandês",
    "ko":"Coreano","hi":"Hindi","sv":"Sueco","da":"Dinamarquês","no":"Norueguês","pl":"Polonês",
    "tr":"Turco","cs":"Tcheco","el":"Grego","th":"Tailandês","id":"Indonésio","vi":"Vietnamita",
    "sw":"Suaíli","fa":"Persa","he":"Hebraico","uk":"Ucraniano","ms":"Malaio","tl":"Tagalog",
    "bn":"Bengali","pa":"Punjabi","mr":"Marata","ta":"Tâmil","te":"Telugu","gu":"Gujarati",
    "kn":"Canarês","ml":"Malaiala","or":"Odiá","as":"Assamês","si":"Cingalês","km":"Cambojano",
    "my":"Birmanês","lo":"Lao","ne":"Nepalês","sr":"Sérvio","hr":"Croata","bs":"Bósnio",
    "mk":"Macedônio","sq":"Albanês","mt":"Maltês","cy":"Galês","eu":"Basco","is":"Islandês",
    "lv":"Letão","lt":"Lituano","et":"Estoniano","fi":"Finlandês","hu":"Húngaro","ro":"Romeno",
    "bg":"Búlgaro","sk":"Eslovaco","sl":"Esloveno","ka":"Georgiano","hy":"Armênio","be":"Bielorrusso"
  };
  function populateLanguages() {
    try {
      let select = document.getElementById('toLang');
      if (!select) {
        select = document.createElement('select');
        select.id = 'toLang';
        select.style.margin = '6px';
        document.body.insertBefore(select, document.body.firstChild);
      }
      select.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Escolha um idioma...';
      placeholder.disabled = true;
      placeholder.selected = true;
      select.appendChild(placeholder);
      for (const [code, name] of Object.entries(languages)) {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = `${name} (${code.toUpperCase()})`;
        select.appendChild(opt);
      }
      if (languages['pt']) select.value = 'pt';
    } catch (err) {
      console.error('[populateLanguages]', err);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populateLanguages);
  } else populateLanguages();

function createItem(str) {
    const item = document.createElement('div');
    item.className = 'item';
    const retryBtn = document.createElement('button');
    retryBtn.className = 'retryBtn';
    retryBtn.title = 'Retraduzir este texto';
    retryBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6a6 
        6 0 0 1-6 6 6 6 0 0 1-5.65-4H4.26A8 8 0 0 0 
        12 20a8 8 0 0 0 8-8c0-4.42-3.58-8-8-8z"/>
      </svg>`;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = str;
    input.dataset.original = str;
    input.className = 'item-input';
    const lockLabel = document.createElement('label');
    lockLabel.className = 'lock-label';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'item-checkbox';
    const labelText = document.createElement('span');
    labelText.textContent = '\u{1F512}';
    labelText.className = 'small';
    lockLabel.appendChild(checkbox);
    lockLabel.appendChild(labelText);
    checkbox.addEventListener('change', () => {
        input.readOnly = checkbox.checked;
        input.classList.toggle('locked', checkbox.checked);
        if (checkbox.checked) {
            labelText.textContent = '\u{1F50F}';
            showToast('\u{1F50F} Tradução bloqueada');
        } else {
            labelText.textContent = '\u{1F512}';
            showToast('\u{1F512} Tradução desbloqueada');
        }
        updateSelectionSummary();
    });

retryBtn.addEventListener('click', async () => {
  const original = input.value;
  const detected = await detectLanguage(original);
  const toLang = toLangSelect.value || 'pt';
  const { text: tokenized, map } = preserveSpacesForTranslate(original);
  let translated = await translateSmart(tokenized, detected, toLang);
  translated = restoreSpacesFromMap(translated, map);

  if (translated.trim().toLowerCase() === original.trim().toLowerCase()) {
    const { text: tokenized2, map: map2 } = preserveSpacesForTranslate(original);
    let fallback = await translateSmart(tokenized2, 'en', toLang);
    translated = restoreSpacesFromMap(fallback, map2);
  }

  translated = applyUserDictionary(translated);

  input.value = translated;
  logTranslation(original, translated);
});

    item.appendChild(retryBtn);
    item.appendChild(input);
    item.appendChild(lockLabel);
    return item;
  }

  const selectionBarId = 'selectionSummary';
  const selectionBar = document.createElement('div');
  selectionBar.id = selectionBarId;
  const selectionText = document.createElement('span');
  selectionText.textContent = 'Nenhum item bloqueado';
  const selectToggleBtn = document.createElement('button');
  selectToggleBtn.textContent = 'Bloquear tudo';
  selectionBar.appendChild(selectionText);
  selectionBar.appendChild(selectToggleBtn);
  selectToggleBtn.addEventListener('click', () => {
  suspendSummary = true;

  const checkboxes = Array.from(document.querySelectorAll('.item-checkbox'));
  const allSelected = checkboxes.every(c => c.checked);
  checkboxes.forEach(c => {
    c.checked = !allSelected;
    applyLockUI(c);
  });

  suspendSummary = false;
  updateSelectionSummary();
});

function applyLockUI(checkbox) {
  const input = checkbox.closest('.item').querySelector('input[type="text"]');
  const labelText = checkbox.closest('label').querySelector('span');

  input.readOnly = checkbox.checked;
  input.classList.toggle('locked', checkbox.checked);
  labelText.textContent = checkbox.checked ? '\u{1F50F}' : '\u{1F512}';
}

  function updateSelectionSummary() {
    const checkboxes = Array.from(document.querySelectorAll('.item-checkbox'));
    const checked = checkboxes.filter(c => c.checked).length;
    if (checked === 0) selectionText.textContent = 'Nenhum item bloqueado';
    else if (checked === 1) selectionText.textContent = '1 item bloqueado';
    else selectionText.textContent = `${checked} itens bloqueado`;
    const total = checkboxes.length;
    const sectionTitle = document.querySelector('.section-title');
    if (sectionTitle) sectionTitle.textContent = total;
    selectToggleBtn.textContent = (checked === total && total > 0) ? 'Desbloquear': 'Bloquear';
    selectToggleBtn.style.cursor = "none";
  }

  function updateDisplayedStringsFromDictionary() {
    const inputs = Array.from(stringList.querySelectorAll('input[type="text"]'));
    inputs.forEach(input => {
      const original = input.dataset.original || input.value || '';
      const newVal = applyUserDictionary(original);

      input.value = newVal;
    });
  }

  async function handleFileLoad(file) {
    if (!file) return;
    showLoading('Carregando arquivo...');
    originalText = await file.text();

if (file.name.toLowerCase().endsWith(".json")) {
  try {
    const json = JSON.parse(originalText);

    window.__jsonOriginal = json;
    
    stringList.innerHTML = "";
    if (!document.getElementById(selectionBarId)) {
      stringList.parentNode.insertBefore(selectionBar, stringList);
    }

    function extractJsonStrings(obj, path = [], out = []) {
      if (typeof obj === "string") {
        out.push({ path: [...path], value: obj });
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) =>
          extractJsonStrings(item, [...path, index], out)
        );
      } else if (obj && typeof obj === "object") {
        Object.entries(obj).forEach(([key, val]) =>
          extractJsonStrings(val, [...path, key], out)
        );
      }
      return out;
    }

    const entries = extractJsonStrings(json);

    if (entries.length === 0) {
      stringList.innerHTML = '<div class="muted">Nenhuma string detectada no JSON.</div>';
      hideLoading();
      updateSelectionSummary();
      return;
    }

    const BATCH = 200;
    let index = 0;

    function pathToLabel(path) {
      return path.map(p => (typeof p === 'number' ? `[${p}]` : p)).join(' → ');
    }

    function renderBatch() {
  const frag = document.createDocumentFragment();
  const end = Math.min(index + BATCH, entries.length);
  
  for (; index < end; index++) {
    const entry = entries[index];
    const label = document.createElement("div");
    label.className = "json-path-label";
    label.style.fontSize = "0.85rem";
    label.style.color = "var(--text-muted)";
    label.style.margin = "10px 0 2px 4px";
    label.textContent = pathToLabel(entry.path);
    frag.appendChild(label);

    const item = createItem(entry.value);
    const input = item.querySelector("input[type='text']");
    input.dataset.jsonPath = JSON.stringify(entry.path);
    
    frag.appendChild(item);
  }

  stringList.appendChild(frag);
  
  if (index < entries.length) {
    requestAnimationFrame(renderBatch);
  } else {
    hideLoading();
    updateSelectionSummary();
  }
}

    renderBatch();
    return;
  } catch (err) {
    console.error('JSON inválido:', err);
    alert("Arquivo JSON inválido.");
    hideLoading();
    return;
  } 
}
    detectedLanguage = await detectLanguage(originalText);
    const parser = new DOMParser();
    doc = parser.parseFromString(originalText, 'text/html');
    docTextNodes = [];
function getTextNodes(root) {
  const skipTags = ['code','pre','script','style','title','link','meta','head'];
  
  function isInsideForbidden(node) {
    let cur = node;
    while (cur) {
      if (cur.nodeType === Node.ELEMENT_NODE) {
        const nm = (cur.nodeName || '').toLowerCase();
        if (skipTags.includes(nm)) return true;
      }
      cur = cur.parentNode;
    }
    return false;
  }

  function walk(node) {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {

        const raw = child.textContent.replace(/\s+/g, ' ');

        if (!raw || !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(raw)) return;

        if (isInsideForbidden(child)) return;
        
        docTextNodes.push({ node: child, text: raw });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  }

  if (root) walk(root);
}
getTextNodes(doc.body);

    docAttrEntries = [];
    const elementsWithAttrs = doc.querySelectorAll('[onclick], [onmouseover], [onchange], [oninput], [onfocus], [onblur]');
    elementsWithAttrs.forEach(elm => {
      for (let attr of elm.attributes) {
        if (/^on/i.test(attr.name)) {
          const matches = [...attr.value.matchAll(/\(\s*(['"])\s*([\s\S]*?)\s*\1\s*\)/g)];
          matches.forEach(m => {
            let txt = m[2];
            if (!txt) return;
            txt = txt.replace(/&nbsp;/g, '\u00A0');
            if (/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(txt) || /\u00A0|\s{2,}/.test(txt)) {
              docAttrEntries.push({ el: elm, attrName: attr.name, value: txt });
            }
          });
        }
      }
    });

    stringList.innerHTML = '';
    if (!document.getElementById(selectionBarId)) {
      stringList.parentNode.insertBefore(selectionBar, stringList);
    }

    const allEntries = [
      ...docTextNodes.map((e, i) => ({ ...e, type: 'text', index: i })),
      ...docAttrEntries.map((e, i) => ({ ...e, type: 'attr', index: i }))
    ];

    if (allEntries.length === 0) {
      stringList.innerHTML = '<div class="muted">Nenhuma string detectada no arquivo.</div>';
      hideLoading();
      updateSelectionSummary();
      return;
    }

    allEntries.forEach(entry => {
      const content = entry.text || entry.value;
      const item = createItem(content);
      const input = item.querySelector('input[type="text"]');
      input.dataset.type = entry.type;
      input.dataset.index = entry.index;
      stringList.appendChild(item);
    });

    updateSelectionSummary();
    hideLoading();
    //showToast(`${allEntries.length} string(s) carregada(s)`);
  }

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (fileName) fileName.textContent = file.name;
      await handleFileLoad(file);
    });
  }

  if (customKeyBtn && aiKeyModal) {
    customKeyBtn.addEventListener("click", () => {
      if (useCustomIA) {
        if (confirm("Desativar o modo IA e voltar para o tradutor padrão?")) {
          useCustomIA = false;
          showToast("⚠️ Modo IA desativado");
          customKeyBtn.textContent = "🔑 Chave IA";
          iaToastShown = false;
        }
      } else {
        aiKeyModal.style.display = "flex";
        aiKeyInput.value = customIAKey || "";
        if (saveAiKeyChk) saveAiKeyChk.checked = !!customIAKey;
        if (aiModelSelect) aiModelSelect.value = selectedAIModel;
      }
    });
  }

  if (cancelAiKeyBtn) {
    cancelAiKeyBtn.addEventListener("click", () => {
      aiKeyModal.style.display = "none";
    });
  }

  if (saveAiKeyBtn) {
    saveAiKeyBtn.addEventListener("click", () => {
      const key = aiKeyInput.value.trim();
      if (!key.startsWith("sk-")) {
        alert("Chave inválida (deve começar com 'sk-').");
        return;
      }
      customIAKey = key;
      selectedAIModel = (aiModelSelect && aiModelSelect.value) ? aiModelSelect.value : selectedAIModel;
      localStorage.setItem("selectedAIModel", selectedAIModel);
      useCustomIA = true;
      if (saveAiKeyChk && saveAiKeyChk.checked) localStorage.setItem("customIAKey", key);
      aiKeyModal.style.display = "none";
      showToast("✔️ Modo IA ativado — " + selectedAIModel);
      customKeyBtn.textContent = "🟢 Ativado";
      iaToastShown = true;
    });
  }

  if (clearAiKeyBtn) {
    clearAiKeyBtn.addEventListener("click", () => {
      if (confirm("Deseja realmente apagar sua chave de IA salva?")) {
        localStorage.removeItem("customIAKey");
        customIAKey = "";
        useCustomIA = false;
        aiKeyInput.value = "";
        showToast("🔒 Chave IA removida");
        customKeyBtn.textContent = "🔑 Chave IA";
        iaToastShown = false;
      }
    });
  }

  if (createAccountBtn) {
    createAccountBtn.addEventListener("click", () => {
      window.open("https://platform.openai.com/signup", "_blank");
    });
  }

  if (translateBtn) {
    translateBtn.addEventListener('click', async () => {
      const inputs = Array.from(stringList.querySelectorAll('input[type="text"]'));
      if (inputs.length === 0) return showToast('⚠️ Nenhuma string para traduzir.');

      const total = inputs.length;
      const fromLang = detectedLanguage || 'auto';
      const toLang = toLangSelect.value || 'pt';

      if (fromLang === toLang) {
        if (!confirm(`Idioma detectado: ${fromLang}. Traduzir para o mesmo idioma (${toLang})?`)) return;
      }

      cancelRequested = false;
      showLoading('Traduzindo...');
      let completed = 0;

      const headerProgressEl = document.getElementById('headerProgress');
      if (headerProgressEl) {
        headerProgressEl.textContent = '0%';
        headerProgressEl.style.display = 'inline-block';
      }

      for (let i = 0; i < total; i++) {
        if (cancelRequested) break;
        const input = inputs[i];
        const checkbox = input.parentElement.querySelector('.item-checkbox');

        if (checkbox?.checked || input.value.trim() === '') {
          completed++;
        } else {
          const original = input.value;
          const { text: tokenized, map } = preserveSpacesForTranslate(original);

          try {
            const sl = (detectedLanguage && detectedLanguage !== 'en') ? detectedLanguage : 'auto';
            const resText = await translateSmart(tokenized, sl, toLang);
            let restored = restoreSpacesFromMap(resText, map)
              .replace(/\s{2,}/g, ' ')
              .replace(/\s+([.,!?;:])/g, '$1')
              .replace(/([¿¡])\s+/g, '$1')
              .replace(/([A-Za-zÀ-ÖØ-öø-ÿ])\s+([A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1 $2')
              .replace(/\b(a|à|ao|aos|as)\s+([A-Z][a-zA-Z0-9_]+)\s*(a|à|ao|aos|as)?\b/g, '$2')
              .trim();

            input.value = restored;
            logTranslation(original, restored);
          } catch (err) {
            console.error('Erro traduzindo item', err);
          }

          completed++;
        }

        const percent = Math.round((completed / total) * 100);
        if (loadingText) loadingText.textContent = `Traduzindo ${percent}%`;
        if (loadingProgress) loadingProgress.textContent = `${percent}%`;
        if (headerProgressEl) headerProgressEl.textContent = `${percent}%`;        
      }

      hideLoading();
      showToast('✔️ Tradução concluída!');

      if (headerProgressEl) {
        headerProgressEl.textContent = '100%';
        setTimeout(() => (headerProgressEl.style.display = 'none'), 1500);
      }
    });
  }
  if (translateBtn && translateBtn._handlerBound !== true) {
    translateBtn._handlerBound = true;
  }

if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {

    const file = fileInput.files[0];
    if (!file) {
      alert("Nenhum arquivo carregado!");
      return;
    }

    const originalName = file.name;
    const lower = originalName.toLowerCase();

    if (lower.endsWith(".json")) {

  const inputs = Array.from(
    stringList.querySelectorAll('input[type="text"]')
  );

  const newJson = JSON.parse(JSON.stringify(window.__jsonOriginal));
  
  for (const input of inputs) {
    const path = JSON.parse(input.dataset.jsonPath);
    const value = input.value;

    let ref = newJson;
    for (let i = 0; i < path.length - 1; i++) {
      ref = ref[path[i]];
    }

    ref[path[path.length - 1]] = value;
  }

  const blob = new Blob(
    [JSON.stringify(newJson, null, 2)],
    { type: "application/json;charset=utf-8" }
  );
  const newName = originalName.replace(/\.[^.]+$/, "") + "-traduzido.json";
  downloadFileFromBlob(newName, blob);
  return;
}

    if (!doc) {
      alert("Erro interno: documento não carregado.");
      return;
    }
let finalText = "";

    const inputs = Array.from(
      stringList.querySelectorAll('input[type="text"]')
    );

    inputs.forEach(input => {

const lower = (file.name || "").toLowerCase();

if (lower.endsWith(".html") || lower.endsWith(".htm")) {

    const headHTML = doc.head ? doc.head.innerHTML : "";
    const bodyHTML = doc.body ? doc.body.innerHTML : "";

    finalText =
        "<!DOCTYPE html>\n" +
        "<html>\n" +
        "<head>\n" +
        headHTML +
        "\n</head>\n" +
        "<body>\n" +
        bodyHTML +
        "\n</body>\n" +
        "</html>";
}

else if (lower.endsWith(".xml")) {

    finalText = originalText;

    docTextNodes.forEach((entry, idx) => {
        const input = document.querySelector(`input[data-index="${idx}"]`);
        if (!input) return;

        const oldVal = entry.text;
        const newVal = input.value;

        if (oldVal !== newVal) {
            finalText = finalText.replace(oldVal, newVal);
        }
    });
}

else if (lower.endsWith(".json")) {
    finalText = JSON.stringify(window.__jsonOriginal, null, 2);
} else {
    finalText = originalText;
}

      const type = input.dataset.type;
      const idx = Number(input.dataset.index);
      const edited = input.value;

      if (type === "text" && docTextNodes[idx]) {

        const original = docTextNodes[idx].text ?? "";

        if (/^[\s\u00A0]+$/.test(original)) {
          docTextNodes[idx].node.textContent = original;
        } else {
          const prefix = original.match(/^[\s\u00A0]*/)?.[0] || "";
          const suffix = original.match(/[\s\u00A0]*$/)?.[0] || "";
          docTextNodes[idx].node.textContent = prefix + edited + suffix;
        }

      } else if (type === "attr" && docAttrEntries[idx]) {

        const entry = docAttrEntries[idx];
        const attr = entry.el.getAttribute(entry.attrName) || "";

        entry.el.setAttribute(
          entry.attrName,
          replaceFirst(attr, entry.value, edited)
        );
      }
    });

inputs.forEach(input => {

  const type = input.dataset.type;
  const idx = Number(input.dataset.index);
  const edited = input.value || "";
  const editedWithDict = (type === "text") ? applyUserDictionary(edited) : edited;

  if (type === "text" && docTextNodes[idx]) {

    const original = docTextNodes[idx].text;

    if (original && editedWithDict !== original) {

      const textNode = docTextNodes[idx].node;
      const parent = textNode.parentNode;

      if (!parent) return;

      let html = parent.innerHTML;
      const esc = escapeRegexLiteral(original);
      const strictRegex = new RegExp(`>${esc}<`, "g");

      if (strictRegex.test(html)) {
        parent.innerHTML = html.replace(strictRegex, `>${editedWithDict}<`);
      } else {
        textNode.textContent = editedWithDict;
      }
    }
  }

  if (type === "attr" && docAttrEntries[idx]) {

    const entry = docAttrEntries[idx];
    const el = entry.el;
    const attrName = entry.attrName;

    el.setAttribute(attrName, edited);
  }
});

finalText = finalText.replace(/>([^<]+)</g, (m, text) => {
    return ">" + text.replace(/\u00A0/g, " ") + "<";
    
});

finalText = finalText
    .replace(/\u00A0/g, " ")
    .replace(/&nbsp;/g, " ");

let mime = "text/plain;charset=utf-8";
if (lower.endsWith(".xml")) mime = "application/xml;charset=utf-8";
else if (lower.endsWith(".html") || lower.endsWith(".htm"))
  mime = "text/html;charset=utf-8";

const blob = new Blob([finalText], { type: mime });
const outName =
  originalName.replace(/\.[^.]+$/, "") +
  "-traduzido" +
  (originalName.match(/\.[^.]+$/)?.[0] || "");

downloadFileFromBlob(outName, blob);

return;
});
}

  if (autoSelectBtn) {
    const autoSelectCodeList = [
      "if","else","for","while","return","var","let","const","function","true","false",
      "null","undefined","import","export","class","this","console","log","print","input",
      "exit","require","acc."
    ];

    const autoSelectMixedList = [
      "main","Linear","VCenter","Horizontal","Outlined","Primary","favorite","parent","options",
      "titles","width","height","items","texts","index","expand","expandIcon","titleWidth",
      "secondaryText","String","Number","Boolean","Object","List","absHeight","absLeft",
      "absTop","absWidth","backColor","backImage","border","borderColor","borderStyle",
      "cornerRadius","disabled","el","fontFile","isVisible","itemPadding","left","margins",
      "opacity","padding","position","rotation","rounded","textColor","textSize","addClass",
      "animate","bringForward","destroy","gone","hide","popItem","removeItemByIndex",
      "removeItemByName","sendBackward","addItem","getEnabled","getLayout","setBorder",
      "setEnabled","addButton","addText","addTextField","showPopup","onStart","onTouch",
      "layout"
    ];

    autoSelectBtn.addEventListener('click', () => {
      const items = document.querySelectorAll('#stringList .item');
      let count = 0;

      items.forEach(item => {
        const input = item.querySelector('input[type="text"]');
        const checkbox = item.querySelector('.item-checkbox');
        if (!input || !checkbox) return;

        const rawText = input.value.trim();
        const isAllLower = /^[a-z0-9_]+$/.test(rawText);
        const matchCode = isAllLower && autoSelectCodeList.includes(rawText);

        const normalized = rawText
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        const matchMixed = autoSelectMixedList.some(word =>
          word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === normalized
        );

        const shouldSelect = matchCode || matchMixed;
        checkbox.checked = shouldSelect;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        if (shouldSelect) count++;
      });

      updateSelectionSummary();
      //showToast(`✔️ ${count} item(s) marcados automaticamente`);
    });
  }

  if (fixSpacesBtn) {
    fixSpacesBtn.addEventListener('click', () => {
      const inputs = document.querySelectorAll('#stringList .item input[type="text"]');
      let count = 0;
      inputs.forEach(i => {
        const before = i.value;
        i.value = i.value.replace(
          /[_\s]*__?\s*(?:ws|space|espace|espaco)[-_]?\s*\d*\s*__?\s*[_\s]*/gi,
          ' '
        );
        if (i.value !== before) count++;
      });
      showToast(`✔️ ${count} campo(s) corrigido(s)`);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.trim().toLowerCase();
      const items = document.querySelectorAll('#stringList .item');
      items.forEach(item => {
        const txt = item.querySelector('input[type="text"]').value.toLowerCase();
        item.style.display = txt.includes(term) ? 'flex' : 'none';
      });
    });
  }

  function ensureDictionaryModalExists() {
    if (document.getElementById('dictionaryModal')) return;
    const modalHTML = ``;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  document.addEventListener('DOMContentLoaded', () => {
  	
    ensureDictionaryModalExists();

    function updateDictList() {
      dictList.innerHTML = "";
      const entries = Object.entries(userDictionary);
      if (entries.length === 0) {
        dictList.innerHTML = "<p class='muted'><i>Nenhuma tradução personalizada.</i></p>";
        return;
      }
      entries.forEach(([orig, trans]) => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.margin = "4px 0";
        row.style.padding = "8px";
        row.style.borderRadius = "8px";
        row.style.background = "rgba(255,255,255,0.02)";
        row.innerHTML = `
          <div style="flex:1;padding-right:8px;">
            <div style="font-size:0.95rem;color:var(--text-muted);">${escapeHtml(orig)}</div>
            <div style="font-weight:700;color:var(--text);">${escapeHtml(trans)}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="dict-delete" title="Apagar" style="background:#a82c2c;color:#fff;border:none;border-radius:6px;padding:6px 8px">🗑</button>
          </div>
        `;
        row.querySelector(".dict-delete").addEventListener("click", () => {
          delete userDictionary[orig];
          saveUserDictionary();
          updateDictList();
        });
        dictList.appendChild(row);
      });
    }

    if (dictionaryBtn) {
      dictionaryBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        updateDictList();
      });
    }
    if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
    saveBtn.addEventListener("click", () => {
      const o = (dictOriginal.value || '').trim();
      const t = (dictTranslated.value || '').trim();
      if (!o || !t) return alert("Preencha os dois campos!");
      userDictionary[o] = t;
      saveUserDictionary();
      dictOriginal.value = "";
      dictTranslated.value = "";
      updateDictList();
      showToast("Tradução adicionada ao dicionário!");
    });
    clearBtn.addEventListener("click", () => {
      if (confirm("Deseja apagar todo o dicionário?")) {
        userDictionary = {};
        saveUserDictionary();
        updateDictList();
      }
    });
    exportBtn.addEventListener("click", () => {

  //Converte o formato antigo { "Back":"Voltar" } para array []
  const formatted = Object.entries(userDictionary).map(([orig, trans], index) => ({
    original: orig,
    translated: trans,
    type: "text",
    index,
    attrName: null,
    rawInner: null
  }));

  const blob = new Blob(
    [JSON.stringify(formatted, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "dicionario.json";
  a.click();
  URL.revokeObjectURL(a.href);
});
    importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);

      //NOVO FORMATO → array de objetos
      if (Array.isArray(data)) {
        data.forEach(entry => {
          if (entry && entry.original && entry.translated) {
            userDictionary[entry.original] = entry.translated;
          }
        });
      }

      //FORMATO ANTIGO → objeto simples
      else if (typeof data === "object") {
        userDictionary = { ...userDictionary, ...data };
      }

      else {
        throw new Error("Formato desconhecido");
      }

      saveUserDictionary();
      updateDictList();
      showToast("✔️ Dicionário importado com sucesso!");

    } catch (err) {
      console.error("Import error:", err);
      alert("Erro ao importar o dicionário. Formato inválido.");
    }
  };

  reader.readAsText(file);
});

    updateDictList();
  });

document.addEventListener('DOMContentLoaded', () => {
  if (!logToggleBtn || !logPanel) return;

  const logOverlay = document.getElementById("logOverlay");

  logToggleBtn.addEventListener('click', () => {
    const isOpening = logPanel.hidden;
    logPanel.hidden = !logPanel.hidden;
    logPanel.classList.toggle('active');

    if (isOpening) {
      logOverlay?.classList.add("show");
      document.body.classList.add("body-no-scroll");
    } else {
      logOverlay?.classList.remove("show");
      document.body.classList.remove("body-no-scroll");
    }
  });

  if (closeLogBtn) {
    closeLogBtn.addEventListener('click', () => {
      logPanel.hidden = true;
      logPanel.classList.remove('active');
      logOverlay?.classList.remove("show");
      document.body.classList.remove("body-no-scroll");
    });
  }

  if (downloadLogBtn) {
    downloadLogBtn.addEventListener('click', () => {
      if (!logData || !logData.trim()) {
        alert('❌ Nenhum log disponível.');
        return;
      }

      const dict = {};
      const blocks = logData
        .split('---')
        .map(b => b.trim())
        .filter(Boolean);

      blocks.forEach(block => {
        const mOrig = block.match(/Original:\s*([\s\S]*?)\n\nTraduzido:/);
        const mTrad = block.match(/Traduzido:\s*([\s\S]*)/);

        if (mOrig && mTrad) {
          dict[mOrig[1].trim()] = mTrad[1].trim();
        }
      });

      const jsonBlob = new Blob(
        [JSON.stringify(dict, null, 2)],
        { type: 'application/json;charset=utf-8' }
      );

      const fname =
        `log_traducao_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;

      downloadFileFromBlob(fname, jsonBlob);
    });
  }
});

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (logPanel) logPanel.hidden = true;
      hideLoading();
    }
  });

  window.addEventListener('wheel', e => { if (loadingScreen && loadingScreen.style.display === 'flex') e.preventDefault(); }, { passive: false });
  window.addEventListener('touchmove', e => { if (loadingScreen && loadingScreen.style.display === 'flex') e.preventDefault(); }, { passive: false });

  if (cancelTranslateBtn) {
    cancelTranslateBtn.addEventListener('click', () => {
      hideLoading();
      const headerProgressEl = document.getElementById('headerProgress');
      if (headerProgressEl) {
        headerProgressEl.style.display = 'inline-block';
        headerProgressEl.textContent = loadingProgress?.textContent || '0%';
      }
    });
  }

  console.log('Tradutor Pro+ (Arquivo) inicializado.');
})();

document.addEventListener("DOMContentLoaded", () => {
  const TEMPO_PISCA = 200;
  const botoes = document.querySelectorAll("button");
  botoes.forEach(btn => {
    let timeout;
    btn.addEventListener("click", () => {
      clearTimeout(timeout);
      btn.classList.add("active");
      timeout = setTimeout(() => {
        btn.classList.remove("active");
      }, TEMPO_PISCA);
    });
  });
});

const exportBtn = document.getElementById("exportStringsBtn");

exportBtn?.addEventListener("click", () => {
    const stringList = document.getElementById("stringList");
    if (!stringList) return;

    const items = stringList.querySelectorAll(".item input[type='text']");

    if (!items.length) {
        alert("❌ Nenhuma string para exportar.");
        return;
    }

    //Exporta novo formato
    const result = [];

    items.forEach((input, index) => {

        result.push({
            original: input.dataset.original || "",
            translated: input.value || "",
            type: input.dataset.type || "text",
            index: Number(input.dataset.index ?? index),
            attrName: input.dataset.attrName || null,
            jsonPath: input.dataset.jsonPath ? JSON.parse(input.dataset.jsonPath) : null,
            rawInner: input.dataset.rawInner || null
        });
    });

    //REMOVE DUPLICAÇÕES mantém apenas o primeiro de cada "original"
    const unique = [];
    const seen = new Set();

    for (const row of result) {
        const key = row.original.trim(); //Chave para detectar duplicados
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(row);
        }
    }

    //Exporta o JSON sem duplicações
    const blob = new Blob(
        [JSON.stringify(unique, null, 2)],
        { type: "application/json" }
    );

    const fname = "strings_export.json";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
});

(function () {
  const fileInput = document.getElementById("fileInput");
  const stringList = document.getElementById("stringList");
  const inspectBtn = document.getElementById("inspectBtn");
  const previewPanel = document.getElementById("previewPanel");
  const previewFrame = document.getElementById("previewFrame");
  const closePreviewBtn = document.getElementById("closePreviewBtn");

  if (!inspectBtn || !previewPanel || !previewFrame) {
    console.warn("[preview] elementos essenciais faltando");
    return;
  }

  let originalFileContent = "";

function sanitize(html) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[A-Za-z]+\s*=\s*(['"])[\s\S]*?\1/gi, "");
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceSmart(html, original, edited) {
  const normOriginal = original.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
  const safe = escapeRegex(normOriginal);
  const flexSpaces = "[ \\u00A0]+";
  const flexibleSafe = safe.replace(/\\ /g, flexSpaces);
  const boundaryRegex = new RegExp(`(?<!\\w)${flexibleSafe}(?!\\w)`, "gi");

  let replaced = false;
  html = html.replace(boundaryRegex, match => {
    replaced = true;
    return edited;
  });

  if (replaced) return html;
  
  const fallbackRegex = new RegExp(flexibleSafe, "gi");

  return html.replace(fallbackRegex, edited);
}

function generateLiveHTML() {
  if (!originalFileContent.trim()) {
    return "<h3 style='color:red;padding:20px'>Nenhum arquivo carregado</h3>";
  }

  let html = originalFileContent.replace(/\u00A0/g, " ");

  const inputs = Array.from(stringList.querySelectorAll("input[type='text']"));
  const subs = inputs.map(inp => {
    const original = (inp.dataset.original || "").trim();
    const edited = (inp.value || "").trim();

    if (!original || !edited || original === edited) return null;

    return {
      original,
      edited,
      len: original.length
    };
  }).filter(Boolean);


  subs.sort((a, b) => b.len - a.len);

  const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  for (const s of subs) {

    const escaped = escapeRegex(s.original);
    const regex = new RegExp(
      `(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`,
      "g"
    );

    html = html.replace(regex, s.edited);
  }

  return sanitize(html);
}

function updatePreview() {
  const doc = previewFrame.contentWindow.document;
  doc.open();
  doc.write(generateLiveHTML());
  doc.close();

  const style = doc.createElement("style");
  style.textContent = `
    a {
      pointer-events: none !important;
      cursor: default !important;
    }
  `;
  doc.head.appendChild(style);
}

  inspectBtn.addEventListener("click", () => {
    if (!originalFileContent.trim()) {
      alert("Carregue um arquivo primeiro.");
      return;
    }

    previewPanel.style.display = "block";
    updatePreview();
  });

  closePreviewBtn.addEventListener("click", () => {
    previewPanel.style.display = "none";
  });

  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;

      const text = await file.text();
      originalFileContent = text;
    });
  }

  stringList.addEventListener("input", () => {
    if (previewPanel.style.display === "block") updatePreview();
  });
})();
