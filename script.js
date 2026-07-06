// ==========================================================================
// ⚙️ 全互动式华文教学系统阅读器大脑 - script.js (简答题版)
// ==========================================================================

let currentIdx = -1; 
let saved = JSON.parse(localStorage.getItem('saved_104')) || [];
let quizData = [];
let currentQuizIdx = 0;
let isLocked = false;
let isTeacherMode = false;

window.onload = function() {
    // 初始化网页标题
    document.getElementById('articleTitle').innerText = lessonTitle;
    document.title = lessonTitle;

    // 渲染课文、生词本和习题
    if (typeof lessonData !== 'undefined') { 
        render(); 
        renderNB(); 
        renderQuestions();  // ← 调用简答题渲染器
    }
    
    // 初始化气泡弹窗事件
    document.body.appendChild(document.getElementById('buddyPopover'));
    document.addEventListener('click', () => { 
        document.getElementById('buddyPopover').style.display = 'none'; 
        document.querySelectorAll('ruby').forEach(r => r.classList.remove('is-active'));
    });
};

// 📖 正文渲染器
function render() {
    const cnt = document.getElementById('content'); 
    cnt.innerHTML = "";
    let pNum = 1; 
    let p = document.createElement("p"); 
    
    // 渲染课文顶部的全局总览赏析板
    const topAnalysis = document.getElementById('teacherArticleAnalysis');
    const topAnalysisContent = document.getElementById('teacherArticleAnalysisContent');
    if (topAnalysis && topAnalysisContent) {
        if (isTeacherMode && typeof lessonTeacherAnalysis !== 'undefined' && lessonTeacherAnalysis.overview) {
            topAnalysis.style.display = "block";
            topAnalysisContent.innerHTML = `<strong>💡 课文总览与赏析要点：</strong><br>${lessonTeacherAnalysis.overview}`;
        } else {
            topAnalysis.style.display = "none";
        }
    }

    function finalizeParagraph(paragraphElement) {
        if (paragraphElement.childNodes.length === 0) return;
        const textContent = paragraphElement.innerText.trim();
        const isAuthorLineAtEnd = (textContent.startsWith("（") && textContent.includes("《"));
        
        if (isAuthorLineAtEnd) {
            paragraphElement.style.textIndent = "0";
            paragraphElement.style.textAlign = "right";  
            paragraphElement.style.color = "#7f8c8d";    
            paragraphElement.style.fontSize = "15px";     
            paragraphElement.style.marginTop = "30px";    
            cnt.appendChild(paragraphElement);
        } else {
            paragraphElement.style.position = "relative";
            paragraphElement.style.textIndent = "2em"; 
            paragraphElement.style.paddingLeft = "0"; 
            paragraphElement.style.marginBottom = "15px";
            
            let s = document.createElement("span");
            s.className = "p-index";
            s.innerText = "第" + pNum + "段";
            s.style.position = "absolute";
            s.style.left = "-55px"; 
            s.style.top = "4px"; 
            s.style.textIndent = "0"; 
            
            paragraphElement.insertBefore(s, paragraphElement.firstChild); 
            cnt.appendChild(paragraphElement);

            // 👁️ 赏析节点预渲染
            if (typeof lessonTeacherAnalysis !== 'undefined' && lessonTeacherAnalysis.paragraphs && lessonTeacherAnalysis.paragraphs[pNum]) {
                let pAnalysis = document.createElement("div");
                pAnalysis.id = `p-analysis-${pNum}`;
                pAnalysis.className = "teacher-p-analysis";
                pAnalysis.style.padding = "10px 15px"; 
                pAnalysis.style.margin = "5px 0 20px 0";
                pAnalysis.style.fontSize = "13.5px";
                pAnalysis.style.borderRadius = "4px";
                pAnalysis.style.textIndent = "0";
                pAnalysis.innerHTML = `<strong>🔍 第 ${pNum} 段文本赏析：</strong>${lessonTeacherAnalysis.paragraphs[pNum]}`;
                
                pAnalysis.style.display = isTeacherMode ? "block" : "none";
                cnt.appendChild(pAnalysis);
            }

            pNum++; 
        }
    }

    lessonData.forEach((d, i) => {
        if (d[0] === "\n") { finalizeParagraph(p); p = document.createElement("p"); }
        else if (d[1] === "") { let s = document.createElement("span"); s.innerText = d[0]; p.appendChild(s); }
        else {
            let r = document.createElement("ruby"); 
            r.setAttribute("data-word-index", i);
            r.onclick = (e) => { 
                e.stopPropagation(); 
                document.querySelectorAll('ruby').forEach(x=>x.classList.remove('is-active')); 
                r.classList.add('is-active'); 
                openPop(e.currentTarget, i);
            };
            r.innerHTML = `${d[0]}<rt>${d[1]}</rt>`; 
            p.appendChild(r);
        }
    });
    finalizeParagraph(p);
}

// 🧠 核心习题区：简答题与概述题渲染器
function renderQuestions() {
    if (typeof lessonQuestions === 'undefined' || lessonQuestions.length === 0) return;

    const cnt = document.getElementById('content');
    
    // 检查是否已经渲染过，避免重复
    if (document.getElementById('lessonQuestionsContainer')) return;

    const qCard = document.createElement("div");
    qCard.id = "lessonQuestionsContainer";
    qCard.style.marginTop = "40px";
    qCard.style.padding = "25px";
    qCard.style.borderTop = "2px dashed #bdc3c7";
    qCard.style.background = "var(--card-bg, #ffffff)";
    qCard.style.borderRadius = "12px";

    const qTitle = document.createElement("h2");
    qTitle.innerText = "📚 课后思考与 AI 智能练习";
    qTitle.style.fontSize = "20px";
    qTitle.style.color = "#2c3e50";
    qTitle.style.marginBottom = "20px";
    qTitle.style.borderBottom = "2px dashed #bdc3c7";
    qTitle.style.paddingBottom = "10px";
    qCard.appendChild(qTitle);

    lessonQuestions.forEach((q) => {
        const qBox = document.createElement("div");
        qBox.style.marginBottom = "30px";
        qBox.style.paddingBottom = "20px";
        qBox.style.borderBottom = "1px dashed #eee";

        const qText = document.createElement("div");
        qText.innerHTML = `<strong>${q.number}</strong> ${q.question.replace(/\n/g, '<br>')} <span style="color:#e74c3c; font-weight:bold;">[${q.score}分]</span>`;
        qText.style.fontSize = "16px";
        qText.style.marginBottom = "10px";
        qBox.appendChild(qText);

        // 如果题目配有 context 背景文本
        if (q.context) {
            const contextBox = document.createElement("div");
            contextBox.innerHTML = q.context.replace(/\n/g, '<br>');
            contextBox.style.background = "#f8f9fa";
            contextBox.style.borderLeft = "4px solid #9b59b6";
            contextBox.style.padding = "15px";
            contextBox.style.margin = "12px 0";
            contextBox.style.fontSize = "15px";
            contextBox.style.color = "#34495e";
            contextBox.style.lineHeight = "1.6";
            contextBox.style.borderRadius = "4px";
            qBox.appendChild(contextBox);
        }

        const textarea = document.createElement("textarea");
        textarea.placeholder = (q.type && q.type === "summary") ? "请在此处输入您的概述答案（注意不超过字数要求）..." : "请在此处输入您的答案...";
        textarea.style.width = "100%";
        textarea.style.height = (q.type && q.type === "summary") ? "110px" : "80px";
        textarea.style.padding = "10px";
        textarea.style.marginTop = "10px";
        textarea.style.boxSizing = "border-box";
        textarea.style.borderRadius = "6px";
        textarea.style.border = "1px solid #ccc";
        textarea.style.fontSize = "15px";
        textarea.style.fontFamily = "inherit";
        textarea.style.background = "var(--card-bg, #ffffff)";
        textarea.style.color = "var(--text-color, #2c3e50)";

        textarea.value = localStorage.getItem(`ans_${q.id}`) || "";
        qBox.appendChild(textarea);

        const controlRow = document.createElement("div");
        controlRow.style.display = "flex";
        controlRow.style.justifyContent = "space-between";
        controlRow.style.alignItems = "center";
        controlRow.style.marginTop = "8px";
        controlRow.style.flexWrap = "wrap";
        controlRow.style.gap = "10px";

        const counter = document.createElement("div");
        counter.style.fontSize = "13px";
        counter.style.color = "#7f8c8d";
        if (q.type && q.type === "summary") {
            counter.innerHTML = `当前字数：<span id="charCount_${q.id}">0</span> / ${q.maxWords || 60} 字`;
        }
        controlRow.appendChild(counter);

        const btnGroup = document.createElement("div");
        btnGroup.style.display = "flex";
        btnGroup.style.gap = "8px";
        btnGroup.style.flexWrap = "wrap";

        const aiBtn = document.createElement("button");
        aiBtn.innerText = "🤖 AI 批改结果";
        aiBtn.style.padding = "6px 12px";
        aiBtn.style.background = "#9b59b6";
        aiBtn.style.color = "white";
        aiBtn.style.border = "none";
        aiBtn.style.borderRadius = "4px";
        aiBtn.style.cursor = "pointer";
        aiBtn.style.fontSize = "13px";
        btnGroup.appendChild(aiBtn);

        const submitBtn = document.createElement("button");
        submitBtn.innerText = "查看满分答案 📋";
        submitBtn.style.padding = "6px 12px";
        submitBtn.style.background = "#2ecc71";
        submitBtn.style.color = "white";
        submitBtn.style.border = "none";
        submitBtn.style.borderRadius = "4px";
        submitBtn.style.cursor = "pointer";
        submitBtn.style.fontSize = "13px";
        btnGroup.appendChild(submitBtn);

        controlRow.appendChild(btnGroup);
        qBox.appendChild(controlRow);

        const ansBox = document.createElement("div");
        ansBox.style.display = "none";
        ansBox.style.marginTop = "15px";
        ansBox.style.padding = "12px";
        ansBox.style.background = "#fff9db";
        ansBox.style.borderLeft = "4px solid #f1c40f";
        ansBox.style.borderRadius = "4px";
        ansBox.style.fontSize = "14px";
        ansBox.innerHTML = `<strong>💡 满分答案：</strong><br><div style="margin-top:6px; color:#2c3e50; font-weight:500;">${q.modelAnswer}</div>`;
        qBox.appendChild(ansBox);

        const aiBox = document.createElement("div");
        aiBox.style.display = "none";
        aiBox.style.marginTop = "15px";
        aiBox.style.padding = "12px";
        aiBox.style.background = "#ebf5fb";
        aiBox.style.borderLeft = "4px solid #3498db";
        aiBox.style.borderRadius = "4px";
        aiBox.style.fontSize = "14px";
        qBox.appendChild(aiBox);

        // 查看满分答案按钮
        submitBtn.onclick = function() {
            if (ansBox.style.display === "none") {
                ansBox.style.display = "block";
                submitBtn.innerText = "收起满分答案 ❌";
            } else {
                ansBox.style.display = "none";
                submitBtn.innerText = "查看满分答案 📋";
            }
        };

        // AI 批改功能
        aiBtn.onclick = async function() {
            const studentAns = textarea.value.trim();
            if (!studentAns) { alert("请先输入您的作答哦！"); return; }

            let apiKey = localStorage.getItem("deepseek_api_key");
            if (!apiKey) {
                apiKey = prompt("🤖 请输入您的 DeepSeek API Key:");
                if (!apiKey) return;
                localStorage.setItem("deepseek_api_key", apiKey.trim());
            }

            aiBox.style.display = "block";
            aiBox.innerHTML = "<span style='color:#34495e;'>⏳ AI 老师正在阅卷中，请稍候...</span>";
            aiBtn.disabled = true;

            const promptText = `请严格根据标准批改学生的华文作答。
【题目】：${q.number} ${q.question} [满分 ${q.score} 分]
【满分答案】：${q.modelAnswer}
【学生作答】：“${studentAns}”

⚠️ 【输出格式模板（严禁自行添加任何多余的文字）】：
【最终得分】：X / ${q.score} 分
【答对】：[请列出写对的要点]
【错漏】：[请列出漏掉或写错的要点]

* 提示：语意对即可，允许近义词。若字数格式不符，在此处直接说明。`;

            try {
                const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + apiKey
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [
                            { role: "system", content: "你是一位精炼、古板、绝不吐露废字的阅卷考官。你只允许严格按照提供给你的三行格式模板输出，绝对禁止自行添加任何多余的汉字、前言或总结语。" },
                            { role: "user", content: promptText }
                        ],
                        stream: false
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error ? errData.error.message : "连接失败");
                }

                const data = await response.json();
                if (data && data.choices && data.choices[0].message.content) {
                    let aiReply = data.choices[0].message.content;
                    let formattedReply = aiReply
                        .replace(/【最终得分】：/g, '<strong>【最终得分】：</strong>')
                        .replace(/【答对】：/g, '<strong>【答对】：</strong>')
                        .replace(/【错漏】：/g, '<strong>【错漏】：</strong>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                    aiBox.innerHTML = `<strong>🤖 AI 老师批改结果：</strong><br><div style="margin-top:8px; white-space: pre-line; line-height:1.6; color:#2c3e50;">${formattedReply}</div>`;
                } else {
                    throw new Error("数据异常");
                }
            } catch (err) {
                aiBox.innerHTML = `<span style='color:#e74c3c;'>❌ 批改失败：${err.message}</span>`;
                console.error(err);
            } finally {
                aiBtn.disabled = false;
            }
        };

        // 字数统计功能
        function updateCharCount() {
            if (q.type && q.type === "summary") {
                const text = textarea.value;
                const matched = text.match(/[\u4e00-\u9fa5\w\d\u3000-\u303f\uff00-\uffef]/g);
                const count = matched ? matched.length : 0;
                const countEl = document.getElementById(`charCount_${q.id}`);
                if (countEl) {
                    countEl.innerText = count;
                    countEl.style.color = count > (q.maxWords || 60) ? "#e74c3c" : "#27ae60";
                }
            }
        }

        textarea.oninput = function() {
            localStorage.setItem(`ans_${q.id}`, textarea.value);
            updateCharCount();
        };
        setTimeout(updateCharCount, 100);

        qCard.appendChild(qBox);
    });

    cnt.appendChild(qCard);
}

// 👁️ 控制开关：切换文本赏析面板
function toggleTeacherMode() {
    isTeacherMode = !isTeacherMode;
    const btn = document.getElementById('teacherToggleBtn');
    
    if (isTeacherMode) {
        btn.innerText = "❌ 关闭文本赏析";
        btn.style.background = "#7d3c98";
    } else {
        btn.innerText = "👁️ 文本赏析";
        btn.style.background = "#9b59b6";
    }
    
    const topAnalysis = document.getElementById('teacherArticleAnalysis');
    const topAnalysisContent = document.getElementById('teacherArticleAnalysisContent');
    if (topAnalysis && topAnalysisContent) {
        if (isTeacherMode && typeof lessonTeacherAnalysis !== 'undefined' && lessonTeacherAnalysis.overview) {
            topAnalysis.style.display = "block";
            topAnalysisContent.innerHTML = `<strong>💡 课文总览与赏析要点：</strong><br>${lessonTeacherAnalysis.overview}`;
        } else {
            topAnalysis.style.display = "none";
        }
    }

    const pPanels = document.querySelectorAll('.teacher-p-analysis');
    pPanels.forEach(panel => {
        panel.style.display = isTeacherMode ? "block" : "none";
    });
}

// ==================== 🛠 字词字典弹窗核心逻辑 ============================
function openPop(el, i) {
    currentIdx = i; const d = lessonData[i];
    document.getElementById('popWord').innerText = d[0];
    document.getElementById('popPinyin').innerText = `[${d[1]}]`;
    document.getElementById('popEn').innerText = d[2]; 
    document.getElementById('popBm').innerText = d[3];
    
    const pop = document.getElementById('buddyPopover'); 
    const arrow = document.getElementById('popArrow');
    pop.style.display = 'block'; 
    
    const rect = el.getBoundingClientRect(); 
    const popRect = pop.getBoundingClientRect();
    
    let top = rect.top - popRect.height - 15; 
    let left = rect.left + (rect.width / 2) - (popRect.width / 2);
    
    if (left + popRect.width > window.innerWidth - 15) left = window.innerWidth - popRect.width - 15;
    if (left < 15) left = 15;
    
    arrow.style.left = `${(rect.left + rect.width / 2) - left}px`; 
    pop.style.top = `${top}px`; 
    pop.style.left = `${left}px`;
}

function saveToNotebook(e) { 
    e.stopPropagation(); 
    if (!saved.includes(currentIdx)) { 
        saved.push(currentIdx); 
        localStorage.setItem('saved_104', JSON.stringify(saved)); 
        renderNB(); 
    } 
    const btn = e.target; 
    btn.innerText = "✓ 已存"; 
    setTimeout(() => btn.innerText = "Copy 📋", 1000); 
}

function renderNB() { 
    const list = document.getElementById('notebookList'); 
    if (saved.length === 0) { 
        list.innerHTML = "<span style='color:#999; font-size:13px;'>点击词语 Copy 记录生词</span>"; 
    } else { 
        list.innerHTML = ""; 
        saved.forEach(idx => { 
            const item = lessonData[idx]; 
            if(!item) return; 
            
            const div = document.createElement("div"); 
            div.className = "notebook-item"; 
            div.style.display = "inline-flex";
            div.style.alignItems = "center";
            div.style.gap = "6px";
            div.style.cursor = "pointer";

            const textSpan = document.createElement("span");
            textSpan.innerText = item[0];
            textSpan.onclick = (e) => { 
                e.stopPropagation(); 
                const target = document.querySelector(`ruby[data-word-index="${idx}"]`); 
                if(target) { 
                    target.scrollIntoView({behavior: "smooth", block: "center"}); 
                    document.querySelectorAll('ruby').forEach(r => r.classList.remove('is-active')); 
                    setTimeout(() => { 
                        target.classList.add('is-active'); 
                        openPop(target, idx); 
                    }, 500); 
                } 
            }; 
            div.appendChild(textSpan);

            const deleteBtn = document.createElement("span");
            deleteBtn.innerText = "×";
            deleteBtn.style.color = "#e74c3c";
            deleteBtn.style.fontWeight = "bold";
            deleteBtn.style.padding = "0 2px";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.borderRadius = "50%";
            deleteBtn.style.transition = "all 0.2s";
            
            deleteBtn.onmouseenter = () => { deleteBtn.style.background = "#fce4e4"; };
            deleteBtn.onmouseleave = () => { deleteBtn.style.background = "transparent"; };
            
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); 
                removeSingleWordFromNotebook(idx);
            };
            div.appendChild(deleteBtn);

            list.appendChild(div); 
        }); 
    } 
}

function removeSingleWordFromNotebook(idx) {
    saved = saved.filter(savedIdx => savedIdx !== idx);
    localStorage.setItem('saved_104', JSON.stringify(saved)); 
    renderNB(); 
    if (saved.length === 0) {
        document.getElementById('gameContainer').style.display = 'none'; 
        document.getElementById('gameToggleBtn').innerText = "🎯 生词测试";
    }
}

function forceClearNotebook() { localStorage.removeItem('saved_104'); saved = []; renderNB(); document.getElementById('gameContainer').style.display = 'none'; document.getElementById('gameToggleBtn').innerText = "🎯 生词测试"; }

function toggleGameMode() { 
    const container = document.getElementById('gameContainer'); 
    const btn = document.getElementById('gameToggleBtn'); 
    if (container.style.display === 'block') { 
        container.style.display = 'none'; 
        btn.innerText = "🎯 生词测试"; 
    } else { 
        if (saved.length < 1) { 
            alert("生词本是空的哦！要先在正文里点生词进行 Copy 收集！"); 
            return; 
        } 
        container.style.display = 'block'; 
        btn.innerText = "📖 返回课文"; 
        startQuizGame(); 
        container.scrollIntoView({behavior: "smooth"}); 
    } 
}

function startQuizGame() { quizData = [...saved].sort(() => Math.random() - 0.5); currentQuizIdx = 0; loadQuestion(); }

function loadQuestion() { 
    isLocked = false; 
    const targetIdx = quizData[currentQuizIdx]; 
    const data = lessonData[targetIdx]; 
    document.getElementById('quizProgress').innerText = `第 ${currentQuizIdx + 1} / ${quizData.length} 题`; 
    document.getElementById('quizQuestion').innerText = data[0]; 
    document.getElementById('quizPinyin').innerText = `[${data[1]}]`; 
    
    const correctStr = (data[2].trim() + "；" + data[3].trim()); 
    let options = [correctStr]; 
    let others = lessonData.filter(d => d[1] !== "" && d[0] !== data[0]).map(d => (d[2].trim() + "；" + d[3].trim())); 
    others = [...new Set(others)].filter(s => s !== correctStr).sort(() => Math.random() - 0.5); 
    
    for(let i=0; i<3; i++) { if(others[i]) options.push(others[i]); } 
    options.sort(() => Math.random() - 0.5); 
    
    const optDiv = document.getElementById('quizOptions'); 
    optDiv.innerHTML = ""; 
    options.forEach(opt => { 
        const b = document.createElement('button'); 
        b.className = 'quiz-opt-btn'; 
        b.innerText = opt; 
        b.onclick = () => { 
            if(isLocked || b.classList.contains('wrong')) return; 
            if(opt.trim() === correctStr.trim()) { 
                isLocked = true; 
                b.classList.add('correct'); 
                setTimeout(() => { 
                    currentQuizIdx++; 
                    if(currentQuizIdx < quizData.length) loadQuestion(); 
                    else { alert("🎉 完成测试！你真棒！"); toggleGameMode(); } 
                }, 800); 
            } else { b.classList.add('wrong'); } 
        }; 
        optDiv.appendChild(b); 
    }); 
}

function toggleTheme() { document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme')==='dark'?'':'dark'); }
