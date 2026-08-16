const API_ACCOUNT = "https://dnc-svc.palat.io.vn/service/2/namhaclub";
let quizData = [];
let POINT_PER_QUESTION = 0.25;
const userId = getCookie("iduser");
let nameofexam = "Trống";
let idExam = "";

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : null;
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
}

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function checkAccount() {
    const token = localStorage.getItem("token");
    if (!token) return redirectToExam();

    try {
        const res = await fetch(API_ACCOUNT, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        return res.status === 200 ? await res.json() : redirectToExam();
    } catch {
        return redirectToExam();
    }
}

function redirectToExam() {
    setTimeout(() => window.open("/exam/", "_self"), 500);
}

async function loadData() {
    const params = new URL(window.location.href).searchParams;
    const utmSource = params.get("id-exam");
    const utmview = params.get("view-exam");

    if (!utmSource) {
        document.getElementById("title").innerText = "Không tìm thấy mã đề";
        return;
    }

    try {
        const response = await fetch(`https://dnc-svc.palat.io.vn/exam/${utmSource}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const { data: exam } = await response.json();
        if (!exam) throw new Error("Không có dữ liệu đề thi");

        nameofexam = exam.tende || "Trống";
        idExam = String(exam.idexam || utmSource);
        POINT_PER_QUESTION = Number(exam.point) || 0.25;
        quizData = Array.isArray(exam.data)
            ? exam.data.filter(q => q && typeof q === "object" && Array.isArray(q.ans))
            : [];

        document.getElementById("title").innerText = nameofexam;

        if (utmview) {
            await handleViewHistory(utmview);
            return;
        }

        await checkAccount();
        await checkHistory();
    } catch (err) {
        console.error("Lỗi tải đề:", err);
        document.getElementById("title").innerText = "Không thể tải đề thi";
        document.getElementById("quiz").innerHTML = `
            <div style="padding:20px;background:#ffebee;color:#c62828;border-radius:8px;">
                Không thể tải dữ liệu đề thi.
            </div>
        `;
    }
}

async function handleViewHistory(utmview) {
    console.log("Đang xem lại bài:", utmview);

    const token = localStorage.getItem("token");
    if (!token) {
        console.log("Chưa đăng nhập");
        await checkAccount();
    }

    try {
        const historyResponse = await fetch("https://dnc-svc.palat.io.vn/exam/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: userId })
        });

        if (!historyResponse.ok) throw new Error("Không lấy được lịch sử bài làm");

        const history = await historyResponse.json();
        const historyData = history.find(
            item => String(item.idexam).trim() === String(utmview).trim()
        );

        if (!historyData) {
            document.getElementById("quiz").innerHTML = `
                <div style="padding:20px;text-align:center;background:#fff3cd;border-radius:8px;">
                    Không tìm thấy bài làm với mã đề <b>${escapeHtml(utmview)}</b>
                </div>
            `;
            return;
        }

        viewHistoryExam(historyData);
    } catch (err) {
        console.error("Lỗi xem lại bài:", err);
        document.getElementById("quiz").innerHTML = `
            <div style="padding:20px;background:#ffebee;color:#c62828;border-radius:8px;">
                Không thể tải bài làm.
            </div>
        `;
    }
}

function viewHistoryExam(historyData) {
    const quizDiv = document.getElementById("quiz");
    if (!quizDiv) {
        console.error("Không tìm thấy #quiz");
        return;
    }

    quizDiv.innerHTML = "";

    if (!historyData || !Array.isArray(historyData.details)) {
        quizDiv.innerHTML = `
            <div style="padding:20px;text-align:center;background:#fff3cd;border-radius:8px;">
                Không có dữ liệu bài làm.
            </div>
        `;
        return;
    }

    document.getElementById("title").innerText = historyData.nameexam || "Xem lại bài làm";

    historyData.details.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "question";
        div.style.display = "block";
        div.id = `history-q-${index}`;

        const type = item.type || "text";
        const userAnswers = Array.isArray(item.answer) ? item.answer : [];
        const correctAnswers = Array.isArray(item.correct) ? item.correct : [];

        let html = `<p><strong>Câu ${index + 1}:</strong> ${escapeHtml(item.question || "")}</p>`;

        html += `
            <div style="margin-top:12px;padding:15px;border-radius:8px;background:${item.isCorrect ? "#e8f5e9" : "#ffebee"};border:1px solid ${item.isCorrect ? "#4caf50" : "#f44336"};">
                <b>Bạn chọn:</b>
                <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:15px;">
        `;

        if (userAnswers.length === 0) {
            html += `<i>Trống</i>`;
        } else {
            userAnswers.forEach(answer => {
                const value = String(answer?.value ?? "");
                const letter = String(answer?.letter ?? "");
                html += renderAnswerDisplay(type, letter, value, "#f44336");
            });
        }

        html += `</div></div>`;

        html += `
            <div style="margin-top:12px;padding:15px;border-radius:8px;background:#e3f2fd;border:1px solid #2196F3;">
                <b style="color:#1565c0;">Đáp án đúng:</b>
                <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:15px;">
        `;

        if (correctAnswers.length === 0) {
            html += `<i>Không có dữ liệu đáp án đúng</i>`;
        } else {
            correctAnswers.forEach(answer => {
                const value = String(answer?.value ?? "");
                const letter = String(answer?.letter ?? "");
                html += renderAnswerDisplay(type, letter, value, "#2196F3");
            });
        }

        html += `</div></div>`;

        html += `
            <div style="margin-top:12px;padding:10px;color:${item.isCorrect ? "#2e7d32" : "#c62828"};font-weight:bold;font-size:16px;">
                ${item.isCorrect ? "✓ ĐÚNG" : "✕ SAI"} ${item.score != null ? ` - ${escapeHtml(item.score)} điểm` : ""}
            </div>
        `;

        div.innerHTML = html;
        quizDiv.appendChild(div);
    });

    const summary = document.createElement("div");
    summary.style.cssText = "margin:20px 0;padding:20px;text-align:center;background:white;border-radius:10px;border:2px solid #2196F3;";
    summary.innerHTML = `
        <h2>Xem lại bài làm</h2>
        <p><b>Điểm:</b> ${escapeHtml(historyData.total_score ?? "0")}</p>
        <p><b>Số câu đúng:</b> ${escapeHtml(historyData.correct_count ?? 0)}/${escapeHtml(historyData.total_questions ?? historyData.details.length)}</p>
    `;
    quizDiv.insertBefore(summary, quizDiv.firstChild);

    document.getElementById("btn-submit").style.display = "none";
    document.getElementById("btn-view-detail").style.display = "none";

    window.scrollTo({ top: document.getElementById("quiz").offsetTop, behavior: "smooth" });
}

function renderAnswerDisplay(type, letter, value, borderColor) {
    if (type === "img") {
        return `
            <div style="width:200px;text-align:center;">
                ${letter ? `<strong>${escapeHtml(letter)}.</strong>` : ""}
                <img src="${escapeHtml(value)}" alt="Đáp án" 
                    style="display:block;width:180px;height:130px;object-fit:contain;margin:8px auto;border:2px solid ${borderColor};border-radius:8px;background:white;padding:5px;" 
                    onerror="this.outerHTML='<div style=\"color:red;\">Không tải được ảnh</div>';">
            </div>
        `;
    }
    return `
        <div style="padding:8px 12px;background:white;border-radius:6px;">
            ${letter ? `<b>${escapeHtml(letter)}.</b> ` : ""}
            ${escapeHtml(value)}
        </div>
    `;
}

function renderQuiz() {
    const quizDiv = document.getElementById("quiz");
    if (!quizDiv) {
        console.error("Không tìm thấy #quiz");
        return;
    }

    quizDiv.innerHTML = "";

    if (!Array.isArray(quizData) || quizData.length === 0) {
        quizDiv.innerHTML = `
            <div style="padding:20px;text-align:center;">
                Không có câu hỏi.
            </div>
        `;
        return;
    }

    quizData.forEach((q, index) => {
        try {
            const div = document.createElement("div");
            div.className = "question";
            div.style.display = "block";
            div.id = `q-container-${index}`;
            div.innerHTML = renderQuestion(q, index);
            quizDiv.appendChild(div);
        } catch (error) {
            console.error(`LỖI RENDER CÂU ${index + 1}:`, error, q);
        }
    });
}

function renderQuestion(q, index) {
    const type = q.type_laber || "text";
    let html = `<p><strong>Câu ${index + 1}:</strong> ${escapeHtml(q.label || "")}</p>`;

    if ((type === "img" || type === "img-thptqg") && q.image) {
        html += `
            <div style="margin:15px 0;text-align:center;">
                <img src="${escapeHtml(q.image)}" style="max-width:100%;max-height:500px;border-radius:8px;object-fit:contain;">
            </div>
        `;
    }

    if (type === "text-thptqg" || type === "img-thptqg") {
        html += renderThptqgQuestion(q, index, type);
    } else {
        html += renderMultipleChoice(q, index, type);
    }

    return html;
}

function renderThptqgQuestion(q, index, type) {
    const correctAnswers = Array.isArray(q.ans)
        ? q.ans.map(a => String(a).trim()).filter(Boolean)
        : [];

    const wrongAnswers = Array.isArray(q.ans_w)
        ? q.ans_w.map(a => typeof a === "object" && a !== null ? a.label : a)
            .filter(a => a !== undefined && a !== null && String(a).trim() !== "")
            .map(a => String(a).trim())
        : [];

    const answers = [...correctAnswers, ...wrongAnswers];
    let html = "";

    answers.forEach((answer, answerIndex) => {
        const letter = String.fromCharCode(65 + answerIndex);
        const isImage = type === "img-thptqg";

        html += `
            <div style="margin:12px 0;padding:15px;border:1px solid #ddd;border-radius:8px;background:#fff;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <strong style="min-width:25px;font-size:16px;">${letter}.</strong>
                    ${isImage ? `
                        <img src="${escapeHtml(answer)}" alt="Ý ${letter}"
                            style="width:180px;max-width:60%;max-height:150px;object-fit:contain;border:1px solid #ddd;border-radius:8px;background:#fff;padding:5px;">
                    ` : `<span>${escapeHtml(answer)}</span>`}
                </div>
                <div style="display:flex;gap:20px;margin-left:50px;">
                    <label style="padding:8px 15px;border:1px solid #ddd;border-radius:6px;cursor:pointer;">
                        <input type="radio" name="q${index}-item${answerIndex}" value="true" data-question="${index}" data-item="${answerIndex}" data-letter="${letter}">
                        Đúng
                    </label>
                    <label style="padding:8px 15px;border:1px solid #ddd;border-radius:6px;cursor:pointer;">
                        <input type="radio" name="q${index}-item${answerIndex}" value="false" data-question="${index}" data-item="${answerIndex}" data-letter="${letter}">
                        Sai
                    </label>
                </div>
            </div>
        `;
    });

    return html;
}

function renderMultipleChoice(q, index, type) {
    const correctAnswers = Array.isArray(q.ans)
        ? q.ans.map(a => String(a).trim()).filter(Boolean)
        : [];

    const wrongAnswers = Array.isArray(q.ans_w)
        ? q.ans_w.map(a => typeof a === "object" && a !== null ? a.label : a)
            .filter(a => a !== undefined && a !== null && String(a).trim() !== "")
            .map(a => String(a).trim())
        : [];

    let answers = [...correctAnswers, ...wrongAnswers];
    answers = shuffle(answers);

    const inputType = correctAnswers.length > 1 ? "checkbox" : "radio";
    let html = "";

    answers.forEach((answer, answerIndex) => {
        const letter = String.fromCharCode(65 + answerIndex);
        const safeAnswer = String(answer);

        if (type === "img") {
            html += `
                <label style="display:flex;align-items:center;gap:10px;margin:12px 0;padding:10px;border:1px solid #eee;border-radius:8px;cursor:pointer;">
                    <input type="${inputType}" name="q${index}" value="${escapeHtml(safeAnswer)}" data-letter="${letter}">
                    <strong>${letter}.</strong>
                    <img src="${escapeHtml(safeAnswer)}" alt="Đáp án ${letter}"
                        style="width:180px;max-width:60%;max-height:150px;object-fit:contain;border:1px solid #ddd;border-radius:8px;background:#fff;padding:5px;">
                </label>
            `;
        } else {
            html += `
                <label style="display:block;margin:8px 0;padding:8px;cursor:pointer;">
                    <input type="${inputType}" name="q${index}" value="${escapeHtml(safeAnswer)}" data-letter="${letter}">
                    <strong>${letter}.</strong> ${escapeHtml(safeAnswer)}
                </label>
            `;
        }
    });

    return html;
}

async function checkHistory() {
    if (!userId) {
        renderQuiz();
        return;
    }

    try {
        const res = await fetch("https://dnc-svc.palat.io.vn/exam/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: userId })
        });

        const history = await res.json();
        const currentExamHistory = Array.isArray(history)
            ? history.find(item => String(item.idexam) === String(idExam))
            : null;

        if (currentExamHistory) {
            document.getElementById("quiz").innerHTML = `
                <div style="text-align:center;padding:30px;border:2px dashed #2196F3;border-radius:10px;">
                    <h2 style="color:#2196F3;">BẠN ĐÃ HOÀN THÀNH ĐỀ SỐ ${escapeHtml(idExam)}</h2>
                    <p style="font-size:1.5em;">Điểm đạt được: <span style="color:red;font-weight:bold;">${escapeHtml(currentExamHistory.total_score)}</span></p>
                    <p>Số câu đúng: ${escapeHtml(currentExamHistory.correct_count)}/${escapeHtml(currentExamHistory.total_questions)}</p>
                    <p><i>Bạn đã hoàn thành đề này.</i></p>
                </div>
            `;
            document.getElementById("btn-submit").style.display = "none";
        } else {
            renderQuiz();
        }
    } catch (e) {
        console.error("Lỗi check lịch sử:", e);
        renderQuiz();
    }
}

async function submitQuiz() {
    let correctCount = 0;
    let totalScore = 0;
    let studentChoices = [];

    quizData.forEach((q, index) => {
        const div = document.getElementById(`q-container-${index}`);
        if (!div) return;

        const oldResult = div.querySelector(".answer-result");
        if (oldResult) oldResult.remove();
        div.classList.remove("correct", "wrong");

        const type = q.type_laber || "text";

        if (type === "text-thptqg" || type === "img-thptqg") {
            const result = gradeThptqgQuestion(q, index, type);
            correctCount += result.correct ? 1 : 0;
            totalScore += result.score;
            displayResult(div, result);
            studentChoices.push(result.choice);
        } else {
            const result = gradeMultipleChoice(q, index, type);
            if (result.isCorrect) {
                correctCount++;
                totalScore += result.score;
            }
            displayResult(div, result);
            studentChoices.push(result.choice);
        }
    });

    const resultPayload = {
        nameexam: nameofexam,
        iduser: userId,
        idexam: idExam,
        total_score: totalScore.toFixed(2),
        correct_count: correctCount,
        total_questions: quizData.length,
        details: studentChoices
    };

    console.log("DỮ LIỆU GỬI LÊN:", resultPayload);

    try {
        const response = await fetch("https://dnc-svc.palat.io.vn/exam/result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resultPayload)
        });

        if (response.ok) {
            console.log("Đã lưu kết quả thành công!");
        } else {
            console.error("POST kết quả thất bại:", response.status);
        }
    } catch (error) {
        console.error("Lỗi POST kết quả:", error);
    }

    document.getElementById("score-text").innerText = `${totalScore.toFixed(2)} Điểm`;
    document.getElementById("stats-text").innerText = `Số câu đúng: ${correctCount}/${quizData.length}`;
    document.getElementById("score-modal").style.display = "flex";
    document.getElementById("btn-submit").style.display = "none";
    document.getElementById("btn-view-detail").style.display = "inline-block";
}

function gradeThptqgQuestion(q, index, type) {
    const correctAnswers = Array.isArray(q.ans)
        ? q.ans.map(a => String(a).trim()).filter(Boolean)
        : [];

    const wrongAnswers = Array.isArray(q.ans_w)
        ? q.ans_w.map(a => typeof a === "object" && a !== null ? a.label : a)
            .filter(a => a !== undefined && a !== null && String(a).trim() !== "")
            .map(a => String(a).trim())
        : [];

    const allAnswers = [...correctAnswers, ...wrongAnswers];
    let numTrue = 0;
    let details = [];
    let userAnswers = [];
    let correctDisplay = [];

    allAnswers.forEach((answer, answerIndex) => {
        const letter = String.fromCharCode(65 + answerIndex);
        const correctValue = correctAnswers.some(correct =>
            String(correct).trim().toLowerCase() === String(answer).trim().toLowerCase()
        );

        const selected = document.querySelector(`input[name="q${index}-item${answerIndex}"]:checked`);
        const userValue = selected ? selected.value === "true" : null;
        const itemCorrect = userValue !== null && userValue === correctValue;

        if (itemCorrect) numTrue++;

        userAnswers.push({
            letter: letter,
            value: userValue === null ? "" : userValue ? "Đúng" : "Sai",
            rawValue: userValue
        });

        correctDisplay.push({
            letter: letter,
            value: correctValue ? "Đúng" : "Sai"
        });

        details.push({
            letter: letter,
            label: answer,
            selected: userValue === null ? null : userValue,
            correct: correctValue,
            isCorrect: itemCorrect
        });
    });

    let score = 0;
    if (numTrue === 4) score = 1.00;
    else if (numTrue === 3) score = 0.50;
    else if (numTrue === 2) score = 0.25;
    else if (numTrue === 1) score = 0.10;

    const isCorrect = numTrue === 4;

    console.log(`Câu ${index + 1}: ${numTrue}/4 ý đúng => ${score} điểm`);

    return {
        correct: isCorrect,
        score: score,
        numTrue: numTrue,
        userAnswers: userAnswers,
        correctDisplay: correctDisplay,
        details: details,
        choice: {
            question: q.label || "",
            type: type,
            answer: userAnswers,
            correct: correctDisplay,
            details: details,
            correct_count: numTrue,
            isCorrect: isCorrect,
            score: score
        }
    };
}

function gradeMultipleChoice(q, index, type) {
    const correctAnswers = Array.isArray(q.ans)
        ? q.ans.map(a => String(a).trim()).filter(Boolean)
        : [];

    const selectedInputs = Array.from(document.querySelectorAll(`input[name="q${index}"]:checked`));

    const userAnswers = selectedInputs.map(input => ({
        letter: input.dataset.letter || "",
        value: String(input.value).trim()
    }));

    const correctValues = correctAnswers.map(a => a.toLowerCase()).sort();
    const userValues = userAnswers.map(a => a.value.toLowerCase()).sort();

    const isCorrect = correctValues.length === userValues.length &&
        correctValues.every((answer, i) => answer === userValues[i]);

    const score = isCorrect ? Number(POINT_PER_QUESTION) : 0;

    const allInputs = Array.from(document.querySelectorAll(`input[name="q${index}"]`));
    const correctAnswerDisplay = correctAnswers.map(correctValue => ({
        letter: allInputs.find(input =>
            String(input.value).trim().toLowerCase() === String(correctValue).trim().toLowerCase()
        )?.dataset.letter || "",
        value: correctValue
    }));

    return {
        isCorrect: isCorrect,
        score: score,
        userAnswers: userAnswers,
        correctAnswerDisplay: correctAnswerDisplay,
        choice: {
            question: q.label || "",
            type: type,
            answer: userAnswers,
            correct: correctAnswerDisplay,
            isCorrect: isCorrect,
            score: score
        }
    };
}

function displayResult(div, result) {
    const resultDiv = document.createElement("div");
    resultDiv.className = "answer-result";

    if (result.numTrue !== undefined) {
        const userHtml = `
            <div style="margin-top:10px;">
                <b>Bạn chọn:</b>
                <div style="display:flex;flex-wrap:wrap;gap:20px;margin-top:10px;">
                    ${result.userAnswers.map(a => `
                        <div><b>${escapeHtml(a.letter)}.</b> ${a.value ? escapeHtml(a.value) : "<i>Trống</i>"}</div>
                    `).join("")}
                </div>
            </div>
        `;

        const correctHtml = `
            <div style="margin-top:10px;">
                <b>Đáp án đúng:</b>
                <div style="display:flex;flex-wrap:wrap;gap:20px;margin-top:10px;">
                    ${result.correctDisplay.map(a => `
                        <div><b>${escapeHtml(a.letter)}.</b> ${escapeHtml(a.value)}</div>
                    `).join("")}
                </div>
            </div>
        `;

        resultDiv.innerHTML = `
            <div style="padding:10px;border-left:4px solid ${result.correct ? "#4caf50" : "#f44336"};">
                <b style="color:${result.correct ? "green" : "red"};">
                    ${result.correct ? "Đúng" : "Sai"}
                </b>
                <span style="margin-left:10px;font-weight:bold;">
                    ${result.numTrue}/4 ý đúng - ${result.score.toFixed(2)} điểm
                </span>
                ${userHtml}
                ${correctHtml}
            </div>
        `;

        div.classList.add(result.correct ? "correct" : "wrong");
    } else {
        const userHtml = result.userAnswers.length === 0
            ? `<i>Trống</i>`
            : result.userAnswers.map(a => `
                <div><b>${escapeHtml(a.letter)}.</b> ${escapeHtml(a.value)}</div>
            `).join("");

        const correctHtml = result.correctAnswerDisplay.map(a => `
            <div><b>${escapeHtml(a.letter)}.</b> ${escapeHtml(a.value)}</div>
        `).join("");

        resultDiv.innerHTML = result.isCorrect
            ? `<b style="color:green">✓ Đúng!</b><div style="margin-top:10px;"><b>Đáp án đúng:</b><div style="display:flex;gap:15px;margin-top:10px;">${correctHtml}</div></div>`
            : `<b style="color:red">✕ Sai!</b><div style="margin-top:10px;"><b>Bạn chọn:</b><div style="display:flex;gap:15px;margin-top:10px;">${userHtml}</div></div><div style="margin-top:10px;"><b>Đáp án đúng:</b><div style="display:flex;gap:15px;margin-top:10px;">${correctHtml}</div></div>`;

        div.classList.add(result.isCorrect ? "correct" : "wrong");
    }

    div.appendChild(resultDiv);
}

function showDetails() {
    document.querySelectorAll(".question").forEach(q => q.style.display = "block");
    window.scrollTo({
        top: document.getElementById("quiz").offsetTop,
        behavior: "smooth"
    });
}

function closeModal() {
    document.getElementById("score-modal").style.display = "none";
}

window.addEventListener("DOMContentLoaded", () => loadData());
