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
    const utmSource = new URL(window.location.href).searchParams.get("id-exam");
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
        await checkAccount();
        await checkHistory();
    } catch (err) {
        console.error("Lỗi tải đề:", err);
        document.getElementById("title").innerText = "Không thể tải đề thi";
        document.getElementById("quiz").innerHTML = 
            `<div style="padding:20px; background:#ffebee; color:#c62828; border-radius:8px;">Không thể tải dữ liệu đề thi.</div>`;
    }
}

function renderQuiz() {
    const quizDiv = document.getElementById("quiz");
    if (!quizDiv) return console.error("Không tìm thấy #quiz");

    quizDiv.innerHTML = "";
    if (!Array.isArray(quizData) || quizData.length === 0) {
        quizDiv.innerHTML = `<div style="padding:20px;text-align:center;">Không có câu hỏi.</div>`;
        return;
    }

    quizData.forEach((q, index) => {
        try {
            if (!q || typeof q !== "object") return;

            const div = document.createElement("div");
            div.className = "question";
            div.style.display = "block";
            div.id = `q-container-${index}`;

            const type = q.type_laber || "text";
            let html = `<p><strong>Câu ${index + 1}:</strong>${escapeHtml(q.label || "")}</p>`;

            if (type === "img" && q.image) {
                html += `<div class="question-image" style="margin:15px 0; text-align:center;">
                    <img src="${escapeHtml(String(q.image))}" alt="Hình câu hỏi" 
                    style="max-width:100%; max-height:500px; border-radius:8px; object-fit:contain;" 
                    onerror="console.error('Không tải được hình câu hỏi:', this.src)">
                </div>`;
            }

            const correctAnswers = Array.isArray(q.ans)
                ? q.ans.map(a => String(a)).filter(a => a.trim() !== "")
                : [];

            const wrongAnswers = Array.isArray(q.ans_w)
                ? q.ans_w.map(a => typeof a === "object" && a !== null ? a.label : a)
                    .filter(a => a !== undefined && a !== null && String(a).trim() !== "")
                    .map(a => String(a))
                : [];

            let answers = [...correctAnswers, ...wrongAnswers];

            if (answers.length === 0) {
                html += `<div style="color:red;">Câu hỏi này chưa có đáp án.</div>`;
            } else {
                answers = shuffle(answers);
                const inputType = correctAnswers.length > 1 ? "checkbox" : "radio";

                answers.forEach((answer, answerIndex) => {
                    const safeAnswer = String(answer);
                    const letter = String.fromCharCode(65 + answerIndex);

                    if (type === "img") {
                        html += `<label style="display:flex; align-items:center; gap:10px; margin:12px 0; padding:10px; border:1px solid #eee; border-radius:8px; cursor:pointer;">
                            <input type="${inputType}" name="q${index}" value="${escapeHtml(safeAnswer)}">
                            <strong>${letter}.</strong>
                            <img src="${escapeHtml(safeAnswer)}" alt="Đáp án ${letter}" 
                            style="width:180px; max-width:60%; max-height:150px; object-fit:contain; border:1px solid #ddd; border-radius:8px; background:#fff; padding:5px;" 
                            onerror="console.error('Không tải được ảnh đáp án:', this.src); this.style.display='none';">
                        </label>`;
                    } else {
                        html += `<label style="display:block; margin:8px 0; padding:8px; cursor:pointer;">
                            <input type="${inputType}" name="q${index}" value="${escapeHtml(safeAnswer)}">
                            ${escapeHtml(safeAnswer)}
                        </label>`;
                    }
                });
            }

            div.innerHTML = html;
            quizDiv.appendChild(div);
        } catch (error) {
            console.error(`LỖI RENDER CÂU ${index + 1}:`, error, q);
        }
    });
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
            document.getElementById("quiz").innerHTML = 
                `<div style="text-align:center; padding:30px; border:2px dashed #2196F3; border-radius:10px;">
                    <h2 style="color:#2196F3;">BẠN ĐÃ HOÀN THÀNH ĐỀ SỐ ${escapeHtml(idExam)}</h2>
                    <p style="font-size:1.5em;">Điểm đạt được: <span style="color:red; font-weight:bold;">${escapeHtml(currentExamHistory.total_score)}</span></p>
                    <p>Số câu đúng: ${escapeHtml(currentExamHistory.correct_count)}/${escapeHtml(currentExamHistory.total_questions)}</p>
                    <p><i>Bạn đã hoàn thành đề này.</i></p>
                </div>`;
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

        let score = 0;
        if (isCorrect) {
            score = Number(POINT_PER_QUESTION);
            correctCount++;
            totalScore += score;
        }

        const allInputs = Array.from(document.querySelectorAll(`input[name="q${index}"]`));
        const correctAnswerDisplay = correctAnswers.map(correctValue => ({
            letter: allInputs.find(input => 
                String(input.value).trim().toLowerCase() === String(correctValue).trim().toLowerCase())
                ?.dataset.letter || "",
            value: correctValue
        }));

        let userHtml = "";
        let correctHtml = "";

        if (userAnswers.length === 0) {
            userHtml = `<div style="margin-top:8px;"><b>Bạn chọn:</b><i>Trống</i></div>`;
        } else {
            userHtml = `<div style="margin-top:8px;"><b>Bạn chọn:</b>
                <div style="display:flex; flex-wrap:wrap; gap:15px; margin-top:10px;">`;
            userAnswers.forEach(answer => {
                if (q.type_laber === "img") {
                    userHtml += `<div style="width:180px; text-align:center;"><strong>${escapeHtml(answer.letter)}.</strong>
                        <img src="${escapeHtml(answer.value)}" style="display:block; width:180px; height:130px; object-fit:contain; border:1px solid #ddd; border-radius:8px; margin-top:5px; background:white;"></div>`;
                } else {
                    userHtml += `<span><b>${escapeHtml(answer.letter)}.</b> ${escapeHtml(answer.value)}</span>`;
                }
            });
            userHtml += `</div></div>`;
        }

        correctHtml = `<div style="margin-top:8px;"><b>Đáp án đúng:</b>
            <div style="display:flex; flex-wrap:wrap; gap:15px; margin-top:10px;">`;
        correctAnswerDisplay.forEach(answer => {
            if (q.type_laber === "img") {
                correctHtml += `<div style="width:180px; text-align:center;"><strong>${escapeHtml(answer.letter)}.</strong>
                    <img src="${escapeHtml(answer.value)}" style="display:block; width:180px; height:130px; object-fit:contain; border:1px solid #ddd; border-radius:8px; margin-top:5px; background:white;"></div>`;
            } else {
                correctHtml += `<span><b>${escapeHtml(answer.letter)}.</b> ${escapeHtml(answer.value)}</span>`;
            }
        });
        correctHtml += `</div></div>`;

        const resultDiv = document.createElement("div");
        resultDiv.className = "answer-result";
        resultDiv.innerHTML = isCorrect 
            ? `<b style="color:green">Đúng!</b>${correctHtml}`
            : `<b style="color:red">Sai!</b>${userHtml}${correctHtml}`;
        
        div.classList.add(isCorrect ? "correct" : "wrong");
        div.appendChild(resultDiv);

        studentChoices.push({
            question: q.label || "",
            type: q.type_laber || "text",
            answer: userAnswers,
            correct: correctAnswerDisplay,
            isCorrect,
            score
        });
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

    try {
        const response = await fetch("https://dnc-svc.palat.io.vn/exam/result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resultPayload)
        });
        if (response.ok) console.log("Đã lưu kết quả thành công!");
    } catch (error) {
        console.error("Lỗi POST kết quả:", error);
    }

    document.getElementById("score-text").innerText = `${totalScore.toFixed(2)} Điểm`;
    document.getElementById("stats-text").innerText = `Số câu đúng: ${correctCount}/${quizData.length}`;
    document.getElementById("score-modal").style.display = "flex";
    document.getElementById("btn-submit").style.display = "none";
    document.getElementById("btn-view-detail").style.display = "inline-block";
}

function showDetails() {
    document.querySelectorAll(".question").forEach(q => q.style.display = "block");
    window.scrollTo({ top: document.getElementById("quiz").offsetTop, behavior: "smooth" });
}

function closeModal() {
    document.getElementById("score-modal").style.display = "none";
}

window.addEventListener("DOMContentLoaded", () => loadData());
