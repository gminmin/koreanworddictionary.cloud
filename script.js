document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const apiSettingsMenuBtn = document.getElementById('api-settings-menu-btn');
    const supportMenuBtn = document.getElementById('support-menu-btn');
    const settingsModal = document.getElementById('settings-modal');
    const supportModal = document.getElementById('support-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const closeSupportBtn = document.getElementById('close-support');
    const saveSettingsBtn = document.getElementById('save-settings');
    const geminiKeyInput = document.getElementById('gemini-key');
    const dictKeyInput = document.getElementById('dict-key');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const resultsArea = document.getElementById('results-area');
    const loadingIndicator = document.getElementById('loading');

    // Constants
    const DICT_API_URL = 'https://stdict.korean.go.kr/api/search.do';

    // Load saved keys
    const loadKeys = () => {
        const geminiKey = localStorage.getItem('geminiKey');
        const dictKey = localStorage.getItem('dictKey');
        if (geminiKey) geminiKeyInput.value = geminiKey;
        if (dictKey) dictKeyInput.value = dictKey;
    };

    // Settings Menu Logic
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsMenu.classList.toggle('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
            settingsMenu.classList.add('hidden');
        }
    });

    // API Settings Menu Button
    apiSettingsMenuBtn.addEventListener('click', () => {
        settingsMenu.classList.add('hidden');
        loadKeys();
        settingsModal.classList.remove('hidden');
    });

    // Support Menu Button
    supportMenuBtn.addEventListener('click', () => {
        settingsMenu.classList.add('hidden');
        supportModal.classList.remove('hidden');
    });

    // Close Modals
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    closeSupportBtn.addEventListener('click', () => {
        supportModal.classList.add('hidden');
    });

    saveSettingsBtn.addEventListener('click', () => {
        const geminiKey = geminiKeyInput.value.trim();
        const dictKey = dictKeyInput.value.trim();

        if (!geminiKey || !dictKey) {
            alert('두 API 키를 모두 입력해주세요.');
            return;
        }

        localStorage.setItem('geminiKey', geminiKey);
        localStorage.setItem('dictKey', dictKey);
        settingsModal.classList.add('hidden');
        alert('설정이 저장되었습니다.');
    });

    // Search Logic
    searchBtn.addEventListener('click', async () => {
        const query = searchInput.value.trim();
        if (!query) {
            alert('검색 내용을 입력해주세요.');
            return;
        }

        const geminiKey = localStorage.getItem('geminiKey');
        const dictKey = localStorage.getItem('dictKey');

        if (!geminiKey || !dictKey) {
            alert('설정에서 API 키를 먼저 등록해주세요.');
            settingsModal.classList.remove('hidden');
            return;
        }

        // UI Reset
        resultsArea.innerHTML = '';
        loadingIndicator.classList.remove('hidden');
        const loadingText = loadingIndicator.querySelector('p');
        loadingText.textContent = 'gemini가 상황에 맞는 단어를 고민하고 있습니다...';
        searchBtn.disabled = true;

        try {
            // 1. Ask Gemini for word suggestions
            const suggestedWords = await getGeminiSuggestions(query, geminiKey);
            console.log('Suggested Words:', suggestedWords);

            if (suggestedWords.length === 0) {
                resultsArea.innerHTML = '<p style="text-align:center; color:#94a3b8;">적절한 단어를 찾지 못했습니다.</p>';
                return;
            }

            // 2. Fetch definitions for each word
            loadingText.textContent = '표준국어대사전에서 단어의 뜻을 찾아보고 있습니다...';

            let failedWordsCount = 0;

            for (const word of suggestedWords) {
                try {
                    const dictData = await fetchDictionaryData(word, dictKey);
                    if (dictData) {
                        renderWordCard(dictData);
                    } else {
                        failedWordsCount++;
                    }
                } catch (err) {
                    console.error(`Error fetching definition for ${word}:`, err);
                    failedWordsCount++;
                }
            }

            if (resultsArea.children.length === 0) {
                resultsArea.innerHTML = '<p style="text-align:center; color:#94a3b8;">사전에서 단어 정보를 찾을 수 없습니다. (API 키나 CORS 설정을 확인해주세요)</p>';
            } else {
                loadingText.textContent = '찾은 단어를 정리해서 보여주고 있습니다...';

                if (failedWordsCount > 0) {
                    const errorMsg = document.createElement('p');
                    errorMsg.style.cssText = 'text-align: center; color: #ef4444; margin-top: 20px; font-size: 0.9rem; width: 100%;';
                    errorMsg.textContent = '알려드리지 못한 단어가 있습니다. 다시 시도해 보는 것도 나쁘지 않을 거예요.';
                    resultsArea.appendChild(errorMsg);
                }
            }

        } catch (error) {
            console.error('Search Error:', error);
            alert('검색 중 오류가 발생했습니다: ' + error.message);
        } finally {
            loadingIndicator.classList.add('hidden');
            searchBtn.disabled = false;
            loadingText.textContent = 'gemini가 열심히 찾아보고 있어요...';
        }
    });

    // Gemini API Call
    async function getGeminiSuggestions(userQuery, apiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const prompt = `
            You are a Korean vocabulary expert.
            The user will describe a situation, feeling, or concept.
            Recommend 3-5 precise Korean words (nouns, verbs, adjectives, or idioms) that match the description.
            Return ONLY a JSON array of strings. Do not include markdown formatting like \`\`\`json.
            
            User Description: "${userQuery}"
        `;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Gemini API Error');
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    }

    // Standard Korean Dictionary API Call
    async function fetchDictionaryData(word, apiKey) {
        const targetUrl = `${DICT_API_URL}?key=${apiKey}&q=${encodeURIComponent(word)}&req_type=json&advanced=y&method=exact`;

        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
        ];

        for (const proxyUrl of proxies) {
            try {
                console.log(`Fetching dictionary data for: ${word} via ${proxyUrl}`);
                const response = await fetch(proxyUrl);

                if (!response.ok) {
                    console.warn(`Proxy failed: ${response.status}`);
                    continue;
                }

                const textData = await response.text();

                try {
                    const data = JSON.parse(textData);
                    if (data.channel && data.channel.item && data.channel.item.length > 0) {
                        return data.channel.item[0];
                    } else {
                        console.warn(`No definition found in JSON for ${word}`);
                        return null;
                    }
                } catch (parseError) {
                    console.error('JSON Parse Error (Response might be XML):', parseError);
                    continue;
                }

            } catch (e) {
                console.error(`Fetch Error for ${word}:`, e);
            }
        }
        return null;
    }

    // Render Card
    function renderWordCard(item) {
        const card = document.createElement('div');
        card.className = 'word-card';

        let senses = [];
        if (Array.isArray(item.sense)) {
            senses = item.sense;
        } else if (item.sense) {
            senses = [item.sense];
        }

        const definitions = senses.map((s, index) =>
            `<li><span class="def-num">${index + 1}.</span> ${s.definition}</li>`
        ).join('');

        card.innerHTML = `
            <div class="word-header">
                <div>
                    <span class="word-term">${item.word}</span>
                    <span class="word-hanja">${item.hanja || ''}</span>
                </div>
                <span class="word-pos">${item.pos}</span>
            </div>
            <ul class="definition-list">
                ${definitions}
            </ul>
            <div style="margin-top:15px; text-align:right;">
                <a href="${item.view_link}" target="_blank" style="color:#3b82f6; text-decoration:none; font-size:0.9rem;">사전에서 보기 <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
            </div>
        `;

        resultsArea.appendChild(card);
    }
});
