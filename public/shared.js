// shared.js — Sidebar + Auth helpers dùng chung cho tất cả trang

const API = 'http://localhost:5000/api';

function getToken() { return localStorage.getItem('token'); }
function getUser()  { return JSON.parse(localStorage.getItem('user') || '{}'); }

function requireAuth() {
  if (!getToken()) window.location.href = 'login.html';
}

function logout() {
  fetch(`${API}/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + getToken() }
  }).finally(() => {
    localStorage.clear();
    window.location.href = 'login.html';
  });
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken(),
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (res.status === 401) { localStorage.clear(); window.location.href = 'login.html'; }
  return { ok: res.ok, data, status: res.status };
}

function renderSidebar(activePage) {
  const user = getUser();
  const role = user.role || 'customer';

  const menuItems = [
    { id: 'dashboard',    icon: 'bi-grid-fill',         label: 'Dashboard',       href: 'dashboard.html',    roles: ['admin','staff','customer'] },
    { id: 'instruments',  icon: 'bi-music-note-beamed', label: 'Nhạc cụ',         href: 'instruments.html',  roles: ['admin','staff','customer'] },
    { id: 'rooms',        icon: 'bi-door-open-fill',    label: 'Phòng tập',       href: 'rooms.html',        roles: ['admin','staff','customer'] },
    { id: 'bookings',     icon: 'bi-calendar-check',    label: 'Đặt phòng',       href: 'bookings.html',     roles: ['admin','staff','customer'] },
    { id: 'borrows',      icon: 'bi-arrow-left-right',  label: 'Mượn/Trả',        href: 'borrows.html',      roles: ['admin','staff'] },
    { id: 'users',        icon: 'bi-people-fill',       label: 'Người dùng',      href: 'users.html',        roles: ['admin'] },
    { id: 'statistics',   icon: 'bi-bar-chart-fill',    label: 'Thống kê',        href: 'statistics.html',   roles: ['admin','staff'] },
  ];

  const filtered = menuItems.filter(m => m.roles.includes(role));

  return `
  <nav class="sidebar" id="sidebar">
    <div class="sidebar-brand">
      <span class="brand-text">Music<span>Studio</span></span>
    </div>

    <div class="sidebar-user">
      <div class="user-avatar">${(user.full_name || 'U')[0].toUpperCase()}</div>
      <div class="user-info">
        <div class="user-name">${user.full_name || user.username}</div>
        <div class="user-role">${role.toUpperCase()}</div>
      </div>
    </div>

    <ul class="sidebar-menu">
      ${filtered.map(item => `
        <li class="sidebar-item ${activePage === item.id ? 'active' : ''}">
          <a href="${item.href}" class="sidebar-link">
            <i class="bi ${item.icon}"></i>
            <span>${item.label}</span>
          </a>
        </li>
      `).join('')}
    </ul>

    <div class="sidebar-footer">
      <button class="btn-logout" onclick="logout()">
        <i class="bi bi-box-arrow-left"></i>
        <span>Đăng xuất</span>
      </button>
    </div>
  </nav>
  `;
}

const SIDEBAR_CSS = `
  :root {
    --primary: #FF6B2B;
    --primary-dark: #e55a1f;
    --bg: #0D0D0D;
    --surface: #161616;
    --surface2: #1E1E1E;
    --border: #2A2A2A;
    --text: #F0F0F0;
    --text-muted: #888;
    --sidebar-w: 240px;
  }

  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans',sans-serif; background:var(--bg); color:var(--text); display:flex; min-height:100vh; }

  .sidebar {
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
  }

  .sidebar-brand {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .brand-text {
    font-family: 'Syne', sans-serif;
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text);
  }

  .brand-text span { color: var(--primary); }

  .sidebar-user {
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid var(--border);
  }

  .user-avatar {
    width: 36px; height: 36px;
    background: var(--primary);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    flex-shrink: 0;
  }

  .user-name {
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-role {
    font-size: 0.7rem;
    color: var(--primary);
    letter-spacing: 0.1em;
  }

  .sidebar-menu {
    list-style: none;
    padding: 1rem 0;
    flex: 1;
    overflow-y: auto;
  }

  .sidebar-item { margin: 0.15rem 0.75rem; }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.75rem;
    color: var(--text-muted);
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.88rem;
    transition: all 0.2s;
  }

  .sidebar-link:hover {
    background: var(--surface2);
    color: var(--text);
  }

  .sidebar-item.active .sidebar-link {
    background: rgba(255,107,43,0.15);
    color: var(--primary);
  }

  .sidebar-link i { font-size: 1rem; width: 20px; }

  .sidebar-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border);
  }

  .btn-logout {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-muted);
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    width: 100%;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .btn-logout:hover {
    border-color: #dc3545;
    color: #dc3545;
  }

  .main-content {
    margin-left: var(--sidebar-w);
    flex: 1;
    padding: 2rem;
    min-height: 100vh;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
  }

  .page-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s;
  }

  .stat-card:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
  }

  .stat-icon {
    width: 48px; height: 48px;
    background: rgba(255,107,43,0.15);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem;
    color: var(--primary);
    margin-bottom: 1rem;
  }

  .stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .data-table {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }

  .table-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .table-title {
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 1rem;
  }

  table { width: 100%; border-collapse: collapse; }

  th {
    padding: 0.75rem 1.5rem;
    text-align: left;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
    font-weight: 500;
  }

  td {
    padding: 0.9rem 1.5rem;
    border-bottom: 1px solid var(--border);
    font-size: 0.88rem;
    vertical-align: middle;
  }

  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--surface2); }

  .badge-status {
    padding: 0.3rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .badge-available  { background: rgba(40,167,69,0.15);  color: #28a745; }
  .badge-borrowed   { background: rgba(255,193,7,0.15);  color: #ffc107; }
  .badge-maintenance{ background: rgba(108,117,125,0.15);color: #6c757d; }
  .badge-pending    { background: rgba(255,193,7,0.15);  color: #ffc107; }
  .badge-confirmed  { background: rgba(40,167,69,0.15);  color: #28a745; }
  .badge-cancelled  { background: rgba(220,53,69,0.15);  color: #dc3545; }
  .badge-completed  { background: rgba(13,110,253,0.15); color: #0d6efd; }

  .btn-primary-custom {
    background: var(--primary);
    color: white;
    border: none;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .btn-primary-custom:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
  }

  .btn-sm-action {
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.8rem;
  }

  .btn-sm-action:hover { border-color: var(--primary); color: var(--primary); }
  .btn-sm-action.danger:hover { border-color: #dc3545; color: #dc3545; }

  /* Modal */
  .modal-content {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text);
  }

  .modal-header {
    border-bottom: 1px solid var(--border);
    padding: 1.25rem 1.5rem;
  }

  .modal-title {
    font-family: 'Syne', sans-serif;
    font-weight: 600;
  }

  .modal-footer { border-top: 1px solid var(--border); }

  .btn-close { filter: invert(1); }

  .form-control, .form-select {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 8px;
    padding: 0.7rem 1rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
  }

  .form-control:focus, .form-select:focus {
    background: var(--surface2);
    border-color: var(--primary);
    color: var(--text);
    box-shadow: 0 0 0 3px rgba(255,107,43,0.1);
  }

  .form-control::placeholder { color: var(--text-muted); }
  .form-select option { background: var(--surface2); }

  .form-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.4rem;
  }

  .toast-container { z-index: 9999; }

  .loading-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 9998;
    align-items: center;
    justify-content: center;
  }

  .loading-overlay.show { display: flex; }
  .spinner-ring {
    width: 48px; height: 48px;
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--text-muted);
  }
  .empty-state i { font-size: 2.5rem; margin-bottom: 1rem; display: block; }
`;

function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer') || (() => {
    const el = document.createElement('div');
    el.id = 'toastContainer';
    el.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(el);
    return el;
  })();

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'warning'} border-0 show`;
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${msg}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button>
    </div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showLoading(show = true) {
  const el = document.getElementById('loadingOverlay');
  if (el) el.classList.toggle('show', show);
}

function formatCurrency(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function badgeStatus(status) {
  const map = {
    available: 'available', borrowed: 'borrowed', maintenance: 'maintenance', retired: 'maintenance',
    pending: 'pending', confirmed: 'confirmed', cancelled: 'cancelled', completed: 'completed',
    returned: 'completed', overdue: 'cancelled', lost: 'cancelled'
  };
  const labels = {
    available: 'Sẵn sàng', borrowed: 'Đang mượn', maintenance: 'Bảo trì', retired: 'Nghỉ hưu',
    pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', cancelled: 'Đã hủy', completed: 'Hoàn thành',
    returned: 'Đã trả', overdue: 'Quá hạn', lost: 'Mất'
  };
  return `<span class="badge-status badge-${map[status] || 'pending'}">${labels[status] || status}</span>`;
}
