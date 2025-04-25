document.addEventListener("DOMContentLoaded",()=>{
    const sections=document.querySelectorAll('.section');
    let activeInput=0;
    let conversionRates={};
    let baseCurrency= "USD";
    async function fetchRates() {
        const [fromSection, toSection] = sections;
        const fromCurrency = fromSection.querySelector('.currency-option.selected').textContent.trim();
        const toCurrency = toSection.querySelector('.currency-option.selected').textContent.trim();
        // Əgər valyutalar eynidirsə api-yə sorğu getmir
        if (fromCurrency === toCurrency) {
            conversionRates = {};
            hideOfflineMessage();
            updateRateText();
            convertCurrency();
            return;
        }
        if (!navigator.onLine) {
            showOfflineMessage();
            return;
        }
        try {
            baseCurrency = "USD";
            const response = await fetch(`https://v6.exchangerate-api.com/v6/bf8d29bd9232b854da898993/latest/${baseCurrency}`);
            const data = await response.json();
            conversionRates = data.conversion_rates;
            hideOfflineMessage();
            convertCurrency();
            updateRateText();
        } catch (error) {
            console.error("Məzənnə yüklənmədi:", error);
            showOfflineMessage();
        }
    }
    sections.forEach((section, index) => {
        const input = section.querySelector('.amount-input');
        input.addEventListener('input', (e) => {
            activeInput = index;
            let value = e.target.value.replace(',', '.');
            value = value.replace(/[^0-9.]/g, '');
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts[1];
            }
            if (value.includes('.')) {
                const [integer, decimal] = value.split('.');
                value = integer + '.' + decimal.slice(0, 5);
            }
            e.target.value = value;
            convertCurrency();
        });

        section.querySelectorAll('.currency-option').forEach(option => {
            option.addEventListener('click', () => {
                section.querySelector('.currency-option.selected')?.classList.remove('selected');
                option.classList.add('selected');
                updateRateText();
                convertCurrency();
            });
        });
    });
    function updateRateText(){
        const [fromSection, toSection] = sections;
        const fromCurrency = fromSection.querySelector('.currency-option.selected').textContent.trim();
        const toCurrency = toSection.querySelector('.currency-option.selected').textContent.trim();
    
        let rate = fromCurrency === toCurrency ? 1 : getRate(fromCurrency, toCurrency);
    
        const roundedRate = rate.toFixed(4);
        const inverseRoundedRate = (1 / rate).toFixed(4);
    
        fromSection.querySelector('.conversion-rate').textContent = `1 ${fromCurrency} = ${roundedRate} ${toCurrency}`;
        toSection.querySelector('.conversion-rate').textContent = `1 ${toCurrency} = ${inverseRoundedRate} ${fromCurrency}`;
    }
    function convertCurrency() {
        const [fromSection, toSection] = sections;
        const activeSection = sections[activeInput];
        const passiveSection = sections[activeInput === 0 ? 1 : 0];
        const activeInputElement = activeSection.querySelector('.amount-input');
        const passiveInputElement = passiveSection.querySelector('.amount-input');
        const activeCurrency = activeSection.querySelector('.currency-option.selected').textContent.trim();
        const passiveCurrency = passiveSection.querySelector('.currency-option.selected').textContent.trim();
        const rawValue = activeInputElement.value.trim();
    
        if (rawValue === ''){
            passiveInputElement.value = '';
            return;
        } 
        const activeValue = parseFloat(rawValue);
        if (isNaN(activeValue)){
            passiveInputElement.value = '';
            return;
        }
        if (!navigator.onLine && activeCurrency !== passiveCurrency){
            // Əgər offline-dursa və valyutalar fərqlidirsə, çevrilməni blokla
            passiveInputElement.value = '';
            return;
        }
        const rate = activeCurrency===passiveCurrency ? 1 : getRate(activeCurrency, passiveCurrency);
        passiveInputElement.value = (activeValue * rate).toFixed(5);
    }
    
    function getRate(from, to) {
        if (from === to) return 1;
        if (from === baseCurrency) {
            return conversionRates[to] || 1;
        } else if (to === baseCurrency) {
            return 1 / (conversionRates[from] || 1);
        } else {
            const fromToUSD = 1 / (conversionRates[from] || 1);
            return fromToUSD * (conversionRates[to] || 1);
        }
    }
    function showOfflineMessage() {
        document.getElementById('offline-alert').style.display = 'block';
    }
    function hideOfflineMessage() {
        document.getElementById('offline-alert').style.display = 'none';
    }
    window.addEventListener('online', () => {
        hideOfflineMessage();
        fetchRates();
    });
    window.addEventListener('offline', showOfflineMessage);
    fetchRates();
});
