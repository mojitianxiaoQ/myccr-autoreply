// ==UserScript==
// @name        No！新境界
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  自己购买api，使用alt+d触发
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      api.deepseek.com
// ==/UserScript==

(function () {
    'use strict';

    //替换为你的 DeepSeek API Key
    const API_KEY = 'sk-e8ecacb3aab24e66a1d608550e287579';

    document.addEventListener('keydown', function (e) {
        if (e.altKey && e.key === 'd') {
            e.preventDefault();
            startAutoAnswer();
        }
    });

    async function startAutoAnswer() {
        console.log('🚀 启动脚本... 尝试单选模式');
        await forceLoadAllQuestions();

        //单选模式
        let questions = extractSingleQuestions();

        if (questions.length === 0) {
            console.log('🔍 单选模式未找到题目，尝试多选模式');
            questions = extractMultipleQuestions();
        }

        if (questions.length === 0) {
            alert('未找到任何题目 (单选或多选)');
            return;
        }

        console.log(`🔍 成功提取 ${questions.length} 道题目`);

        try {
            const answerText = await fetchDeepSeekAnswer(questions);
            console.log('✅ AI 返回:', answerText);

            // 判断是单选还是多选进行填涂
            if (questions[0].type === 'multiple') {
                fillMultipleAnswers(answerText, questions);
            } else {
                fillSingleAnswers(answerText, questions);
            }
        } catch (error) {
            console.error('❌ 失败:', error);
            alert('请求失败: ' + error.message);
        }
    }

    // 强制滚动加载
    async function forceLoadAllQuestions() {
        return new Promise((resolve) => {
            const container = document.querySelector('.happy-scroll-content') ||
                             document.querySelector('.study-container__main__body') ||
                             window;
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

    // 提取单选题 (来自版本 3.0)
    function extractSingleQuestions() {
        const subjects = document.querySelectorAll('.subject[data-v-8aff41ba]');
        const result = [];
        subjects.forEach((subject, index) => {
            const descElement = subject.querySelector('.subject__content__desc.wangeditor-content');
            const optionLabels = subject.querySelectorAll('.el-radio__label .wangeditor-content div:last-child');
            if (!descElement || optionLabels.length === 0) return;

            const questionText = descElement.innerText.trim().replace(/\s+/g, ' ');
            const options = Array.from(optionLabels).map(el => el.innerText.trim().replace(/\s+/g, ' '));
            result.push({
                element: subject,
                question: questionText,
                options: options,
                type: 'single' // 标记类型
            });
        });
        return result;
    }

    // 提取多选题 (来自版本 1.0)
    function extractMultipleQuestions() {
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
                options: options,
                type: 'multiple' // 标记类型
            });
        });
        return result;
    }

    // 发送给 DeepSeek (整合逻辑)
    function fetchDeepSeekAnswer(questions) {
        return new Promise((resolve, reject) => {
            let promptText = "";

            // 根据题目类型调整提示词
            if (questions[0].type === 'multiple') {
                promptText = "Answer the multiple-choice questions. Return only the letters (e.g., AB, CD, A). Do not include explanations.\n\n";
            } else {
                prompt  = "请解答以下单选题，只返回大写字母组成的答案序列（如：ABCD），不要包含任何标点、空格或解释。\n\n";
            }

            questions.forEach((q, i) => {
                promptText += `Q${i+1}: ${q.question}\n`;
                q.options.forEach((opt, idx) => {
                    promptText += `${String.fromCharCode(65+idx)}. ${opt}\n`;
                });
                promptText += "\n";
            });

            GM_xmlhttpRequest({
                method: "POST",
                url: "https://api.deepseek.com/v1/chat/completions",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`
                },
                data: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{role: "user", content: promptText}],
                    temperature: 0.1
                }),
                onload: function (res) {
                    try {
                        const data = JSON.parse(res.responseText);
                        const rawAnswer = data.choices[0].message.content;
                        const cleanedAnswer = rawAnswer.split('\n').map(line => line.trim()).join('');
                        resolve(cleanedAnswer);
                    } catch (e) {
                        reject(new Error('Parse error'));
                    }
                },
                onerror: function (err) {
                    reject(new Error('Network error'));
                }
            });
        });
    }

    // 填涂单选答案 
    function fillSingleAnswers(answerString, questions) {
        const letters = answerString.split('').filter(char => /[A-D]/.test(char));
        console.log(`📝 解析答案: ${letters.join('')} (共 ${letters.length} 题)`);

        questions.forEach((q, index) => {
            if (index >= letters.length) return;

            const targetLetter = letters[index];
            const input = q.element.querySelector(`.el-radio__original[value="${targetLetter}"]`);

            if (input) {
                input.checked = true;
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);

                const radio = input.closest('.el-radio');
                if (radio) radio.classList.add('is-checked');

                console.log(`✅ 第 ${index+1} 题已选 ${targetLetter}`);
            }
        });
        alert('单选答题完成！');
    }

    // 填涂多选答案 (来自版本 1.0)
    function fillMultipleAnswers(answerString, questions) {
        const letters = answerString.split('').filter(char => /[A-D]/.test(char));
        console.log(`Answers: ${letters.join('')}`);

        questions.forEach((q, index) => {
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
        alert('多选答题完成！');
    }

})();
