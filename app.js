

// 1. MAPEAMENTO DOS ELEMENTOS DA TELA (DOM)
const tabSingle = document.getElementById('tab-single');
const tabBatch = document.getElementById('tab-batch');
const invoicePayload = document.getElementById('invoice-payload');
const btnSubmit = document.getElementById('btn-submit');
const monitorTbody = document.getElementById('monitor-tbody');
// Procure pelo mapeamento do modal no topo do arquivo e adicione a linha faltante:
const deleteModal = document.getElementById('delete-modal');
const deleteModalContent = document.getElementById('delete-modal-content');
const deleteModalText = document.getElementById('delete-modal-text'); // ADICION



// 2. CONTRATOS DE DADOS DE EXEMPLO (PAYLOADS)
const singleExample = {
  "numeroNota": "88881",
  "cnpjEmitente": "12345678000199",
  "cnpjDestinatario": "98765432000188",
  "valorTotal": 1500.50,
  "itens": "Item A, Item B"
};

const batchExample = [
  {
    "numeroNota": "88882",
    "cnpjEmitente": "12345678000199",
    "cnpjDestinatario": "98765432000188",
    "valorTotal": 2300.00,
    "itens": "Item C, Item D"
  },
  {
    "numeroNota": "88883",
    "cnpjEmitente": "44445678000122",
    "cnpjDestinatario": "98765432000188",
    "valorTotal": 450.90,
    "itens": "Item E"
  }
];

// VARIÁVEL DE ESTADO: CONTROLA QUAL ABA ESTÁ ATIVA
let currentMode = 'single';
//const BASE_URL = 'http://localhost:8083/api/invoices';
//const BASE_URL = '/api/invoices';
const currentHost = window.location.hostname;

// Define a API base dinamicamente
const BASE_URL = (currentHost === 'localhost' || currentHost === '127.0.0.1')
    ? 'http://localhost:8083/api/invoices'  // Quando clica no ícone do Chrome no IntelliJ
    : '/api/invoices';                     // Quando roda na VM da Oracle (Proxy Reverso)

// Configuração download
const DOWNLOAD_URL = (currentHost === 'localhost' || currentHost === '127.0.0.1')
    ? 'http://localhost:8082/api/downloads'
    : '/api/downloads';

// Configuração delete single invoice
const DELETE_URL = (currentHost === 'localhost' || currentHost === '127.0.0.1')
    ? 'http://localhost:8082/api/history'
    : '/api/history';


// Configuração show history invoices
const HISTORY_SHOW_ALL = (currentHost === 'localhost' || currentHost === '127.0.0.1')
    ? 'http://localhost:8082/api/history'
    : '/api/history';

// 3. GERENCIAMENTO DAS ABAS (TABS)
tabSingle.addEventListener('click', () => {
    currentMode = 'single';
    invoicePayload.value = JSON.stringify(singleExample, null, 2);
    btnSubmit.innerHTML = '🚀 Dispatch Single to Apache Kafka';
});

tabBatch.addEventListener('click', () => {
    currentMode = 'batch';
    invoicePayload.value = JSON.stringify(batchExample, null, 2);
    btnSubmit.innerHTML = '📦 Dispatch Batch Lote to Apache Kafka';
});

// 4. LÓGICA DE DISPARO DA INGESTÃO (BOTÃO ENVIAR)
btnSubmit.addEventListener('click', async () => {
    const rawContent = invoicePayload.value.trim();

    // Validação Sênior: Evita enviar lixo ou caixas vazias para o Kafka
    if (!rawContent) {
        showToast('Payload validation failed: JSON content cannot be empty.', true);
        return;
    }

    let parsedData;
    try {
        parsedData = JSON.parse(rawContent);
    } catch (e) {
          showToast('Syntax Error: Invalid JSON format. Please verify quotation marks and commas.', true);
          return;
    }

    // Altera visualmente o botão para indicar que o tráfego de rede está acontecendo
    btnSubmit.innerHTML = '⏳ Processing Ingestion...';
    btnSubmit.disabled = true;

    // Define a rota exata de acordo com a aba selecionada
    const endpoint = currentMode === 'single' ? `${BASE_URL}/single` : `${BASE_URL}/batch`;

    try {
        console.log(`[OCI-PLATFORM] Enviando dados para: ${endpoint}`);

        // Dispara a chamada HTTP real para a sua API Spring Boot
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: rawContent
        });

        if (response.ok) {
            console.log('[OCI-PLATFORM] Ingestão aceita pelo Produtor!');

            // Adiciona as notas enviadas diretamente na tabela visual do monitor
            if (currentMode === 'single') {
                adicionarNotaAoMonitor(parsedData);
            } else if (Array.isArray(parsedData)) {
                parsedData.forEach(nota => adicionarNotaAoMonitor(nota));
            }

            showToast('Payload processed and successfully dispatched to Apache Kafka clusters!');
        } else {
            showToast('Server Failure: Unable to establish connection with backend API.', true);
        }

    } catch (error) {
        console.error('[OCI-PLATFORM] Erro de conexão:', error);
        showToast('❌ Erro Crítico: Não foi possível conectar ao Produtor (Porta 8083). Verifique se o microsserviço está ligado!',true);
    } finally {
        // Restaura o estado original do botão de disparo
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = currentMode === 'single' ? '🚀 Dispatch Single to Apache Kafka' : '📦 Dispatch Batch Lote to Apache Kafka';
    }
});

// 5. FUNÇÃO PARA ALIMENTAR A TABELA DO MONITOR DINAMICAMENTE
function adicionarNotaAoMonitor(nota) {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #1f2937';
    tr.style.color = '#e5e7eb';

    // Formata o valor bruto (Ex: 1500.5 -> R$ 1.500,50)
    const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nota.valorTotal || 0);

    tr.innerHTML = `
        <td style="padding: 0.75rem; font-family: monospace; font-weight: 600;">${nota.numeroNota || 'N/A'}</td>
        <td style="padding: 0.75rem; font-weight: 700; color: #fb923c;">${valorFormatado}</td>
        <td style="padding: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.375rem;">
                <span style="height: 0.375rem; width: 0.375rem; background-color: #10b981; border-radius: 9999px; display: inline-block;"></span>
                <span style="color: #34d399; font-weight: 600;">OCI Storage Ready</span>
            </div>
        </td>

        <td style="padding: 0.75rem; text-align: center;">
            <div style="display: flex; gap: 6px; justify-content: center;">
                <!-- Botão Individual: Download -->
                <button class="btn-single-download" style="background-color: #1f2937; border: 1px solid #4b5563; color: #fb923c; font-weight: 700; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 0.25rem; padding: 0.375rem 0.75rem; cursor: pointer; transition: all 0.2s;"
                        onmouseover="this.style.color='#f3f4f6'; this.style.borderColor='#f3f4f6';"
                        onmouseout="this.style.color='#fb923c'; this.style.borderColor='#4b5563';">
                    📄 Download
                </button>
                <!-- Botão Individual: Lixeira Vermelha -->
                <button class="btn-single-delete" style="background-color: #111827; border: 1px solid #991b1b; color: #ef4444; font-weight: 700; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 0.25rem; padding: 0.375rem 0.75rem; cursor: pointer; transition: all 0.2s;"
                        onmouseover="this.style.backgroundColor='#991b1b'; this.style.color='#f3f4f6';"
                        onmouseout="this.style.backgroundColor='#111827'; this.style.color='#ef4444';">
                    🗑️ Delete
                </button>
            </div>
        </td>

    `;

    // Insere a nova linha sempre no topo da tabela para dar o visual de Feed dinâmico ao vivo
    monitorTbody.insertBefore(tr, monitorTbody.firstChild);
}

// 6. INICIALIZAÇÃO AUTOMÁTICA
tabSingle.click();

// FUNÇÃO SÊNIOR PARA EXIBIR NOTIFICAÇÃO TOAST SEM TRAVAR O NAVEGADOR
function showToast(message, isError = false) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');

    // Ajusta as cores dinamicamente se for sucesso ou erro
    toast.style.borderColor = isError ? '#ef4444' : '#10b981';
    toast.querySelector('span').innerHTML = isError ? '❌' : '🚀';
    toast.querySelector('h4').innerHTML = isError ? 'Ingestion Failed' : 'Ingestion Success';

    toastMessage.innerText = message;

    // Faz o elemento subir e aparecer de forma suave
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    // Agenda para sumir sozinho depois de 4 segundos
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
    }, 4000);
}


// 6. ADICIONA O ESCUTADOR DE EVENTOS DE CLIQUE NA TABELA DO MONITOR (PARA DOWNLOADS)
monitorTbody.addEventListener('click', async (event) => {
     const target = event.target;

    // Verifica se o elemento clicado foi de fato o botão de Download individual
    if (event.target.classList.contains('btn-single-download') || event.target.closest('.btn-single-download')) {
        const btn = event.target.classList.contains('btn-single-download') ? event.target : event.target.closest('.btn-single-download');

        // Sobe até a linha (tr) e captura o número da nota fiscal gravado na primeira célula
        const tr = btn.closest('tr');
        const numeroNota = tr.cells[0].innerText.trim();

        btn.innerHTML = '⏳ Fetching URL...';
        btn.disabled = true;

        try {
            console.log(`[OCI-DOWNLOAD] Requesting secure URL for invoice nº ${numeroNota}`);

            // 1. Faz o pedido da URL segura (PAR) para o seu Consumidor na porta 8082
            const response = await fetch(`${DOWNLOAD_URL}/url/${numeroNota}`);

            const data = await response.json();
            const secureOciUrl = data.downloadUrl; // Link temporário gerado pelo SDK da Oracle Cloud

            // 2. BUSCA O ARQUIVO EM SEGUNDO PLANO E FORÇA O DOWNLOAD FÍSICO (BLOB STRATEGY)
            console.log('[OCI-DOWNLOAD] Downloading physical file from OCI via Blob streaming...');

            // Faz o fetch direto na URL segura da Oracle Cloud
            const fileResponse = await fetch(secureOciUrl);
            if (!fileResponse.ok) throw new Error('Failed to fetch file content from OCI storage');

            // Transforma o conteúdo em um arquivo binário na memória RAM (Blob)
            const fileBlob = await fileResponse.blob();
            const blobUrl = window.URL.createObjectURL(fileBlob);

            // Cria o gatilho de download forçado no Windows
            const tempLink = document.createElement('a');
            tempLink.href = blobUrl;
            tempLink.setAttribute('download', `invoice_${numeroNota}.json`); // Define o nome exato do arquivo salvo
            document.body.appendChild(tempLink);
            tempLink.click(); // Dispara o download automático na barra de tarefas

            // Limpa os resíduos da memória do navegador
            document.body.removeChild(tempLink);
            window.URL.revokeObjectURL(blobUrl);



            /*
            if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);

            const data = await response.json();
            const secureOciUrl = data.downloadUrl; // Link temporário gerado pelo SDK da Oracle Cloud

            console.log('[OCI-DOWNLOAD] Secure PAR URL received successfully!');

            // 2. DISPARA O DOWNLOAD FÍSICO AUTOMÁTICO NO NAVEGADOR
            const tempLink = document.createElement('a');
            tempLink.href = secureOciUrl;
            //tempLink.setAttribute('download', `nota_${numeroNota}.json`);
            tempLink.target = '_blank';
            document.body.appendChild(tempLink);
            tempLink.click(); // Força o clique invisível para iniciar a transferência no Windows
            document.body.removeChild(tempLink);
            */

            showToast(`Invoice file nº ${numeroNota} successfully downloaded from Oracle Cloud Object Storage!`);

        } catch (error) {
            console.error('[OCI-DOWNLOAD] Critical error during file retrieval:', error);
            showToast('Critical Download Error: Failed to secure transmission channel with port 8082.', true);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '📄 Download';
        }
    }

// ---------------------------------------------------------------------
    // FLUXO B: DETECTOU CLIQUE NO BOTÃO DE DELETE INDIVIDUAL (MODAL PREMIUM)
    // ---------------------------------------------------------------------
    if (target.classList.contains('btn-single-delete') || target.closest('.btn-single-delete')) {
        const btn = target.classList.contains('btn-single-delete') ? target : target.closest('.btn-single-delete');
        const tr = btn.closest('tr');
        const numeroNota = tr.cells[0].innerText.trim(); // Captura a primeira coluna (Nota nº)

        console.log(`[OCI-UI] Intercepted click on delete for invoice: ${numeroNota}`);

        // Aciona o Modal Premium Escuro assíncrono
        const isApproved = await askPermission(`Are you absolutely sure you want to permanently obliterate Invoice nº ${numeroNota} from the SQL Database and Cloud Object Storage?`);
        if (!isApproved) return;

        btn.innerHTML = '⏳ Purging...';
        btn.disabled = true;

        try {

            const response = await fetch(`${DELETE_URL}/delete/${numeroNota}`, { method: 'DELETE' });
            if (response.ok) {
                tr.style.transition = 'all 0.4s ease';
                tr.style.opacity = '0';
                tr.style.transform = 'translateX(50px)';
                setTimeout(() => { tr.remove(); }, 400);
                showToast(`Invoice nº ${numeroNota} successfully wiped from the cloud!`);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('[OCI-DELETE-ERROR]', error);
            showToast('Purge Failure: Operational transmission channel rejected by port 8082.', true);
            btn.disabled = false;
            btn.innerHTML = '🗑️ Delete';
        }
    }
});

// =========================================================================
// 6. CONTROLE GLOBAL ATUALIZADO: PURGE ALL INVOICES (BATCH OBLITERATION)
// =========================================================================
document.getElementById('btn-delete-all').addEventListener('click', async () => {
    const rows = monitorTbody.querySelectorAll('tr');
    const btnAll = document.getElementById('btn-delete-all');

    if (rows.length === 0) {
        showToast('Purge Error: Active monitoring feed is already clean!', true);
        return;
    }

    // 1. ABRE O MODAL APENAS UMA VEZ PARA O LOTE INTEIRO!
    const isApproved = await askPermission(`🚨 CRITICAL WARNING: You are about to permanently obliterate ALL ${rows.length} active invoices from the SQL Database and Oracle Cloud Storage. Proceed with mass purge?`);
    if (!isApproved) return;

    // Se o usuário aprovou, o modal fecha elegantemente e o processo roda limpo em background
    btnAll.innerHTML = '⏳ Purging Lote...';
    btnAll.disabled = true;
    showToast(`Executing parallel cloud deletion for ${rows.length} records...`);

    try {
        // 2. Executa a deleção em lote enviando as requisições em paralelo via rede
        await Promise.all(Array.from(rows).map(async (row) => {
            const numeroNota = row.cells[0].innerText.trim(); // Ajustado índice 0 para ler a primeira coluna

            console.log(`[OCI-BATCH-DELETE] Purging invoice nº ${numeroNota}`);

            // Dispara o DELETE direto para a API REST do seu Consumidor (8082)
            const response = await fetch(`${DELETE_URL}/delete/${numeroNota}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove a linha da tela com efeito de transição suave
                row.style.transition = 'all 0.4s ease';
                row.style.opacity = '0';
                row.style.transform = 'translateX(50px)';
                setTimeout(() => { row.remove(); }, 400);
            } else {
                console.error(`[OCI-BATCH-DELETE] Server rejected note ${numeroNota}. Status: ${response.status}`);
            }
        }));

        showToast('Success Action: All selected infrastructure components have been fully purged.');

    } catch (error) {
        console.error('[OCI-BATCH-DELETE-ERROR]', error);
        showToast('Batch Purge Failure: Transmission grid connection timeout.', true);
    } finally {
        btnAll.disabled = false;
        btnAll.innerHTML = '🗑️ Purge All';
    }
});

// 7. MOTOR DE INICIALIZAÇÃO: BUSCA O HISTÓRICO REAL DO BANCO VIA NOVA CONTROLLER
async function loadHistoryFromDatabase() {
    console.log('[OCI-INITIALIZATION] Fetching invoice history from database (Port 8082)...');
    try {
        // Dispara o fetch para a sua nova rota exclusiva de historico
        const response = await fetch('${HISTORY_SHOW_ALL}/all');
        if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);

        const invoices = await response.json();

        // Se o banco trouxer dados, limpa a tabela e carrega o historico real
        if (invoices && invoices.length > 0) {
            monitorTbody.innerHTML = ''; // Esvazia o monitor
            invoices.forEach(nota => adicionarNotaAoMonitor(nota)); // Carrega linha por linha usando a funcao da sua foto
            console.log('[OCI-INITIALIZATION] History successfully loaded from Clean Architecture Controller!');
        }
    } catch (error) {
        console.error('[OCI-INITIALIZATION] Failed to load startup history:', error);
    }
}

// GATILHO OFICIAL: Executa a busca automatica assim que a tela terminar de carregar
window.addEventListener('DOMContentLoaded', loadHistoryFromDatabase);

// VARIÁVEL GLOBAL AUXILIAR PARA GERENCIAR A PROMESSA DO MODAL CUSTOMIZADO
let modalResolveFn = null;

// =========================================================================
// 7. SUBSISTEMAS AUXILIARES E INTERFACES (MODAL, TOAST, RENDERER)
// =========================================================================
function askPermission(message) {

    deleteModalText.innerText = message;
    deleteModal.style.opacity = '1';
    deleteModal.style.pointerEvents = 'auto';
    deleteModalContent.style.transform = 'scale(1)';
    return new Promise((resolve) => { modalResolveFn = resolve; });
}

// Vincula o clique dos botões do Modal diretamente às funções de fechamento
document.getElementById('btn-modal-cancel').addEventListener('click', () => fecharModal(false));
document.getElementById('btn-modal-confirm').addEventListener('click', () => fecharModal(true));

// CORREÇÃO: Garante o fechamento correto e resolve a Promessa travada
function fecharModal(approved) {
    deleteModal.style.opacity = '0';
    deleteModal.style.pointerEvents = 'none';
    deleteModalContent.style.transform = 'scale(0.9)';

    // Executa a resolução da Promessa passando true ou false para o fluxo prosseguir
    if (modalResolveFn) {
        modalResolveFn(approved);
        modalResolveFn = null; // Limpa o ponteiro da memória
    }
}
// 8. INTERCEPTADOR DE CLIQUE NA TABELA PARA EXCLUSÃO INDIVIDUAL (COM MODAL PREMIUM)
monitorTbody.addEventListener('click', async (event) => {
    if (event.target.classList.contains('btn-single-delete') || event.target.closest('.btn-single-delete')) {
        const btn = event.target.classList.contains('btn-single-delete') ? event.target : event.target.closest('.btn-single-delete');
        const tr = btn.closest('tr');
        const numeroNota = tr.cells[0].innerText.trim();

        // SUBSTITUÍDO: Agora chama o modal escuro premium sem menções a localhost!
        const isApproved = await askPermission(`Are you absolutely sure you want to permanently obliterate Invoice nº ${numeroNota} from the SQL Database and Cloud Object Storage?`);
        if (!isApproved) return;

        btn.innerHTML = '⏳ Purging...';
        btn.disabled = true;

        try {
            console.log(`[OCI-DELETE] Dispatching purge token for invoice nº ${numeroNota}`);
            const response = await fetch(`${DELETE_URL}/delete/${numeroNota}`, { method: 'DELETE' });

            if (response.ok) {
                tr.style.transition = 'all 0.4s ease';
                tr.style.opacity = '0';
                tr.style.transform = 'translateX(50px)';
                setTimeout(() => { tr.remove(); }, 400);
                showToast(`Invoice nº ${numeroNota} successfully wiped from the cloud!`);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('[OCI-DELETE] Purge failure:', error);
            showToast('Purge Failure: Operational transmission channel rejected.', true);
            btn.disabled = false;
            btn.innerHTML = '🗑️ Delete';
        }
    }
});


// =========================================================================
// 6. CONTROLES GLOBAIS DO CABEÇALHO (DOWNLOAD ALL E PURGE ALL)
// =========================================================================

// GATILHO MASTER: DOWNLOAD ALL INVOICES (.ZIP)
document.getElementById('btn-download-all').addEventListener('click', async () => {
    const rows = monitorTbody.querySelectorAll('tr');
    const btnAll = document.getElementById('btn-download-all');
    if (rows.length === 0) {
        showToast('Download Error: Monitoring feed is empty!', true);
        return;
    }

    btnAll.innerHTML = '⏳ Packaging ZIP...';
    btnAll.disabled = true;
    showToast(`Initializing batch download for ${rows.length} items...`);
    const zip = new JSZip();

    try {
        await Promise.all(Array.from(rows).map(async (row) => {
            const numeroNota = row.cells[0].innerText.trim();
            const urlResponse = await fetch(`${DOWNLOAD_URL}/url/${numeroNota}`);
            const urlData = await urlResponse.json();
            const fileResponse = await fetch(urlData.downloadUrl);
            const fileText = await fileResponse.text();
            zip.file(`invoice_${numeroNota}.json`, fileText);
        }));

        const contentBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = window.URL.createObjectURL(contentBlob);
        const tempLink = document.createElement('a');
        tempLink.href = zipUrl;
        tempLink.setAttribute('download', `all_invoices_${new Date().toISOString().slice(0,10)}.zip`);
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        window.URL.revokeObjectURL(zipUrl);
        showToast('Success! All cloud invoices packed into a single .zip.');
    } catch (error) {
        console.error('[OCI-ZIP-ERROR]', error);
        showToast('Batch Download Failure: Object storage streaming blocked.', true);
    } finally {
        btnAll.disabled = false;
        btnAll.innerHTML = '📥 Download All (.Zip)';
    }
});

// GATILHO MASTER: PURGE ALL (EXCLUSÃO MASSIVA EM LOTE)
document.getElementById('btn-delete-all').addEventListener('click', async () => {
    const rows = monitorTbody.querySelectorAll('tr');
    const btnAll = document.getElementById('btn-delete-all');

    if (rows.length === 0) {
        showToast('Purge Error: Active monitoring feed is already clean!', true);
        return;
    }

    // Abre o modal uma única vez no início para o lote todo
    const isApproved = await askPermission(`🚨 CRITICAL WARNING: You are about to permanently obliterate ALL ${rows.length} active invoices from the SQL Database and Oracle Cloud Storage. Proceed with mass purge?`);
    if (!isApproved) return;

    btnAll.innerHTML = '⏳ Purging Lote...';
    btnAll.disabled = true;
    showToast(`Executing parallel cloud deletion for ${rows.length} records...`);

    try {
        await Promise.all(Array.from(rows).map(async (row) => {
            const numeroNota = row.cells[0].innerText.trim();
            const response = await fetch(`${DELETE_URL}/delete/${numeroNota}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                row.style.transition = 'all 0.4s ease';
                row.style.opacity = '0';
                row.style.transform = 'translateX(50px)';
                setTimeout(() => { row.remove(); }, 400);
            }
        }));
        showToast('Success Action: All selected infrastructure components have been fully purged.');
    } catch (error) {
        console.error('[OCI-BATCH-DELETE-ERROR]', error);
        showToast('Batch Purge Failure: Transmission grid connection timeout.', true);
    } finally {
        btnAll.disabled = false;
        btnAll.innerHTML = '🗑️ Delete All';
    }
});

