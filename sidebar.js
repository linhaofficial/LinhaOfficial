// =============================================
// SIDEBAR GLOBAL — Carregada em todas as páginas
// =============================================
(function () {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    function isActive(page) {
        return currentPage === page ? 'active' : '';
    }

    const sidebarHTML = `
    <style>
        /* ----  RESET DO BODY PARA SIDEBAR ---- */
        body {
            margin: 0;
            padding: 0;
        }
        #app-layout {
            display: flex;
            min-height: 100vh;
        }

        /* ---- SIDEBAR ---- */
        #sidebar {
            width: 240px;
            min-height: 100vh;
            background: #ffffff;
            border-right: 1px solid #e5e7eb;
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
            transition: transform 0.3s ease;
            box-shadow: 2px 0 12px rgba(0,0,0,0.06);
        }
        #sidebar .sidebar-header {
            padding: 1.5rem 1.25rem 1rem;
            border-bottom: 1px solid #f3f4f6;
        }
        #sidebar .brand {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            text-decoration: none;
        }
        #sidebar .brand-icon {
            width: 36px; height: 36px;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 1rem;
        }
        #sidebar .brand-name {
            font-weight: 700;
            font-size: 1rem;
            color: #111827;
        }

        /* ---- NAV LINKS ---- */
        #sidebar nav {
            padding: 1rem 0.75rem;
            flex: 1;
        }
        #sidebar .sidebar-section {
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: #9ca3af;
            padding: 0.5rem 0.5rem 0.25rem;
            margin-top: 0.5rem;
        }
        #sidebar .nav-link {
            display: flex;
            align-items: center;
            gap: 0.65rem;
            padding: 0.65rem 0.9rem;
            border-radius: 8px;
            color: #374151;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.92rem;
            margin-bottom: 2px;
            transition: all 0.18s;
        }
        #sidebar .nav-link i {
            font-size: 1.05rem;
            opacity: 0.75;
        }
        #sidebar .nav-link:hover {
            background: #f5f3ff;
            color: #4f46e5;
        }
        #sidebar .nav-link:hover i { opacity: 1; }
        #sidebar .nav-link.active {
            background: #ede9fe;
            color: #4f46e5;
            font-weight: 600;
        }
        #sidebar .nav-link.active i { opacity: 1; }

        /* ---- FOOTER DO SIDEBAR ---- */
        #sidebar .sidebar-footer {
            padding: 1rem 1.25rem;
            border-top: 1px solid #f3f4f6;
        }
        .user-pill {
            display: flex; align-items: center; gap: 0.6rem;
            margin-bottom: 0.6rem;
        }
        .user-avatar {
            width: 34px; height: 34px; border-radius: 50%;
            background: linear-gradient(135deg,#4f46e5,#7c3aed);
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 700; font-size: 0.85rem; flex-shrink: 0;
        }
        .user-name {
            font-size: 0.82rem; font-weight: 600; color: #111827;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .user-email {
            font-size: 0.72rem; color: #9ca3af;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .btn-logout {
            display: flex; align-items: center; gap: 0.5rem;
            width: 100%; padding: 0.5rem 0.75rem;
            background: none; border: 1px solid #e5e7eb;
            border-radius: 8px; color: #6b7280;
            font-size: 0.82rem; font-weight: 500;
            cursor: pointer; transition: all 0.18s;
        }
        .btn-logout:hover { background: #fef2f2; border-color: #fca5a5; color: #ef4444; }

        /* ---- CONTEÚDO PRINCIPAL ---- */
        #page-content {
            margin-left: 240px;
            flex: 1;
            min-width: 0;
        }

        /* ---- MOBILE ---- */
        #sidebar-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.45);
            z-index: 999;
        }
        #sidebar-toggle {
            display: none;
            position: fixed;
            top: 0.85rem;
            left: 0.85rem;
            z-index: 1100;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 0.4rem 0.6rem;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        @media (max-width: 768px) {
            #sidebar {
                transform: translateX(-100%);
            }
            #sidebar.open {
                transform: translateX(0);
            }
            #sidebar-overlay.open {
                display: block;
            }
            #sidebar-toggle {
                display: flex;
                align-items: center;
            }
            #page-content {
                margin-left: 0;
                padding-top: 3.5rem;
            }
        }
    </style>

    <!-- Botão mobile -->
    <button id="sidebar-toggle" aria-label="Menu">
        <i class="bi bi-list fs-4"></i>
    </button>

    <!-- Overlay mobile -->
    <div id="sidebar-overlay"></div>

    <!-- SIDEBAR -->
    <div id="sidebar">
        <div class="sidebar-header">
            <a href="index.html" class="brand">
                <div class="brand-icon"><i class="bi bi-box-seam"></i></div>
                <span class="brand-name">Painel de Vendas</span>
            </a>
        </div>

        <nav>
            <div class="sidebar-section">Principal</div>
            <a href="index.html" class="nav-link ${isActive('index.html')}">
                <i class="bi bi-house-door"></i> Dashboard
            </a>
            <a href="produtos.html" class="nav-link ${isActive('produtos.html')}">
                <i class="bi bi-tags"></i> Produtos
            </a>
            <a href="clientes.html" class="nav-link ${isActive('clientes.html')}">
                <i class="bi bi-people"></i> Clientes
            </a>
            <a href="colaboradores.html" class="nav-link ${isActive('colaboradores.html')}">
                <i class="bi bi-person-badge"></i> Colaboradores
            </a>

            <div class="sidebar-section">Operações</div>
            <a href="calculadora.html" class="nav-link ${isActive('calculadora.html')}">
                <i class="bi bi-calculator"></i> Calculadora
            </a>
            <a href="vendas.html" class="nav-link ${isActive('vendas.html')}">
                <i class="bi bi-receipt"></i> Registar Venda
            </a>
            <a href="historico.html" class="nav-link ${isActive('historico.html')}">
                <i class="bi bi-clock-history"></i> Histórico de Vendas
            </a>

            <div class="sidebar-section" id="sysNavSection">Sistema</div>
            <a href="configuracoes.html" class="nav-link ${isActive('configuracoes.html')}" id="sysNavLink">
                <i class="bi bi-gear"></i> Configurações
            </a>
        </nav>

        <div class="sidebar-footer">
            <div class="user-pill">
                <div class="user-avatar" id="sidebarAvatar">?</div>
                <div style="min-width:0">
                    <div class="user-name" id="sidebarName">A carregar...</div>
                    <div class="user-email" id="sidebarEmail"></div>
                </div>
            </div>
            <button class="btn-logout" onclick="sairDaConta()">
                <i class="bi bi-box-arrow-right"></i> Sair da conta
            </button>
        </div>
    </div>
    `;

    // Injetar sidebar
    const sidebarEl = document.getElementById('app-sidebar');
    if (sidebarEl) {
        sidebarEl.innerHTML = sidebarHTML;
        // Preencher info do utilizador assim que o auth estiver pronto
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                const colabSession = localStorage.getItem('vendaslinha_colab');
                if (colabSession) {
                    const colab = JSON.parse(colabSession);
                    const name = colab.name || 'Colaborador';
                    const ini = name.charAt(0).toUpperCase();
                    document.getElementById('sidebarAvatar').textContent = ini;
                    document.getElementById('sidebarName').textContent = name;
                    document.getElementById('sidebarEmail').textContent = 'Membro da Equipa';
                    
                    const sysSec = document.getElementById('sysNavSection');
                    const sysLink = document.getElementById('sysNavLink');
                    if (sysSec) sysSec.style.display = 'none';
                    if (sysLink) sysLink.style.display = 'none';
                    return;
                }

                const { data: { session } } = await window.supabase
                    .createClient(
                        'https://ygyomwclmfqehhbtjaxy.supabase.co',
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneW9td2NsbWZxZWhoYnRqYXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTk5ODksImV4cCI6MjA4ODU5NTk4OX0.sXsc3vS6wtsLE8iMIdXrpqxKjoYM14WGhQbyK3p5rj4'
                    ).auth.getSession();

                if (session?.user) {
                    const u = session.user;
                    const name = u.user_metadata?.full_name || u.email.split('@')[0];
                    const ini = name.charAt(0).toUpperCase();
                    document.getElementById('sidebarAvatar').textContent = ini;
                    document.getElementById('sidebarName').textContent = name;
                    document.getElementById('sidebarEmail').textContent = u.email;
                }
            } catch (e) { }
        });
    }

    // Lógica do toggle mobile
    document.addEventListener('DOMContentLoaded', () => {
        const toggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        toggle?.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('open');
        });
        overlay?.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    });
})();
