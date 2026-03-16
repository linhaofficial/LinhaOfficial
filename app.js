// ==========================================
// SUPABASE
// ==========================================
const SUPABASE_URL = 'https://ygyomwclmfqehhbtjaxy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneW9td2NsbWZxZWhoYnRqYXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTk5ODksImV4cCI6MjA4ODU5NTk4OX0.sXsc3vS6wtsLE8iMIdXrpqxKjoYM14WGhQbyK3p5rj4';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// AUTH — guarda o utilizador atual
// ==========================================
window.currentUser = null;

// Auth guard: redireciona para login se não autenticado.
// Cada página deve ter na sua tag <script>:
//   document.addEventListener('DOMContentLoaded', async () => {
//       await requireAuth();   // <-- primeira linha sempre
//       ... resto do código
//   });
async function requireAuth() {
    const colabSession = localStorage.getItem('vendaslinha_colab');
    if (colabSession) {
        window.currentUser = JSON.parse(colabSession);
        window.currentUser.type = 'collaborator';
        validarPermissoesPagina();
        setupRealtime();
        return window.currentUser;
    }

    const { data: { session } } = await db.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        throw new Error('Not authenticated — redirecting');
    }
    window.currentUser = session.user;
    window.currentUser.type = 'admin';
    validarPermissoesPagina();
    setupRealtime();
    return window.currentUser;
}

function validarPermissoesPagina() {
    const path = window.location.pathname;
    if (window.currentUser?.type === 'collaborator') {
        if (path.includes('configuracoes.html')) {
            window.location.href = 'index.html';
        }
    }
}

// Logout
async function sairDaConta() {
    if (window.currentUser?.type === 'collaborator') {
        localStorage.removeItem('vendaslinha_colab');
    } else {
        await db.auth.signOut();
    }
    window.location.href = 'login.html';
}

// ==========================================
// CONFIGURAÇÕES (por utilizador)
// ==========================================
let BOX_COST = 1.20;
let LABEL_COST = 0.30;
let COLAB_PCT = 40;

async function carregarConfiguracoes() {
    if (!window.currentUser) return;
    try {
        const uid = window.currentUser.type === 'collaborator' ? window.currentUser.admin_user_id : window.currentUser.id;
        const { data } = await db
            .from('settings')
            .select('*')
            .eq('user_id', uid)
            .single();
        if (data) {
            BOX_COST = parseFloat(data.default_box_cost) || 1.20;
            LABEL_COST = parseFloat(data.default_label_cost) || 0.30;
            COLAB_PCT = parseInt(data.colab_percent) || 40;
        }
    } catch (e) { /* usa defaults */ }
}

// ==========================================
// PRODUTOS
// ==========================================
let todosOsProdutos = [];

async function carregarProdutos() {
    const sel = document.getElementById('saleProduct');
    const uid = window.currentUser.type === 'collaborator' ? window.currentUser.admin_user_id : window.currentUser.id;
    let data, error;
    
    if (window.currentUser.type === 'collaborator') {
        const res = await db.rpc('get_products_for_collaborator', { admin_uid: uid, colab_id: window.currentUser.id });
        data = res.data; error = res.error;
    } else {
         const res = await db.from('products').select('*').eq('user_id', uid).order('name');
         data = res.data; error = res.error;
    }

    if (error || !data || data.length === 0) {
        if (sel) sel.innerHTML = '<option value="">Sem produtos no catálogo</option>';
        return;
    }
    todosOsProdutos = data;
    if (sel) {
        sel.innerHTML = '<option value="">-- Escolher produto --</option>';
        data.forEach(p => {
            const o = document.createElement('option');
            o.value = p.id;
            o.textContent = p.name + '  —  €' + parseFloat(p.final_sale_price).toFixed(2);
            sel.appendChild(o);
        });
    }
}

function mostrarInfoProduto() {
    const id = document.getElementById('saleProduct').value;
    const box = document.getElementById('saleProductInfo');
    if (!id) { box?.classList.add('d-none'); return; }
    const p = todosOsProdutos.find(x => x.id === id);
    if (!p) return;
    document.getElementById('infoPriceTotal').textContent = '€' + parseFloat(p.final_sale_price).toFixed(2);
    document.getElementById('infoProfit').textContent = '€' + parseFloat(p.profit_margin).toFixed(2);
    document.getElementById('infoColab').textContent = '€' + parseFloat(p.collaborator_fee).toFixed(2);
    box?.classList.remove('d-none');
}

// ==========================================
// VENDAS
// ==========================================
async function guardarVendaCompleta(hasColab) {
    const prodId = document.getElementById('saleProduct').value;
    const cliente = document.getElementById('saleClient')?.value.trim();
    const phone = document.getElementById('saleClientPhone')?.value.trim() || '';
    const discount = parseFloat(document.getElementById('saleDiscount')?.value) || 0;
    const btn = document.getElementById('saveSaleBtn');
    const msg = document.getElementById('saleMsg');

    if (!prodId) { alert('Escolhe um produto!'); return; }
    const prod = todosOsProdutos.find(x => x.id === prodId);
    if (!prod) return;

    const isColabUser = window.currentUser?.type === 'collaborator';
    const adminUserId = isColabUser ? window.currentUser.admin_user_id : window.currentUser.id;
    const colabNameInput = hasColab ? (document.getElementById('saleColaborador')?.value.trim() || '') : '';
    const colabNome = isColabUser ? window.currentUser.name : colabNameInput;

    const baseCost = parseFloat(prod.base_cost) + parseFloat(prod.box_cost) + parseFloat(prod.label_cost);
    const finalPrice = Math.max(0, parseFloat(prod.final_sale_price) - discount);
    const net = finalPrice - baseCost;

    let colabFee = 0;
    if (isColabUser || hasColab) {
        let originalFee = (parseFloat(prod.final_sale_price) - baseCost) * (COLAB_PCT / 100);
        colabFee = Math.max(0, originalFee - discount);
    }
    const adminProfit = net - colabFee;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> A gravar...';

    const payload = {
        user_id: adminUserId,
        product_id: prodId,
        client_name: cliente || null,
        client_phone: phone || null,
        collaborator_name: colabNome || null,
        total_price: prod.final_sale_price,
        discount,
        final_price: finalPrice,
        collaborator_fee: colabFee,
        admin_profit: adminProfit
    };

    let error;
    if (isColabUser) {
        payload.collaborator_id = window.currentUser.id;
        const res = await db.rpc('insert_sale_as_collaborator', { sale_data: payload });
        error = res.error || (res.data?.error ? { message: res.data.error } : null);
    } else {
        const res = await db.from('sales').insert([payload]);
        error = res.error;
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-receipt me-2"></i> Registar Venda';

    if (error) {
        msg.className = 'text-center small mt-2 text-danger';
        msg.textContent = 'Erro: ' + error.message;
        console.error(error);
    } else {
        msg.className = 'text-center small mt-2 text-success fw-bold';
        msg.textContent = '✔ Venda registada com sucesso!';
        document.getElementById('saleProduct').value = '';
        if (document.getElementById('saleClient')) document.getElementById('saleClient').value = '';
        if (document.getElementById('saleClientPhone')) document.getElementById('saleClientPhone').value = '';
        if (document.getElementById('saleColaborador')) document.getElementById('saleColaborador').value = '';
        if (document.getElementById('saleDiscount')) document.getElementById('saleDiscount').value = '0';
        document.getElementById('saleProductInfo')?.classList.add('d-none');
        document.getElementById('finalPriceBox')?.classList.add('d-none');
        setTimeout(() => msg.classList.add('d-none'), 3000);
    }
    msg.classList.remove('d-none');
}

async function guardarVenda() { return guardarVendaCompleta(true); }

// ==========================================
// DASHBOARD
// ==========================================
async function carregarDashboard() {
    const inicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const isColab = window.currentUser?.type === 'collaborator';
    const uid = isColab ? window.currentUser.admin_user_id : window.currentUser.id;

    let query = db.from('sales')
        .select('final_price, total_price, admin_profit, collaborator_fee')
        .eq('user_id', uid)
        .gte('created_at', inicio);
        
    if (isColab) {
        query = query.eq('collaborator_name', window.currentUser.name);
    }

    const { data } = await query;
    if (!data) return;

    document.getElementById('dashTotalSales').textContent = '€' + data.reduce((s, x) => s + parseFloat(x.final_price || x.total_price || 0), 0).toFixed(2);
    document.getElementById('dashTotalProducts').textContent = data.length;
    
    if (isColab) {
        const titleEl = document.getElementById('dashProfitTitle');
        if (titleEl) titleEl.textContent = 'A Tua Comissão';
        document.getElementById('dashTotalProfit').textContent = '€' + data.reduce((s, x) => s + parseFloat(x.collaborator_fee || 0), 0).toFixed(2);
    } else {
        document.getElementById('dashTotalProfit').textContent = '€' + data.reduce((s, x) => s + parseFloat(x.admin_profit || 0), 0).toFixed(2);
    }
}

// ==========================================
// LISTA DE PRODUTOS (tabela)
// ==========================================
async function carregarListaProdutos() {
    const tbody = document.getElementById('produtosTable');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">A carregar...</td></tr>';
    const { data, error } = await db
        .from('products')
        .select('*')
        .eq('user_id', window.currentUser.id)
        .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Sem produtos no catálogo.</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(p => `
        <tr>
            <td class="fw-semibold px-4">${p.name}</td>
            <td>€${parseFloat(p.base_cost).toFixed(2)}</td>
            <td class="text-success fw-bold">€${parseFloat(p.final_sale_price).toFixed(2)}</td>
            <td class="text-info">€${parseFloat(p.profit_margin).toFixed(2)}</td>
            <td class="text-warning">€${parseFloat(p.collaborator_fee).toFixed(2)}</td>
        </tr>
    `).join('');
}

// ==========================================
// REALTIME NOTIFICAÇÕES
// ==========================================
function setupRealtime() {
    if (!window.currentUser) return;
    const isColab = window.currentUser?.type === 'collaborator';
    const uid = isColab ? window.currentUser.admin_user_id : window.currentUser.id;

    if (!document.getElementById('toastContainer')) {
        const div = document.createElement('div');
        div.id = 'toastContainer';
        div.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        div.style.zIndex = '9999';
        document.body.appendChild(div);
    }

    db.channel('public:sales')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'sales', filter: `user_id=eq.${uid}` },
            (payload) => {
                const s = payload.new;
                
                if (isColab && s.collaborator_name !== window.currentUser.name) return;

                const colabText = s.collaborator_name ? `por ${s.collaborator_name}` : 'Direta';
                mostrarToast('Nova Venda Registada! 🎉', `Valor: €${parseFloat(s.final_price).toFixed(2)} (${colabText})`);

                if (typeof carregarDashboard === 'function' && window.location.pathname.includes('index.html')) {
                    carregarDashboard();
                    location.reload(); 
                }
            }
        )
        .subscribe();
}

function mostrarToast(titulo, msg) {
    const container = document.getElementById('toastContainer');
    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-white bg-success border-0 mb-2';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <strong>${titulo}</strong> <br/> ${msg}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    container.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
    
    toastEl.addEventListener('hidden.bs.toast', () => { toastEl.remove(); });
}
