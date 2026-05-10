// ==UserScript==
// @name         Auto Answer Multi-Select Fix
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  For multi-select questions, fixes MouseEvent error
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      api.deepseek.com
// ==/UserScript==

(function () {
    'use strict';

    const API_KEY = 'YOUR_DEEPSEEK_API_KEY';

    document.addEventListener('keydown', function (e) {
        if (e.altKey && e.key === 'd') {
            e.preventDefault();
            startAutoAnswer();
        }
    });

    async function startAutoAnswer() {
        console.log('🚀 Start');
        await forceLoadAllQuestions();
        await new Promise(r => setTimeout(r, 1000));
        const questions = extractQuestions();
        if (questions.length === 0) {
            alert('No questions');
            return;
        }
        try {
            const answerText = await fetchDeepSeekAnswer(questions);
            console.log('AI:', answerText);
            fillAnswers(answerText, questions);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed: ' + error.message);
        }
    }

    async function forceLoadAllQuestions() {
        return new Promise((resolve) => {
            const container = document.querySelector('.happy-scroll-content') || window;
            let lastScrollTop = container.scrollTop || 0;
            let ticking = false;

            function updateScroll() {
                if (container === window) {
                    window.scrollBy(0, 1000);
                } else {
                    container.scrollTop += 500;
                }
                ticking = false;
            }

            function requestTick() {
                if (!ticking) {
                    requestAnimationFrame(updateScroll);
                    ticking = true;
                }
                setTimeout(resolve, 1000);
            }
            requestTick();
        });
    }

    function extractQuestions() {
        const subjects = document.querySelectorAll('.subject.multiple');
        const result = [];

        subjects.forEach((subject, index) => {
            const descElement = subject.querySelector('.subject__content__desc');
            const optionLabels = subject.querySelectorAll('.choice-options div:last-child');

            if (!descElement || optionLabels.length === 0) return;

            const questionText = descElement.innerText.trim().replace(/\s+/g, ' ');
            const options = Array.from(optionLabels).map(el => el.innerText.trim().replace(/\s+/g, ' '));

            result.push({
                element: subject,
                question: questionText,
                options: options
            });
        });

        return result;
    }

    function fetchDeepSeekAnswer(questions) {
        return new Promise((resolve, reject) => {
            let promptText = "Answer the multiple-choice questions. Return only the letters (e.g., AB, CD, A). Do not include explanations.\n\n";
            questions   问题.forEach((q   问, i   我) => {
                promptText += `Q${i+1}: ${q.question}\n`;
                q.options.forEach((opt, idx) => {q   问.options。forEach   选项。forEach((opt   选择, idx) => {
                    promptText += `${String.fromCharCode(65+idx)}. ${opt}\n`;promptText = ' ${String.fromCharCode(65 idx)}。${选择}\ n ';
                });
                promptText += "\n";   promptText  = "\n";
            });

            GM_xmlhttpRequest({
                method: "POST",   method   方法: "POST"   "POST"   "POST"   "POST"   "POST"   "POST"   "POST",
                url: "https://api.deepseek.com/v1/chat/completions",url:“https://api.deepseek.com/v1/chat/completions"
                headers: {   标题:{
                    "Content-Type": "application/json","Content-Type"   "Content-Type"   "Content-Type"   "Content-Type"   "Content-Type"   "Content-Type"   "Content-Type": "application/json"   "application/json"   "application/json"   "application/json"   "application/json"   "application/json"   "application/json",
                    "Authorization": `Bearer ${API_KEY}`"Authorization"   "Authorization"   "Authorization"   "Authorization"   "Authorization"   "Authorization": ‘承载者${API_KEY} ’
                },
                data   数据: JSON.stringify({   数据:JSON.stringify ({
                    model: "deepseek-chat",   模特:" deepseek-chat"   “deepseek-chat   闲谈，聊天"
                    messages: [{role: "user", content: promptText}],messages   消息: [{role   角色: "user"   "user", content   内容: promptText}]，
                    temperature: 0.1   温度:0.1
                }),
                onload: function (res) {   Onload：函数（res） {
                    try {   尝试{
                        const data = JSON.parse(res.responseText);const   常量   数据 data      数据数据 = JSON.parse   解析(res.responseText   响应结果字符串)；
                        const rawAnswer = data.choices[0].message.content;const   常量 rawAnswer = data   数据.choices   选择[0].message   消息.content；   内容;
                        const cleanedAnswer = rawAnswer.split('\n').map(line => line.trim()).join('');
                        resolve(cleanedAnswer);   解决(cleanedAnswer);
                    } catch (e) {
                        reject(new Error('Parse error'));
                    }
                },
                onerror: function (err) {   Onerror: function   函数 (err   犯错) {
                    reject(new Error('Network error'));
                }
            });
        });
    }

    function fillAnswers(answerString, questions) {函数fillAnswers(answerString, questions   问题) {
        const letters = answerString.split('').filter(char => /[A-D]/.test(char));const   常量   信 letters      信信 = answerString.split   分裂(").filter(char => /[A-D]/.test(char))；).filter(char => /[A-D]/.test(char))；
        console.log(`Answers: ${letters.join('')}`);

        questions.forEach((q, index) => {的问题。forEach((q   问, index   指数) => {
            const options = q.element.querySelectorAll('.el-checkbox.choice-options');
            const answerChar = letters[index];

            options.forEach(option => {
                const input = option.querySelector('.el-checkbox__original');
                if (input && input.value === answerChar) {
                    input.checked = true;
                    option.classList.add('is-checked');
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                    console.log(`Selected ${answerChar}`);
                }
            });
        });

        alert('Done!');
    }

})();
