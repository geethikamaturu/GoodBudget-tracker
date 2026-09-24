/* ==========================================================
   Expense Tracker — CRUD + Calculations + DOM
   Data persists in the browser via localStorage.
   ========================================================== */

const STORAGE_KEY = 'ledger.expenses.v1';

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Other'];

/* ---------- State ---------- */
let expenses = loadExpenses();
let editingId = null;

/* ---------- DOM references ---------- */
const form = document.getElementById('expense-form');
const idField = document.getElementById('expense-id');
const titleField = document.getElementById('title');
const amountField = document.getElementById('amount');
const dateField = document.getElementById('date');
const categoryField = document.getElementById('category');
const descriptionField = document.getElementById('description');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formHeading = document.getElementById('form-heading');

const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const filterFrom = document.getElementById('filter-from');
const filterTo = document.getElementById('filter-to');
const clearFiltersBtn = document.getElementById('clear-filters-btn');

const rowsBody = document.getElementById('expense-rows');
const emptyState = document.getElementById('empty-state');
const totalAmountEl = document.getElementById('total-amount');
const entryCountEl = document.getElementById('entry-count');
const categoryBreakdownEl = document.getElementById('category-breakdown');
const toastEl = document.getElementById('toast');

/* ---------- Persistence ---------- */
function loadExpenses(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return seedData();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedData();
  }catch(err){
    console.error('Could not read saved expenses:', err);
    return [];
  }
}

function saveExpenses(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }catch(err){
    console.error('Could not save expenses:', err);
    showToast('Could not save — storage may be full.');
  }
}

function seedData(){
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };
  return [
    { id: cryptoId(), title: 'Groceries', amount: 1450, category: 'Food', date: daysAgo(1), description: 'Weekly vegetables and staples' },
    { id: cryptoId(), title: 'Auto to office', amount: 180, category: 'Travel', date: daysAgo(2), description: '' },
    { id: cryptoId(), title: 'New headphones', amount: 3200, category: 'Shopping', date: daysAgo(4), description: 'Replacing broken ones' },
    { id: cryptoId(), title: 'Electricity bill', amount: 2100, category: 'Bills', date: daysAgo(6), description: '' },
    { id: cryptoId(), title: 'Movie night', amount: 650, category: 'Entertainment', date: daysAgo(8), description: 'With friends' },
  ];
}

function cryptoId(){
  return (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

/* ---------- Formatting helpers ---------- */
function formatMoney(n){
  const num = Number(n) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoStr){
  if(!isoStr) return '';
  const d = new Date(isoStr + 'T00:00:00');
  if(isNaN(d)) return isoStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(str){
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast(message){
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

/* ---------- CRUD: Create / Update ---------- */
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = titleField.value.trim();
  const amount = parseFloat(amountField.value);
  const date = dateField.value;
  const category = categoryField.value;
  const description = descriptionField.value.trim();

  if(!title || isNaN(amount) || amount < 0 || !date || !category){
    showToast('Please fill in title, a valid amount, date and category.');
    return;
  }

  if(editingId){
    const target = expenses.find(x => x.id === editingId);
    if(target){
      Object.assign(target, { title, amount, date, category, description });
      showToast('Entry updated.');
    }
    exitEditMode();
  }else{
    expenses.push({ id: cryptoId(), title, amount, date, category, description });
    showToast('Entry added.');
  }

  saveExpenses();
  form.reset();
  dateField.value = todayIso();
  render();
});

/* ---------- CRUD: Edit ---------- */
function startEdit(id){
  const item = expenses.find(x => x.id === id);
  if(!item) return;

  editingId = id;
  idField.value = id;
  titleField.value = item.title;
  amountField.value = item.amount;
  dateField.value = item.date;
  categoryField.value = item.category;
  descriptionField.value = item.description || '';

  formHeading.textContent = 'Edit entry';
  submitBtn.textContent = 'Save changes';
  cancelEditBtn.hidden = false;
  titleField.focus();
  document.querySelector('.entry-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function exitEditMode(){
  editingId = null;
  idField.value = '';
  formHeading.textContent = 'New entry';
  submitBtn.textContent = 'Add entry';
  cancelEditBtn.hidden = true;
}

cancelEditBtn.addEventListener('click', () => {
  exitEditMode();
  form.reset();
  dateField.value = todayIso();
});

/* ---------- CRUD: Delete ---------- */
function deleteExpense(id){
  const item = expenses.find(x => x.id === id);
  if(!item) return;
  const ok = confirm(`Delete "${item.title}" (${formatMoney(item.amount)})? This can't be undone.`);
  if(!ok) return;

  expenses = expenses.filter(x => x.id !== id);
  saveExpenses();

  if(editingId === id){
    exitEditMode();
    form.reset();
    dateField.value = todayIso();
  }

  showToast('Entry deleted.');
  render();
}

/* ---------- Filtering / Search ---------- */
function getFilteredExpenses(){
  const query = searchInput.value.trim().toLowerCase();
  const cat = filterCategory.value;
  const from = filterFrom.value;
  const to = filterTo.value;

  return expenses.filter(x => {
    if(cat && x.category !== cat) return false;
    if(from && x.date < from) return false;
    if(to && x.date > to) return false;
    if(query){
      const haystack = (x.title + ' ' + (x.description || '')).toLowerCase();
      if(!haystack.includes(query)) return false;
    }
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));
}

[searchInput, filterCategory, filterFrom, filterTo].forEach(el => {
  el.addEventListener('input', render);
});

clearFiltersBtn.addEventListener('click', () => {
  searchInput.value = '';
  filterCategory.value = '';
  filterFrom.value = '';
  filterTo.value = '';
  render();
});

/* ---------- Calculations ---------- */
function calculateTotal(list){
  return list.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
}

function calculateByCategory(list){
  const totals = {};
  CATEGORIES.forEach(c => totals[c] = 0);
  list.forEach(x => { totals[x.category] = (totals[x.category] || 0) + (Number(x.amount) || 0); });
  return totals;
}

/* ---------- Rendering ---------- */
function render(){
  const filtered = getFilteredExpenses();

  renderSummary(filtered);
  renderTable(filtered);
}

function renderSummary(list){
  const total = calculateTotal(list);
  totalAmountEl.textContent = formatMoney(total);
  entryCountEl.textContent = `${list.length} ${list.length === 1 ? 'entry' : 'entries'}`;

  const byCategory = calculateByCategory(list);
  categoryBreakdownEl.innerHTML = CATEGORIES
    .filter(c => byCategory[c] > 0)
    .map(c => `
      <div class="breakdown-item">
        <span class="breakdown-dot cat-${c}"></span>
        <span class="breakdown-name">${c}</span>
        <span class="breakdown-amt">${formatMoney(byCategory[c])}</span>
      </div>
    `).join('') || '<span class="breakdown-name">Nothing to break down yet.</span>';
}

function renderTable(list){
  if(list.length === 0){
    rowsBody.innerHTML = '';
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  rowsBody.innerHTML = list.map(x => `
    <tr>
      <td class="col-date">${formatDate(x.date)}</td>
      <td class="col-title">
        <span class="row-title">${escapeHtml(x.title)}</span>
        ${x.description ? `<span class="row-desc">${escapeHtml(x.description)}</span>` : ''}
      </td>
      <td class="col-category"><span class="pill cat-${x.category}">${x.category}</span></td>
      <td class="col-amount">${formatMoney(x.amount)}</td>
      <td class="col-actions">
        <div class="row-actions">
          <button type="button" class="icon-btn" data-action="edit" data-id="${x.id}">Edit</button>
          <button type="button" class="icon-btn danger" data-action="delete" data-id="${x.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

rowsBody.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if(!btn) return;
  const { action, id } = btn.dataset;
  if(action === 'edit') startEdit(id);
  if(action === 'delete') deleteExpense(id);
});

/* ---------- Init ---------- */
function todayIso(){
  return new Date().toISOString().slice(0, 10);
}

dateField.value = todayIso();
render();
