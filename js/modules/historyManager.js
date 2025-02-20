// 添加显示历史记录函数
window.showHistory = (studentId) => {
    const students = JSON.parse(localStorage.getItem('students'));
    const student = students.find(s => s.id === studentId);
    const history = JSON.parse(localStorage.getItem('scoreHistory')) || [];
    const studentHistory = history
        .filter(h => h.studentId === studentId)
        .reverse();

    const modal = document.getElementById('historyModal');
    const title = document.getElementById('historyTitle');
    const content = document.getElementById('historyContent');

    title.textContent = `${student.name} 的积分历史记录`;
    content.innerHTML = studentHistory.length ? 
        studentHistory.map(h => `
            <div class="history-item">
                ${h.timestamp}: 
                ${h.operation === 'add' ? '加' : '减'}${h.value}分
                （${h.oldScore} → ${h.newScore}）
            </div>
        `).join('') :
        '<div class="history-item">暂无历史记录</div>';

    modal.style.display = 'flex';
};

// 添加关闭历史记录弹窗函数
window.closeHistoryModal = () => {
    document.getElementById('historyModal').style.display = 'none';
};

// 点击弹窗外部关闭
window.onclick = (event) => {
    const modal = document.getElementById('historyModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};
// 修复历史记录存储函数
const addHistory = (studentId, operation, value, oldScore, newScore) => {
    const students = JSON.parse(localStorage.getItem('students'));
    const student = students.find(s => s.id === studentId);
    const history = JSON.parse(localStorage.getItem('scoreHistory')) || [];
    
    history.push({
        studentId,
        studentName: student.name,
        operation,
        value,
        oldScore,
        newScore,
        timestamp: new Date().toLocaleString()
    });
    
    // 只保留最近100条记录
    if (history.length > 100) history.shift();
    localStorage.setItem('scoreHistory', JSON.stringify(history));
};