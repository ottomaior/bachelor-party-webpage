// Currency converter — inline card on the Prága page.
(function () {
    'use strict';

    const exchangeRates = {
        EUR: 1,
        CZK: 25.0,
        HUF: 395.0,
        RON: 4.97
    };

    function setCurrencyAmount(amount) {
        const input = document.getElementById('currencyAmount');
        if (input) {
            input.value = amount;
            convertCurrency();
        }
    }

    function convertCurrency() {
        const amountEl = document.getElementById('currencyAmount');
        const fromEl = document.getElementById('currencyFrom');
        if (!amountEl || !fromEl) return;

        const amount = parseFloat(amountEl.value) || 0;
        const fromCurrency = fromEl.value;
        const eurAmount = amount / exchangeRates[fromCurrency];

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        set('resultEUR', eurAmount.toFixed(2));
        set('resultCZK', (eurAmount * exchangeRates.CZK).toFixed(2));
        set('resultHUF', (eurAmount * exchangeRates.HUF).toFixed(2));
        set('resultRON', (eurAmount * exchangeRates.RON).toFixed(2));
    }

    document.addEventListener('DOMContentLoaded', () => {
        const input = document.getElementById('currencyAmount');
        const select = document.getElementById('currencyFrom');
        if (input) input.addEventListener('input', convertCurrency);
        if (select) select.addEventListener('change', convertCurrency);
        document.querySelectorAll('[data-currency-amount]').forEach(btn => {
            btn.addEventListener('click', () => setCurrencyAmount(parseFloat(btn.dataset.currencyAmount)));
        });
        convertCurrency();
    });

    window.setCurrencyAmount = setCurrencyAmount;
    window.convertCurrency = convertCurrency;
})();
