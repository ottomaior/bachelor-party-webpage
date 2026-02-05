import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD7STy9Pyx6jBOtagEtQBQ3xM77cdlRIU8",
    authDomain: "otto-bachelor-party.firebaseapp.com",
    projectId: "otto-bachelor-party",
    storageBucket: "otto-bachelor-party.firebasestorage.app",
    messagingSenderId: "918048100825",
    appId: "1:918048100825:web:13069d341370085ba689c8"
};

// Initialize Firebase
console.log('🚀 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
console.log('✅ Firebase initialized');

// Exchange rate
const CZK_TO_EUR = 0.04;

// State
let peopleList = [];
let editingExpenseId = null;

// ==================== LOAD PEOPLE ====================
async function loadPeople() {
    console.log('🔄 Loading people...');
    try {
        const querySnapshot = await getDocs(collection(db, 'rsvps'));
        peopleList = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.name) {
                peopleList.push({
                    name: data.name,
                    revolut: data.revolut || '',
                    revolutLink: data.revolutLink || ''
                });
            }
        });

        console.log('✅ Loaded', peopleList.length, 'people');

        if (peopleList.length === 0) {
            peopleList = [
                { name: 'Alexandru Suciu', revolutLink: 'https://revolut.me/alexanle5x', revolut: '' },
                { name: 'Ottó', revolut: '', revolutLink: '' },
                { name: 'Emil', revolut: '', revolutLink: '' }
            ];
        }

        populatePeopleDropdowns();
        setTimeout(renderRevolutPeople, 300);
    } catch (error) {
        console.error("❌ Error loading people:", error);
        peopleList = [
            { name: 'Alexandru Suciu', revolutLink: 'https://revolut.me/alexanle5x', revolut: '' },
            { name: 'Ottó', revolut: '', revolutLink: '' },
            { name: 'Emil', revolut: '', revolutLink: '' }
        ];
        populatePeopleDropdowns();
        renderRevolutPeople();
    }
}

// ==================== POPULATE DROPDOWNS ====================
function populatePeopleDropdowns() {
    const paidBySelect = document.getElementById('paid-by');
    const splitBetweenList = document.getElementById('split-between-list');

    if (paidBySelect) {
        paidBySelect.innerHTML = '<option value="">Válassz...</option>';
        peopleList.forEach(person => {
            const option = document.createElement('option');
            option.value = person.name;
            option.textContent = person.name;
            paidBySelect.appendChild(option);
        });
    }

    if (splitBetweenList) {
        splitBetweenList.innerHTML = '';
        peopleList.forEach((person, index) => {
            const div = document.createElement('div');
            div.className = 'flex items-center gap-2 p-2 hover:bg-white/5 rounded transition';
            div.innerHTML = `
                <input type="checkbox" id="person-${index}" value="${person.name}" class="w-4 h-4 rounded person-checkbox accent-purple-500">
                <label for="person-${index}" class="cursor-pointer flex-1">${person.name}</label>
            `;
            splitBetweenList.appendChild(div);
        });
    }
}

// ==================== REVOLUT PEOPLE WITH QR CODES ====================
function renderRevolutPeople() {
    const container = document.getElementById('revolut-people-list');
    if (!container) return;

    if (peopleList.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4 col-span-full">Nincsenek résztvevők</p>';
        return;
    }

    container.innerHTML = peopleList.map(person => {
        const revolutLink = person.revolutLink || (person.revolut ? `https://revolut.me/${person.revolut}` : '');
        const hasRevolut = revolutLink && revolutLink.trim() !== '';

        if (hasRevolut) {
            return `
                <div class="flex flex-col items-center gap-2 p-3 glass-card rounded-xl hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group text-center">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                        ${person.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="text-xs font-semibold text-white">${person.name.split(' ')[0]}</div>
                    <div class="flex gap-2 w-full">
                        <a href="${revolutLink}" target="_blank" rel="noopener noreferrer"
                           class="flex-1 px-2 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1">
                            <span>💳</span><span>Pay</span>
                        </a>
                        <button onclick="showQRCode('${person.name}', '${revolutLink}')" 
                                class="px-2 py-1.5 bg-purple-500 hover:bg-purple-600 rounded-lg text-xs font-semibold text-white transition-colors">
                            📱
                        </button>
                    </div>
                </div>
            `;
        }
        return `
            <div class="flex flex-col items-center gap-2 p-3 glass-card rounded-xl opacity-40 cursor-not-allowed text-center">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white font-bold text-lg">
                    ${person.name.charAt(0).toUpperCase()}
                </div>
                <div class="text-xs font-semibold text-white">${person.name.split(' ')[0]}</div>
                <div class="px-3 py-1.5 bg-gray-600 rounded-lg text-xs text-gray-400 w-full">No Link</div>
            </div>
        `;
    }).join('');
}

// ==================== QR CODE FUNCTIONS ====================
window.showQRCode = function(name, revolutLink) {
    const modal = document.getElementById('qr-modal');
    const title = document.getElementById('qr-modal-title');
    const subtitle = document.getElementById('qr-modal-subtitle');
    const directLink = document.getElementById('qr-direct-link');
    const canvas = document.getElementById('qr-canvas');
    
    if (!modal || !canvas) return;
    
    title.textContent = `Fizetés: ${name}`;
    subtitle.textContent = 'Scanneld be a QR kódot a Revoluttal';
    directLink.href = revolutLink;
    
    // Generate QR code
    if (typeof QRCode !== 'undefined') {
        QRCode.toCanvas(canvas, revolutLink, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }, function(error) {
            if (error) console.error('QR Code error:', error);
        });
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeQRModal = function(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('qr-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// ==================== MODAL CONTROLS ====================
const modal = document.getElementById('expense-modal');
const addExpenseBtn = document.getElementById('add-expense-btn');
const addExpenseBtnTop = document.getElementById('add-expense-btn-top');
const addExpenseBtnHeader = document.getElementById('add-expense-btn-header');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelBtn = document.getElementById('cancel-btn');

function openModal() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('expense-form')?.reset();
    document.getElementById('photo-preview')?.classList.add('hidden');
    if (editingExpenseId) resetFormToAddMode();
}

if (addExpenseBtn) addExpenseBtn.addEventListener('click', openModal);
if (addExpenseBtnTop) addExpenseBtnTop.addEventListener('click', openModal);
if (addExpenseBtnHeader) addExpenseBtnHeader.addEventListener('click', openModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

// Photo preview
const billPhotoInput = document.getElementById('bill-photo');
if (billPhotoInput) {
    billPhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('preview-img').src = e.target.result;
                document.getElementById('photo-preview').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
}

// Select all button
document.getElementById('select-all-btn')?.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.person-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
});

// ==================== CONFETTI ====================
function triggerConfetti() {
    const colors = ['#FF6B9D', '#C44569', '#FEC163', '#A8EDEA', '#764BA2', '#667EEA'];
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

// ==================== FORM SUBMISSION ====================
const expenseForm = document.getElementById('expense-form');
if (expenseForm) {
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const currency = document.getElementById('currency').value;
        const category = document.getElementById('category').value;
        const paidBy = document.getElementById('paid-by').value;
        const billPhoto = document.getElementById('bill-photo').files[0];

        if (!paidBy) {
            window.toast?.warning('Kérlek válaszd ki ki fizette!') || alert('Kérlek válaszd ki ki fizette!');
            return;
        }

        const splitBetween = Array.from(document.querySelectorAll('.person-checkbox:checked')).map(cb => cb.value);
        if (splitBetween.length === 0) {
            window.toast?.warning('Kérlek válassz legalább egy embert!') || alert('Kérlek válassz legalább egy embert!');
            return;
        }

        const amountEUR = currency === 'CZK' ? amount * CZK_TO_EUR : amount;
        const amountPerPerson = amountEUR / splitBetween.length;

        let billImageUrl = '';
        if (billPhoto) {
            try {
                const storageRef = ref(storage, `bills/${Date.now()}_${billPhoto.name}`);
                await uploadBytes(storageRef, billPhoto);
                billImageUrl = await getDownloadURL(storageRef);
            } catch (error) {
                console.error('Error uploading photo:', error);
            }
        }

        const payments = {};
        splitBetween.forEach(person => {
            payments[person] = {
                status: person === paidBy ? 'paid' : 'pending',
                paidAt: person === paidBy ? new Date() : null
            };
        });

        try {
            if (editingExpenseId) {
                const existingExpense = (window.allExpenses || []).find(e => e.id === editingExpenseId);
                const updateData = {
                    description, amount: amountEUR, originalAmount: amount, currency, category,
                    paidBy, splitBetween, amountPerPerson, payments, updatedAt: serverTimestamp()
                };
                if (billImageUrl) updateData.billImageUrl = billImageUrl;
                else if (existingExpense?.billImageUrl) updateData.billImageUrl = existingExpense.billImageUrl;

                await updateDoc(doc(db, 'expenses', editingExpenseId), updateData);
                window.toast?.success('Költség sikeresen módosítva!', { icon: '✏️' });
                resetFormToAddMode();
            } else {
                await addDoc(collection(db, 'expenses'), {
                    description, amount: amountEUR, originalAmount: amount, currency, category,
                    paidBy, splitBetween, amountPerPerson, billImageUrl, payments, timestamp: serverTimestamp()
                });
                triggerConfetti();
                window.toast?.success('Költség sikeresen hozzáadva!', { icon: '💰' });
            }
            closeModal();
        } catch (error) {
            console.error('Error:', error);
            window.toast?.error(error.message, { title: 'Hiba történt' }) || alert('❌ Hiba: ' + error.message);
        }
    });
}

function resetFormToAddMode() {
    editingExpenseId = null;
    const modalTitle = document.querySelector('#expense-modal h3');
    const submitBtn = document.querySelector('#expense-form button[type="submit"]');
    if (modalTitle) modalTitle.textContent = '➕ Új Költség Hozzáadása';
    if (submitBtn) submitBtn.innerHTML = '💾 Költség Mentése';
}

// ==================== LOAD EXPENSES ====================
function loadExpenses() {
    const q = query(collection(db, 'expenses'), orderBy('timestamp', 'desc'));

    onSnapshot(q, (snapshot) => {
        const expenses = [];
        snapshot.forEach((doc) => {
            expenses.push({ id: doc.id, ...doc.data() });
        });

        window.allExpenses = expenses;
        displayExpenses(expenses);
        calculateAndDisplayBalances(expenses);
        updateCategoryBreakdown(expenses);
        updateQuickStats(expenses);
        updateChart(expenses);
    });
}

// ==================== DISPLAY EXPENSES ====================
function displayExpenses(expenses) {
    const expenseList = document.getElementById('expense-list');
    if (!expenseList) return;

    if (expenses.length === 0) {
        expenseList.innerHTML = `
            <div class="text-center text-gray-400 py-12 glass-card rounded-2xl">
                <p class="text-lg">Még nincsenek költségek</p>
                <p class="text-sm mt-2">Kattints a + gombra az első hozzáadásához!</p>
            </div>
        `;
        return;
    }

    const categoryEmoji = { food: '🍽️', accommodation: '🏠', transport: '🚕', activities: '🎉', gifts: '🎁', other: '💊' };

    expenseList.innerHTML = expenses.map(expense => {
        const date = expense.timestamp ? new Date(expense.timestamp.seconds * 1000) : new Date();
        const dateStr = date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const paidCount = expense.splitBetween.filter(p => expense.payments?.[p]?.status === 'paid').length;
        const hasImage = expense.billImageUrl && expense.billImageUrl.trim() !== '';

        return `
            <div onclick="viewExpense('${expense.id}')" class="glass-card rounded-2xl p-6 cursor-pointer hover:bg-white/10 transition-all relative overflow-hidden group">
                ${hasImage ? `<div class="absolute top-4 right-4 z-10"><div class="flex items-center gap-2 px-3 py-2 bg-blue-500/90 backdrop-blur-sm rounded-lg shadow-lg"><span class="text-xl">📸</span><span class="text-white font-semibold text-sm">Számla</span></div></div>` : ''}
                <div class="flex items-start justify-between mb-4 ${hasImage ? 'pr-24' : ''}">
                    <div>
                        <h3 class="text-xl font-bold mb-1">${categoryEmoji[expense.category] || '💰'} ${expense.description}</h3>
                        <p class="text-sm text-gray-400">Fizette: ${expense.paidBy} • ${dateStr}</p>
                    </div>
                </div>
                <div class="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">€${expense.amount.toFixed(2)}</div>
                <div class="flex items-center justify-between text-sm flex-wrap gap-2">
                    <span class="text-gray-400">${expense.splitBetween.length} fő • €${expense.amountPerPerson.toFixed(2)}/fő</span>
                    <span class="${paidCount === expense.splitBetween.length ? 'text-green-400' : 'text-yellow-400'}">${paidCount}/${expense.splitBetween.length} fizetve</span>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== BALANCES ====================
function calculateAndDisplayBalances(expenses) {
    const balances = {};
    peopleList.forEach(p => balances[p.name] = 0);

    expenses.forEach(exp => {
        balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount;
        exp.splitBetween.forEach(person => {
            const isPaid = exp.payments?.[person]?.status === 'paid';
            if (!isPaid) balances[person] = (balances[person] || 0) - exp.amountPerPerson;
        });
    });

    const balanceList = document.getElementById('balance-list');
    if (!balanceList) return;

    const sorted = Object.entries(balances).sort((a, b) => b[1] - a[1]);

    balanceList.innerHTML = sorted.map(([person, balance]) => {
        const personData = peopleList.find(p => p.name === person);
        const revolutLink = personData?.revolutLink || (personData?.revolut ? `https://revolut.me/${personData.revolut}` : '');
        const hasRevolut = revolutLink && revolutLink.trim() !== '';

        let bgColor = 'bg-gray-900/20', borderColor = 'border-gray-600/30', textColor = 'text-gray-400', text = 'Kiegyenlítve', emoji = '✅';

        if (balance > 0.5) {
            bgColor = 'bg-green-900/20'; borderColor = 'border-green-600/30'; textColor = 'text-green-400';
            text = `+€${balance.toFixed(2)} visszakapja`; emoji = '💰';
        } else if (balance < -0.5) {
            bgColor = 'bg-red-900/20'; borderColor = 'border-red-600/30'; textColor = 'text-red-400';
            text = `€${Math.abs(balance).toFixed(2)} tartozik`; emoji = '⏳';
        }

        return `
            <div class="p-4 ${bgColor} border ${borderColor} rounded-xl transition-all hover:scale-[1.01]">
                <div class="flex justify-between items-center flex-wrap gap-2">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${emoji}</span>
                        <h3 class="font-bold text-white">${person}</h3>
                        ${hasRevolut ? `<a href="${revolutLink}" target="_blank" class="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition" onclick="event.stopPropagation()">💳 Pay</a>` : ''}
                    </div>
                    <div class="${textColor} font-bold">${text}</div>
                </div>
            </div>
        `;
    }).join('');

    calculateSmartSettlement(expenses);
}

// ==================== CATEGORY BREAKDOWN ====================
function updateCategoryBreakdown(expenses) {
    const container = document.getElementById('category-breakdown');
    if (!container) return;

    const categoryTotals = {};
    const categoryEmoji = { food: '🍽️', accommodation: '🏠', transport: '🚕', activities: '🎉', gifts: '🎁', other: '💊' };
    const categoryNames = { food: 'Étel & Ital', accommodation: 'Szállás', transport: 'Utazás', activities: 'Programok', gifts: 'Ajándékok', other: 'Egyéb' };

    expenses.forEach(exp => categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount);

    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">Még nincsenek költségek</p>';
        return;
    }

    container.innerHTML = sorted.map(([cat, amount]) => {
        const percentage = (amount / total * 100).toFixed(1);
        return `
            <div class="space-y-2">
                <div class="flex justify-between items-center">
                    <span class="font-medium">${categoryEmoji[cat]} ${categoryNames[cat]}</span>
                    <span class="text-sm text-gray-400">€${amount.toFixed(2)} (${percentage}%)</span>
                </div>
                <div class="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full cat-${cat} progress-fill rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== SMART SETTLEMENT ====================
function calculateSmartSettlement(expenses) {
    const section = document.getElementById('settlement-section');
    const list = document.getElementById('settlement-list');
    if (!section || !list) return;

    if (expenses.length === 0) { section.classList.add('hidden'); return; }

    const balances = {};
    peopleList.forEach(p => balances[p.name] = 0);

    expenses.forEach(exp => {
        balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount;
        exp.splitBetween.forEach(person => {
            if (exp.payments?.[person]?.status !== 'paid') {
                balances[person] = (balances[person] || 0) - exp.amountPerPerson;
            }
        });
    });

    const settlements = [];
    const debtors = Object.entries(balances).filter(([_, b]) => b < -0.01).sort((a, b) => a[1] - b[1]);
    const creditors = Object.entries(balances).filter(([_, b]) => b > 0.01).sort((a, b) => b[1] - a[1]);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const [debtor, debt] = debtors[i];
        const [creditor, credit] = creditors[j];
        const amount = Math.min(-debt, credit);

        if (amount > 0.01) {
            const creditorData = peopleList.find(p => p.name === creditor);
            const revolutLink = creditorData?.revolutLink || (creditorData?.revolut ? `https://revolut.me/${creditorData.revolut}` : '');
            settlements.push({ from: debtor, to: creditor, amount, revolutLink });
        }

        debtors[i][1] += amount;
        creditors[j][1] -= amount;
        if (Math.abs(debtors[i][1]) < 0.01) i++;
        if (Math.abs(creditors[j][1]) < 0.01) j++;
    }

    if (settlements.length === 0) { section.classList.add('hidden'); return; }

    section.classList.remove('hidden');
    list.innerHTML = settlements.map((s, idx) => {
        const hasRevolut = s.revolutLink && s.revolutLink.trim() !== '';
        return `
            <div class="glass-card rounded-xl p-4 hover:bg-white/10 transition">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <div class="flex items-center gap-3">
                        <span class="text-lg font-bold text-gray-400">${idx + 1}.</span>
                        <span class="font-bold text-lg text-red-400">${s.from}</span>
                        <span class="text-green-400 text-2xl">→</span>
                        <span class="font-bold text-lg text-green-400">${s.to}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-green-400 font-bold text-xl">€${s.amount.toFixed(2)}</span>
                        ${hasRevolut ? `<a href="${s.revolutLink}" target="_blank" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition flex items-center gap-2 text-sm">💳 <span class="hidden md:inline">Pay Now</span></a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
    list.insertAdjacentHTML('beforeend', `
        <div class="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-500/20 text-center">
            <span class="text-green-400 font-medium">✨ Összesen ${settlements.length} tranzakció szükséges (€${totalAmount.toFixed(2)})</span>
        </div>
    `);
}

// ==================== SEARCH & FILTER ====================
document.getElementById('search-expenses')?.addEventListener('input', filterExpenses);
document.getElementById('filter-category-main')?.addEventListener('change', filterExpenses);

function filterExpenses() {
    const searchTerm = document.getElementById('search-expenses')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('filter-category-main')?.value || 'all';

    const expenses = window.allExpenses || [];
    const filtered = expenses.filter(exp => {
        const matchesSearch = exp.description.toLowerCase().includes(searchTerm) || exp.paidBy.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    displayExpenses(filtered);
}

// ==================== CHARTS ====================
let expenseChart = null;
let currentChartType = 'category';

const chartColors = {
    purple: 'rgba(147, 51, 234, 0.8)', pink: 'rgba(236, 72, 153, 0.8)', blue: 'rgba(59, 130, 246, 0.8)',
    green: 'rgba(34, 197, 94, 0.8)', yellow: 'rgba(234, 179, 8, 0.8)', cyan: 'rgba(6, 182, 212, 0.8)'
};

const categoryLabels = {
    food: '🍽️ Étel & Ital', accommodation: '🏠 Szállás', transport: '🚕 Utazás',
    activities: '🎉 Programok', gifts: '🎁 Ajándékok', other: '💊 Egyéb'
};

function initCharts() {
    document.querySelectorAll('.chart-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.chart-toggle').forEach(b => {
                b.classList.remove('active', 'bg-purple-500/30');
                b.classList.add('bg-white/10');
            });
            btn.classList.add('active', 'bg-purple-500/30');
            btn.classList.remove('bg-white/10');
            currentChartType = btn.id.replace('chart-toggle-', '');
            if (window.allExpenses) updateChart(window.allExpenses);
        });
    });
}

function updateChart(expenses) {
    const ctx = document.getElementById('expense-chart');
    if (!ctx) return;
    if (expenseChart) expenseChart.destroy();

    if (expenses.length === 0) {
        ctx.parentElement.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400"><p>Nincs adat</p></div><canvas id="expense-chart"></canvas>`;
        return;
    }

    let config;
    if (currentChartType === 'category') config = createCategoryChart(expenses);
    else if (currentChartType === 'person') config = createPersonChart(expenses);
    else config = createTimelineChart(expenses);

    expenseChart = new Chart(ctx, config);
}

function createCategoryChart(expenses) {
    const totals = {};
    expenses.forEach(exp => totals[exp.category] = (totals[exp.category] || 0) + exp.amount);
    return {
        type: 'doughnut',
        data: {
            labels: Object.keys(totals).map(c => categoryLabels[c] || c),
            datasets: [{ data: Object.values(totals), backgroundColor: Object.values(chartColors), borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.8)' } } } }
    };
}

function createPersonChart(expenses) {
    const totals = {};
    expenses.forEach(exp => totals[exp.paidBy] = (totals[exp.paidBy] || 0) + exp.amount);
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return {
        type: 'bar',
        data: { labels: sorted.map(([n]) => n), datasets: [{ data: sorted.map(([, a]) => a), backgroundColor: chartColors.purple, borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.7)', callback: v => `€${v}` } }, y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)' } } } }
    };
}

function createTimelineChart(expenses) {
    const sorted = [...expenses].sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
    const dailyTotals = {};
    let cumulative = 0;
    sorted.forEach(exp => {
        const date = exp.timestamp ? new Date(exp.timestamp.seconds * 1000).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }) : '?';
        dailyTotals[date] = (dailyTotals[date] || 0) + exp.amount;
        cumulative += exp.amount;
    });
    return {
        type: 'line',
        data: {
            labels: Object.keys(dailyTotals),
            datasets: [
                { label: 'Napi', data: Object.values(dailyTotals), borderColor: chartColors.purple, backgroundColor: chartColors.purple, tension: 0.4, fill: true },
                { label: 'Összes', data: Object.keys(dailyTotals).map((_, i, arr) => Object.values(dailyTotals).slice(0, i + 1).reduce((a, b) => a + b, 0)), borderColor: chartColors.pink, borderDash: [5, 5], tension: 0.4, fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'rgba(255,255,255,0.8)' } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.7)' } }, y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.7)', callback: v => `€${v}` } } } }
    };
}

function updateQuickStats(expenses) {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const avg = expenses.length > 0 ? total / expenses.length : 0;
    const participants = new Set();
    expenses.forEach(e => e.splitBetween?.forEach(p => participants.add(p)));
    const perPerson = participants.size > 0 ? total / participants.size : 0;

    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('stat-total', `€${total.toFixed(2)}`);
    el('stat-count', expenses.length);
    el('stat-avg', `€${avg.toFixed(2)}`);
    el('stat-per-person', `€${perPerson.toFixed(2)}`);
    
    // Update budget tracker
    updateBudgetTracker(total, participants.size, perPerson);
}

// ==================== BUDGET TRACKER ====================
function updateBudgetTracker(total, participantCount, perPerson) {
    const BUDGET_MIN = 400;
    const BUDGET_MAX = 600;
    
    // Update elements
    const currentEl = document.getElementById('budget-current');
    const fillEl = document.getElementById('budget-fill');
    const statusEl = document.getElementById('budget-status');
    const totalEl = document.getElementById('budget-total');
    const participantsEl = document.getElementById('budget-participants');
    const remainingLowEl = document.getElementById('budget-remaining-low');
    const remainingHighEl = document.getElementById('budget-remaining-high');
    
    if (currentEl) currentEl.textContent = `€${perPerson.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `€${total.toFixed(2)}`;
    if (participantsEl) participantsEl.textContent = participantCount || peopleList.length;
    
    // Calculate remaining budget
    const remainingLow = Math.max(0, BUDGET_MIN - perPerson);
    const remainingHigh = Math.max(0, BUDGET_MAX - perPerson);
    if (remainingLowEl) remainingLowEl.textContent = `€${remainingLow.toFixed(0)}`;
    if (remainingHighEl) remainingHighEl.textContent = `€${remainingHigh.toFixed(0)}`;
    
    // Calculate progress percentage (based on max budget)
    const percentage = Math.min((perPerson / BUDGET_MAX) * 100, 100);
    
    if (fillEl) {
        fillEl.style.width = `${percentage}%`;
        // Change background position based on percentage to show gradient
        const gradientPos = (percentage / 100) * 100;
        fillEl.style.backgroundPosition = `${gradientPos}% 50%`;
    }
    
    // Update status message
    if (statusEl) {
        let statusHTML = '';
        let statusClass = '';
        
        if (perPerson === 0) {
            statusHTML = '<span class="text-gray-400">Még nincsenek költségek</span>';
        } else if (perPerson < BUDGET_MIN * 0.5) {
            statusClass = 'bg-green-900/30 border border-green-500/30';
            statusHTML = `<span class="text-green-400">🟢 Jó ütemben haladtok!</span><br><span class="text-sm text-gray-400">Még bőven van keret</span>`;
        } else if (perPerson < BUDGET_MIN) {
            statusClass = 'bg-green-900/30 border border-green-500/30';
            statusHTML = `<span class="text-green-400">✅ A minimum alatt vagytok</span><br><span class="text-sm text-gray-400">Költhettek még €${remainingLow.toFixed(0)}-t a minimumig</span>`;
        } else if (perPerson <= BUDGET_MAX) {
            statusClass = 'bg-yellow-900/30 border border-yellow-500/30';
            statusHTML = `<span class="text-yellow-400">⚠️ Költségvetésen belül</span><br><span class="text-sm text-gray-400">Még €${remainingHigh.toFixed(0)} a maximum előtt</span>`;
        } else {
            statusClass = 'bg-red-900/30 border border-red-500/30';
            const over = perPerson - BUDGET_MAX;
            statusHTML = `<span class="text-red-400">🔴 Túlléptétek a keretet!</span><br><span class="text-sm text-gray-400">€${over.toFixed(0)}-val többet költöttetek a tervezettnél</span>`;
        }
        
        statusEl.className = `p-4 rounded-xl text-center ${statusClass}`;
        statusEl.innerHTML = statusHTML;
    }
}

// ==================== EXPORT ====================
document.getElementById('export-btn')?.addEventListener('click', async () => {
    try {
        const snapshot = await getDocs(collection(db, 'expenses'));
        let csv = 'Dátum,Leírás,Összeg,Fizette,Résztvevők\n';
        snapshot.forEach(doc => {
            const e = doc.data();
            const date = e.timestamp ? new Date(e.timestamp.seconds * 1000).toLocaleDateString() : '';
            csv += `"${date}","${e.description}",${e.amount},"${e.paidBy}","${e.splitBetween.join(', ')}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'koltsegek.csv';
        a.click();
        window.toast?.success('CSV exportálva!', { icon: '📊' });
    } catch (error) {
        console.error('Export error:', error);
    }
});

// ==================== VIEW EXPENSE DETAIL ====================
window.viewExpense = function(expenseId) {
    const expense = (window.allExpenses || []).find(e => e.id === expenseId);
    if (!expense) return;

    const categoryEmoji = { food: '🍽️', accommodation: '🏠', transport: '🚕', activities: '🎉', gifts: '🎁', other: '💊' };
    const date = expense.timestamp ? new Date(expense.timestamp.seconds * 1000) : new Date();
    const dateStr = date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const paidByPerson = peopleList.find(p => p.name === expense.paidBy);
    const paidByRevolut = paidByPerson?.revolutLink || (paidByPerson?.revolut ? `https://revolut.me/${paidByPerson.revolut}` : '');
    const hasPaidByRevolut = paidByRevolut && paidByRevolut.trim() !== '';

    const paidCount = expense.splitBetween.filter(p => expense.payments?.[p]?.status === 'paid').length;
    const totalPaid = paidCount * expense.amountPerPerson;
    const remaining = expense.amount - totalPaid;

    const detailContent = document.getElementById('detail-content');
    detailContent.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-start justify-between">
                <div>
                    <h2 class="text-3xl font-bold mb-2">${categoryEmoji[expense.category] || '💰'} ${expense.description}</h2>
                    <p class="text-gray-400">${dateStr}</p>
                </div>
                <button onclick="closeDetailModal()" class="text-gray-400 hover:text-white text-3xl transition">×</button>
            </div>

            <div class="bg-white/5 rounded-xl p-6 border border-white/10">
                <div class="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">€${expense.amount.toFixed(2)}</div>
                ${expense.currency === 'CZK' ? `<div class="text-center text-gray-400">(Eredeti: ${expense.originalAmount} CZK)</div>` : ''}
                <div class="mt-4 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Fizetési státusz</span>
                        <span class="font-bold ${remaining > 0 ? 'text-yellow-400' : 'text-green-400'}">${paidCount}/${expense.splitBetween.length} fizetve</span>
                    </div>
                    <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all" style="width: ${(paidCount / expense.splitBetween.length * 100)}%"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white/5 rounded-xl p-4">
                    <div class="text-sm text-gray-400 mb-2">Fizette</div>
                    <div class="text-xl font-bold mb-2">${expense.paidBy}</div>
                    ${hasPaidByRevolut ? `<a href="${paidByRevolut}" target="_blank" class="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition">💳 Pay</a>` : ''}
                </div>
                <div class="bg-white/5 rounded-xl p-4">
                    <div class="text-sm text-gray-400 mb-1">Fejenként</div>
                    <div class="text-xl font-bold">€${expense.amountPerPerson.toFixed(2)}</div>
                </div>
            </div>

            <div>
                <h3 class="font-bold mb-3 text-lg">Résztvevők (${expense.splitBetween.length} fő)</h3>
                <div class="space-y-3">
                    ${expense.splitBetween.map(person => {
                        const isPaid = expense.payments?.[person]?.status === 'paid';
                        const personData = peopleList.find(p => p.name === person);
                        const revolutLink = personData?.revolutLink || (personData?.revolut ? `https://revolut.me/${personData.revolut}` : '');
                        const hasRevolut = revolutLink && revolutLink.trim() !== '';
                        return `
                            <div class="p-4 ${isPaid ? 'bg-green-900/20 border-green-600/30' : 'bg-yellow-900/20 border-yellow-600/30'} border rounded-xl">
                                <div class="flex items-center justify-between flex-wrap gap-3">
                                    <div class="flex items-center gap-3">
                                        <span class="text-3xl">${isPaid ? '✅' : '⏳'}</span>
                                        <div>
                                            <div class="font-bold text-white text-lg">${person}</div>
                                            ${hasRevolut ? `<a href="${revolutLink}" target="_blank" class="text-xs text-blue-400 hover:text-blue-300" onclick="event.stopPropagation()">💳 Revolut</a>` : ''}
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <span class="text-lg font-bold ${isPaid ? 'text-green-400' : 'text-yellow-400'}">€${expense.amountPerPerson.toFixed(2)}</span>
                                        ${isPaid
                                            ? `<button onclick="markAsUnpaid('${expenseId}', '${person}')" class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-semibold transition text-sm">❌ Visszavon</button>`
                                            : `<button onclick="markAsPaid('${expenseId}', '${person}')" class="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg font-semibold transition text-sm">✅ Kifizetve</button>`
                                        }
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            ${expense.billImageUrl ? `<div><h3 class="font-bold mb-3 text-lg">📸 Számla</h3><img src="${expense.billImageUrl}" class="w-full rounded-xl border border-white/10 cursor-pointer hover:opacity-90 transition" onclick="window.open('${expense.billImageUrl}', '_blank')"></div>` : ''}

            <div class="flex gap-3 pt-4">
                <button onclick="editExpense('${expenseId}')" class="flex-1 px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl font-bold transition">✏️ Szerkesztés</button>
                <button onclick="deleteExpense('${expenseId}')" class="flex-1 px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl font-bold transition">🗑️ Törlés</button>
            </div>
        </div>
    `;

    document.getElementById('detail-modal').classList.remove('hidden');
    document.getElementById('detail-modal').classList.add('flex');
};

window.closeDetailModal = function() {
    document.getElementById('detail-modal').classList.add('hidden');
    document.getElementById('detail-modal').classList.remove('flex');
};

window.deleteExpense = async function(expenseId) {
    if (!confirm('Biztosan törölni szeretnéd?')) return;
    try {
        await deleteDoc(doc(db, 'expenses', expenseId));
        window.toast?.success('Költség törölve!', { icon: '🗑️' });
        closeDetailModal();
    } catch (error) {
        console.error('Error:', error);
        window.toast?.error('Hiba történt!');
    }
};

window.editExpense = function(expenseId) {
    const expense = (window.allExpenses || []).find(e => e.id === expenseId);
    if (!expense) return;

    editingExpenseId = expenseId;
    closeDetailModal();

    setTimeout(() => {
        document.getElementById('description').value = expense.description || '';
        document.getElementById('amount').value = expense.originalAmount || expense.amount || '';
        document.getElementById('currency').value = expense.currency || 'EUR';
        document.getElementById('category').value = expense.category || 'other';
        document.getElementById('paid-by').value = expense.paidBy || '';
        document.querySelectorAll('.person-checkbox').forEach(cb => cb.checked = expense.splitBetween?.includes(cb.value));

        document.querySelector('#expense-modal h3').textContent = '✏️ Költség Szerkesztése';
        document.querySelector('#expense-form button[type="submit"]').innerHTML = '💾 Változtatások Mentése';
        openModal();
    }, 100);
};

window.markAsPaid = async function(expenseId, personName) {
    try {
        await updateDoc(doc(db, 'expenses', expenseId), {
            [`payments.${personName}.status`]: 'paid',
            [`payments.${personName}.paidAt`]: new Date()
        });
        window.toast?.success(`${personName} - Kifizetve!`, { icon: '✅' });
        setTimeout(() => viewExpense(expenseId), 300);
    } catch (error) {
        console.error('Error:', error);
        window.toast?.error('Hiba történt!');
    }
};

window.markAsUnpaid = async function(expenseId, personName) {
    try {
        await updateDoc(doc(db, 'expenses', expenseId), {
            [`payments.${personName}.status`]: 'pending',
            [`payments.${personName}.paidAt`]: null
        });
        window.toast?.info(`${personName} - Visszavonva`, { icon: '↩️' });
        setTimeout(() => viewExpense(expenseId), 300);
    } catch (error) {
        console.error('Error:', error);
        window.toast?.error('Hiba történt!');
    }
};

// ==================== INIT ====================
console.log('🚀 Initializing app...');
initCharts();
loadPeople();
loadExpenses();
