// --- Các biến toàn cục ---
let currentScore = 0;
let currentLevelTime = 2000;
let currentPointsReward = 10;
let currentAnswerTime = 20000;
let timeRemaining = 0; // Lưu thời gian còn lại (Fix Bug)
let barStartTime = 0;  // Mốc bắt đầu chạy thanh bar
let numberSequence = [];
let currentIndex = 0;
let isPlaying = false; 
let currentTimer = null;
let answerTimeout = null; 

// --- Khai báo DOM Elements ---
const screenSetup = document.getElementById('screen-setup');
const screenGame = document.getElementById('screen-game');
const numberDisplay = document.getElementById('number-display');
const answerSection = document.getElementById('answer-section');
const gameMessage = document.getElementById('game-message');
const scoreSpan = document.getElementById('score');
const userInput = document.getElementById('user-input');      
const playerNameInput = document.getElementById('player-name'); 
const levelSelect = document.getElementById('level-select');
const leaderboardList = document.getElementById('leaderboard-list');
const timeBarContainer = document.getElementById('time-bar-container');
const timeBar = document.getElementById('time-bar');
const gameModal = document.getElementById('game-modal');
const modalTitle = document.getElementById('modal-title');
const modalScore = document.getElementById('modal-score');

// --- Khởi tạo ---
window.onload = function() {
    renderLeaderboard();
};

// --- Chức năng chính ---
function startGame() {
    const name = playerNameInput.value.trim();
    if (!name) {
        alert("Vui lòng nhập tên trước khi chơi!");
        return;
    }

    const selectedOption = levelSelect.options[levelSelect.selectedIndex];
    currentLevelTime = parseInt(levelSelect.value);
    currentPointsReward = parseInt(selectedOption.getAttribute('data-points'));
    currentAnswerTime = parseInt(selectedOption.getAttribute('data-answer-time'));

    currentScore = 0;
    scoreSpan.innerText = currentScore;
    isPlaying = true;

    screenSetup.classList.add('hidden');
    screenGame.classList.remove('hidden');
    gameModal.classList.add('hidden');

    startRound();
}

function quitGame(reason = "Dừng đột ngột") {
    isPlaying = false;
    if (currentTimer) clearTimeout(currentTimer);
    if (answerTimeout) clearTimeout(answerTimeout); 
    
    saveScoreToLeaderboard(currentScore);

    if (reason === "Hết giờ" || reason === "Sai đáp án") {
        showGameOverModal(reason);
    } else {
        screenGame.classList.add('hidden');
        screenSetup.classList.remove('hidden');
        renderLeaderboard();
    }
}

function showGameOverModal(reason) {
    timeBarContainer.classList.add('hidden');
    screenGame.classList.add('hidden'); 
    modalTitle.textContent = (reason === "Hết giờ") ? "HẾT THỜI GIAN!" : "SAI ĐÁP ÁN!";
    modalScore.textContent = currentScore;
    gameModal.classList.remove('hidden');
}

function startRound() {
    if (!isPlaying) return;
    
    if (answerTimeout) clearTimeout(answerTimeout); 
    timeBarContainer.classList.add('hidden');
    answerSection.classList.add('hidden');
    userInput.value = '';
    numberDisplay.innerText = '...';
    gameMessage.innerText = `Cấp độ: ${currentPointsReward} điểm/câu`;
    gameMessage.style.color = '#bdc3c7';

    // THAY ĐỔI TẠI ĐÂY: Phạm vi số từ 1 ĐẾN 30
    numberSequence = [];
    for(let i = 0; i < 3; i++) {
        // Công thức tạo số ngẫu nhiên từ 1 đến 30
        let num = Math.floor(Math.random() * 30) + 1;
        numberSequence.push(num); 
    }
    
    currentIndex = 0;
    currentTimer = setTimeout(showNextNumber, 1000);
}
function showNextNumber() {
    if (!isPlaying) return;

    if (currentIndex >= 3) {
        numberDisplay.innerText = '?';
        gameMessage.innerText = 'Nhập tổng ngay!';
        answerSection.classList.remove('hidden');
        userInput.focus();
        
        timeRemaining = currentAnswerTime;
        startAnswerTimer();
        return;
    }

    let val = numberSequence[currentIndex];
    
    // SỬA TẠI ĐÂY: Chỉ hiện nguyên giá trị (số âm sẽ tự có dấu -, số dương hiện bình thường)
    numberDisplay.innerText = val; 
    
    currentIndex++;
    currentTimer = setTimeout(showNextNumber, currentLevelTime);
}

// CẢI TIẾN 2: Fix Bug Thanh Bar chạy tiếp từ vị trí cũ
function startAnswerTimer() {
    if (!isPlaying) return;
    timeBarContainer.classList.remove('hidden');
    barStartTime = Date.now(); // Lưu mốc bắt đầu
    
    // 1. Tính toán width hiện tại dựa trên thời gian còn lại
    let currentWidth = (timeRemaining / currentAnswerTime) * 100;
    
    // 2. Thiết lập thanh bar không có hiệu ứng để nhảy ngay về vị trí cũ
    timeBar.style.transition = 'none';
    timeBar.style.width = currentWidth + '%';

    // 3. Sau một khoảng ngắn, cho nó bắt đầu chạy về 0
    setTimeout(() => {
        if (!isPlaying) return;
        timeBar.style.transition = `width ${timeRemaining}ms linear`;
        timeBar.style.width = '0%';
    }, 50);

    // 4. Thiết lập timeout kết thúc game
    answerTimeout = setTimeout(() => {
        if (isPlaying) quitGame("Hết giờ");
    }, timeRemaining);
}

function checkAnswer() {
    if (!isPlaying) return;

    // Tạm dừng và tính toán thời gian đã mất khi nhấn nút
    if (answerTimeout) {
        clearTimeout(answerTimeout);
        let timeElapsed = Date.now() - barStartTime;
        timeRemaining -= timeElapsed; // Cập nhật thời gian còn lại
    }

    const playerAnswer = parseInt(userInput.value);
    const correctSum = numberSequence.reduce((a, b) => a + b, 0);

    // Xử lý khi bỏ trống hoặc nhập sai định dạng
    if (isNaN(playerAnswer)) {
        gameMessage.innerText = 'Vui lòng nhập số!';
        gameMessage.style.color = '#e74c3c';
        
        // Dừng thanh bar 1s cho người dùng đọc rồi chạy tiếp
        timeBar.style.transition = 'none'; 
        setTimeout(() => {
            if (isPlaying && !answerSection.classList.contains('hidden')) {
                startAnswerTimer(); // Chạy tiếp từ timeRemaining đã lưu
            }
        }, 1000);
        return;
    }

    if (playerAnswer === correctSum) {
        timeBarContainer.classList.add('hidden');
        currentScore += currentPointsReward;
        scoreSpan.innerText = currentScore;
        
        gameMessage.innerText = `ĐÚNG RỒI! +${currentPointsReward} điểm`;
        gameMessage.style.color = '#2ecc71';
        
        currentTimer = setTimeout(startRound, 1500);
    } else {
        quitGame("Sai đáp án");
    }
}

// --- Xử lý Bảng Xếp Hạng ---
function saveScoreToLeaderboard(score) {
    if (score === 0) return;
    const name = playerNameInput.value.trim() || "Ẩn danh";
    let scores = JSON.parse(localStorage.getItem('quickMathScoresV2')) || [];
    scores.push({ 
        name: name, 
        score: score, 
        date: new Date().toLocaleTimeString() 
    });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5);
    localStorage.setItem('quickMathScoresV2', JSON.stringify(scores));
}

function renderLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('quickMathScoresV2')) || [];
    leaderboardList.innerHTML = '';
    if (scores.length === 0) {
        leaderboardList.innerHTML = '<li>Chưa có dữ liệu</li>';
        return;
    }
    scores.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>#${index + 1} <strong>${item.name}</strong></span>
            <span class="rank-score">${item.score}</span>
        `;
        leaderboardList.appendChild(li);
    });
}

function clearData() {
    if(confirm("Xóa hết bảng xếp hạng?")) {
        localStorage.removeItem('quickMathScoresV2');
        renderLeaderboard();
    }
}

// Enter để trả lời
userInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter" && !answerSection.classList.contains('hidden')) {
    checkAnswer();
  }
});