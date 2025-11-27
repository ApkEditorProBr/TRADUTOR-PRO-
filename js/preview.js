/**
 * ---------------------------------------------------------------
 *                           PREVIEW.JS
 * ---------------------------------------------------------------
 * Sistema de pré-visualização seguro para arquivos HTML, XML e JSON.
 * 
 * OBJETIVO:
 * ---------
 * Este script cria um painel de preview que permite:
 *  - Visualizar o arquivo original carregado.
 *  - Aplicar substituições feitas pelo usuário aplicado no (stringList).
 *  - Destacar sintaxe de HTML, XML e JSON.
 *  - Alternar entre:
 *        → “Visualização html de Código”  (com highlight)
 *        → “Visualização html de Página” (renderização real no iframe)
 *
 * SEGURANÇA:
 * ----------
 * O sistema para evitar execução de scripts:
 *  - Remove <script> e atributos onClick/onLoad/etc.
 *  - Remove <iframe>.
 *  - Desabilita links (<a>) na pré-visualização.
 *  - Usa iframe com sandbox.
 *
 * PRINCIPAIS COMPONENTES:
 * ------------------------
 * 1) generatePreview()
 *    - Constrói o HTML exibido no iframe.
 *    - Converte conteúdo para visualização baseada no tipo do arquivo.
 *    - Aplica syntax highlight customizado.
 *
 * 2) updatePreview()
 *    - Reescreve o iframe com o conteúdo gerado.
 *    - Injeta o CSS do preview diretamente no iframe.
 *    - Configura o botão que alterna Código ↔ Página.
 *
 * 3) sanitize(), syntaxHighlightHTML(), syntaxHighlightXML(), syntaxHighlightJSON()
 *    - Utilitários para segurança e estilização do código exibido.
 *
 * 4) Toggle de visualização
 *    - Mostra o código original (com highlight) ou a página renderizada.
 *    - O botão possui ícones alternados (código/página).
 *
 * 5) Sistema de substituições (stringList)
 *    - O usuário altera trechos específicos.
 *    - As substituições são aplicadas ao preview em tempo real.
 *
 * FLUXO DE EXECUÇÃO:
 * -------------------
 * - Usuário seleciona um arquivo → conteúdo é lido.
 * - Usuário clica "Inspecionar" → abre o painel.
 * - Preview é renderizado via updatePreview().
 * - Usuário altera campos → updatePreview() atualiza em tempo real.
 * - Botão alterna entre código e página.
 * - Close fecha o painel e restaura scroll da página.
 *
 * OBS:
 * ----
 * Todo o CSS do preview é injetado diretamente no iframe,
 * garantindo que estilos externos não interfiram ou quebrem a exibição.
 *
 * Autor:

**BruMarti – YouTube**  
https://youtube.com/@brumarti-oficial6117
 * ---------------------------------------------------------------
 */
 
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
  let originalFileType = "";
  let toggleBtn;
  let codeView;
  let pageView;
  let sourceTag;

  function sanitize(html) {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son[A-Za-z]+\s*=\s*(['"])[\s\S]*?\1/gi, "");
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

function replaceSmart(html, original, edited) {
  if (!original.trim()) return html;

  //Normalizar espaços
  const normOriginal = original.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();

  //Proteger regex
  const esc = normOriginal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  //Match apenas quando não houver letras/números antes/depois
  const regex = new RegExp(`(?<![\\w\\-])${esc}(?![\\w\\-])`, "gi");

  let replaced = html.replace(regex, edited);

  //Fallback para casos extremos
  if (replaced === html) {
    const fallback = new RegExp(esc, "gi");
    return html.replace(fallback, edited);
  }

  return replaced;
}

  function syntaxHighlightHTML(html) {
    return html
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, `<span class="hl-comment">$1</span>`)
      .replace(/(&lt;\/?[a-zA-Z0-9\-]+)(.*?)(\/?&gt;)/g, (match, tagStart, attrs, tagEnd) => {
        const coloredAttrs = attrs.replace(
          /([a-zA-Z\-:]+)="(.*?)"/g,
          `<span class="hl-attr">$1</span>=<span class="hl-value">"$2"</span>`
        );
        return `<span class="hl-tag">${tagStart}</span>${coloredAttrs}<span class="hl-tag">${tagEnd}</span>`;
      });
  }

function syntaxHighlightJSON(json) {
  return json
    //Chaves "nome":
    .replace(/"(.*?)"\s*:/g,
      `<span class="hl-json-key">"$1"</span>:`)
    //Strings "valor"
    .replace(/: "(.*?)"/g,
      `: <span class="hl-json-string">"$1"</span>`)
    //Números
    .replace(/\b\d+(\.\d+)?\b/g,
      `<span class="hl-json-number">$&</span>`)
    //Boolean / null
    .replace(/\b(true|false|null)\b/g,
      `<span class="hl-json-bool">$1</span>`);
}

function syntaxHighlightXML(xml) {
  return xml
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g,
      `<span class="xml-comment">$1</span>`)
    //CDATA <![CDATA[ ... ]]>
    .replace(/(&lt;!\[CDATA\[[\s\S]*?\]\]&gt;)/g,
      `<span class="xml-cdata">$1</span>`)
    //Declaração XML <?xml ... ?>
    .replace(/(&lt;\?[^&]*?\?&gt;)/g,
      `<span class="xml-decl">$1</span>`)
    //Tags + atributos
    .replace(/(&lt;\/?[a-zA-Z0-9:_-]+)([^&]*?)(&gt;)/g,
      (match, tagStart, attrs, tagEnd) => {
        //Highlight dos atributos
        const formattedAttrs = attrs.replace(
          /([a-zA-Z0-9:_-]+)="(.*?)"/g,
          `<span class="xml-attr">$1</span>=<span class="xml-value">"$2"</span>`
        );
        return `<span class="xml-tag">${tagStart}</span>${formattedAttrs}<span class="xml-tag">${tagEnd}</span>`;
      }
    );
}

  const iframeCss = `
/* Estilos injetados no iframe (iguais ao preview.css) */
.preview-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: #ff6666;
}
.preview-base {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 20px;
  background: transparent;
  color: #eee;
  font-size: clamp(12px, 2.8vw, 16px);
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  overflow-y: auto;
  overflow-x: auto;
  box-sizing: border-box;
  border-radius: 0;
}
.toggle-view-btn {
  position: fixed;
  bottom: clamp(8px, 3vw, 20px);
  right: clamp(8px, 3vw, 20px);
  z-index: 9999;
  padding: clamp(6px, 2.5vw, 12px) clamp(10px, 3vw, 18px);
  background: white;
  color: black;
  border: none;
  border-radius: 50px;
  font-size: clamp(10px, 2.8vw, 14px);
  cursor: none;
  box-shadow: 0 0 4px #666, inset -2px -2px 6px rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}
.toggle-view-btn:hover { transform: scale(1.05); }
.html-code-view { display: block; }
.html-page-view {
  display: none;
  width: 100%;
  height: 100%;
  overflow: auto;
  border: none;
  background: transparent;
  backdrop-filter: blur(2px);
}

.html-page-view {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  margin: 0;
  padding: 0;
}
.link-disabled {
  pointer-events: none !important;
  cursor: default !important;
}

/* Sintaxe html */
.hl-comment { color: #777 !important; }
.hl-tag { color: #f66 !important; }
.hl-attr { color: #6cf !important; }
.hl-value { color: #fc6 !important; }
.hl-bool { color: #f66 !important; }
.hl-num { color: #9f6 !important; }
.hl-text { color: #ffffff !important; }

/* Sintaxe XML */
.xml-comment { color: #888 !important; }
.xml-decl    { color: #0E6 !important; }
.xml-cdata   { color: #ccc !important; }
.xml-tag     { color: #CFCFEC !important; }
.xml-attr    { color: #DAB0DA !important; }
.xml-value   { color: #5AA85A !important; }

/* Sintaxe JSON */
.hl-json-key    { color: #4aa3ff !important; font-weight: 600; }
.hl-json-string { color: #fff !important; }
.hl-json-number { color: #0A6 !important; }
.hl-json-bool   { color: #f66 !important; }
`;

  function generatePreview() {
    if (!originalFileContent.trim()) {
      return `<div class="preview-empty">Nenhum arquivo carregado</div>`;
    }

    const isJSON = originalFileType.endsWith(".json");
    const isXML = originalFileType.endsWith(".xml");
    const isHTML = originalFileType.endsWith(".html") || originalFileType.endsWith(".htm");

    let content = originalFileContent;

    const inputs = stringList.querySelectorAll("input[type='text']");
//NOTA: as substituições são aplicadas usando replaceSmart() //Para arquivos HTML complexos, isso às vezes pode modificar o texto/atributos das tags de maneiras //Que quebram a renderização. Se você ainda vir uma pré-visualização distorcida, considere usar //Uma abordagem de substituição baseada em DOM (substituindo apenas nós de texto e atributos).
inputs.forEach(input => {
  const original = input.dataset.original || "";
  const edited = input.value || "";
  content = replaceSmart(content, original, edited);
});

    //JSON
    if (isJSON) {
      try {
        const formatted = JSON.stringify(JSON.parse(content), null, 2);
        return `<pre class="preview-base">${syntaxHighlightJSON(formatted)}</pre>`;
      } catch {
        return `<pre class="preview-base">${content}</pre>`;
      }
    }

    //XML
    if (isXML) {
      const escaped = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<pre class="preview-base">${syntaxHighlightXML(escaped)}</pre>`;
    }

//HTML
if (isHTML) {
  const escaped = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const highlighted = syntaxHighlightHTML(escaped);

  let sanitized = content
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "");

  sanitized = sanitized.replace(/<a /gi, '<a class="link-disabled" ');

  const safeSource = sanitized.replace(/<\/script>/gi, "<\\/script>");

  return `
    <button id="toggleViewBtn" class="toggle-view-btn" aria-label="Alternar visualização código / página">Página</button>

    <div id="htmlCodeView" class="html-code-view">
      <pre class="preview-base">${highlighted}</pre>
    </div>

    <iframe id="htmlPageView" class="html-page-view" sandbox="allow-same-origin"></iframe>

    <script id="previewSource" type="text/plain" style="display:none">${safeSource}</script>
  `;
}

    return content;
  }
  
  function updatePreview() {
    const doc = previewFrame.contentWindow.document;
    doc.open();
    doc.write(generatePreview());
    doc.close();

    //Injete o CSS necessário DENTRO do iframe para que as classes funcionem lá.
    try {
      const styleTag = doc.createElement("style");
      styleTag.type = "text/css";
      styleTag.appendChild(doc.createTextNode(iframeCss));
      doc.head.appendChild(styleTag);
    } catch (err) {
      //Recurso alternativo caso doc.createTextNode/appendChild falhe por algum motivo.
      const fallbackStyle = doc.createElement("style");
      fallbackStyle.type = "text/css";
      fallbackStyle.textContent = iframeCss;
      doc.head.appendChild(fallbackStyle);
    }

toggleBtn = doc.getElementById("toggleViewBtn");
codeView  = doc.getElementById("htmlCodeView");
pageView  = doc.getElementById("htmlPageView");
sourceTag = doc.getElementById("previewSource");

    const svgCodigo = `
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2">
        <path d="M16 18l6-6-6-6"/>
        <path d="M8 6L2 12l6 6"/>
      </svg>`;

    const svgPagina = `
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2
        2 0 0 0 2-2V8z"/>
        <path d="M14 2v6h6"/>
      </svg>`;

    if (toggleBtn && codeView && pageView && sourceTag) {
      toggleBtn.innerHTML = svgPagina;

      toggleBtn.addEventListener("click", () => {
        const showingCode = codeView.style.display !== "none";

        if (showingCode) {
          codeView.style.display = "none";
          pageView.style.display = "block";

          const iframeDoc = pageView.contentWindow.document;
          iframeDoc.open();
          iframeDoc.write(sourceTag.textContent || sourceTag.innerHTML); //Mais seguro: use  para evitar a mistura acidental de HTML...
          iframeDoc.close();

          //Também injetar CSS na página carregada dentro do iframe (quando escrevemos source)
          try {
            const styleTag2 = iframeDoc.createElement("style");
            styleTag2.type = "text/css";
            styleTag2.appendChild(iframeDoc.createTextNode(iframeCss));
            iframeDoc.head.appendChild(styleTag2);
          } catch (err) {
            const fallback2 = iframeDoc.createElement("style");
            fallback2.type = "text/css";
            fallback2.textContent = iframeCss;
            iframeDoc.head.appendChild(fallback2);
          }

          toggleBtn.innerHTML = svgCodigo;
        } else {
          pageView.style.display = "none";
          codeView.style.display = "block";

          toggleBtn.innerHTML = svgPagina;
        }
      });
    }
  }

  inspectBtn.addEventListener("click", () => {
    if (!originalFileContent.trim()) {
      alert("Carregue um arquivo primeiro.");
      return;
    }
    document.body.style.overflow = "hidden";
    previewPanel.style.display = "block";
    updatePreview();
  });

  closePreviewBtn.addEventListener("click", () => {
    previewPanel.style.display = "none";
    document.body.style.overflow = "";
  });

  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;

      const text = await file.text();
      originalFileContent = text;
      originalFileType = file.name.toLowerCase();
    });
  }

  stringList.addEventListener("input", () => {
    if (previewPanel.style.display === "block") updatePreview();
  });
})();
