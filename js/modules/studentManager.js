// 学生管理模块

// 初始化学生数据
const initializeStudents = () => {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    if (students.length === 0) {
        const names = [
            '蔡煜安', '陈泽勋', '陈梓轩', '洪健城', '黄镓艺', '江臻胤',
            '练长鑫', '廖柏辰', '林梓琦', '苏俊敏', '张煜锋', '陈煌仪',
            '王璟逸', '张瀚琪', '林禹衡', '王茁恺', '黄蓥芯', '杨子妍',
            '曾雅琳', '苏恩怡', '王希恩', '姚庄诚', '张宇彤', '李嘉勋',
            '林凯楠', '陈玥颖', '费奕文', '梁世弘', '吕紫翔', '李秋华',
            '许宏伟', '陈文铄', '赵梓言', '苏瑾萱', '陈嘉俊', '郑沛文'
        ];
        names.forEach((name, index) => {
            students.push({
                id: index + 1,
                name: name,
                score: 0
            });
        });
        localStorage.setItem('students', JSON.stringify(students));
    }
    return students;
};

// 更新分数
window.updateScore = (studentId, operation) => {
    const input = document.getElementById(`input-${studentId}`);
    const value = parseInt(input.value);
    
    if (isNaN(value) || value <= 0) {
        showAlert("请输入有效的正整数值");
        return;
    }

    const students = JSON.parse(localStorage.getItem('students'));
    const student = students.find(s => s.id === studentId);
    const oldScore = student.score;
    
    if (operation === 'add') {
        student.score += value;
    } else {
        student.score = Math.max(0, student.score - value);
    }
    
    addHistory(studentId, operation, value, oldScore, student.score);
    localStorage.setItem('students', JSON.stringify(students));
    updateDisplay(students);
    resetAdminTimer();
};

// 跳转到抽奖页面
window.goToLottery = (studentId) => {
    const students = JSON.parse(localStorage.getItem('students'));
    const student = students.find(s => s.id === studentId);
    if (student) {
        localStorage.setItem('currentLotteryStudent', JSON.stringify(student));
        window.location.href = 'lottery.html';
    } else {
        showAlert('无法找到学生信息！');
    }
};

// 修改编辑姓名函数
window.editName = (studentId) => {
    if (!isAdmin) {
        showAlert('修改姓名需要管理员权限！');
        return;
    }
    
    checkLock(() => {
        const students = JSON.parse(localStorage.getItem('students'));
        const student = students.find(s => s.id === studentId);
        currentEditingId = studentId;
        
        const modal = document.getElementById('nameEditModal');
        const input = document.getElementById('nameInput');
        input.value = student.name.replace(/^\d+\./, ''); // 移除现有序号
        modal.style.display = 'flex';
        input.focus();
        input.select();
        resetAdminTimer();  // 重置管理员超时计时器
    });
};

function closeNameEditModal() {
    document.getElementById('nameEditModal').style.display = 'none';
    currentEditingId = null;
}

function submitNameEdit() {
    const newName = document.getElementById('nameInput').value.trim();
    if (!newName) {
        showAlert('姓名不能为空！');
        return;
    }

    if (/\d/.test(newName)) {
        showAlert('姓名不能包含数字！');
        return;
    }

    if (currentEditingId) {
        const students = JSON.parse(localStorage.getItem('students'));
        const student = students.find(s => s.id === currentEditingId);
        const studentIndex = students.findIndex(s => s.id === currentEditingId);
        student.name = `${studentIndex + 1}.${newName}`;  // 添加序号前缀
        localStorage.setItem('students', JSON.stringify(students));
        updateDisplay(students);
        closeNameEditModal();
        showAlert('✅ 修改姓名成功！');
    }
}

// 添加回车键提交姓名修改
document.getElementById('nameInput').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        submitNameEdit();
    }
});

// 跳转到抽奖页面
window.goToLottery = (studentId) => {
    const students = JSON.parse(localStorage.getItem('students'));
    const student = students.find(s => s.id === studentId);
    if (!student) {
        showAlert('找不到该学生信息！');
        return;
    }

    // 检查积分是否满足初级奖池要求（50积分）
    if (student.score < 50) {
        showAlert('积分不足，请继续努力赚取积分！');
        return;
    }
    
    // 将学生信息存储到localStorage
    localStorage.setItem('currentLotteryStudent', JSON.stringify({
        id: student.id,
        name: student.name,
        score: student.score
    }));
    
    // 跳转到抽奖页面
    window.location.href = 'lottery.html';
};
// 按积分排序
window.sortStudents = () => {
    const students = JSON.parse(localStorage.getItem('students'));
    students.sort((a, b) => b.score - a.score);
    updateDisplay(students);
};

// 恢复默认排序
window.restoreOriginalOrder = () => {
    const students = JSON.parse(localStorage.getItem('students'));
    students.sort((a, b) => a.id - b.id);
    updateDisplay(students);
};
// 修改清除存储函数
window.clearStorage = () => {
    if (!isAdmin) {
        showAlert('此操作需要管理员权限！');
        return;
    }

    if (isLocked) {
        showAlert('系统已锁定，请先解锁！');
        return;
    }
    
    showConfirm('确定要清除所有数据吗？清除后将重新初始化学生名单', (result) => {
        if (result) {
            localStorage.removeItem('students');
            localStorage.removeItem('scoreHistory');
            showAlert('⚠️ 数据已清除，系统将重新初始化', true);
            setTimeout(() => location.reload(), 2000);
        }
    });
};

// 修改重置积分函数
window.resetAllScores = () => {
    if (!isAdmin) {
        showAlert('此操作需要管理员权限！');
        return;
    }

    if (isLocked) {
        showAlert('系统已锁定，请先解锁！');
        return;
    }

    showConfirm('确定要重置所有学生的积分吗？此操作不可恢复！', (result) => {
        if (result) {
            const students = JSON.parse(localStorage.getItem('students'));
            const history = JSON.parse(localStorage.getItem('scoreHistory')) || [];
            
            // 记录重置操作到历史记录
            students.forEach(student => {
                if (student.score > 0) {
                    history.push({
                        studentId: student.id,
                        studentName: student.name,
                        operation: 'reset',
                        value: student.score,
                        oldScore: student.score,
                        newScore: 0,
                        timestamp: new Date().toLocaleString()
                    });
                    student.score = 0;
                }
            });
            
            localStorage.setItem('students', JSON.stringify(students));
            localStorage.setItem('scoreHistory', JSON.stringify(history));
            updateDisplay(students);
            showAlert('✅ 所有学生积分已重置为0', false);
        }
    });
};



// 添加清除存储的函数
window.clearStorage = () => {
    if (!isAdmin) {
        showAlert('此操作需要管理员权限！');
        return;
    }

    if (isLocked) {
        showAlert('系统已锁定，请先解锁！');
        return;
    }
    
    const verifyAndClear = () => {
        showConfirm('确定要清除所有数据吗？清除后将重新初始化学生名单', (result) => {
            if (result) {
                localStorage.removeItem('students');
                localStorage.removeItem('scoreHistory');
                showAlert('⚠️ 数据已清除，系统将重新初始化', true);
                setTimeout(() => location.reload(), 2000);
            }
        });
    };

    // 先验证密码
    showVerifyPasswordModal(
        'clear',
        '此操作将清除所有数据，请输入系统密码确认身份',
        verifyAndClear
    );
};