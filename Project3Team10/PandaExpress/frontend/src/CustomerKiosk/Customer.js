import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Customer.css';
import SoundCloudPlayer from './SoundCloudPlayer.js';
import SizeSelectionPage from './SizeSelectionPage';
import API_URL from '../config';
  
export default function Customer(){
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const options = [
        'Bowl',
        'Plate',
        'Bigger Plate',
        'Drink',
        'Appetizer'
    ];
    const [weather, setWeather] = useState(null);
    const [sizePageStep, setSizePageStep] = useState('sides'); // 'sides' or 'entrees'
    const [prices, setPrices] = useState({}); // map option -> price (number)
    const [sizesInfo, setSizesInfo] = useState({}); // map size name -> { price, numberofentrees, numberofsides }
    const [orderItems, setOrderItems] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState(null); // 'size' | 'appetizer' | 'drink'
    const [modalSize, setModalSize] = useState(null);
    // full-page size selection (replaces the old size modal for better accessibility)
    const [sizePageOpen, setSizePageOpen] = useState(false);
    const [sizePageSize, setSizePageSize] = useState(null);
    const [availableSides, setAvailableSides] = useState([]);
    const [availableEntrees, setAvailableEntrees] = useState([]);
    const [selectedSides, setSelectedSides] = useState([]);
    const [selectedEntrees, setSelectedEntrees] = useState([]);
    const [availableAppetizers, setAvailableAppetizers] = useState([]); // array of {name, price}
    const [selectedAppetizer, setSelectedAppetizer] = useState(null);
    const [appetizerPageOpen, setAppetizerPageOpen] = useState(false);
    const [appetizerPageSelected, setAppetizerPageSelected] = useState(null);
    const [appetizerImages, setAppetizerImages] = useState({}); // id -> object URL
    const appetizerImagesRef = useRef({});
    useEffect(() => { appetizerImagesRef.current = appetizerImages; }, [appetizerImages]);
    const [selectedDrinkSize, setSelectedDrinkSize] = useState(null);
    const [availableDrinkSizes, setAvailableDrinkSizes] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const translateLoadedRef = useRef(false);

    const initGoogleTranslate = () => {
        // If the script hasn't finished loading, don't attempt to access
        // `window.google.translate` yet 
        if (translateLoadedRef.current) return;
        if (!window.google || !window.google.translate) return;

        // Try to initialize the widget. Some environments may expose
        // `TranslateElement` as a constructor, others as a plain function;
        // handle both. Only mark the widget as loaded after successful
        // initialization so callers can retry on failure.
        try {
            const ctor = window.google.translate.TranslateElement;
            if (typeof ctor === 'function') {
                // Preferred usage - includedLanguages forces English to be first/default
                new ctor({ 
                    pageLanguage: 'en',
                    includedLanguages: 'en,es,zh-CN,zh-TW,fr,de,it,ja,ko,pt,ru,ar,hi,th,vi',
                    autoDisplay: false
                }, 'google_translate_element');
            } else if (typeof window.google.translate.TranslateElement === 'object' && window.google.translate.TranslateElement !== null) {
                // Rare case: it's exposed as an object with an init method
                if (typeof window.google.translate.TranslateElement.init === 'function') {
                    window.google.translate.TranslateElement.init({ 
                        pageLanguage: 'en',
                        includedLanguages: 'en,es,zh-CN,zh-TW,fr,de,it,ja,ko,pt,ru,ar,hi,th,vi',
                        autoDisplay: false
                    }, 'google_translate_element');
                } else {
                    // Fallback: try calling it like a function
                    window.google.translate.TranslateElement({ 
                        pageLanguage: 'en',
                        includedLanguages: 'en,es,zh-CN,zh-TW,fr,de,it,ja,ko,pt,ru,ar,hi,th,vi',
                        autoDisplay: false
                    }, 'google_translate_element');
                }
            } else {
                // Last resort: try calling as a function (some builds expose it this way)
                try {
                    window.google.translate.TranslateElement({ 
                        pageLanguage: 'en',
                        includedLanguages: 'en,es,zh-CN,zh-TW,fr,de,it,ja,ko,pt,ru,ar,hi,th,vi',
                        autoDisplay: false
                    }, 'google_translate_element');
                } catch (innerErr) {
                    throw innerErr;
                }
            }

            translateLoadedRef.current = true;
        } catch (e) {
            // Keep translateLoadedRef false so callers can retry; log for debugging
            console.debug('initGoogleTranslate failed (will retry when script is ready)', e);
        }

        // After widget initializes, reorder dropdown options so English is first,
        // then force it to English initially, then try to preserve any previously
        // selected target language (stored in the `googtrans` cookie).
        setTimeout(() => {
            try {
                const sel = document.querySelector('.goog-te-combo');
                if (!sel) return;
                
                // Reorder options to put English first
                const options = Array.from(sel.options);
                const englishOption = options.find(opt => opt.value === 'en');
                if (englishOption) {
                    // Remove English option from its current position
                    englishOption.remove();
                    // Insert it at the beginning (after "Select Language" placeholder)
                    if (sel.options.length > 0 && sel.options[0].value === '') {
                        sel.insertBefore(englishOption, sel.options[1]);
                    } else {
                        sel.insertBefore(englishOption, sel.options[0]);
                    }
                }
                
                // First, force to English
                sel.value = 'en';
                
                // Then check if user had a different language selected previously
                const cookie = document.cookie.split(';').map(c=>c.trim()).find(c => c.startsWith('googtrans='));
                if (cookie) {
                    const val = cookie.split('=')[1] || '';
                    const parts = val.split('/');
                    const target = parts[2] || null;
                    if (target && target !== 'en') {
                        sel.value = target;
                    }
                }
                
                sel.dispatchEvent(new Event('change'));
                sel.dispatchEvent(new Event('input'));
            } catch (e) {
                // swallow errors — don't break app UX
                console.debug('preserve translate failed', e);
            }
        }, 350);
    };

    const [darkMode, setDarkMode] = useState(() => {
        try {
            const v = localStorage.getItem('panda-dark-mode');
            if (v === '1') return true;
            if (v === '0') return false;
        } catch (e) {
            // ignore
        }
        // fallback to system preference
        try {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch (e) {
            return false;
        }
    });
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState(null);
    const [lastOrderId, setLastOrderId] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const successTimeoutRef = useRef(null);

    useEffect(() => {
        // Fetch prices for size-type options individually
        async function fetchPrices(){
            const newPrices = {};

            // Fetch all sizes in one request and map names -> price + size details
            try {
                const resp = await fetch(`${API_URL}/api/sizes`);
                if (resp.ok){
                    const list = await resp.json(); // [{id, name, price, numberofentrees, numberofsides}, ...]
                    if (Array.isArray(list)){
                        const newSizes = {};
                        list.forEach(item => {
                            if (item && item.name){
                                const p = Number(item.price);
                                if (!Number.isNaN(p)) newPrices[item.name] = p;
                                newSizes[item.name] = {
                                    price: !Number.isNaN(Number(item.price)) ? Number(item.price) : undefined,
                                    numberofentrees: item.numberofentrees,
                                    numberofsides: item.numberofsides
                                };
                            }
                        });
                        setSizesInfo(prev => ({ ...prev, ...newSizes }));
                    }
                }
            } catch (e) {
                console.log(e.message);
            }

            // For appetizers/drinks, fetch list of enabled items and use a 'from' price (minimum)
            try {
                const resp = await fetch(`${API_URL}/api/appetizers-drinks/prices`);
                if (resp.ok){
                    const list = await resp.json(); // [{name, price}, ...]
                    if (Array.isArray(list) && list.length > 0){
                        // compute minimum price
                        const pricesOnly = list.map(i => Number(i.price)).filter(p => !Number.isNaN(p));
                        if (pricesOnly.length > 0){
                            const min = Math.min(...pricesOnly);
                            newPrices['Appetizer'] = min;
                            newPrices['Drink'] = min; // drinks share source; if you have separate drink table adjust accordingly
                        }
                    }
                }
            } catch (e) {
                // ignore
            }

            setPrices(prev => ({...prev, ...newPrices}));
        }

        fetchPrices();
    }, []);

    useEffect(() => {
        if (sizePageOpen && sizePageStep === 'sides' && availableSides.length > 0) {
            async function applyTranslationToSidesPage() {
                // Wait a bit longer for DOM to fully render
                await new Promise((r) => setTimeout(r, 200));
    
                const readCookieLang = () => {
                    try {
                        const cookie = document.cookie
                            .split(';')
                            .map((c) => c.trim())
                            .find((c) => c.startsWith('googtrans='));
                        if (!cookie) return null;
                        const val = cookie.split('=')[1] || '';
                        const parts = val.split('/');
                        return parts[2] || null;
                    } catch (e) {
                        return null;
                    }
                };
    
                const tryApplySelect = (lang) => {
                    const sel = document.querySelector('.goog-te-combo');
                    if (!sel) return false;
                    try {
                        if (lang && lang !== 'en') {
                            sel.value = lang;
                            sel.dispatchEvent(new Event('change', { bubbles: true }));
                            sel.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        return true;
                    } catch (e) {
                        return false;
                    }
                };
    
                const target = readCookieLang();
                
                // Only apply if we have a non-English target
                if (!target || target === 'en') return;
    
                if (tryApplySelect(target)) {
                    // Retry after delay
                    await new Promise((r) => setTimeout(r, 150));
                    tryApplySelect(target);
                    return;
                }
    
                translateLoadedRef.current = false;
                initGoogleTranslate();
    
                await new Promise((r) => setTimeout(r, 350));
                tryApplySelect(target);
            }
    
            applyTranslationToSidesPage();
        }
    }, [sizePageOpen, sizePageStep, availableSides]);

    useEffect(() => {
        if (sizePageOpen && sizePageStep === 'entrees') {
            async function applyTranslationToEntreesPage() {
                await new Promise((r) => setTimeout(r, 120));
    
                const readCookieLang = () => {
                    try {
                        const cookie = document.cookie
                            .split(';')
                            .map((c) => c.trim())
                            .find((c) => c.startsWith('googtrans='));
                        if (!cookie) return null;
                        const val = cookie.split('=')[1] || '';
                        const parts = val.split('/');
                        return parts[2] || null;
                    } catch (e) {
                        return null;
                    }
                };
    
                const tryApplySelect = (lang) => {
                    const sel = document.querySelector('.goog-te-combo');
                    if (!sel) return false;
                    try {
                        if (lang) sel.value = lang;
                        sel.dispatchEvent(new Event('change'));
                        sel.dispatchEvent(new Event('input'));
                        return true;
                    } catch (e) {
                        return false;
                    }
                };
    
                const target = readCookieLang();
    
                if (tryApplySelect(target)) return;
    
                translateLoadedRef.current = false;
                initGoogleTranslate();
    
                await new Promise((r) => setTimeout(r, 350));
                tryApplySelect(target);
            }
    
            applyTranslationToEntreesPage();
        }
    }, [sizePageOpen, sizePageStep, availableEntrees]);

    // apply theme class to body and persist preference
    useEffect(() => {
        try {
            if (darkMode) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('panda-dark-mode', '1');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('panda-dark-mode', '0');
            }
        } catch (e) {
            // ignore
        }
    }, [darkMode]);

    function toggleDarkMode(){
        setDarkMode(d => !d);
    }

    function resetTranslation(){
        try{
            // Set the googtrans cookie to English — both root path and host-specific
            document.cookie = 'googtrans=/en/en;path=/';
            try{ document.cookie = 'googtrans=/en/en;path=/;domain=' + window.location.hostname; }catch(e){}
        }catch(e){/* ignore */}

        // If the translate select exists, set it to English and dispatch events
        try{
            const sel = document.querySelector('.goog-te-combo');
            if (sel){
                sel.value = 'en';
                sel.dispatchEvent(new Event('change'));
                sel.dispatchEvent(new Event('input'));
            }
        }catch(e){}

        // Re-init widget
        try{
            translateLoadedRef.current = false;
            initGoogleTranslate();
        }catch(e){}
    }

    // cleanup any pending success timeout on unmount
    useEffect(() => {
        return () => {
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
                successTimeoutRef.current = null;
            }
            // revoke any appetizer image object URLs
            try {
                Object.values(appetizerImagesRef.current || {}).forEach(url => { try { if (String(url).startsWith('blob:')) URL.revokeObjectURL(url); } catch (e){} });
            } catch (e) {}
        };
    }, []);

    function formatPrice(p){
        if (typeof p !== 'number' || Number.isNaN(p)) return '$0.00';
        return `$${p.toFixed(2)}`;
    }

    // Resolve a food name/object to an object { name, id?, imgUrl? } using DB
    async function resolveFoodItem(i){
        // If i is an object with id/name use it; if it lacks id but has name, try to resolve via POST /api/food
        if (i && typeof i === 'object'){
            const name = i.name || '';
            const maybeId = (typeof i.id === 'number' && !Number.isNaN(i.id)) ? i.id : undefined;
            if (maybeId !== undefined) return { name, id: maybeId, imgUrl: `/api/food-image/${maybeId}` };

            // no id provided — attempt to get/create the food via the backend to obtain an id
            if (name) {
                try {
                    const resp = await fetch(`${API_URL}/api/food`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name })
                    });
                    if (resp.ok){
                        const data = await resp.json().catch(() => null);
                        const id = data && data.item && (data.item.id || data.item.id === 0) ? data.item.id : undefined;
                        const imgUrl = id !== undefined ? `${API_URL}/api/food-image/${id}` : undefined;
                        return { name, id, imgUrl };
                    }
                } catch (e) {
                    // ignore and fall back to name-only
                }
            }
            return { name, id: undefined, imgUrl: undefined };
        }

        // If i is a string, try to POST /api/food to get or create the food and its id
        if (typeof i === 'string'){
            const name = i;
            try {
                const resp = await fetch(`${API_URL}/api/food`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
                    if (resp.ok){
                    const data = await resp.json().catch(() => null);
                    const id = data && data.item && (data.item.id || data.item.id === 0) ? data.item.id : undefined;
                    const imgUrl = id !== undefined ? `${API_URL}/api/food-image/${id}` : undefined;
                    return { name, id, imgUrl };
                }
            } catch (e) {
                // ignore — we'll fall back to name-only
            }
            return { name, id: undefined, imgUrl: undefined };
        }

        return null;
    }



    // Open a full-page size selection which provides larger images and an accessible layout
    function openSizePage(sizeName){
        setSizePageSize(sizeName);
        setSizePageStep('sides'); 
        setSelectedSides([]);
        setSelectedEntrees([]);
        setSelectedAppetizer(null);
        setSelectedDrinkSize(null);
        setSizePageOpen(true);

        // Fetch sides and entrees lists and resolve images
        (async () => {
            try {
                const s = await fetch(`${API_URL}/api/sides`);
                if (s.ok){
                    const list = await s.json();
                    const items = Array.isArray(list) ? await Promise.all(list.map(resolveFoodItem)) : [];
                    setAvailableSides((items || []).filter(Boolean));
                }
            } catch (e) {
                // ignore
            }

            try {
                const eResp = await fetch(`${API_URL}/api/entrees`);
                if (eResp.ok){
                    const list = await eResp.json();
                    const items = Array.isArray(list) ? await Promise.all(list.map(resolveFoodItem)) : [];
                    setAvailableEntrees((items || []).filter(Boolean));
                }
            } catch (e) {
                // ignore
            }
        })();
    }

    async function openAppetizerPage(){
        setAppetizerPageSelected(null);
        setAvailableAppetizers([]);
        setAppetizerPageOpen(true);
        try {
            // Fetch appetizers (id, name, price) and render images via direct image route
            const resp = await fetch(`${API_URL}/api/inventory/price-adjustment/appetizers-drinks-enabled`);
            if (resp.ok){
                const list = await resp.json(); // [{id, name, price}, ...]
                const items = Array.isArray(list) ? list.map(i => {
                    const id = i && (i.id || i.id === 0) ? i.id : undefined;
                    const name = i && i.name;
                    const raw = i && i.price;
                    const p = raw != null ? Number(raw) : undefined;
                    const imgUrl = id !== undefined ? `${API_URL}/api/appetizer-drink-image/${id}` : undefined;
                    return { name, id, imgUrl, price: (!Number.isNaN(p) ? p : undefined) };
                }) : [];
                const cleaned = (items || []).filter(Boolean);
                setAvailableAppetizers(cleaned);
            }
        } catch (e) {
            console.error('openAppetizerPage error', e);
            setAvailableAppetizers([]);
        }
    }




    function openDrinkModal(){
        // choose a drink size from sizes
        setModalMode('drink');
        setModalSize(null);
        setSelectedSides([]);
        setSelectedEntrees([]);
        setSelectedAppetizer(null);
        setSelectedDrinkSize(null);
        setModalOpen(true);
        // Build a fixed set of drink sizes (Small/Medium/Large) and try to resolve their prices
        (async () => {
            try {
                const resp = await fetch(`${API_URL}/api/appetizers-drinks/prices`);
                let list = [];
                if (resp.ok) list = await resp.json(); // [{name, price}, ...]

                const sizes = ['Small','Medium','Large'];
                const mapped = sizes.map(s => {
                    const dbName = `${s} Drink`;
                    const found = Array.isArray(list) ? list.find(p => p && p.name === dbName) : null;
                    const raw = found && found.price;
                    const p = raw != null ? Number(raw) : undefined;
                    return { size: s, dbName, price: (!Number.isNaN(p) ? p : undefined) };
                });
                setAvailableDrinkSizes(mapped);
            } catch (e) {
                const sizes = ['Small','Medium','Large'];
                setAvailableDrinkSizes(sizes.map(s => ({ size: s, dbName: `${s} Drink`, price: undefined })));
            }
        })();
    }

    function addToOrder(option){
        // If option is a size, open the selection modal
        if (['Bowl','Plate','Bigger Plate'].includes(option)){
            // navigate to full-page size selection for larger images and accessibility
            openSizePage(option);
            return;
        }

        if (option === 'Appetizer'){
            // open full-page appetizer selector like sizes do
            openAppetizerPage();
            return;
        }

        if (option === 'Drink'){
            openDrinkModal();
            return;
        }

        const price = prices[option] || 0;
        setOrderItems(prev => [...prev, { name: option, price }]);
    }

    // Clear the current order
    function clearOrder(){
        setOrderItems([]);
    }

    const total = useMemo(() => {
        return orderItems.reduce((s, it) => s + (Number(it.price) || 0), 0);
    }, [orderItems]);

    // Toggle between selected entree/side
    function toggleSelect(arr, setter, value){
        if (arr.includes(value)) setter(arr.filter(v => v !== value));
        else setter([...arr, value]);
    }


    // Confirm the current modal selection and add to order
    async function confirmModal(){
        if (modalMode === 'size'){
            if (!modalSize || !sizesInfo[modalSize]) return;
            const requiredSides = Number(sizesInfo[modalSize].numberofsides) || 0;
            const requiredEntrees = Number(sizesInfo[modalSize].numberofentrees) || 0;

            if (selectedSides.length !== requiredSides || selectedEntrees.length !== requiredEntrees){
                alert(`Please select ${requiredSides} side${requiredSides===1? '':'s'} and ${requiredEntrees} entree${requiredEntrees===1? '':'s'}.`);
                return;
            }

            const price = sizesInfo[modalSize].price || 0;
            setOrderItems(prev => [...prev, { name: modalSize, price, sides: selectedSides, entrees: selectedEntrees }]);
            setModalOpen(false);
            setModalMode(null);
            setModalSize(null);
            return;
        }

        if (modalMode === 'appetizer'){
            if (!selectedAppetizer) { alert('Please select an appetizer'); return; }
            // Prefer the price we fetched for appetizers; fall back to fetching a single price
            const found = availableAppetizers.find(a => a.name === selectedAppetizer);
            if (found && typeof found.price === 'number'){
                setOrderItems(prev => [...prev, { name: selectedAppetizer, price: found.price }]);
                setModalOpen(false);
                setModalMode(null);
                return;
            }

            try {
                const resp = await fetch(`${API_URL}/api/appetizers-drinks/price/${encodeURIComponent(selectedAppetizer)}`);
                if (resp.ok){
                    const data = await resp.json();
                    const raw = data && data.price;
                    const p = raw != null ? Number(raw) : undefined;
                    const price = (p !== undefined && !Number.isNaN(p)) ? p : (prices['Appetizer'] || 0);
                    setOrderItems(prev => [...prev, { name: selectedAppetizer, price }]);
                } else {
                    setOrderItems(prev => [...prev, { name: selectedAppetizer, price: prices['Appetizer'] || 0 }]);
                }
            } catch (e) {
                setOrderItems(prev => [...prev, { name: selectedAppetizer, price: prices['Appetizer'] || 0 }]);
            }

            setModalOpen(false);
            setModalMode(null);
            return;
        }

        if (modalMode === 'drink'){
            if (!selectedDrinkSize) { alert('Please select a drink size'); return; }
            const selected = availableDrinkSizes.find(d => d.size === selectedDrinkSize);
            const dbName = selected ? selected.dbName : `${selectedDrinkSize} Drink`;

            // Try to fetch exact price from appetizers/drinks table; fallback to any pre-known price
            if (selected && typeof selected.price === 'number'){
                setOrderItems(prev => [...prev, { name: dbName, price: selected.price }]);
            } else {
                try {
                    const resp = await fetch(`${API_URL}/api/appetizers-drinks/price/${encodeURIComponent(dbName)}`);
                    if (resp.ok){
                        const data = await resp.json();
                        const raw = data && data.price;
                        const p = raw != null ? Number(raw) : undefined;
                        const price = (p !== undefined && !Number.isNaN(p)) ? p : (prices['Drink'] || 0);
                        setOrderItems(prev => [...prev, { name: dbName, price }]);
                    } else {
                        setOrderItems(prev => [...prev, { name: dbName, price: prices['Drink'] || 0 }]);
                    }
                } catch (e){
                    setOrderItems(prev => [...prev, { name: dbName, price: prices['Drink'] || 0 }]);
                }
            }

            setModalOpen(false);
            setModalMode(null);
            setSelectedDrinkSize(null);
            return;
        }
    }

    // Cancel and close the current modal
    function cancelModal(){
        setModalOpen(false);
        setModalMode(null);
        setModalSize(null);
    }

    // Cancel and close the full-page size selection
    function cancelSizePage(){
        setSizePageOpen(false);
        setSizePageSize(null);
        // clear any partial selections
        setSelectedSides([]);
        setSelectedEntrees([]);
    }

    // Cancel and close the full-page appetizer selection
    function cancelAppetizerPage(){
        setAppetizerPageOpen(false);
        setAppetizerPageSelected(null);
        setAvailableAppetizers([]);
    }


    // Confirm the current modal selection and add to order
    async function confirmSizePage(){
        if (!sizePageSize || !sizesInfo[sizePageSize]) return;
        const requiredSides = Number(sizesInfo[sizePageSize].numberofsides) || 0;
        const requiredEntrees = Number(sizesInfo[sizePageSize].numberofentrees) || 0;

        if (selectedSides.length !== requiredSides || selectedEntrees.length !== requiredEntrees){
            alert(`Please select ${requiredSides} side${requiredSides===1? '':'s'} and ${requiredEntrees} entree${requiredEntrees===1? '':'s'}.`);
            return;
        }

        const price = sizesInfo[sizePageSize].price || 0;
        setOrderItems(prev => [...prev, { name: sizePageSize, price, sides: selectedSides, entrees: selectedEntrees }]);
        setSizePageOpen(false);
        setSizePageSize(null);
        setSelectedSides([]);
        setSelectedEntrees([]);
    }

    // Confirm the current modal selection and add to order
    async function confirmAppetizerPage(){
        if (!appetizerPageSelected) { alert('Please select an appetizer'); return; }
        const found = availableAppetizers.find(a => a.name === appetizerPageSelected);
        if (found && typeof found.price === 'number'){
            setOrderItems(prev => [...prev, { name: appetizerPageSelected, price: found.price }]);
            setAppetizerPageOpen(false);
            setAppetizerPageSelected(null);
            return;
        }

        try {
            const resp = await fetch(`${API_URL}/api/appetizers-drinks/price/${encodeURIComponent(appetizerPageSelected)}`);
            if (resp.ok){
                const data = await resp.json();
                const raw = data && data.price;
                const p = raw != null ? Number(raw) : undefined;
                const price = (p !== undefined && !Number.isNaN(p)) ? p : (prices['Appetizer'] || 0);
                setOrderItems(prev => [...prev, { name: appetizerPageSelected, price }]);
            } else {
                setOrderItems(prev => [...prev, { name: appetizerPageSelected, price: prices['Appetizer'] || 0 }]);
            }
        } catch (e) {
            setOrderItems(prev => [...prev, { name: appetizerPageSelected, price: prices['Appetizer'] || 0 }]);
        }

        setAppetizerPageOpen(false);
        setAppetizerPageSelected(null);
    }

    function toggleCart(){
        setCartOpen(c => !c);
    }

    function closeCart(){
        setCartOpen(false);
    }

    // close cart on Escape key
    useEffect(() => {
        if (!cartOpen) return;
        function onKey(e){
            if (e.key === 'Escape' || e.key === 'Esc') closeCart();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [cartOpen]);

    function removeItem(index){
        setOrderItems(prev => prev.filter((_, i) => i !== index));
    }


    // Fetch weather info on mount and every 10 minutes
    useEffect(() => {
        async function fetchWeather() {
          try {
            const API_KEY = 'c5346e2ecf676c8aee30d87e6429bc2d'; // your actual key
            const city = 'College Station,us'; // or whatever city you want
            
            const response = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${API_KEY}&units=imperial`
            );
            
            if (response.ok) {
              const data = await response.json();
              setWeather({
                temp: Math.round(data.main.temp),
                description: data.weather[0].description,
                icon: data.weather[0].icon
              });
            }
          } catch (err) {
            console.log('Weather fetch failed:', err);
          }
        }
      
        fetchWeather();
        // Refresh every 10 minutes
        const interval = setInterval(fetchWeather, 600000);
        return () => clearInterval(interval);
      }, []);
    
      useEffect(() => {
            // Default to English before translate widget runs
                // Set the `googtrans` cookie to `/en/en` both for path and (where allowed) domain.
                try {
                        document.cookie = 'googtrans=/en/en;path=/';
                        try { document.cookie = 'googtrans=/en/en;path=/;domain=' + window.location.hostname; } catch(e) {}
                } catch (e) {
                        // ignore cookie errors
                }

                // If script not loaded, load it
                const enforceEnglish = () => {
                        try {
                                document.cookie = 'googtrans=/en/en;path=/';
                                try { document.cookie = 'googtrans=/en/en;path=/;domain=' + window.location.hostname; } catch(e) {}
                        } catch (e) {}

                        // Try to set the visible select value repeatedly until it takes.
                        let attempts = 0;
                        const maxAttempts = 40; // ~4 seconds at 100ms interval
                        const interval = setInterval(() => {
                                attempts += 1;
                                try {
                                        const sel = document.querySelector('.goog-te-combo');
                                        if (sel) {
                                                try {
                                                        sel.value = 'en';
                                                        sel.dispatchEvent(new Event('change'));
                                                        sel.dispatchEvent(new Event('input'));
                                                } catch (e) {
                                                        // ignore
                                                }
                                                // Also set document language for accessibility
                                                try { document.documentElement.lang = 'en'; } catch (e) {}
                                                clearInterval(interval);
                                                return;
                                        }
                                } catch (e) {
                                        // ignore
                                }

                                if (attempts >= maxAttempts) {
                                        clearInterval(interval);
                                }
                        }, 100);
                };

                if (!window.google || !window.google.translate) {
                    // Set global callback for widget init
                    window.googleTranslateElementInit = () => {
                            initGoogleTranslate();
                            // Small delay to let the widget render then enforce
                            setTimeout(enforceEnglish, 250);
                    };

                    if (!document.querySelector('#google-translate-script')) {
                        const script = document.createElement('script');
                        script.id = 'google-translate-script';
                        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
                        script.async = true;
                        // When the script has loaded, try enforcement again after a short delay
                        script.onload = () => setTimeout(enforceEnglish, 300);
                        document.body.appendChild(script);
                    } else {
                        // Script tag exists but widget may not be ready; attempt enforcement
                        setTimeout(enforceEnglish, 250);
                    }
                } else {
                    initGoogleTranslate();
                    setTimeout(enforceEnglish, 250);
                }
      }, []);

            useEffect(() => {
                // Apply translation when size page opens 
                async function applyTranslationToSizePage(){
                    // small delay to allow DOM update
                    await new Promise(r => setTimeout(r, 120));

                    const readCookieLang = () => {
                        try{
                            const cookie = document.cookie.split(';').map(c=>c.trim()).find(c => c.startsWith('googtrans='));
                            if (!cookie) return null;
                            // cookie value looks like "/en/es"
                            const val = cookie.split('=')[1] || '';
                            const parts = val.split('/');
                            // parts[2] is the target language code
                            return parts[2] || null;
                        }catch(e){ return null; }
                    };

                    const tryApplySelect = (lang) => {
                        const sel = document.querySelector('.goog-te-combo');
                        if (!sel) return false;
                        try{
                            if (lang) sel.value = lang;
                            // Dispatch both input and change for broader compatibility
                            sel.dispatchEvent(new Event('change'));
                            sel.dispatchEvent(new Event('input'));
                            return true;
                        }catch(e){ return false; }
                    };

                    const target = readCookieLang();

                    // If select exists already, apply directly
                    if (tryApplySelect(target)) return;

                    // If not, re-initialize the widget (reset loaded flag) then try again
                    translateLoadedRef.current = false;
                    initGoogleTranslate();

                    // Wait a bit for the widget to render
                    await new Promise(r => setTimeout(r, 350));
                    tryApplySelect(target);
                }

                applyTranslationToSizePage();
            }, [sizePageOpen]);

    function checkout(){
        // Build payload and POST to /api/orders with detailed error handling
        (async () => {
            if (orderItems.length === 0) { alert('Cart is empty'); return; }

            setCheckoutLoading(true);
            setCheckoutError(null);
            // hide any previous success indicator while we process
            setShowSuccess(false);
            setSuccessMessage(null);
            setLastOrderId(null);

            // Combos: items that have sides or entrees
            const combos = orderItems
                .filter(it => (it.sides && it.sides.length > 0) || (it.entrees && it.entrees.length > 0))
                .map(it => ({ 
                    size: it.name, 
                    items: it.entrees && it.entrees.length > 0 ? it.entrees : [],
                    sides: it.sides && it.sides.length > 0 ? it.sides : []
                }));

            // Appetizers and drinks: everything else — classify by name containing 'Drink' or lookup in availableDrinkSizes
            const appetizers = [];
            const drinks = [];
            orderItems
                .filter(it => !( (it.sides && it.sides.length>0) || (it.entrees && it.entrees.length>0) ))
                .forEach(it => {
                    const name = it.name || '';
                    if (/\bDrink\b/i.test(name) || (availableDrinkSizes && availableDrinkSizes.some(d => name === d.dbName))) {
                        drinks.push(name);
                    } else {
                        appetizers.push(name);
                    }
                });

            const payload = { combos, appetizers, drinks, totalPrice: Number(total || 0) };

            try {
                const resp = await fetch(`${API_URL}/api/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!resp.ok) {
                    // Try to extract more info from the server response
                    let text = null;
                    try { text = await resp.text(); } catch (tErr) { text = null; }
                    let parsed = null;
                    try { parsed = text ? JSON.parse(text) : null; } catch (jErr) { parsed = null; }

                    const serverMessage = (parsed && (parsed.error || parsed.message)) || text || `${resp.status} ${resp.statusText}`;

                    // Log detailed context for debugging
                    console.error('Order submission failed', {
                        payload,
                        status: resp.status,
                        statusText: resp.statusText,
                        serverResponse: parsed || text
                    });

                    setCheckoutError(`Checkout failed: ${serverMessage}`);
                    setCheckoutLoading(false);
                    return;
                }

                const data = await resp.json().catch(() => null);
                const orderId = data && (data.orderId || data.id) ? (data.orderId || data.id) : null;

                console.info('Order submitted successfully', { payload, orderId, response: data });
                setLastOrderId(orderId);
                // show a brief accessible success toast and auto-hide it
                const msg = orderId ? `Order placed — ID ${orderId}` : 'Order placed successfully';
                setSuccessMessage(msg);
                setShowSuccess(true);
                if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
                successTimeoutRef.current = setTimeout(() => {
                    setShowSuccess(false);
                    successTimeoutRef.current = null;
                }, 5000);

                setOrderItems([]);
                setCartOpen(false);
                setCheckoutLoading(false);
            } catch (e) {
                // Network or unexpected error
                console.error('Network or unexpected error during order submission', { error: e, payload });
                setCheckoutError('Network or server error occurred while submitting your order. See console for details.');
                setCheckoutLoading(false);
            }
        })();
    }

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <div className="customer-page">
            {/* Header Section */}
            <header className="site-header" role="banner">
                <div className="header-left">
                    <div id="google_translate_element"></div>
                    {weather && (
                        <div className="weather-display">
                            <img 
                            src={`https://openweathermap.org/img/wn/${weather.icon}.png`} 
                            alt={weather.description}
                            />
                            <span className="weather-temp">{weather.temp}°F</span>
                            <span className="weather-desc">{weather.description}</span>
                        </div>
                    )}
                </div>

                <div className="header-center">
                    <h1 className="customer-title">Customer Kiosk</h1>
                </div>

                {/* Desktop Navigation */}
                <div className="header-actions desktop-nav">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/')}
                        aria-label="Return to home"
                    >
                        Home
                    </button>
                    <button
                        type="button"
                        className="theme-toggle"
                        onClick={toggleDarkMode}
                        aria-pressed={darkMode}
                        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={resetTranslation}
                        aria-label="Reset translation to English"
                    >
                        Reset Translation
                    </button>
                </div>
                
                {/* Hamburger Icon - Only visible on mobile */}
                <button className="hamburger-icon" onClick={toggleMobileMenu} aria-label="Toggle menu">
                    <span className={mobileMenuOpen ? 'hamburger-line open' : 'hamburger-line'}></span>
                    <span className={mobileMenuOpen ? 'hamburger-line open' : 'hamburger-line'}></span>
                    <span className={mobileMenuOpen ? 'hamburger-line open' : 'hamburger-line'}></span>
                </button>

                {/* Mobile Navigation Dropdown */}
                <div className={`mobile-nav-dropdown ${mobileMenuOpen ? 'open' : ''}`}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => { navigate('/'); closeMobileMenu(); }}
                        aria-label="Return to home"
                    >
                        Home
                    </button>
                    <button
                        type="button"
                        className="theme-toggle"
                        onClick={() => { toggleDarkMode(); closeMobileMenu(); }}
                        aria-pressed={darkMode}
                        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => { resetTranslation(); closeMobileMenu(); }}
                        aria-label="Reset translation to English"
                    >
                        Reset Translation
                    </button>
                </div>
            </header>

            {/* Overlay to close menu when clicking outside */}
            {mobileMenuOpen && <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>}

            {/* SoundCloud Player */}

            <SoundCloudPlayer playlistUrl = 'https://w.soundcloud.com/player/api.js' />
              
            {/* Success Toast */}
            {showSuccess && successMessage && (
                <div
                    className="success-toast"
                    role="status"
                    aria-live="polite"
                    style={{
                        position: 'fixed',
                        top: 92,
                        right: 16,
                        background: '#28a745',
                        color: '#fff',
                        padding: '10px 14px',
                        borderRadius: 6,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        zIndex: 1000
                    }}
                >
                    {successMessage}
                </div>
            )}
            {/* Main Content Area */}
            {sizePageOpen ? (
                <div className="size-page-wrapper">
                    <SizeSelectionPage
                        sizeName={sizePageSize}
                        price={sizesInfo[sizePageSize] && sizesInfo[sizePageSize].price}
                        requiredSides={sizesInfo[sizePageSize] && sizesInfo[sizePageSize].numberofsides}
                        requiredEntrees={sizesInfo[sizePageSize] && sizesInfo[sizePageSize].numberofentrees}
                        availableSides={availableSides}
                        availableEntrees={availableEntrees}
                        selectedSides={selectedSides}
                        selectedEntrees={selectedEntrees}
                        setSelectedSides={setSelectedSides}
                        onStepChange={setSizePageStep}
                        setSelectedEntrees={setSelectedEntrees}
                        toggleSelect={toggleSelect}
                        onConfirm={confirmSizePage}
                        onCancel={cancelSizePage}
                    />
                </div>
            ) : appetizerPageOpen ? (
                <div className="size-page-wrapper">
                    <div className="menu-grid" role="menu" aria-label="Appetizers">
                        {availableAppetizers.length === 0 ? (
                            <div className="loading">Loading appetizers…</div>
                        ) : (
                            availableAppetizers.map(a => {
                                const selected = appetizerPageSelected === a.name;
                                return (
                                    <button
                                        key={a.name}
                                        className={`menu-item ${selected ? 'selected' : ''}`}
                                        type="button"
                                        onClick={() => setAppetizerPageSelected(a.name)}
                                        aria-pressed={selected}
                                        aria-label={`Select ${a.name}`}
                                    >
                                        <div>{a.name}</div>
                                        {
                                            a && typeof a.id !== 'undefined' ? (
                                                <img
                                                    src={`/api/appetizer-drink-image/${a.id}`}
                                                    alt={a.name}
                                                    onError={(e) => { try { e.currentTarget.onerror = null; e.currentTarget.src = '/images/no-image.png'; } catch (err) {} }}
                                                />
                                            ) : (
                                                <img src="/images/no-image.png" alt="No image" />
                                            )
                                        }
                                        <span className="price_display">{a.price !== undefined ? `Price: ${formatPrice(a.price)}` : `Price: ${formatPrice(prices['Appetizer'])}+`}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <div style={{width: '100%', display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12}}>
                        <button className="btn" onClick={confirmAppetizerPage}>Add to order</button>
                        <button className="btn btn-secondary" onClick={cancelAppetizerPage}>Cancel</button>
                    </div>
                </div>
            ) : (
                <div className="menu-grid" role="menu" aria-label="Menu options">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            className="menu-item"
                            type="button"
                            onClick={() => addToOrder(opt)}
                            aria-label={`${opt} - add to order`}
                        >
                            <div>{opt}</div>
                            <img src={`/images/${opt.toLowerCase().replace(' ', '-')}.png`} alt={opt} />
                            <span className="price_display">{`Price: ${formatPrice(prices[opt])}+`}</span>
                            {['Bowl','Plate','Bigger Plate'].includes(opt) ? (
                                sizesInfo[opt] ? (
                                    <span>
                                        {`${sizesInfo[opt].numberofsides} Side${sizesInfo[opt].numberofsides === 1 ? '' : 's'} and ${sizesInfo[opt].numberofentrees} Entree${sizesInfo[opt].numberofentrees === 1 ? '' : 's'}`}
                                    </span>
                                ) : (
                                    <span>Loading details...</span>
                                )
                            ) : null}
                        </button>
                    ))}
                </div>
            )}

            

            {/* Modal Overlay */}

            {modalOpen && (
                <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={modalMode ? `${modalMode} selection` : 'selection'}>
                    <div className="modal-content">
                        {modalMode === 'size' && modalSize && (
                            <>
                                <h3>{modalSize} — choose your items</h3>
                                <div className="modal-price">Price: {formatPrice(sizesInfo[modalSize] && sizesInfo[modalSize].price)}</div>
                                <div className="modal-instructions">Select {sizesInfo[modalSize] ? sizesInfo[modalSize].numberofsides : 'N'} side(s) and {sizesInfo[modalSize] ? sizesInfo[modalSize].numberofentrees : 'N'} entree(s)</div>

                                <div className="modal-columns">
                                    <div className="modal-column">
                                        <h4>Sides</h4>
                                        <div className="modal-list">
                                            {availableSides.length === 0 ? <div className="loading">Loading sides…</div> : availableSides.map(s => {
                                                const name = s.name;
                                                const img = s.imgUrl;
                                                const maxSides = sizesInfo[modalSize] ? Number(sizesInfo[modalSize].numberofsides) || 0 : 0;
                                                const disabled = !selectedSides.includes(name) && selectedSides.length >= maxSides;
                                                return (
                                                    <label key={name} className={`modal-item ${disabled ? 'disabled' : ''}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSides.includes(name)}
                                                            disabled={disabled}
                                                            onChange={() => toggleSelect(selectedSides, setSelectedSides, name)}
                                                        />
                                                        {img ? (
                                                            <img src={img} alt={name} className="modal-item-image" onError={(e)=>{e.currentTarget.style.display='none';}} />
                                                        ) : (
                                                            <div className="modal-no-image">No image</div>
                                                        )}
                                                        <span>{name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="modal-column">
                                        <h4>Entrees</h4>
                                        <div className="modal-list">
                                            {availableEntrees.length === 0 ? <div className="loading">Loading entrees…</div> : availableEntrees.map(e => {
                                                const name = e.name;
                                                const img = e.imgUrl;
                                                const maxEntrees = sizesInfo[modalSize] ? Number(sizesInfo[modalSize].numberofentrees) || 0 : 0;
                                                const disabled = !selectedEntrees.includes(name) && selectedEntrees.length >= maxEntrees;
                                                return (
                                                    <label key={name} className={`modal-item ${disabled ? 'disabled' : ''}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEntrees.includes(name)}
                                                            disabled={disabled}
                                                            onChange={() => toggleSelect(selectedEntrees, setSelectedEntrees, name)}
                                                        />
                                                        {img ? (
                                                            <img src={img} alt={name} className="modal-item-image" onError={(e)=>{e.currentTarget.style.display='none';}} />
                                                        ) : (
                                                            <div className="modal-no-image">No image</div>
                                                        )}
                                                        <span>{name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button className="btn" onClick={confirmModal}>Add to order</button>
                                    <button className="btn btn-secondary" onClick={cancelModal}>Cancel</button>
                                </div>
                            </>
                        )}

                        {modalMode === 'appetizer' && (
                            <>
                                <h3>Choose an appetizer</h3>
                                <div className="modal-list" style={{maxHeight: 300}}>
                                    {availableAppetizers.length === 0 ? (
                                        <div className="loading">Loading appetizers…</div>
                                    ) : (
                                        availableAppetizers.map(a => (
                                            <label key={a.name} className="modal-item">
                                                <input type="radio" name="appetizer" checked={selectedAppetizer === a.name} onChange={() => setSelectedAppetizer(a.name)} />
                                                {
                                                        a && typeof a.id !== 'undefined' ? (
                                                            <img
                                                                src={`/api/appetizer-drink-image/${a.id}`}
                                                                alt={a.name}
                                                                className="modal-item-image"
                                                                onError={(e)=>{ try { e.currentTarget.onerror = null; e.currentTarget.style.display='none'; e.currentTarget.src = '/images/no-image.png'; } catch (err){} }}
                                                            />
                                                        ) : (
                                                            <div className="modal-no-image">No image</div>
                                                        )
                                                }
                                                <span>{a.name}{a.price !== undefined ? ` — ${formatPrice(a.price)}` : ''}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <div className="modal-actions">
                                    <button className="btn" onClick={confirmModal}>Add to order</button>
                                    <button className="btn btn-secondary" onClick={cancelModal}>Cancel</button>
                                </div>
                            </>
                        )}

                        {modalMode === 'drink' && (
                            <>
                                <h3>Choose a drink size</h3>
                                <div className="modal-list" style={{maxHeight:300}}>
                                    {availableDrinkSizes.length === 0 ? (
                                        <div className="loading">Loading sizes…</div>
                                    ) : (
                                        availableDrinkSizes.map(d => (
                                            <label key={d.size} className="modal-item">
                                                <input type="radio" name="drink-size" checked={selectedDrinkSize === d.size} onChange={() => setSelectedDrinkSize(d.size)} />
                                                <span>{d.size}{d.price !== undefined ? ` — ${formatPrice(d.price)}` : ''}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <div className="modal-actions">
                                    <button className="btn" onClick={confirmModal}>Add to order</button>
                                    <button className="btn btn-secondary" onClick={cancelModal}>Cancel</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}

            <div className="customer-footer" role="contentinfo">
                <div className="footer-left">
                    <strong>Order total:</strong>
                    <span className="order-total"> {formatPrice(total)}</span>
                </div>
                <div className="footer-right">
                    <button className="clear-order" type="button" onClick={clearOrder}>Clear</button>
                    <button className="view-cart" type="button" onClick={toggleCart} aria-expanded={cartOpen}>View Cart</button>
                </div>
            </div>

            {/* Cart Panel */}

            {cartOpen && (
                <>
                    <div className="cart-backdrop" onClick={closeCart} aria-hidden="true"></div>
                    <div className="cart-panel" role="dialog" aria-label="Cart">
                    <div className="cart-header">
                        <h4>Your Cart</h4>
                        <button className="close-cart" onClick={toggleCart} aria-label="Close cart">×</button>
                    </div>
                    <div className="cart-list">
                        {orderItems.length === 0 ? (
                            <div className="cart-empty">Your cart is empty.</div>
                        ) : (
                            orderItems.map((it, idx) => (
                                <div className="cart-item" key={`${it.name}-${idx}`}>
                                    <div className="cart-item-left">
                                        <div className="cart-item-name">{it.name}</div>
                                        {it.sides && it.sides.length > 0 && (
                                            <div className="cart-item-sub">Sides: {it.sides.join(', ')}</div>
                                        )}
                                        {it.entrees && it.entrees.length > 0 && (
                                            <div className="cart-item-sub">Entrees: {it.entrees.join(', ')}</div>
                                        )}
                                    </div>
                                    <div className="cart-item-right">
                                        <div className="cart-item-price">{formatPrice(it.price)}</div>
                                        <button className="remove-item" onClick={() => removeItem(idx)} aria-label={`Remove ${it.name}`}>Remove</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {checkoutError && (
                        <div className="checkout-error" role="status" aria-live="polite">{checkoutError}</div>
                    )}
                    <div className="cart-footer">
                        <div className="cart-total">Total: {formatPrice(total)}</div>
                        <div className="cart-actions">
                            <button className="btn" onClick={checkout} disabled={checkoutLoading}>{checkoutLoading ? 'Processing…' : 'Checkout'}</button>
                            <button className="btn btn-secondary" onClick={clearOrder}>Clear</button>
                            <button className="btn btn-secondary" onClick={closeCart} aria-label="Close cart">Close</button>
                        </div>
                    </div>
                    {lastOrderId && (
                        <div className="checkout-success" role="status" aria-live="polite">Order placed — ID {lastOrderId}</div>
                    )}
                    </div>
                </>
            )}
        </div>
    );
}