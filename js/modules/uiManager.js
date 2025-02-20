// 修改分数颜色区间函数
const getScoreColorClass = (score) => {
    if (score >= 500) return 'score-500-1000';
    if (score >= 100) return 'score-100-500';
    return 'score-0-100';
};
// 添加更新排行榜函数
const updateLeaderboard = (students) => {
    const topStudents = [...students]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    // 更新固定排行榜
    const rankingList = document.getElementById('rankingList');
    updateRankingContent(rankingList, topStudents);

    // 更新移动端排行榜
    const mobileRankingList = document.getElementById('mobileRankingList');
    updateRankingContent(mobileRankingList, topStudents);
};

// 添加排行榜内容更新函数
const updateRankingContent = (container, students) => {
    if (!container) return;
    
    container.innerHTML = students.map((student, index) => {
        const rankNumber = index + 1;
        const crown = rankNumber <= 3 ? '👑' : '';
        const scoreColorClass = getScoreColorClass(student.score);
        return `
            <div class="rank-item rank-${rankNumber}">
                <div class="rank-number">${rankNumber}</div>
                <div class="rank-name">${student.name.replace(/^\d+\./, '')}</div>
                <div class="rank-score ${scoreColorClass}">${student.score}</div>
                <div class="rank-crown">${crown}</div>
            </div>
        `;
    }).join('');
};
// 修改积分符号转换函数，使用新的太阳图标
const convertScoreToSymbols = (score) => {
    const symbols = {
        text: '',
        html: ''
    };
    
    // 计算太阳数量（100分一个）
    const suns = Math.floor(score / 100);
    const remainingAfterSuns = score % 100;
    
    // 计算月亮数量（10分一个）
    const moons = Math.floor(remainingAfterSuns / 10);
    const remainingAfterMoons = remainingAfterSuns % 10;
    
    // 计算星星数量（1分一个）
    const stars = remainingAfterMoons;
    
    // 生成显示文本
    let textParts = [];
    if (suns > 0) textParts.push(`${suns}🌞`);  // 使用彩色太阳表情
    if (moons > 0) textParts.push(`${moons}🌙`);
    if (stars > 0) textParts.push(`${stars}⭐`);
    symbols.text = textParts.join(' ');
    
    // 生成HTML - 每个符号独立占据一个格子
    let htmlParts = [];
    for (let i = 0; i < suns; i++) {
        htmlParts.push(`<span class="sun">🌞</span>`);  // 使用彩色太阳表情
    }
    for (let i = 0; i < moons; i++) {
        htmlParts.push(`<span class="moon">🌙</span>`);
    }
    for (let i = 0; i < stars; i++) {
        htmlParts.push(`<span class="star">⭐</span>`);
    }
    symbols.html = htmlParts.join('');
    
    return symbols;
};

// 修复 updateDisplay 函数
const updateDisplay = (students) => {
    if (isLocked) return; // 锁定状态下不更新显示
    
    const container = document.getElementById('studentContainer');
    container.innerHTML = '';
    
    // 显示学生卡片
    students.forEach((student, index) => {
        const symbols = convertScoreToSymbols(student.score);
        const scoreColorClass = getScoreColorClass(student.score);
        const card = document.createElement('div');
        card.className = 'student-card';
        
        // 修改卡片内容，根据设备类型显示不同的内容
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // 移动端优化布局
            card.innerHTML = `
                <div class="student-name" onclick="editName(${student.id})">
                    ${(index + 1) + '.' + student.name.replace(/^\d+\./, '')}
                </div>
                <button class="history-btn" onclick="showHistory(${student.id})">
                    <span style="transform: rotate(-45deg)">📋</span>
                </button>
                <div class="total-score ${scoreColorClass}">
                    积分：${student.score}
                </div>
                <input type="number" 
                       class="score-input" 
                       id="input-${student.id}" 
                       min="0" 
                       value="1"
                       aria-label="分数值">
                <div class="button-group">
                    <button class="add-btn" onclick="updateScore(${student.id}, 'add')">+</button>
                    <button class="subtract-btn" onclick="updateScore(${student.id}, 'subtract')">-</button>
                    <button class="lottery-btn" onclick="goToLottery(${student.id})">🎰 抽奖</button>
                </div>
            `;
        } else {
            // 桌面端保持原有布局
            card.innerHTML = `
                <div class="delete-student-btn" onclick="deleteStudent(${student.id})" title="删除学生">×</div>
                <div class="student-name" onclick="editName(${student.id})">${(index + 1) + '.' + student.name.replace(/^\d+\./, '')}</div>
                <div class="score-display">
                    <div class="total-score ${scoreColorClass}">积分：${student.score}</div>
                    <div class="score-symbol" title="${symbols.text}">${symbols.html}</div>
                </div>
                <input type="number" class="score-input" id="input-${student.id}" min="0" value="1">
                <div class="button-group">
                    <button class="add-btn" onclick="updateScore(${student.id}, 'add')">+</button>
                    <button class="subtract-btn" onclick="updateScore(${student.id}, 'subtract')">-</button>
                    <button class="lottery-btn" onclick="goToLottery(${student.id})">🎰 抽奖</button>
                </div>
                <button class="history-btn" onclick="showHistory(${student.id})">历史</button>
            `;
        }
        
        container.appendChild(card);
    });

    // 添加新增学生卡片
    if (isAdmin) {
        const addCard = document.createElement('div');
        addCard.className = 'student-card add-student-card';
        addCard.onclick = showAddStudentModal;
        addCard.innerHTML = `<div class="add-icon">+</div>`;
        container.appendChild(addCard);
    }

    // 更新排行榜
    updateLeaderboard(students);
};

// 添加页面加载时的初始化
document.addEventListener('DOMContentLoaded', () => {
    // ...existing initialization code...
    
    // 初始化管理员状态
    isAdmin = false;
    ADMIN_PASSWORD = localStorage.getItem('adminPassword') || 'admin888';
    
    // 添加回车键提交支持
    document.getElementById('adminPassword').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            submitAdminLogin();
        }
    });
    
    // 初始化UI状态
    updateAdminUI();
});

// 添加点击外部关闭弹窗
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-base')) {
        // 如果点击的是模态框背景
        if (event.target.id === 'adminLoginModal') {
            closeAdminLogin();
        }
    }
});