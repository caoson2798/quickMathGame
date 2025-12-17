// --- Các biến toàn cục ---
let currentScore = 0;
let currentLevelTime = 2000;
let currentPointsReward = 10;
let currentAnswerTime = 20000;
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

// New Modal DOM elements
const gameModal = document.getElementById('game-modal');      // <-- MỚI
const modalTitle = document.getElementById('modal-title');    // <-- MỚI
const modalScore = document.getElementById('modal-score');    // <-- MỚI


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
    gameModal.classList.add('hidden'); // Đảm bảo modal ẩn khi bắt đầu

    startRound();
}

function quitGame(reason = "Dừng đột ngột") {
    // 1. Dừng mọi hoạt động
    isPlaying = false;
    if (currentTimer) clearTimeout(currentTimer);
    if (answerTimeout) clearTimeout(answerTimeout); 
    
    // 2. Lưu điểm
    saveScoreToLeaderboard(currentScore);

    // 3. Xử lý giao diện (DÙNG MODAL)
    if (reason === "Hết giờ" || reason === "Sai đáp án") {
        showGameOverModal(reason);
    } else {
        // Nếu bấm nút "Dừng & Lưu"
        screenGame.classList.add('hidden');
        screenSetup.classList.remove('hidden');
        renderLeaderboard();
    }
}

// Hàm mới để hiện modal Game Over (MỚI)
function showGameOverModal(reason) {
    // Ẩn các màn hình chơi game
    timeBarContainer.classList.add('hidden');
    screenGame.classList.add('hidden'); 
    
    // Cập nhật nội dung modal
    if (reason === "Hết giờ") {
        modalTitle.textContent = "HẾT THỜI GIAN!";
    } else if (reason === "Sai đáp án") {
        modalTitle.textContent = "SAI ĐÁP ÁN!";
    }
    
    modalScore.textContent = currentScore;

    // Hiển thị modal
    gameModal.classList.remove('hidden');
}

// Hàm mới cho nút "Trang chủ" trong modal (MỚI)
// function closeModalAndGoHome() {
//     gameModal.classList.add('hidden');
//     screenSetup.classList.remove('hidden');
//     renderLeaderboard();
// }

function startRound() {
    if (!isPlaying) return;
    
    if (answerTimeout) clearTimeout(answerTimeout); 
    timeBarContainer.classList.add('hidden');

    answerSection.classList.add('hidden');
    userInput.value = '';
    numberDisplay.innerText = '...';
    gameMessage.innerText = `Cấp độ: ${currentPointsReward} điểm/câu`;
    gameMessage.style.color = '#bdc3c7';

    // Tạo 3 số ngẫu nhiên TỪ 1 ĐẾN 50
    numberSequence = [];
    for(let i = 0; i < 3; i++) {
        numberSequence.push(Math.floor(Math.random() * 50) + 1); 
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
        
        startAnswerTimer();
        return;
    }

    numberDisplay.innerText = numberSequence[currentIndex];
    currentIndex++;

    currentTimer = setTimeout(showNextNumber, currentLevelTime);
}

function startAnswerTimer() {
    timeBarContainer.classList.remove('hidden');
    
    timeBar.style.width = '100%';
    timeBar.style.transitionDuration = `${currentAnswerTime / 1000}s`;

    setTimeout(() => {
        timeBar.style.width = '0%';
    }, 10);

    answerTimeout = setTimeout(() => {
        if (isPlaying) {
            quitGame("Hết giờ");
        }
    }, currentAnswerTime);
}

function checkAnswer() {
    if (!isPlaying) return;

    if (answerTimeout) clearTimeout(answerTimeout);
    timeBarContainer.classList.add('hidden');

    const playerAnswer = parseInt(userInput.value);
    const correctSum = numberSequence.reduce((a, b) => a + b, 0);

    if (isNaN(playerAnswer)) {
        gameMessage.innerText = 'Vui lòng nhập số!';
        gameMessage.style.color = '#e74c3c';
        answerTimeout = setTimeout(() => startAnswerTimer(), 1000);
        return;
    }

    if (playerAnswer === correctSum) {
        currentScore += currentPointsReward;
        scoreSpan.innerText = currentScore;
        
        gameMessage.innerText = `ĐÚNG RỒI! +${currentPointsReward} điểm`;
        gameMessage.style.color = '#2ecc71';
        
        currentTimer = setTimeout(startRound, 1500);
    } else {
        quitGame("Sai đáp án"); // Gọi quitGame, logic hiện modal sẽ được kích hoạt
    }
}

// --- Xử lý Bảng Xếp Hạng (Giữ nguyên) ---

function saveScoreToLeaderboard(score) {
    if (score === 0) return;

    const name = playerNameInput.value || "Ẩn danh";
    const levelName = levelSelect.options[levelSelect.selectedIndex].text;
    
    let scores = JSON.parse(localStorage.getItem('quickMathScoresV2')) || [];

    scores.push({ 
        name: name, 
        score: score, 
        level: levelName,
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
        // CẬP NHẬT: Loại bỏ thẻ <small> chứa cấp độ (item.level)
        li.innerHTML = `
            <span>
                #${index + 1} <strong>${item.name}</strong> 
                </span>
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

// Cho phép nhấn Enter để trả lời
userInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter" && !answerSection.classList.contains('hidden')) {
    checkAnswer();
  }
});