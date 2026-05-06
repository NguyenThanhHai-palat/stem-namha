let quizData = [];
var POINT_PER_QUESTION = 0.25;
const userId = getCookie("iduser");
var nameofexam = "Trống"
// Hàm bổ trợ: Lấy giá trị Cookie theo tên
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

let idExam = "";
const API_ACCOUNT = "https://dnc-svc.palat.io.vn/service/2/namhaclub";
function redirect_url(name_url,mode){
    console.log("redirect_url : ", name_url)
}

async function Check_account(){
  const token = localStorage.getItem("token");

  if (!token) {
    var delayInMilliseconds = 500;
        setTimeout(function() {
            window.open("/exam/" ,"_self");
        }, delayInMilliseconds);
        var seconds = 0;
        setInterval(function() {timer.innerHTML = seconds++;
        console.log(seconds);
        }, 1000);

  }

  const res = await fetch(API_ACCOUNT, {
    headers: {
      "Authorization": "Bearer " + token
    }
  });

  if(res.status === 200){
    const data = await res.json();
    Had_Sigin = 1;
    return data; 
  } else {
    var delayInMilliseconds = 500;
        setTimeout(function() {
            window.open("/exam/" ,"_self");
        }, delayInMilliseconds);
        var seconds = 0;
        setInterval(function() {timer.innerHTML = seconds++;
        console.log(seconds);
        }, 1000);

    return null;
  }
}
async function loadData() {
   var url = new URL(window.location.href);
   var params = url.searchParams;
   var utmSource = params.get("id-exam");
   
    try {
        const response = await fetch(`https://data.palat.io.vn/detest${utmSource}/read`);
        const data = await response.json();
        Check_account();
        document.getElementById("title").innerText = data.tende;
        nameofexam= data.tende;
        quizData = data.data;
        idExam = data.idexam; // Lấy ID đề từ JSON
        POINT_PER_QUESTION = data.point;
        checkHistory();
        
    } catch (err) {
        console.error("Lỗi tải đề:", err);
    }
}

function renderQuiz() {
    const quizDiv = document.getElementById("quiz");
    quizDiv.innerHTML = "";
    
    quizData.forEach((q, index) => {
        const div = document.createElement("div");
        div.className = "question";
        div.style.display = "block"; 
        div.id = `q-container-${index}`;

        let html = `<p><strong>Câu ${index + 1}:</strong> ${q.label}</p>`;

        if (q.ans_w && q.ans_w.length > 0) {
            let answers = [q.ans, ...q.ans_w.map(a => a.label)];
            answers.sort(() => Math.random() - 0.5);
            answers.forEach(ans => {
                html += `<label><input type="radio" name="q${index}" value="${ans}"> ${ans}</label>`;
            });
        } else {
            html += `<input type="text" placeholder="Nhập đáp án..." id="text${index}">`;
        }
        div.innerHTML = html;
        quizDiv.appendChild(div);
    });
    if (!quizData || !Array.isArray(quizData)) {
    document.getElementById("quiz").innerHTML = "Không có dữ liệu câu hỏi!";
    return;
}
}
async function checkHistory() {
    if (!userId) {
        renderQuiz();
        return;
    }

    try {
        const res = await fetch('https://dnc-svc.palat.io.vn/exam/search', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: userId })
        });
        
        const history = await res.json(); 
        const currentExamHistory = history.find(item => String(item.idexam) === String(idExam));

        if (currentExamHistory) {
            document.getElementById("quiz").innerHTML = `
                <div style="text-align:center; padding: 30px; border: 2px dashed #2196F3; border-radius: 10px;">
                    <h2 style="color: #2196F3;">BẠN ĐÃ HOÀN THÀNH ĐỀ SỐ ${idExam}</h2>
                    <p style="font-size: 1.5em;">Điểm đạt được: <span style="color:red">${currentExamHistory.total_score}</span></p>
                    <p>Số câu đúng: ${currentExamHistory.correct_count}/${currentExamHistory.total_questions}</p>
                    <p><i>Bạn không thể xem lại bài làm tại đây bạn sẽ xem lại được bài làm sau khi bài thi kết thúc ngày.</i></p>
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
    let studentChoices = [];
        

    quizData.forEach((q, index) => {
        const div = document.getElementById(`q-container-${index}`);
        let userAns = "";

        if (q.ans_w && q.ans_w.length > 0) {
            let selected = document.querySelector(`input[name="q${index}"]:checked`);
            userAns = selected ? selected.value : "";
        } else {
            userAns = document.getElementById(`text${index}`).value.trim();
        }

        let correctAns = q.ans.trim();
        let isCorrect = userAns.toLowerCase() === correctAns.toLowerCase();
        if (isCorrect) correctCount++;

        studentChoices.push({
            question_label: q.label,
            selected_ans: userAns,
            correct_ans: correctAns,
            is_correct: isCorrect
        });

        div.classList.remove("correct", "wrong");
        let oldResult = div.querySelector(".answer-result");
        if (oldResult) oldResult.remove();

        let resultDiv = document.createElement("div");
        resultDiv.className = "answer-result";
        resultDiv.innerHTML = isCorrect ? "<b>Đáp án đúng</b>" : `<b>Đáp án Sai!</b><br>Đáp án đúng là: <b>${correctAns}</b>`;
        div.appendChild(resultDiv);
        div.style.display = "none";
    });

    const totalScore = correctCount * POINT_PER_QUESTION;

    const resultPayload = {
        nameexam:nameofexam,
        iduser: userId,
        idexam: idExam,
        total_score: totalScore.toFixed(2),
        correct_count: correctCount,
        total_questions: quizData.length,
        details: studentChoices
    };

    try {
        const response = await fetch('https://dnc-svc.palat.io.vn/exam/result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resultPayload)
        });
        
        if (response.ok) {
            console.log("Đã lưu kết quả thành công!");
        } else {
            console.warn("Server nhận dữ liệu nhưng phản hồi lỗi.");
        }
    } catch (error) {
        console.error("Lỗi khi POST kết quả:", error);
    }

    document.getElementById("score-text").innerText = `${totalScore.toFixed(2)} Điểm`;
    document.getElementById("stats-text").innerText = `Số câu đúng: ${correctCount}/${quizData.length}`;
    document.getElementById("score-modal").style.display = "flex";

    document.getElementById("btn-submit").style.display = "none";
    document.getElementById("btn-view-detail").style.display = "inline-block";
}

function showDetails() {
    document.querySelectorAll(".question").forEach(q => q.style.display = "block");
    window.scrollTo({ top: document.getElementById("quiz").offsetTop, behavior: 'smooth' });
}

function closeModal() {
    document.getElementById("score-modal").style.display = "none";
}

window.onload = loadData;