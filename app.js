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
    const { data: { session } } = await db.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        // Para a execução do chamador
        throw new Error('Not authenticated — redirecting');
    }
    window.currentUser = session.user;
    return session.user;
}

// Logout
async function sairDaConta() {
    await db.auth.signOut();
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
        const { data } = await db
            .from('settings')
            .select('*')
            .eq('user_id', window.currentUser.id)
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
    const { data, error } = await db
        .from('products')
        .select('*')
        .eq('user_id', window.currentUser.id)
        .order('name');

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
    const colab = hasColab ? (document.getElementById('saleColaborador')?.value.trim() || '') : '';
    const discount = parseFloat(document.getElementById('saleDiscount')?.value) || 0;
    const btn = document.getElementById('saveSaleBtn');
    const msg = document.getElementById('saleMsg');

    if (!prodId) { alert('Escolhe um produto!'); return; }

    const prod = todosOsProdutos.find(x => x.id === prodId);
    if (!prod) return;

    const finalPrice = Math.max(0, parseFloat(prod.final_sale_price) - discount);
    const net = finalPrice - (parseFloat(prod.base_cost) + parseFloat(prod.box_cost) + parseFloat(prod.label_cost));
    const colabFee = hasColab ? Math.max(0, net * (COLAB_PCT / 100)) : 0;
    const adminProfit = finalPrice - (parseFloat(prod.base_cost) + parseFloat(prod.box_cost) + parseFloat(prod.label_cost)) - colabFee;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> A gravar...';

    const { error } = await db.from('sales').insert([{
        user_id: window.currentUser.id,
        product_id: prodId,
        client_name: cliente || null,
        client_phone: phone || null,
        collaborator_name: colab || null,
        total_price: prod.final_sale_price,
        discount,
        final_price: finalPrice,
        collaborator_fee: colabFee,
        admin_profit: adminProfit
    }]);

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
    const { data } = await db
        .from('sales')
        .select('final_price, total_price, admin_profit')
        .eq('user_id', window.currentUser.id)
        .gte('created_at', inicio);

    if (!data) return;
    document.getElementById('dashTotalSales').textContent = '€' + data.reduce((s, x) => s + parseFloat(x.final_price || x.total_price || 0), 0).toFixed(2);
    document.getElementById('dashTotalProducts').textContent = data.length;
    document.getElementById('dashTotalProfit').textContent = '€' + data.reduce((s, x) => s + parseFloat(x.admin_profit || 0), 0).toFixed(2);
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
