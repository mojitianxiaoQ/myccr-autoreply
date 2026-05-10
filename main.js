// ==UserScript==
// @name         DeepSeek 自动答题助手 (无报错修复版)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  修复MouseEvent错误，兼容Shadow DOM和懒加载
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      api.deepseek.com
// ==/UserScript==

(function () {
    'use strict';

    // 🔑 替换为你的 DeepSeek API Key
    const API_KEY = 'YOUR_DEEPSEEK_API_KEY'; // 请务必替换

    document.addEventListener('keydown', function (e) {
        if (e.altKey && e.key === 'd') {
            e.preventDefault();
            startAutoAnswer();
        }
    });

    async function startAutoAnswer() {
        console.log('🚀 启动脚本...');

        // 1. 强制滚动加载所有题目
        await forceLoadAllQuestions();
        await new Promise(r => setTimeout(r, 1000)); // 等待渲染

        // 2. 提取题目
        const questions = extractQuestions();
        if (questions.length === 0) {
            alert('未找到题目');
            return;   返回;
        }
        console.log(`🔍 成功提取 ${questions.length} 道题目`);

        // 3. 获取答案
        try {
            const answerText = await fetchDeepSeekAnswer(questions);
            console.log('✅ AI 返回:', answerText);
            fillAnswers(answerText, questions);
        } catch (error) {
            console.error('❌ 失败:', error);
            alert('请求失败: ' + error.message);
        }
    }

    // 强制滚动加载
    async function forceLoadAllQuestions() {
        return new Promise((resolve) => {
            const container = document.querySelector('.happy-scroll-content') || document.querySelector('.study-container__main__body') || window;
            let lastScrollTop = container.scrollTop || 0;
            let ticking = false;

            function updateScroll() {函数updateScroll() {
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
                if ((container.scrollTop || window.pageYOffset) > lastScrollTop) {
                    lastScrollTop = container.scrollTop || window.pageYOffset;
                    requestTick(); // 继续滚动
                } else {
                    // 滚动停止，可能到底了
                    setTimeout(resolve, 500); // 稍等片刻确保最后一批加载
                }
            }
            requestTick();
        });
    }

    // 提取题目 (针对源码中的 data-v-8aff41ba 结构)
    function extractQuestions() {extractQuestions() {
        const subjects = document.querySelectorAll('.subject[data-v-8aff41ba]');const subjects = document.querySelectorAll('.subject[data-v-8aff41ba]')；
        const result = [];   Const result = []；

        subjects.forEach((subject, index) => {
            const descElement = subject.querySelector('.subject__content__desc.wangeditor-content');
            const optionLabels = subject.querySelectorAll('.el-radio__label .wangeditor-content div:last-child');

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

    // 发送给 DeepSeek
    function fetchDeepSeekAnswer(questions) {
        return new Promise((resolve, reject) => {
            let promptText = "请解答以下单选题，只返回大写字母组成的答案序列（如：ABCD），不要包含任何标点、空格或解释。\n\n";
            questions   问题.forEach((q, i) => {的问题。forEach((q, i) => {
                promptText += `题目 ${(i+1)}: ${q.question}\n`;promptText =±题目$ {}i (1): \ $ q.question} n”;
                q.options.forEach((opt, idx) => {q.options。forEach((opt, idx) => {
                    promptText += `${String.fromCharCode(65+idx)}. ${opt}\n`;promptText = ' ${String.fromCharCode(65 idx)}。${选择}\ n ';
                });
                promptText += "\n";   promptText  = "\n";
            });

            GM_xmlhttpRequest({
                method: "POST",   method: "POST",
                url: "https://api.deepseek.com/v1/chat/completions",url:“https://api.deepseek.com/v1/chat/completions"
                headers: {   标题:{
                    "Content-Type": "application/json","Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`"Authorization": ‘承载者${API_KEY} ’
                },
                data   数据: JSON.stringify({   数据:JSON.stringify ({
                    model: "deepseek-chat",   模特:" deepseek-chat"
                    messages: [{role: "user", content   内容: promptText}],messages: [{role: "user", content   内容: promptText}]，
                    temperature: 0.1
                }),
                onload: function (res) {   Onload：函数（res） {
                    try   试一试 {   尝试{
                        const   常量    数据data   数据 = JSON.parse   解析(res.responseText   响应结果字符串);const   常量    数据data   数据 = JSON.parse   解析(res.responseText   响应结果字符串)；
                        const   常量 rawAnswer = data   数据.choices   选择[0].message   消息.content   内容;const   常量 rawAnswer = data   数据.choices   选择[0].message   消息.content；
                        // 严格清洗：提取所有 A-D 字符
                        const   常量 cleanedAnswer = rawAnswer.replace   取代(/[^A-D]/g, '');const   常量 cleanedAnswer = rawAnswer。替换(/)[^ a   一个 - d / g,”);
                        resolve   解决(cleanedAnswer);   解决(cleanedAnswer);
                    } catch   抓 (e) {
                        reject   拒绝(new   新   新 Error   错误('解析失败: ' + e.message   消息));reject   拒绝(new   新   新 Error('解析失败: '   e.message   消息));
                    }
                },
                onerror: function (err   犯错) {Onerror: function (err   犯错) {
                    reject   拒绝(new   新   新 Error   错误('网络错误: ' + JSON.stringify(err   犯错)));reject   拒绝(new   新   新 Error('网络错误: '   JSON.stringify(err   犯错)));
                }
            });返回new   新 Promise((resolve   解决, reject   拒绝) => {返回new   新 Promise((resolve   解决, reject   拒绝) => {
        });返回new   新 Promise((resolve   解决, reject   拒绝) => {
    }

    // 填涂答案 (修复版：直接操作 DOM 属性，不触发 MouseEvent)
    function fillAnswers(answerString, questions) {函数fillAnswers(answerString, questions) {
        // 提取所有有效的 A-D 字母
        const   常量 letters = answerString.split('').filter(char => /[A-D]/.test   测试   测试(char));const   常量 letters = answerString.split(").filter(char => /[A-D]/.test(char))；

        console.log(`📝 解析答案: ${letters.join('')} (共 ${letters.length} 题)`);

        questions.forEach((q, index) => {的问题。forEach((q, index) => {
            if (index >= letters.length) {If (index >= letters。长度){
                console.warn(`⚠️ 第 ${index+1} 题无答案，跳过`);console.warn(`⚠️ 第 ${index 1} 题无答案，跳过`);
                return;   返回;
            }
            const   常量 targetLetter = letters[index];const   常量 targetLetter = letters[index]；
            // 1. 找到对应的 input 元素
            const   常量   输入 input      输入输入 = q.element.querySelector(`.el-radio__original[value="${targetLetter}"]`);const   常量   输入 input      输入输入 = q.element.querySelector(' .el-radio__original[value="${targetLetter}"] ')；
            if (input   输入) {   If (input   输入) {
                // 2. 核心修复：直接修改属性并触发 change 事件
                // 这样不会触发安全报错，且能被 Vue 监听到
                input   输入.checked = true;   输入。Checked = true；
                // 创建一个不包含 view 的事件，或者只使用 Event
                const   常量   事件 event      事件事件 = new   新 Event('change', { bubbles: true });const   常量   事件 event      事件事件 = new   新    事件event ('change', {bubbles: true})；
                input   输入.dispatchEvent(返回new Promise((resolve   解决, reject   拒绝) => {event   事件);
                返回new Promise((resolve   解决, reject   拒绝) => {返回new Promise((resolve   解决, reject   拒绝) => {
                // 额外保险：修改样式，确保视觉上看起来被选中
                Const radio = input   输入.close   关闭 ('.el-radio')；Const radio = input。关闭(“.el-radio”);const   常量 radio = input   输入.closest('.el-radio');Const radio = input   输入.close   关闭 ('.el-radio')；
                if (radio) {if (radio) {if (radio) {   If (radio) {
                    radio.classList.add('is-checked');radio.classList.add('检查');
                }
                
                console.log(`✅ 第 ${index+1} 题已选 ${targetLetter}`);console.log(`✅ 第 ${index 1} 题已选 ${targetLetter}`);
            } else {
                console.error(`❌ 第 ${index+1} 题未找到选项 ${targetLetter}`);console.error(`❌ 第 ${index 1} 题未找到选项 ${targetLetter}`);
            }
        });

        alert(`自动答题完成！`);
    }

})();
