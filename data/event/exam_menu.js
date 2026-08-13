let Had_Sigin= 0 ; //0 là chưa check đăng nhập , 1 là check rồi, đã đăng nhập, 2 là check rồi chưa đăng nhập
const COOKIE_NAME = "hwid";
let DATA_USER = null;
const API_ACCOUNT = "https://dnc-svc.palat.io.vn/service/2/namhaclub";
function redirect_url(name_url,mode){
    console.log("redirect_url : ", name_url)
}

async function Check_account(){
  const token = localStorage.getItem("token");

  if (!token) {
    Had_Sigin = 2;
    return null;
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
    Had_Sigin = 2;
    return null;
  }
}
async function LoadAccount() {
    
    if(Had_Sigin<1)  Check_account();
    if(Had_Sigin == 2){
       const data_returning = `
        <div class="auth-container" >
        <div class="auth-box">
            <div class="auth-tabs">
                <button class="tab-btn active" onclick="toggleAuth('login')">Đăng nhập</button>
                <button class="tab-btn" onclick="toggleAuth('register')">Đăng ký</button>
            </div>
            <form id="login-form" class="auth-form active">
                <div class="input-group">
                    <i class="fas fa-envelope"></i>
                    <input type="email" id="l_email"  placeholder="Email của bạn" required>
                </div>
                <div class="input-group">
                    <i class="fas fa-lock"></i>
                    <input type="password"  id="l_password" placeholder="Mật khẩu" required>
                </div>
                <div class="form-options">
                    <a onclick='alert("phải chịu, inbox với chủ web đi nha hết cứu r :))")'>Quên mật khẩu?</a>
                </div>
                <button onclick="login()" type="button" class="btn-auth">Đăng nhập</button>
            </form>
            <form id="register-form" class="auth-form">
                <div class="input-group">
                    <i class="fas fa-user"></i>
                    <input type="text" id="r_name" placeholder="Họ và tên" required>
                </div>
                <div class="input-group">
                    <i class="fas fa-envelope"></i>
                    <input id="r_email" type="email" placeholder="Email" required>
                </div>
                <div class="input-group">
                    <i class="fas fa-envelope"></i>
                    <input type="text" id="r_class" placeholder="Lớp hiện tại của bạn" required>
                </div>
                <div class="input-group">
                    <i class="fas fa-envelope"></i>
                    <input id="r_yearstudy" type="text" placeholder="Năm học bạn tham gia" required>
                </div>
                <div class="input-group">
                    <i class="fas fa-lock"></i>
                    <input type="text" id="r_password"  placeholder="Mật khẩu (kiểm tra kỹ)" required>
                </div>
                <button onclick="register()" type="button" class="btn-auth">Tạo tài khoản</button>
            </form>

            
        </div>
    </div>
        `
    document.getElementById("MAIN").innerHTML = data_returning;
    }
    if(Had_Sigin == 1){
        console.log("Load")
        const data_returning = `
        <div class="auth-container" >
        <div class="auth-box">
                <div class="input-group">
                    <label>Họ và tên</label>
                    <i class="fas fa-user"></i>
                    <input type="text" id="r_name" placeholder="Họ và tên" readonly>
                </div>
                <div class="input-group">
                    <label>Email</label>
                    <i class="fas fa-envelope"></i>
                    <input id="r_email" type="email" placeholder="Email" readonly>
                </div>
                <div class="input-group">
                    <label>Lớp</label>
                    <i class="fas fa-envelope"></i>
                    <input type="text" id="r_class" placeholder="Lớp hiện tại của bạn" readonly>
                </div>
                <div class="input-group">
                    <label>Năm tham gia</label>
                    <i class="fas fa-envelope"></i>
                    <input id="r_yearstudy" type="text" placeholder="Năm học bạn tham gia" readonly>
                </div>

        </div>
    </div>`
    document.getElementById("MAIN").innerHTML = data_returning;
    document.getElementById("r_name").value = DATA_USER.name || "";
    document.getElementById("r_email").value = DATA_USER.email || "";
    document.getElementById("r_class").value = DATA_USER.class || "";
    document.getElementById("r_yearstudy").value = DATA_USER.year_study || "";
    }
     
}
async function Load_Home(){
    const res = await fetch("https://dnc-svc.palat.io.vn/exam/list");
    const data_return_json = await res.json();
    console.log(data_return_json,data_return_json.title)
    
    var examlist = "";
    var examlist_score = "";
    data_return_json.data_exam.forEach((sp, index) => {
        let statusexam = sp.status =="0" ? 'hidden' : '';
        examlist_score = examlist_score+ `<h4 id="exam-data-title-1">${sp.title_exam}</h4>
                            <p id="exam-data-describe-1">${sp.describe_exam_result}</p> `
        examlist = examlist + `
        <div class="exam-item">
                        <div class="exam-info">
                            <span class="category">${sp.title_exam_topic}</span>
                            <h3>${sp.title_exam}</h3>
                            <p><i class="far fa-calendar-alt"></i> ${sp.time}</p>
                            <p><i class="far fa-calendar-alt"></i> ${sp.describe_exam}</p>
                            <p><i class="far fa-clock"></i> ${sp.form_exam}</p>
                        </div>
                        <button ${statusexam} onclick='start("${sp.idexam}","${sp.url}")'class="btn-start">Vào thi</button>
                    </div>`
    });
    const data_returning=`
        <div id="home">
            
            <main class="main-content">
            <header>
                <div class="welcome-text">
                <h3>Chào ${DATA_USER.name}</h3>
                </div>
            </header>

            <section class="stats-cards">
                <div class="card" id="exam-describe">
                    <i class="fas fa-clock"></i>
                    <div>
                        <h3>Mô tả</h3>
                        <p>${data_return_json.describe}</p>
                    </div>
                </div>
                <div class="card" id="exam-describe-total_result">
                    <i class="fas fa-check-circle"></i>
                    <div>
                        <h4>Quy định thang điểm</h4>
                        <hr>
                        <h4>Đối với bài thi </h4>
                        ${examlist_score}
                        
                    </div>
                </div>
            </section>

            <section class="exam-list">
                <h2 id="exam-list-title">${data_return_json.exam_title}</h2>

                <div class="exam-grid" id="exam-data">
                    ${examlist}
                </div>
            </section>
        </main>

        </div>
    `
  document.getElementById("MAIN").innerHTML = data_returning;
}
async function LoadResult() {
    const userId = getCookie("iduser"); // Đảm bảo lấy được userId
    if (!userId) return;

    try {
        const res = await fetch('https://dnc-svc.palat.io.vn/exam/search', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: userId })
        });
        
        const history = await res.json(); 
        if (history && history.length > 0) {
            let htmlContent = `
                <div style="padding: 20px; background: white; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <h2 style="text-align:center; color: #2196F3;">LỊCH SỬ THI CỦA BẠN</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead>
                            <tr style="background: #2196F3; color: white;">
                                <th style="padding: 10px; border: 1px solid #ddd;">Tên bài</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Số hiệu đề</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Điểm</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Số Câu Đúng</th>
                                 <th style="padding: 10px; border: 1px solid #ddd;">Phúc Khảo</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            history.forEach(item => {
                let timeStr = item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN') : "---";
                
                htmlContent += `
                    <tr style="text-align: center;">
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${item.nameexam}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${item.idexam}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; color: red; font-weight: bold;">${item.total_score || item.score}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.correct_count || item.correct}/${item.total_questions || item.total}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">Hiện chưa cho xem</td>
                    </tr>
                `;
            });

            htmlContent += `
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById("MAIN").innerHTML = htmlContent;
        } else {
            document.getElementById("MAIN").innerHTML = `
                <div style="text-align:center; padding: 50px;">
                    <p>Bạn chưa thực hiện bài thi nào.</p>
                </div>
            `;
        }
    } catch (e) {
        console.error("Lỗi load lịch sử:", e);
        document.getElementById("MAIN").innerHTML = "<p>Không thể tải lịch sử lúc này.</p>" + e;
    }
}
 function setCookie(name, value, days) {
            let expires = "";
            if (days) {
                let date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            console.log("ok")
            document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
            let nameEQ = name + "=";
            let ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
}
async function register() {
  const data = {
    name: document.getElementById("r_name").value,
    classes: document.getElementById("r_class").value,
    yearstudy: document.getElementById("r_yearstudy").value,
    email: document.getElementById("r_email").value,
    password: document.getElementById("r_password").value
  };

  const res = await fetch(API_ACCOUNT + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  if(result.message=="OK"){
    alert("Đăng ký thành công, vui lòng đăng nhập!")
     var delayInMilliseconds = 500;
    setTimeout(function() { window.open("/exam/" ,"_self");}, delayInMilliseconds);var seconds = 0; setInterval(function() {timer.innerHTML = seconds++;console.log(seconds);}, 1000);
  }
  else{
    alert("Lỗi :"+ result.message)
  }
  
}
async function login() {
  const data = {
    email: document.getElementById("l_email").value,
    password: document.getElementById("l_password").value
  };

  const res = await fetch(API_ACCOUNT + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (result.token) {
    localStorage.setItem("token", result.token);
    alert("Đăng nhập thành công!");
    var delayInMilliseconds = 500;
    setTimeout(function() { window.open("/exam/" ,"_self");}, delayInMilliseconds);var seconds = 0; setInterval(function() {timer.innerHTML = seconds++;console.log(seconds);}, 1000);
  } else {
    alert(result.message);
  }
}
window.addEventListener("DOMContentLoaded", async() => {
   
   var url = new URL(window.location.href);
   var params = url.searchParams;
   var utmSource = params.get("to");
    
   DATA_USER = await Check_account(); console.log(Had_Sigin)
   
   if(utmSource=="my_profile") LoadAccount();
   else if(utmSource == "result_exam") LoadResult()
   else {
    
    if (Had_Sigin == 2) {
        LoadAccount();
    } else {
        setCookie("iduser", DATA_USER.id, 14);
        Load_Home();
    }
   }
   
});
function start(id,url){
    if(url.length>1) window.open(`${url}` ,"_self");

    else  window.open(`../exam/dethi.html?id-exam=${id}` ,"_self");
}
function toggleAuth(type) {
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            const tabs = document.querySelectorAll('.tab-btn');

            if (type === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
                tabs[0].classList.add('active');
                tabs[1].classList.remove('active');
            } else {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
                tabs[0].classList.remove('active');
                tabs[1].classList.add('active');
            }
        }