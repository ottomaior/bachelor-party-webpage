import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    updateDoc,
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

            alert('✅ Költség hozzáadva!');
            closeModal();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Hiba: ' + error.message);
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
}


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
        alert('✅ Költség törölve!');
        closeDetailModal();
    } catch (error) {
        console.error('Error deleting:', error);
        alert('❌ Hiba történt!');
    }
};

window.editExpense = function(expenseId) {
    alert('Szerkesztés funkció hamarosan! Egyelőre törölheted és újra hozzáadhatod. 😊');
};


// Initialize
console.log('Initializing...');
loadPeople();
loadExpenses();
