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
console.log('Initializing Firebase with projectId:', firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);

// Initialize services with explicit configuration
const db = getFirestore(app);
const storage = getStorage(app);

console.log('Firebase initialized successfully');
console.log('Firestore instance:', db);
console.log('Storage bucket:', storage);


// Exchange rate
const CZK_TO_EUR = 0.04;

// People list
let peopleList = [];

// Load people from RSVP
async function loadPeople() {
    console.log('Loading people...');
    try {
        const querySnapshot = await getDocs(collection(db, 'rsvps'));
        peopleList = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.name) {
                peopleList.push({
                    name: data.name,
                    revolut: data.revolut || ''
                });
            }
        });

        console.log('Loaded', peopleList.length, 'people');

        if (peopleList.length === 0) {
            peopleList = [
                { name: 'Alexandru Suciu', revolut: '' },
                { name: 'Ottó', revolut: '' },
                { name: 'Emil', revolut: '' }
            ];
        }

        populatePeopleDropdowns();
    } catch (error) {
        console.error("Error loading people:", error);
        peopleList = [
            { name: 'Alexandru Suciu', revolut: '' },
            { name: 'Ottó', revolut: '' },
            { name: 'Emil', revolut: '' }
        ];
        populatePeopleDropdowns();
    }
}

// Populate dropdowns
function populatePeopleDropdowns() {
    const paidBySelect = document.getElementById('paid-by');
    const splitBetweenList = document.getElementById('split-between-list');
    const filterPerson = document.getElementById('filter-person');

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
    
    // Also populate filter dropdown
    if (filterPerson) {
        filterPerson.innerHTML = '<option value="">Mind</option>';
        peopleList.forEach(person => {
            const option = document.createElement('option');
            option.value = person.name;
            option.textContent = person.name;
            filterPerson.appendChild(option);
        });
    }
}

// Modal controls
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
    
    // Reset to add mode if we were editing
    if (editingExpenseId) {
        resetFormToAddMode();
    }
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
const selectAllBtn = document.getElementById('select-all-btn');
if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.person-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
    });
}

// Form submission
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
            if (window.toast) {
                window.toast.warning('Kérlek válaszd ki ki fizette!');
            } else {
                alert('Kérlek válaszd ki ki fizette!');
            }
            return;
        }

        const splitBetween = Array.from(document.querySelectorAll('.person-checkbox:checked'))
            .map(cb => cb.value);

        if (splitBetween.length === 0) {
            if (window.toast) {
                window.toast.warning('Kérlek válassz legalább egy embert!');
            } else {
                alert('Kérlek válassz legalább egy embert!');
            }
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
            // Check if we're editing or adding
            if (editingExpenseId) {
                // Get existing expense for preserving some fields
                const existingExpense = (window.allExpenses || []).find(e => e.id === editingExpenseId);
                
                // Update existing expense
                const updateData = {
                    description,
                    amount: amountEUR,
                    originalAmount: amount,
                    currency,
                    category,
                    paidBy,
                    splitBetween,
                    amountPerPerson,
                    payments,
                    updatedAt: serverTimestamp()
                };
                
                // Only update billImageUrl if a new photo was uploaded
                if (billImageUrl) {
                    updateData.billImageUrl = billImageUrl;
                } else if (existingExpense?.billImageUrl) {
                    // Keep existing image
                    updateData.billImageUrl = existingExpense.billImageUrl;
                }
                
                await updateDoc(doc(db, 'expenses', editingExpenseId), updateData);
                
                if (window.toast) {
                    window.toast.success('Költség sikeresen módosítva!', { icon: '✏️' });
                } else {
                    alert('✅ Költség módosítva!');
                }
                
                resetFormToAddMode();
            } else {
                // Add new expense
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

                if (window.toast) {
                    window.toast.success('Költség sikeresen hozzáadva!', { icon: '💰' });
                } else {
                    alert('✅ Költség hozzáadva!');
                }
            }
            
            closeModal();
        } catch (error) {
            console.error('Error:', error);
            if (window.toast) {
                window.toast.error(error.message, { title: 'Hiba történt' });
            } else {
                alert('❌ Hiba: ' + error.message);
            }
        }
    });
}

// Load expenses
function loadExpenses() {
    const q = query(collection(db, 'expenses'), orderBy('timestamp', 'desc'));

    onSnapshot(q, (snapshot) => {
        const expenses = [];
        snapshot.forEach((doc) => {
            expenses.push({ id: doc.id, ...doc.data() });
        });

        displayExpenses(expenses);
        calculateAndDisplayBalances(expenses);
    });
}

// Display expenses
function displayExpenses(expenses) {
    window.allExpenses = expenses; // Store for detail view
    
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
        
        return `
            <div onclick="viewExpense('${expense.id}')" 
                 class="bg-white/5 rounded-2xl border border-white/10 p-6 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="text-xl font-bold mb-1">
                            ${categoryEmoji[expense.category] || '💰'} ${expense.description}
                        </h3>
                        <p class="text-sm text-gray-400">Fizette: ${expense.paidBy} • ${dateStr}</p>
                    </div>
                    ${expense.billImageUrl ? '<span class="text-2xl">📸</span>' : ''}
                </div>
                
                <div class="text-3xl font-bold mb-3">€${expense.amount.toFixed(2)}</div>
                
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-400">${expense.splitBetween.length} fő • €${expense.amountPerPerson.toFixed(2)}/fő</span>
                    <span class="text-gray-400">${paidCount}/${expense.splitBetween.length} fizetve</span>
                </div>
            </div>
        `;
    }).join('');
}


// Calculate balances
function calculateAndDisplayBalances(expenses) {
    const balances = {};
    peopleList.forEach(p => balances[p.name] = 0);
    
    expenses.forEach(exp => {
        balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount;
        exp.splitBetween.forEach(person => {
            balances[person] = (balances[person] || 0) - exp.amountPerPerson;
        });
    });
    
    const balanceList = document.getElementById('balance-list');
    const sorted = Object.entries(balances).sort((a, b) => b[1] - a[1]);
    
    balanceList.innerHTML = sorted.map(([person, balance]) => {
        let bgColor = 'bg-gray-900/20';
        let borderColor = 'border-gray-600/30';
        let textColor = 'text-gray-400';
        let text = 'Kiegyenlítve';
        
        if (balance > 0.5) {
            bgColor = 'bg-green-900/20';
            borderColor = 'border-green-600/30';
            textColor = 'text-green-400';
            text = `+€${balance.toFixed(2)} visszakapja`;
        } else if (balance < -0.5) {
            bgColor = 'bg-red-900/20';
            borderColor = 'border-red-600/30';
            textColor = 'text-red-400';
            text = `-€${Math.abs(balance).toFixed(2)} tartozik`;
        }
        
        return `
            <div class="p-4 ${bgColor} border ${borderColor} rounded-xl">
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-white">${person}</h3>
                    <div class="${textColor} font-bold">${text}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Calculate and display smart settlements
    const settlements = calculateSmartSettlement(balances);
    displaySettlements(settlements);
}

/**
 * Smart Settlement Algorithm
 * Minimizes the number of transactions needed to settle all debts
 * Uses a greedy approach: match largest debtor with largest creditor
 */
function calculateSmartSettlement(balances) {
    const settlements = [];
    const threshold = 0.5; // Ignore tiny amounts due to rounding
    
    // Create separate lists for creditors and debtors
    const creditors = []; // People who should receive money (positive balance)
    const debtors = [];   // People who owe money (negative balance)
    
    Object.entries(balances).forEach(([person, balance]) => {
        if (balance > threshold) {
            creditors.push({ name: person, amount: balance });
        } else if (balance < -threshold) {
            debtors.push({ name: person, amount: -balance }); // Store as positive for easier math
        }
    });
    
    // Sort by amount (descending) for optimal matching
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    // Greedy matching: match largest debtor with largest creditor
    while (creditors.length > 0 && debtors.length > 0) {
        const creditor = creditors[0];
        const debtor = debtors[0];
        
        // Calculate the transfer amount (minimum of what's owed and what's due)
        const transferAmount = Math.min(creditor.amount, debtor.amount);
        
        if (transferAmount > threshold) {
            settlements.push({
                from: debtor.name,
                to: creditor.name,
                amount: transferAmount
            });
        }
        
        // Update remaining amounts
        creditor.amount -= transferAmount;
        debtor.amount -= transferAmount;
        
        // Remove fully settled parties
        if (creditor.amount < threshold) creditors.shift();
        if (debtor.amount < threshold) debtors.shift();
    }
    
    return settlements;
}

/**
 * Display settlement suggestions in the UI
 */
function displaySettlements(settlements) {
    const settlementSection = document.getElementById('settlement-section');
    const settlementList = document.getElementById('settlement-list');
    
    if (!settlementSection || !settlementList) return;
    
    if (settlements.length === 0) {
        settlementSection.classList.add('hidden');
        return;
    }
    
    settlementSection.classList.remove('hidden');
    
    // Find Revolut usernames for people
    const getRevolutInfo = (name) => {
        const person = peopleList.find(p => p.name === name);
        return person?.revolut || null;
    };
    
    settlementList.innerHTML = settlements.map((settlement, index) => {
        const fromRevolut = getRevolutInfo(settlement.from);
        const toRevolut = getRevolutInfo(settlement.to);
        
        return `
            <div class="settlement-item p-4 bg-white/5 rounded-xl border border-green-500/20 hover:bg-white/10 transition-all">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${index + 1}.</span>
                        <div>
                            <div class="font-bold text-white">
                                <span class="text-red-400">${settlement.from}</span>
                                <span class="text-gray-400 mx-2">→</span>
                                <span class="text-green-400">${settlement.to}</span>
                            </div>
                            <div class="text-sm text-gray-400">
                                ${toRevolut ? `Revolut: @${toRevolut}` : 'Revolut nem megadva'}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="text-2xl font-bold text-green-400">€${settlement.amount.toFixed(2)}</div>
                        <div class="flex gap-2">
                            <button onclick="copyPaymentDetails('${settlement.to}', ${settlement.amount.toFixed(2)}, '${toRevolut || ''}')"
                                    class="px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition text-sm"
                                    title="Másolás">
                                📋
                            </button>
                            ${toRevolut ? `
                                <button onclick="openRevolutPayment('${toRevolut}', ${settlement.amount.toFixed(2)})"
                                        class="px-3 py-2 bg-blue-600/20 rounded-lg hover:bg-blue-600/30 transition text-sm"
                                        title="Revolut-tal fizetés">
                                    💳
                                </button>
                            ` : ''}
                            <button onclick="generateQRCode('${settlement.to}', ${settlement.amount.toFixed(2)}, ${index})"
                                    class="px-3 py-2 bg-purple-600/20 rounded-lg hover:bg-purple-600/30 transition text-sm"
                                    title="QR kód">
                                📱
                            </button>
                        </div>
                    </div>
                </div>
                <div id="qr-container-${index}" class="hidden mt-4 flex justify-center">
                    <canvas id="qr-code-${index}"></canvas>
                </div>
            </div>
        `;
    }).join('');
    
    // Add summary
    const totalTransactions = settlements.length;
    const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
    
    const summaryHtml = `
        <div class="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-500/20 text-center">
            <span class="text-green-400 font-medium">
                ✨ Összesen ${totalTransactions} tranzakció szükséges (€${totalAmount.toFixed(2)} összesen)
            </span>
        </div>
    `;
    
    settlementList.insertAdjacentHTML('beforeend', summaryHtml);
}

// Copy payment details to clipboard
window.copyPaymentDetails = function(to, amount, revolut) {
    const text = revolut 
        ? `Fizetés: ${to}\nÖsszeg: €${amount}\nRevolut: @${revolut}`
        : `Fizetés: ${to}\nÖsszeg: €${amount}`;
    
    navigator.clipboard.writeText(text).then(() => {
        if (window.toast) {
            window.toast.success('Fizetési adatok vágólapra másolva!', { icon: '📋' });
        }
    }).catch(() => {
        if (window.toast) {
            window.toast.error('Nem sikerült másolni');
        }
    });
};

// Open Revolut payment deep link
window.openRevolutPayment = function(revolutUsername, amount) {
    // Revolut deep link format
    const revolutLink = `https://revolut.me/${revolutUsername}`;
    
    // Try to open the app, fallback to web
    window.open(revolutLink, '_blank');
    
    if (window.toast) {
        window.toast.info(`Revolut megnyitása: @${revolutUsername}`, { icon: '💳' });
    }
};

// Generate QR code for payment
window.generateQRCode = function(to, amount, index) {
    const qrContainer = document.getElementById(`qr-container-${index}`);
    const qrCanvas = document.getElementById(`qr-code-${index}`);
    
    if (!qrContainer || !qrCanvas) return;
    
    // Toggle visibility
    if (qrContainer.classList.contains('hidden')) {
        qrContainer.classList.remove('hidden');
        
        // Generate QR code with payment info
        const paymentData = `Fizess ${to} részére €${amount}`;
        
        // Check if QRCode library is available
        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(qrCanvas, paymentData, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#ffffff',
                    light: '#00000000'
                }
            });
        } else {
            // Fallback: show text
            qrContainer.innerHTML = `
                <div class="text-center p-4 bg-white/10 rounded-lg">
                    <p class="text-sm text-gray-400">QR könyvtár nem elérhető</p>
                    <p class="text-lg font-bold mt-2">${paymentData}</p>
                </div>
            `;
        }
    } else {
        qrContainer.classList.add('hidden');
    }
};


// Mark as paid
window.markAsPaid = async function (expenseId, personName) {
    try {
        await updateDoc(doc(db, 'expenses', expenseId), {
            [`payments.${personName}.status`]: 'paid',
            [`payments.${personName}.paidAt`]: new Date()
        });
    } catch (error) {
        console.error('Error:', error);
    }
};

// Export
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

// View/Edit expense detail
let currentExpenseId = null;

window.viewExpense = function(expenseId) {
    const expenses = window.allExpenses || [];
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    currentExpenseId = expenseId;
    
    const categoryEmoji = {
        food: '🍽️', accommodation: '🏠', transport: '🚕',
        activities: '🎉', gifts: '🎁', other: '💊'
    };
    
    const date = expense.timestamp ? new Date(expense.timestamp.seconds * 1000) : new Date();
    const dateStr = date.toLocaleDateString('hu-HU', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    
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
                <div class="text-center text-gray-400">
                    ${expense.currency === 'CZK' ? `(Eredeti: ${expense.originalAmount} CZK)` : ''}
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white/5 rounded-xl p-4">
                    <div class="text-sm text-gray-400 mb-1">Fizette</div>
                    <div class="text-xl font-bold">${expense.paidBy}</div>
                </div>
                <div class="bg-white/5 rounded-xl p-4">
                    <div class="text-sm text-gray-400 mb-1">Fejenként</div>
                    <div class="text-xl font-bold">€${expense.amountPerPerson.toFixed(2)}</div>
                </div>
            </div>
            
            <div>
                <h3 class="font-bold mb-3 text-lg">Résztvevők (${expense.splitBetween.length} fő)</h3>
                <div class="space-y-2">
                    ${expense.splitBetween.map(person => {
                        const payment = expense.payments && expense.payments[person];
                        const isPaid = payment && payment.status === 'paid';
                        return `
                            <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <span class="flex items-center gap-2">
                                    <span class="text-2xl">${isPaid ? '✅' : '⏳'}</span>
                                    <strong>${person}</strong>
                                </span>
                                <span class="text-gray-400">€${expense.amountPerPerson.toFixed(2)}</span>
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
                <button onclick="editExpense('${expenseId}')" 
                        class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition">
                    ✏️ Szerkesztés
                </button>
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
        if (window.toast) {
            window.toast.success('Költség sikeresen törölve!', { icon: '🗑️' });
        } else {
            alert('✅ Költség törölve!');
        }
        closeDetailModal();
    } catch (error) {
        console.error('Error deleting:', error);
        if (window.toast) {
            window.toast.error('Hiba történt a törlés közben!');
        } else {
            alert('❌ Hiba történt!');
        }
    }
};

// Track if we're editing
let editingExpenseId = null;

window.editExpense = function(expenseId) {
    const expenses = window.allExpenses || [];
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    editingExpenseId = expenseId;
    
    // Close detail modal first
    closeDetailModal();
    
    // Populate the form with existing data
    setTimeout(() => {
        document.getElementById('description').value = expense.description || '';
        document.getElementById('amount').value = expense.originalAmount || expense.amount || '';
        document.getElementById('currency').value = expense.currency || 'EUR';
        document.getElementById('category').value = expense.category || 'other';
        document.getElementById('paid-by').value = expense.paidBy || '';
        
        // Check the people in splitBetween
        document.querySelectorAll('.person-checkbox').forEach(cb => {
            cb.checked = expense.splitBetween?.includes(cb.value) || false;
        });
        
        // Update modal title and button
        const modalTitle = document.querySelector('#expense-modal h3');
        const submitBtn = document.querySelector('#expense-form button[type="submit"]');
        
        if (modalTitle) modalTitle.textContent = '✏️ Költség Szerkesztése';
        if (submitBtn) submitBtn.innerHTML = '💾 Változtatások Mentése';
        
        // Open modal
        openModal();
    }, 100);
};

// Reset form to add mode
function resetFormToAddMode() {
    editingExpenseId = null;
    
    const modalTitle = document.querySelector('#expense-modal h3');
    const submitBtn = document.querySelector('#expense-form button[type="submit"]');
    
    if (modalTitle) modalTitle.textContent = '➕ Új Költség Hozzáadása';
    if (submitBtn) submitBtn.innerHTML = '💾 Költség Mentése';
}


// ===== CHART.JS VISUALIZATIONS =====
let expenseChart = null;
let currentChartType = 'category';

const chartColors = {
    purple: 'rgba(147, 51, 234, 0.8)',
    pink: 'rgba(236, 72, 153, 0.8)',
    blue: 'rgba(59, 130, 246, 0.8)',
    green: 'rgba(34, 197, 94, 0.8)',
    yellow: 'rgba(234, 179, 8, 0.8)',
    cyan: 'rgba(6, 182, 212, 0.8)',
    orange: 'rgba(249, 115, 22, 0.8)',
    red: 'rgba(239, 68, 68, 0.8)'
};

const categoryLabels = {
    food: '🍽️ Étel & Ital',
    accommodation: '🏠 Szállás',
    transport: '🚕 Utazás',
    activities: '🎉 Programok',
    gifts: '🎁 Ajándékok',
    other: '💊 Egyéb'
};

function initCharts() {
    // Setup chart toggle buttons
    const toggleBtns = document.querySelectorAll('.chart-toggle');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => {
                b.classList.remove('active', 'bg-purple-500/30');
                b.classList.add('bg-white/10');
            });
            btn.classList.add('active', 'bg-purple-500/30');
            btn.classList.remove('bg-white/10');
            
            const type = btn.id.replace('chart-toggle-', '');
            currentChartType = type;
            
            if (window.allExpenses) {
                updateChart(window.allExpenses);
            }
        });
    });
}

function updateChart(expenses) {
    const ctx = document.getElementById('expense-chart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    // Update quick stats
    updateQuickStats(expenses);
    
    if (expenses.length === 0) {
        // Show empty state
        ctx.parentElement.innerHTML = `
            <div class="flex items-center justify-center h-full text-gray-400">
                <p>Nincs elegendő adat a grafikonhoz</p>
            </div>
            <canvas id="expense-chart"></canvas>
        `;
        return;
    }
    
    let chartConfig;
    
    switch (currentChartType) {
        case 'category':
            chartConfig = createCategoryChart(expenses);
            break;
        case 'person':
            chartConfig = createPersonChart(expenses);
            break;
        case 'timeline':
            chartConfig = createTimelineChart(expenses);
            break;
        default:
            chartConfig = createCategoryChart(expenses);
    }
    
    expenseChart = new Chart(ctx, chartConfig);
}

function createCategoryChart(expenses) {
    const categoryTotals = {};
    
    expenses.forEach(exp => {
        const cat = exp.category || 'other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
    });
    
    const labels = Object.keys(categoryTotals).map(cat => categoryLabels[cat] || cat);
    const data = Object.values(categoryTotals);
    const colors = [
        chartColors.purple, chartColors.pink, chartColors.blue,
        chartColors.green, chartColors.yellow, chartColors.cyan
    ];
    
    return {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.slice(0, data.length),
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `€${context.raw.toFixed(2)}`
                    }
                }
            }
        }
    };
}

function createPersonChart(expenses) {
    const personTotals = {};
    
    expenses.forEach(exp => {
        personTotals[exp.paidBy] = (personTotals[exp.paidBy] || 0) + exp.amount;
    });
    
    const sorted = Object.entries(personTotals).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([name]) => name);
    const data = sorted.map(([, amount]) => amount);
    
    return {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Fizetett összeg',
                data,
                backgroundColor: chartColors.purple,
                borderColor: 'rgba(147, 51, 234, 1)',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `€${context.raw.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { 
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: (value) => `€${value}`
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            }
        }
    };
}

function createTimelineChart(expenses) {
    // Sort by timestamp
    const sorted = [...expenses].sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeA - timeB;
    });
    
    // Group by date
    const dailyTotals = {};
    let cumulative = 0;
    const cumulativeData = [];
    
    sorted.forEach(exp => {
        const date = exp.timestamp 
            ? new Date(exp.timestamp.seconds * 1000).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
            : 'Ismeretlen';
        
        dailyTotals[date] = (dailyTotals[date] || 0) + exp.amount;
        cumulative += exp.amount;
        
        // Only add cumulative point if date changed
        if (cumulativeData.length === 0 || cumulativeData[cumulativeData.length - 1].x !== date) {
            cumulativeData.push({ x: date, y: cumulative });
        } else {
            cumulativeData[cumulativeData.length - 1].y = cumulative;
        }
    });
    
    const labels = Object.keys(dailyTotals);
    const dailyData = Object.values(dailyTotals);
    
    return {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Napi költés',
                    data: dailyData,
                    backgroundColor: chartColors.purple,
                    borderColor: chartColors.purple,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Kumulatív',
                    data: cumulativeData.map(d => d.y),
                    backgroundColor: 'rgba(236, 72, 153, 0.2)',
                    borderColor: chartColors.pink,
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: 'rgba(255, 255, 255, 0.8)' }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: €${context.raw.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { 
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: (value) => `€${value}`
                    }
                }
            }
        }
    };
}

function updateQuickStats(expenses) {
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const avgAmount = expenses.length > 0 ? totalAmount / expenses.length : 0;
    
    // Get unique participants
    const participants = new Set();
    expenses.forEach(exp => {
        exp.splitBetween?.forEach(person => participants.add(person));
    });
    const perPerson = participants.size > 0 ? totalAmount / participants.size : 0;
    
    document.getElementById('stat-total').textContent = `€${totalAmount.toFixed(2)}`;
    document.getElementById('stat-count').textContent = expenses.length;
    document.getElementById('stat-avg').textContent = `€${avgAmount.toFixed(2)}`;
    document.getElementById('stat-per-person').textContent = `€${perPerson.toFixed(2)}`;
}

// Update loadExpenses to also update charts
const originalLoadExpenses = loadExpenses;
loadExpenses = function() {
    const q = query(collection(db, 'expenses'), orderBy('timestamp', 'desc'));

    onSnapshot(q, (snapshot) => {
        const expenses = [];
        snapshot.forEach((doc) => {
            expenses.push({ id: doc.id, ...doc.data() });
        });

        displayExpenses(expenses);
        calculateAndDisplayBalances(expenses);
        updateChart(expenses); // Add chart update
    });
};

// ===== FILTERING SYSTEM =====
let activeFilters = {
    search: '',
    category: '',
    person: '',
    date: ''
};

function initFilters() {
    const toggleBtn = document.getElementById('toggle-filters-btn');
    const filterPanel = document.getElementById('filter-panel');
    const clearBtn = document.getElementById('clear-filters-btn');
    
    // Toggle filter panel
    if (toggleBtn && filterPanel) {
        toggleBtn.addEventListener('click', () => {
            filterPanel.classList.toggle('hidden');
        });
    }
    
    // Clear filters
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }
    
    // Filter inputs with debounce for search
    const filterSearch = document.getElementById('filter-search');
    const filterCategory = document.getElementById('filter-category');
    const filterPerson = document.getElementById('filter-person');
    const filterDate = document.getElementById('filter-date');
    
    let searchDebounce;
    
    if (filterSearch) {
        filterSearch.addEventListener('input', (e) => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => {
                activeFilters.search = e.target.value.toLowerCase();
                applyFilters();
            }, 300);
        });
    }
    
    if (filterCategory) {
        filterCategory.addEventListener('change', (e) => {
            activeFilters.category = e.target.value;
            applyFilters();
        });
    }
    
    if (filterPerson) {
        filterPerson.addEventListener('change', (e) => {
            activeFilters.person = e.target.value;
            applyFilters();
        });
    }
    
    if (filterDate) {
        filterDate.addEventListener('change', (e) => {
            activeFilters.date = e.target.value;
            applyFilters();
        });
    }
}

function clearFilters() {
    activeFilters = { search: '', category: '', person: '', date: '' };
    
    // Reset form elements
    const filterSearch = document.getElementById('filter-search');
    const filterCategory = document.getElementById('filter-category');
    const filterPerson = document.getElementById('filter-person');
    const filterDate = document.getElementById('filter-date');
    
    if (filterSearch) filterSearch.value = '';
    if (filterCategory) filterCategory.value = '';
    if (filterPerson) filterPerson.value = '';
    if (filterDate) filterDate.value = '';
    
    applyFilters();
}

function applyFilters() {
    const expenses = window.allExpenses || [];
    const filtered = filterExpenses(expenses);
    
    displayExpenses(filtered);
    updateFilterUI(filtered.length, expenses.length);
}

function filterExpenses(expenses) {
    return expenses.filter(expense => {
        // Search filter
        if (activeFilters.search) {
            const searchTerm = activeFilters.search.toLowerCase();
            const description = (expense.description || '').toLowerCase();
            const paidBy = (expense.paidBy || '').toLowerCase();
            
            if (!description.includes(searchTerm) && !paidBy.includes(searchTerm)) {
                return false;
            }
        }
        
        // Category filter
        if (activeFilters.category && expense.category !== activeFilters.category) {
            return false;
        }
        
        // Person filter
        if (activeFilters.person && expense.paidBy !== activeFilters.person) {
            return false;
        }
        
        // Date filter
        if (activeFilters.date && expense.timestamp) {
            const expenseDate = new Date(expense.timestamp.seconds * 1000);
            const now = new Date();
            
            switch (activeFilters.date) {
                case 'today':
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    if (expenseDate < today) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (expenseDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    if (expenseDate < monthAgo) return false;
                    break;
            }
        }
        
        return true;
    });
}

function updateFilterUI(filteredCount, totalCount) {
    const filterResults = document.getElementById('filter-results');
    const activeFilterCount = document.getElementById('active-filter-count');
    
    // Count active filters
    const activeCount = Object.values(activeFilters).filter(v => v !== '').length;
    
    if (filterResults) {
        if (activeCount > 0) {
            filterResults.textContent = `${filteredCount} / ${totalCount} költség megjelenítve`;
        } else {
            filterResults.textContent = `${totalCount} költség`;
        }
    }
    
    if (activeFilterCount) {
        if (activeCount > 0) {
            activeFilterCount.textContent = activeCount;
            activeFilterCount.classList.remove('hidden');
        } else {
            activeFilterCount.classList.add('hidden');
        }
    }
}

// Initialize
console.log('Initializing...');
initCharts();
initFilters();
loadPeople();
loadExpenses();
