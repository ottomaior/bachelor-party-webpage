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
console.log('Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
console.log('Firebase initialized successfully');

// Exchange rate
const CZK_TO_EUR = 0.04;

// People list
let peopleList = [];

// ========== LOAD PEOPLE ==========
async function loadPeople() {
    console.log('🔄 Loading people from Firebase...');
    try {
        const querySnapshot = await getDocs(collection(db, 'rsvps'));
        peopleList = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('📄 Document data:', doc.id, data); // Debug: see raw data
            
            if (data.name) {
                peopleList.push({
                    name: data.name,
                    revolut: data.revolut || '',
                    revolutLink: data.revolutLink || ''  // ← IMPORTANT!
                });
            }
        });

        console.log('✅ Loaded', peopleList.length, 'people with full data:', peopleList);

        if (peopleList.length === 0) {
            console.warn('⚠️ No people found in Firebase, using defaults');
            peopleList = [
                { name: 'Alexandru Suciu', revolutLink: 'https://revolut.me/alexanle5x', revolut: '' },
                { name: 'Ottó', revolut: 'otto123', revolutLink: '' },
                { name: 'Emil', revolut: '', revolutLink: '' }
            ];
        }

        populatePeopleDropdowns();
        
        // Render Revolut people immediately after loading
        setTimeout(() => {
            renderRevolutPeople();
        }, 500);
        
    } catch (error) {
        console.error("❌ Error loading people:", error);
        peopleList = [
            { name: 'Alexandru Suciu', revolutLink: 'https://revolut.me/alexanle5x', revolut: '' },
            { name: 'Ottó', revolut: 'otto123', revolutLink: '' },
            { name: 'Emil', revolut: '', revolutLink: '' }
        ];
        populatePeopleDropdowns();
        renderRevolutPeople();
    }
}

// ========== POPULATE DROPDOWNS ==========
function populatePeopleDropdowns() {
    const paidBySelect = document.getElementById('paid-by');
    const splitBetweenList = document.getElementById('split-between-list');

    if (!paidBySelect || !splitBetweenList) return;

    paidBySelect.innerHTML = '<option value="">Válassz...</option>';
    splitBetweenList.innerHTML = '';

    peopleList.forEach((person, index) => {
        const option = document.createElement('option');
        option.value = person.name;
        option.textContent = person.name;
        paidBySelect.appendChild(option);

        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'flex items-center gap-2 p-2 hover:bg-white/5 rounded';
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="person-${index}" value="${person.name}" 
                   class="w-4 h-4 rounded person-checkbox">
            <label for="person-${index}" class="cursor-pointer flex-1">${person.name}</label>
        `;
        splitBetweenList.appendChild(checkboxDiv);
    });
}

// ========== REVOLUT INTEGRATION (DEBUG VERSION) ==========
function renderRevolutPeople() {
    const container = document.getElementById('revolut-people-list');
    if (!container) {
        console.error('❌ Revolut container NOT FOUND!');
        return;
    }
    
    console.log('✅ Container found');
    console.log('📋 People List:', peopleList);
    
    if (peopleList.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4 col-span-full text-sm">Nincsenek résztvevők</p>';
        return;
    }
    
    // Check each person's Revolut data
    peopleList.forEach(person => {
        console.log(`👤 ${person.name}:`, {
            revolut: person.revolut,
            revolutLink: person.revolutLink
        });
    });
    
    container.innerHTML = peopleList.map(person => {
        // Support both revolutLink (full URL) and revolut (username)
        const revolutLink = person.revolutLink || 
                           (person.revolut ? `https://revolut.me/${person.revolut}` : '');
        const hasRevolut = revolutLink && revolutLink.trim() !== '';
        
        console.log(`🔗 ${person.name} - Link: ${revolutLink} - Has: ${hasRevolut}`);
        
        if (hasRevolut) {
            return `
                <a href="${revolutLink}" target="_blank" rel="noopener noreferrer"
                   class="flex flex-col items-center gap-2 p-3 glass-card rounded-xl hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group cursor-pointer text-center">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                        ${person.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="text-xs font-semibold text-white">${person.name.split(' ')[0]}</div>
                    <div class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-xs font-semibold text-white transition-colors w-full flex items-center justify-center gap-1">
                        <span>💳</span>
                        <span>Pay</span>
                    </div>
                </a>
            `;
        } else {
            return `
                <div class="flex flex-col items-center gap-2 p-3 glass-card rounded-xl opacity-40 cursor-not-allowed text-center">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white font-bold text-lg">
                        ${person.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="text-xs font-semibold text-white">${person.name.split(' ')[0]}</div>
                    <div class="px-3 py-1.5 bg-gray-600 rounded-lg text-xs text-gray-400 w-full">
                        No Link
                    </div>
                </div>
            `;
        }
    }).join('');
    
    console.log('✅ Revolut people rendered successfully');
}



// ========== MODAL CONTROLS ==========
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
    document.getElementById('expense-form').reset();
    document.getElementById('photo-preview').classList.add('hidden');
}

if (addExpenseBtn) addExpenseBtn.addEventListener('click', openModal);
if (addExpenseBtnTop) addExpenseBtnTop.addEventListener('click', openModal);
if (addExpenseBtnHeader) addExpenseBtnHeader.addEventListener('click', openModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

// ========== PHOTO PREVIEW ==========
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

// ========== SELECT ALL BUTTON ==========
const selectAllBtn = document.getElementById('select-all-btn');
if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.person-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
    });
}

// ========== CONFETTI ==========
function triggerConfetti() {
    const colors = ['#FF6B9D', '#C44569', '#FEC163', '#A8EDEA', '#764BA2', '#667EEA'];
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

// ========== FORM SUBMISSION ==========
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
            alert('Kérlek válaszd ki ki fizette!');
            return;
        }

        const splitBetween = Array.from(document.querySelectorAll('.person-checkbox:checked'))
            .map(cb => cb.value);

        if (splitBetween.length === 0) {
            alert('Kérlek válassz legalább egy embert!');
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
            await addDoc(collection(db, 'expenses'), {
                description,
                amount: amountEUR,
                originalAmount: amount,
                currency,
                category,
                paidBy,
                splitBetween,
                amountPerPerson,
                billImageUrl,
                payments,
                timestamp: serverTimestamp()
            });

            triggerConfetti();
            alert('✅ Költség hozzáadva!');
            closeModal();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Hiba: ' + error.message);
        }
    });
}

// ========== LOAD & DISPLAY EXPENSES ==========
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
        calculateSmartSettlement(expenses);
    });
}

// ========== DISPLAY EXPENSES (UPDATED WITH BETTER IMAGE INDICATOR) ==========
function displayExpenses(expenses) {
    const expenseList = document.getElementById('expense-list');
    
    if (expenses.length === 0) {
        expenseList.innerHTML = `
            <div class="text-center text-gray-400 py-12 bg-white/5 rounded-2xl">
                <p>Még nincsenek költségek</p>
            </div>
        `;
        return;
    }
    
    expenseList.innerHTML = expenses.map(expense => {
        const categoryEmoji = {
            food: '🍽️', accommodation: '🏠', transport: '🚕',
            activities: '🎉', gifts: '🎁', other: '💊'
        };
        
        const date = expense.timestamp ? new Date(expense.timestamp.seconds * 1000) : new Date();
        const dateStr = date.toLocaleDateString('hu-HU', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
        
        const paidCount = expense.splitBetween.filter(person => 
            expense.payments[person] && expense.payments[person].status === 'paid'
        ).length;
        
        const hasImage = expense.billImageUrl && expense.billImageUrl.trim() !== '';
        
        return `
            <div onclick="viewExpense('${expense.id}')" 
                 class="bg-white/5 rounded-2xl border border-white/10 p-6 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
                
                <!-- Image badge overlay -->
                ${hasImage ? `
                    <div class="absolute top-4 right-4 z-10">
                        <div class="flex items-center gap-2 px-3 py-2 bg-blue-500/90 backdrop-blur-sm rounded-lg shadow-lg group-hover:bg-blue-600/90 transition-all">
                            <span class="text-xl">📸</span>
                            <span class="text-white font-semibold text-sm">Számla</span>
                        </div>
                    </div>
                ` : ''}
                
                <div class="flex items-start justify-between mb-4 ${hasImage ? 'pr-24' : ''}">
                    <div>
                        <h3 class="text-xl font-bold mb-1">
                            ${categoryEmoji[expense.category] || '💰'} ${expense.description}
                        </h3>
                        <p class="text-sm text-gray-400">Fizette: ${expense.paidBy} • ${dateStr}</p>
                    </div>
                </div>
                
                <div class="text-3xl font-bold mb-3">€${expense.amount.toFixed(2)}</div>
                
                <div class="flex items-center justify-between text-sm flex-wrap gap-2">
                    <span class="text-gray-400">${expense.splitBetween.length} fő • €${expense.amountPerPerson.toFixed(2)}/fő</span>
                    <span class="text-gray-400">${paidCount}/${expense.splitBetween.length} fizetve</span>
                </div>
            </div>
        `;
    }).join('');
}


// ========== CALCULATE BALANCES WITH REVOLUT (UPDATED - PENDING ONLY) ==========
function calculateAndDisplayBalances(expenses) {
    const balances = {};
    peopleList.forEach(p => balances[p.name] = 0);
    
    expenses.forEach(exp => {
        // Aki fizette, pluszban van
        balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount;
        
        // Csak a pending fizetéseket vonjuk le
        exp.splitBetween.forEach(person => {
            const payment = exp.payments && exp.payments[person];
            const isPaid = payment && payment.status === 'paid';
            
            if (!isPaid) {
                balances[person] = (balances[person] || 0) - exp.amountPerPerson;
            }
        });
    });
    
    const balanceList = document.getElementById('balance-list');
    const sorted = Object.entries(balances).sort((a, b) => b[1] - a[1]);
    
    balanceList.innerHTML = sorted.map(([person, balance]) => {
        const personData = peopleList.find(p => p.name === person);
        
        // Support both revolutLink (full URL) and revolut (username)
        const revolutLink = personData?.revolutLink || 
                           (personData?.revolut ? `https://revolut.me/${personData.revolut}` : '');
        const hasRevolut = revolutLink && revolutLink.trim() !== '';
        
        let bgColor = 'bg-gray-900/20';
        let borderColor = 'border-gray-600/30';
        let textColor = 'text-gray-400';
        let text = 'Kiegyenlítve';
        let emoji = '✅';
        
        if (balance > 0.5) {
            bgColor = 'bg-green-900/20';
            borderColor = 'border-green-600/30';
            textColor = 'text-green-400';
            text = `+€${balance.toFixed(2)} visszakapja`;
            emoji = '💰';
        } else if (balance < -0.5) {
            bgColor = 'bg-red-900/20';
            borderColor = 'border-red-600/30';
            textColor = 'text-red-400';
            text = `€${Math.abs(balance).toFixed(2)} tartozik`;
            emoji = '⏳';
        }
        
        return `
            <div class="p-4 ${bgColor} border ${borderColor} rounded-xl">
                <div class="flex justify-between items-center flex-wrap gap-2">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${emoji}</span>
                        <h3 class="font-bold text-white">${person}</h3>
                        ${hasRevolut ? `
                            <a href="${revolutLink}" target="_blank" rel="noopener noreferrer"
                               class="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition cursor-pointer"
                               onclick="event.stopPropagation()"
                               title="Pay with Revolut">
                                💳 Pay
                            </a>
                        ` : ''}
                    </div>
                    <div class="${textColor} font-bold">${text}</div>
                </div>
            </div>
        `;
    }).join('');
    
    renderRevolutPeople();
}

// ========== CATEGORY BREAKDOWN ==========
function updateCategoryBreakdown(expenses) {
    const container = document.getElementById('category-breakdown');
    if (!container) return;
    
    const categoryTotals = {};
    const categoryEmoji = {
        food: '🍽️', accommodation: '🏠', transport: '🚕',
        activities: '🎉', gifts: '🎁', other: '💊'
    };
    
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    
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
                    <span class="font-medium">${categoryEmoji[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                    <span class="text-sm text-gray-400">€${amount.toFixed(2)} (${percentage}%)</span>
                </div>
                <div class="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full cat-${cat} progress-fill rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ========== SMART SETTLEMENT (UPDATED WITH REVOLUT LINKS) ==========
function calculateSmartSettlement(expenses) {
    const section = document.getElementById('settlement-section');
    const list = document.getElementById('settlement-list');
    if (!section || !list) return;
    
    if (expenses.length === 0) {
        section.classList.add('hidden');
        return;
    }
    
    const balances = {};
    peopleList.forEach(p => balances[p.name] = 0);
    
    expenses.forEach(exp => {
        balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount;
        
        exp.splitBetween.forEach(person => {
            const payment = exp.payments && exp.payments[person];
            const isPaid = payment && payment.status === 'paid';
            
            if (!isPaid) {
                balances[person] = (balances[person] || 0) - exp.amountPerPerson;
            }
        });
    });
    
    console.log('Smart Settlement Balances:', balances);
    
    const settlements = [];
    const debtors = Object.entries(balances).filter(([_, bal]) => bal < -0.01).sort((a, b) => a[1] - b[1]);
    const creditors = Object.entries(balances).filter(([_, bal]) => bal > 0.01).sort((a, b) => b[1] - a[1]);
    
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const [debtor, debt] = debtors[i];
        const [creditor, credit] = creditors[j];
        const amount = Math.min(-debt, credit);
        
        if (amount > 0.01) {
            const creditorData = peopleList.find(p => p.name === creditor);
            const revolutLink = creditorData?.revolutLink || 
                               (creditorData?.revolut ? `https://revolut.me/${creditorData.revolut}` : '');
            
            settlements.push({ 
                from: debtor, 
                to: creditor, 
                amount,
                revolutLink 
            });
        }
        
        debtors[i][1] += amount;
        creditors[j][1] -= amount;
        
        if (Math.abs(debtors[i][1]) < 0.01) i++;
        if (Math.abs(creditors[j][1]) < 0.01) j++;
    }
    
    if (settlements.length === 0) {
        section.classList.add('hidden');
        return;
    }
    
    section.classList.remove('hidden');
    list.innerHTML = settlements.map(s => {
        const hasRevolut = s.revolutLink && s.revolutLink.trim() !== '';
        return `
            <div class="glass-card rounded-xl p-4 hover:bg-white/10 transition">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <div class="flex items-center gap-3">
                        <span class="font-bold text-lg">${s.from}</span>
                        <span class="text-green-400 text-2xl">→</span>
                        <span class="font-bold text-lg">${s.to}</span>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <span class="text-green-400 font-bold text-xl">€${s.amount.toFixed(2)}</span>
                        ${hasRevolut ? `
                            <a href="${s.revolutLink}" target="_blank" rel="noopener noreferrer"
                               class="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition flex items-center gap-2 text-sm whitespace-nowrap">
                                <span>💳</span>
                                <span class="hidden md:inline">Pay Now</span>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}



// ========== SEARCH & FILTER ==========
document.getElementById('search-expenses')?.addEventListener('input', filterExpenses);
document.getElementById('filter-category')?.addEventListener('change', filterExpenses);

function filterExpenses() {
    const searchTerm = document.getElementById('search-expenses')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('filter-category')?.value || 'all';
    
    const expenses = window.allExpenses || [];
    const filtered = expenses.filter(exp => {
        const matchesSearch = exp.description.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    displayExpenses(filtered);
}

// ========== EXPORT ==========
const exportBtn = document.getElementById('export-btn');
if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
        try {
            const snapshot = await getDocs(collection(db, 'expenses'));
            let csv = 'Dátum,Leírás,Összeg,Fizette,Résztvevők\n';
            snapshot.forEach((doc) => {
                const e = doc.data();
                const date = e.timestamp ? new Date(e.timestamp.seconds * 1000).toLocaleDateString() : '';
                csv += `"${date}","${e.description}",${e.amount},"${e.paidBy}","${e.splitBetween.join(', ')}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'koltsegek.csv';
            a.click();
        } catch (error) {
            console.error('Export error:', error);
        }
    });
}

// ========== VIEW EXPENSE DETAIL ==========
// ========== VIEW EXPENSE DETAIL (UPDATED WITH PAYMENT BUTTONS) ==========
window.viewExpense = function(expenseId) {
    const expenses = window.allExpenses || [];
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    const categoryEmoji = {
        food: '🍽️', accommodation: '🏠', transport: '🚕',
        activities: '🎉', gifts: '🎁', other: '💊'
    };
    
    const date = expense.timestamp ? new Date(expense.timestamp.seconds * 1000) : new Date();
    const dateStr = date.toLocaleDateString('hu-HU', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    
    const paidByPerson = peopleList.find(p => p.name === expense.paidBy);
    const paidByRevolut = paidByPerson?.revolut || '';
    const hasPaidByRevolut = paidByRevolut && paidByRevolut.trim() !== '';
    
    // Calculate payment stats
    const paidCount = expense.splitBetween.filter(person => 
        expense.payments[person] && expense.payments[person].status === 'paid'
    ).length;
    const totalPaid = paidCount * expense.amountPerPerson;
    const remaining = expense.amount - totalPaid;
    
    const detailModal = document.getElementById('detail-modal');
    const detailContent = document.getElementById('detail-content');
    
    detailContent.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-start justify-between">
                <div>
                    <h2 class="text-3xl font-bold mb-2">
                        ${categoryEmoji[expense.category] || '💰'} ${expense.description}
                    </h2>
                    <p class="text-gray-400">${dateStr}</p>
                </div>
                <button onclick="closeDetailModal()" class="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            
            <div class="bg-white/5 rounded-xl p-6 border border-white/10">
                <div class="text-5xl font-bold text-center mb-4">€${expense.amount.toFixed(2)}</div>
                <div class="text-center text-gray-400 mb-4">
                    ${expense.currency === 'CZK' ? `(Eredeti: ${expense.originalAmount} CZK)` : ''}
                </div>
                
                <!-- Payment Progress -->
                <div class="mt-4 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Fizetési státusz</span>
                        <span class="font-bold ${remaining > 0 ? 'text-yellow-400' : 'text-green-400'}">
                            ${paidCount}/${expense.splitBetween.length} fizetve
                        </span>
                    </div>
                    <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500" 
                             style="width: ${(paidCount / expense.splitBetween.length * 100)}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>Befizetve: €${totalPaid.toFixed(2)}</span>
                        <span>Hátra: €${remaining.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white/5 rounded-xl p-4">
                    <div class="text-sm text-gray-400 mb-2">Fizette</div>
                    <div class="text-xl font-bold mb-2">${expense.paidBy}</div>
                    ${hasPaidByRevolut ? `
                        <a href="https://revolut.me/${paidByRevolut}" target="_blank" rel="noopener noreferrer"
                           class="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition">
                            <span>💳</span>
                            <span>@${paidByRevolut}</span>
                        </a>
                    ` : '<p class="text-xs text-gray-500">Nincs Revolut</p>'}
                </div>
                <div class="bg-white/5 rounded-xl p-4">
                    <div class="text-sm text-gray-400 mb-1">Fejenként</div>
                    <div class="text-xl font-bold">€${expense.amountPerPerson.toFixed(2)}</div>
                </div>
            </div>
            
            <div>
                <h3 class="font-bold mb-3 text-lg flex items-center justify-between">
                    <span>Résztvevők (${expense.splitBetween.length} fő)</span>
                    <span class="text-sm font-normal text-gray-400">Kattints a gombokra a státusz módosításához</span>
                </h3>
                <div class="space-y-3">
                    ${expense.splitBetween.map(person => {
                        const payment = expense.payments && expense.payments[person];
                        const isPaid = payment && payment.status === 'paid';
                        const personData = peopleList.find(p => p.name === person);
                        const revolutId = personData?.revolut || '';
                        const hasRevolut = revolutId && revolutId.trim() !== '';
                        
                        return `
                            <div class="p-4 ${isPaid ? 'bg-green-900/20 border-green-600/30' : 'bg-yellow-900/20 border-yellow-600/30'} border rounded-xl transition-all">
                                <div class="flex items-center justify-between flex-wrap gap-3">
                                    <div class="flex items-center gap-3">
                                        <span class="text-3xl">${isPaid ? '✅' : '⏳'}</span>
                                        <div>
                                            <div class="font-bold text-white text-lg">${person}</div>
                                            ${hasRevolut ? `
                                                <a href="https://revolut.me/${revolutId}" target="_blank" rel="noopener noreferrer"
                                                   class="text-xs text-blue-400 hover:text-blue-300"
                                                   onclick="event.stopPropagation()">
                                                    💳 @${revolutId}
                                                </a>
                                            ` : ''}
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center gap-3">
                                        <span class="text-lg font-bold ${isPaid ? 'text-green-400' : 'text-yellow-400'}">
                                            €${expense.amountPerPerson.toFixed(2)}
                                        </span>
                                        
                                        ${isPaid ? `
                                            <button onclick="markAsUnpaid('${expenseId}', '${person}')"
                                                    data-expense="${expenseId}" 
                                                    data-person="${person}"
                                                    class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-semibold transition text-sm">
                                                ❌ Visszavon
                                            </button>
                                        ` : `
                                            <button onclick="markAsPaid('${expenseId}', '${person}')"
                                                    data-expense="${expenseId}" 
                                                    data-person="${person}"
                                                    class="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg font-semibold transition text-sm">
                                                ✅ Kifizetve
                                            </button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            ${expense.billImageUrl ? `
                <div>
                    <h3 class="font-bold mb-3 text-lg">📸 Számla</h3>
                    <img src="${expense.billImageUrl}" 
                         class="w-full rounded-xl border border-white/10 cursor-pointer hover:opacity-90 transition"
                         onclick="window.open('${expense.billImageUrl}', '_blank')">
                </div>
            ` : ''}
            
            <div class="flex gap-3 pt-4">
                <button onclick="deleteExpense('${expenseId}')" 
                        class="flex-1 px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl font-bold transition">
                    🗑️ Törlés
                </button>
            </div>
        </div>
    `;
    
    detailModal.classList.remove('hidden');
    detailModal.classList.add('flex');
};


window.closeDetailModal = function() {
    document.getElementById('detail-modal').classList.add('hidden');
    document.getElementById('detail-modal').classList.remove('flex');
};

window.deleteExpense = async function(expenseId) {
    if (!confirm('Biztosan törölni szeretnéd ezt a költséget?')) return;
    
    try {
        await deleteDoc(doc(db, 'expenses', expenseId));
        alert('✅ Költség törölve!');
        closeDetailModal();
    } catch (error) {
        console.error('Error deleting:', error);
        alert('❌ Hiba történt!');
    }
};

// ========== MARK AS PAID FUNCTIONALITY ==========

window.markAsPaid = async function(expenseId, personName) {
    try {
        console.log(`Marking ${personName} as paid for expense ${expenseId}`);
        
        await updateDoc(doc(db, 'expenses', expenseId), {
            [`payments.${personName}.status`]: 'paid',
            [`payments.${personName}.paidAt`]: new Date()
        });
        
        // Show success feedback
        const btn = document.querySelector(`button[data-expense="${expenseId}"][data-person="${personName}"]`);
        if (btn) {
            btn.textContent = '✅ Fizetve!';
            btn.classList.remove('bg-yellow-500/20', 'hover:bg-yellow-500/30');
            btn.classList.add('bg-green-500/20', 'cursor-not-allowed');
            btn.disabled = true;
        }
        
        // Refresh the detail view
        setTimeout(() => {
            viewExpense(expenseId);
        }, 500);
        
    } catch (error) {
        console.error('Error marking as paid:', error);
        alert('❌ Hiba történt! Próbáld újra.');
    }
};

window.markAsUnpaid = async function(expenseId, personName) {
    try {
        console.log(`Marking ${personName} as unpaid for expense ${expenseId}`);
        
        await updateDoc(doc(db, 'expenses', expenseId), {
            [`payments.${personName}.status`]: 'pending',
            [`payments.${personName}.paidAt`]: null
        });
        
        // Refresh the detail view
        setTimeout(() => {
            viewExpense(expenseId);
        }, 500);
        
    } catch (error) {
        console.error('Error marking as unpaid:', error);
        alert('❌ Hiba történt! Próbáld újra.');
    }
};

// ========== INITIALIZE ==========
console.log('Initializing app...');
loadPeople();
loadExpenses();
