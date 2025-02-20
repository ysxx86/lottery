// 奖品池配置
const prizePool = {
    level1: ['铅笔', '橡皮', '本子', '尺子', '圆珠笔', '记号笔'],
    level2: ['零食', '薯片', '魔芋爽', '饼干', '糖果', '巧克力'],
    level3: ['可乐', '奶茶', '饮料', '汉堡', '三明治', '果汁']
};

// 积分消耗配置
const costConfig = {
    1: 50,
    2: 100,
    3: 150
};

// 积分范围配置
const scoreRanges = {
    1: { min: 0, max: 100 },
    2: { min: 100, max: 150 },
    3: { min: 150, max: 300 }
};

let currentStudent = null; // 当前学生信息
let currentEditLevel = 1; // 当前编辑的奖池等级
// 添加获奖记录相关变量
let winningRecords = [];

// 在页面加载时初始化获奖记录
window.onload = () => {
    // 从localStorage获取当前学生信息
    const studentData = localStorage.getItem('currentLotteryStudent');
    if (!studentData) {
        alert('无法获取学生信息！');
        window.location.href = 'index.html';
        return;
    }

    currentStudent = JSON.parse(studentData);
    document.getElementById('currentStudent').textContent = currentStudent.name;
    
    // 初始化获奖记录
    loadWinningRecords();
    // 确保初始时记录区域是隐藏的
    document.querySelector('.winning-records').style.display = 'none';
    updateScore();
    updatePrizesList();
};

// 加载获奖记录
function loadWinningRecords() {
    const today = new Date().toLocaleDateString();
    const records = JSON.parse(localStorage.getItem('winningRecords')) || {};
    winningRecords = records[today] || [];
    updateWinningRecordsList();
}

// 更新获奖记录显示
function updateWinningRecordsList() {
    const recordsList = document.getElementById('winningRecordsList');
    const winningRecordsContainer = document.querySelector('.winning-records');
    recordsList.innerHTML = winningRecords.map(record => `
        <div class="record-item">
            <div class="time">${record.time}</div>
            <div class="student">${record.studentName}</div>
            <div class="prize">获得：${record.prize}</div>
        </div>
    `).join('');
    // 如果有记录则显示记录区域
    winningRecordsContainer.style.display = winningRecords.length > 0 ? 'block' : 'none';
}

// 添加获奖记录
function addWinningRecord(prize, level) {
    const now = new Date();
    const record = {
        time: now.toLocaleTimeString(),
        studentName: currentStudent.name,
        prize: prize,
        level: level,
        cost: costConfig[level]
    };

    const today = now.toLocaleDateString();
    const records = JSON.parse(localStorage.getItem('winningRecords')) || {};
    if (!records[today]) {
        records[today] = [];
    }
    records[today].push(record);
    winningRecords = records[today];

    localStorage.setItem('winningRecords', JSON.stringify(records));
    updateWinningRecordsList();
}

// 导出获奖记录
function exportWinningRecords() {
    const records = winningRecords.map(record => ({
        '时间': record.time,
        '学生姓名': record.studentName,
        '奖品': record.prize,
        '奖池等级': ['初级', '中级', '高级'][record.level - 1],
        '消耗积分': record.cost
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(records);
    XLSX.utils.book_append_sheet(wb, ws, "获奖记录");

    // 导出Excel文件
    const today = new Date().toLocaleDateString().replace(/\//g, '-');
    XLSX.writeFile(wb, `抽奖记录_${today}.xlsx`);
}

// 修改抽奖函数，添加记录功能
function drawPrize(level) {
    const cost = costConfig[level];
    const button = event.target;
    
    if (currentStudent.score < cost) {
        alert('积分不足！');
        return;
    }

    // 禁用所有抽奖按钮
    document.querySelectorAll('.section button').forEach(btn => {
        btn.disabled = true;
    });

    // 选择奖品并开始滚动
    const prizes = level === 1 ? prizePool.level1 :
                  level === 2 ? prizePool.level2 :
                  prizePool.level3;
    
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const prize = prizes[randomIndex];

    // 扣除积分并更新学生数据
    currentStudent.score -= cost;
    
    // 更新主系统中的学生数据
    const students = JSON.parse(localStorage.getItem('students'));
    const student = students.find(s => s.id === currentStudent.id);
    if (student) {
        student.score = currentStudent.score;
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('currentLotteryStudent', JSON.stringify(currentStudent));
    }
    
    updateScore();
    
    // 开始滚动效果
    rollPrizes(level, prize);

    // 添加获奖记录
    addWinningRecord(prize, level);

    // 滚动结束后启用按钮
    setTimeout(() => {
        document.querySelectorAll('.section button').forEach(btn => {
            btn.disabled = false;
        });
    }, 2500);
}

// 更新积分显示
function updateScore() {
    if (!currentStudent) return;
    currentScore = currentStudent.score; // 更新currentScore变量
    document.getElementById('currentScore').textContent = currentScore;
    document.getElementById('scoreInput').value = currentScore;
    updatePrizePoolsVisibility();
}

// 更新奖池显示逻辑
function updatePrizePoolsVisibility() {
    const primaryPool = document.querySelector('.section.primary');
    const intermediatePool = document.querySelector('.section.intermediate');
    const advancedPool = document.querySelector('.section.advanced');

    // 重置所有奖池显示状态
    primaryPool.classList.remove('visible');
    intermediatePool.classList.remove('visible');
    advancedPool.classList.remove('visible');

    // 只要积分足够就显示对应奖池
    if (currentScore >= costConfig[1]) {
        primaryPool.classList.add('visible');
    }
    if (currentScore >= costConfig[2]) {
        intermediatePool.classList.add('visible');
    }
    if (currentScore >= costConfig[3]) {
        advancedPool.classList.add('visible');
    }
}

// 修改滚动展示函数
function rollPrizes(level, finalPrize, duration = 2000) {
    const prizeRoll = document.getElementById('prizeRoll');
    const finalResult = document.getElementById('finalResult');
    const rollingContainer = document.getElementById('rollingContainer');
    const prizes = level === 1 ? prizePool.level1 :
                  level === 2 ? prizePool.level2 :
                  prizePool.level3;
    
    // 显示滚动容器
    rollingContainer.style.display = 'block';
    finalResult.classList.remove('show');
    
    // 创建滚动容器
    const container = document.createElement('div');
    container.className = 'prize-container rolling';
    
    // 初始化滚动内容
    function updateRollContent() {
        const randomPrizes = Array.from({length: 3}, () => 
            prizes[Math.floor(Math.random() * prizes.length)]);
        container.innerHTML = randomPrizes
            .map(prize => `<div class="prize-item">${prize}</div>`)
            .join('');
    }
    
    // 清空并添加滚动容器
    prizeRoll.innerHTML = '';
    prizeRoll.appendChild(container);
    
    // 开始滚动
    let rollInterval = setInterval(updateRollContent, 50);
    
    // 结束滚动
    setTimeout(() => {
        clearInterval(rollInterval);
        rollingContainer.style.display = 'none';
        
        // 显示最终结果
        setTimeout(() => {
            const levelNames = {1: '初级', 2: '中级', 3: '高级'};
            finalResult.innerHTML = `
                <div>🎉 恭喜抽中：${finalPrize}</div>
                <div>从${levelNames[level]}奖池中抽取，扣除 ${costConfig[level]} 积分</div>
                <div>💰 剩余积分：${currentScore}</div>
            `;
            finalResult.classList.add('show');
        }, 500);
    }, duration);
}

// 添加积分输入处理函数
function handleScoreUpdate() {
    const scoreInput = document.getElementById('scoreInput');
    const newScore = parseInt(scoreInput.value);
    
    if (isNaN(newScore) || newScore < 0) {
        alert('请输入有效的积分值！');
        scoreInput.value = currentScore;
        return;
    }

    currentScore = newScore;
    updateScore();
}

// 显示奖品列表
function updatePrizesList() {
    document.getElementById('level1-prizes').textContent = prizePool.level1.join('、');
    document.getElementById('level2-prizes').textContent = prizePool.level2.join('、');
    document.getElementById('level3-prizes').textContent = prizePool.level3.join('、');
}

// 显示编辑弹窗
function showEditPrizes(level) {
    currentEditLevel = level;
    const modal = document.getElementById('editModal');
    const prizeInput = document.getElementById('prizeInput');
    const prizes = level === 1 ? prizePool.level1 :
                  level === 2 ? prizePool.level2 :
                  prizePool.level3;
    
    prizeInput.value = prizes.join('\n');
    modal.style.display = 'block';
}

// 关闭编辑弹窗
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// 保存奖品
function savePrizes() {
    const prizeInput = document.getElementById('prizeInput');
    const prizes = prizeInput.value.split('\n')
        .map(prize => prize.trim())
        .filter(prize => prize !== '')
        .slice(0, 6);
    
    if (prizes.length === 0) {
        alert('请至少输入一个奖品！');
        return;
    }

    // 更新奖品池
    if (currentEditLevel === 1) {
        prizePool.level1 = prizes;
    } else if (currentEditLevel === 2) {
        prizePool.level2 = prizes;
    } else {
        prizePool.level3 = prizes;
    }

    updatePrizesList();
    closeEditModal();
}

// 初始化事件监听
document.getElementById('updateScoreBtn').addEventListener('click', handleScoreUpdate);

// 添加回车键处理
document.getElementById('scoreInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleScoreUpdate();
    }
});

// 初始化时显示奖品列表
updatePrizesList();

// 添加ESC键关闭弹窗
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEditModal();
    }
});

// 初始化积分显示
updateScore();

// 初始化时调用显示更新
updatePrizePoolsVisibility();
