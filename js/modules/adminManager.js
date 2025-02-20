

// 导出到Excel
window.exportToExcel = () => {
    if (!isAdmin) {
        showAlert('此操作需要管理员权限！');
        return;
    }

    const students = JSON.parse(localStorage.getItem('students'));
    const history = JSON.parse(localStorage.getItem('scoreHistory')) || [];

    // 准备学生数据工作表
    const studentData = students.map(s => ({
        '序号': s.id,
        '姓名': s.name.replace(/^\d+\./, ''), // 移除序号前缀
        '积分': s.score
    }));

    // 准备历史记录工作表
    const historyData = history.map(h => ({
        '时间': h.timestamp,
        '学生': h.studentName.replace(/^\d+\./, ''),
        '操作': h.operation === 'add' ? '加分' : h.operation === 'subtract' ? '减分' : '重置',
        '分值': h.value,
        '变更前积分': h.oldScore,
        '变更后积分': h.newScore
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 添加学生数据工作表
    const ws1 = XLSX.utils.json_to_sheet(studentData);
    XLSX.utils.book_append_sheet(wb, ws1, "学生积分");

    // 添加历史记录工作表
    const ws2 = XLSX.utils.json_to_sheet(historyData);
    XLSX.utils.book_append_sheet(wb, ws2, "历史记录");

    // 导出Excel文件
    XLSX.writeFile(wb, `积分数据_${new Date().toLocaleDateString()}.xlsx`);
};

// 从Excel导入
window.importFromExcel = () => {
    if (!isAdmin) {
        showAlert('此操作需要管理员权限！');
        return;
    }

    if (isLocked) {
        showAlert('系统已锁定，请先解锁！');
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                
                // 读取学生数据
                const studentSheet = workbook.Sheets[workbook.SheetNames[0]];
                const studentData = XLSX.utils.sheet_to_json(studentSheet);
                
                // 验证名字格式
                const invalidNames = studentData.filter(row => /\d/.test(row['姓名']));
                if (invalidNames.length > 0) {
                    showAlert('导入失败：以下学生姓名包含数字：\n' + 
                            invalidNames.map(row => row['姓名']).join('\n'));
                    return;
                }

                // 转换为应用格式
                const students = studentData.map((row, index) => ({
                    id: index + 1,
                    name: `${index + 1}.${row['姓名']}`,
                    score: parseInt(row['积分']) || 0
                }));

                // 保存数据
                localStorage.setItem('students', JSON.stringify(students));
                updateDisplay(students);
                showAlert('✅ 导入成功！');

            } catch (err) {
                console.error(err);
                showAlert('导入失败：文件格式错误');
            }
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
};
// 添加二维码相关函数
let qrcode = null;

function showQRCode() {
    const modal = document.getElementById('qrModal');
    modal.style.display = 'flex';
    
    if (!qrcode) {
        // 获取当前页面URL
        const currentURL = window.location.href;
        
        // 创建二维码
        qrcode = new QRCode("qrcode", {
            text: currentURL,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

function closeQRModal() {
    document.getElementById('qrModal').style.display = 'none';
}

// 点击弹窗外部关闭
document.querySelector('.qr-modal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeQRModal();
    }
});

// 添加修改密码相关函数
function showChangePasswordModal(isForced = false) {
    if (isLocked && !isForced) {
        showAlert('请先解锁系统再修改密码！');
        return;
    }
    const modal = document.getElementById('changePasswordModal');
    modal.style.display = 'flex';
    // 清空输入框
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // 如果是强制修改密码，禁用关闭按钮
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-btn-secondary');
    if (isForced) {
        closeBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        modal.setAttribute('data-forced', 'true');
    } else {
        closeBtn.style.display = 'block';
        cancelBtn.style.display = 'block';
        modal.removeAttribute('data-forced');
    }
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal.getAttribute('data-forced') === 'true') {
        showAlert('首次登录必须修改默认密码！');
        return;
    }
    modal.style.display = 'none';
}

// 修复修改密码函数
function submitChangePassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!oldPassword || !新密码 || !confirmPassword) {
        showAlert('请填写所有密码字段！');
        return;
    }

    if (oldPassword !== ADMIN_PASSWORD) {
        showAlert('原密码错误！');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('两次输入的新密码不一致！');
        return;
    }

    if (新密码.length < 6) {
        showAlert('新密码长度不能少于6位！');
        return;
    }

    // 更新管理员密码
    ADMIN_PASSWORD = newPassword;
    // 保存到 localStorage
    localStorage.setItem('adminPassword', newPassword);
    
    // 关闭弹窗
    const modal = document.getElementById('changePasswordModal');
    modal.removeAttribute('data-forced');
    modal.style.display = 'none';
    
    showAlert('✅ 密码修改成功！');
    resetAdminTimer();  // 重置管理员计时器
}

// 添加回车键提交支持
document.getElementById('confirmPassword').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        submitChangePassword();
    }
});

// 修改锁定系统函数
function lockSystem() {
    isLocked = true;
    document.body.classList.add('locked-state');
    document.body.classList.remove('unlocked-state');
    
    const lockBtn = document.querySelector('.lock-btn');
    const unlockBtn = document.querySelector('.center-unlock-btn');
    
    lockBtn.textContent = '系统已锁定';
    lockBtn.classList.add('locked');
    unlockBtn.style.display = 'block';
    
    // 禁用所有操作按钮和输入框
    const controls = document.querySelectorAll('.controls button:not(.lock-btn), .student-card button, .student-card input');
    controls.forEach(el => el.classList.add('disabled'));
}

// 修改解锁系统函数
function unlockSystem() {
    isLocked = false;
    document.body.classList.remove('locked-state');
    document.body.classList.add('unlocked-state');
    
    const lockBtn = document.querySelector('.lock-btn');
    const unlockBtn = document.querySelector('.center-unlock-btn');
    
    lockBtn.textContent = '点击锁定系统';
    lockBtn.classList.remove('locked');
    unlockBtn.style.display = 'none';
    
    // 启用所有操作按钮和输入框
    const controls = document.querySelectorAll('.controls button:not(.lock-btn), .student-card button, .student-card input');
    controls.forEach(el => el.classList.remove('disabled'));
    
    // 重新显示所有内容
    const students = JSON.parse(localStorage.getItem('students')) || [];
    updateDisplay(students);
}

// 修改密码提交函数
function submitPassword() {
    const password = document.getElementById('passwordInput').value;
    if (password === UNLOCK_PASSWORD) {
        closePasswordModal();
        unlockSystem();
        showAlert('✅ 验证成功，系统已解锁！');
    } else {
        showAlert('密码错误！');
    }
}

// 修改初始化函数
document.addEventListener('DOMContentLoaded', () => {
    // 初始化时设置锁定状态
    isLocked = true;
    document.body.classList.add('locked-state');
    
    const lockBtn = document.querySelector('.lock-btn');
    lockBtn.textContent = '系统已锁定';
    lockBtn.classList.add('locked');
    
    // 显示中央解锁按钮
    document.querySelector('.center-unlock-btn').style.display = 'block';
    
    // 初始化数据但不显示
    initializeStudents();
    
    // 从localStorage读取保存的密码
    const savedPassword = localStorage.getItem('systemPassword');
    if (savedPassword) {
        UNLOCK_PASSWORD = savedPassword;
    }
    
    // 更新界面
    updateAdminUI();
});

// 添加处理修改系统密码的函数
function handleSystemPasswordChange() {
    if (!isAdmin) {
        showAlert('需要管理员权限！');
        return;
    }
    
    if (isLocked) {
        showAlert('请先解锁系统再修改密码！');
        return;
    }

    const modal = document.getElementById('systemPasswordModal');
    // 清空输入框
    document.getElementById('currentSystemPassword').value = '';
    document.getElementById('newSystemPassword').value = '';
    document.getElementById('confirmSystemPassword').value = '';
    
    modal.style.display = 'flex';
    document.getElementById('currentSystemPassword').focus();
}

function closeSystemPasswordModal() {
    document.getElementById('systemPasswordModal').style.display = 'none';
}

// 修复系统解锁密码修改函数
function submitSystemPasswordChange() {
    const currentPassword = document.getElementById('currentSystemPassword').value;
    const newPassword = document.getElementById('newSystemPassword').value;
    const confirmPassword = document.getElementById('confirmSystemPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('请填写所有密码字段！');
        return;
    }

    if (currentPassword !== UNLOCK_PASSWORD) {
        showAlert('当前密码错误！');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('两次输入的新密码不一致！');
        return;
    }

    if (newPassword.length < 6) {
        showAlert('新密码长度不能少于6位！');
        return;
    }

    // 更新系统解锁密码
    UNLOCK_PASSWORD = newPassword;
    localStorage.setItem('systemPassword', newPassword);
    showAlert('✅ 系统解锁密码修改成功！');
    closeSystemPasswordModal();
}

// 重置系统密码为默认值
function resetSystemPassword() {
    UNLOCK_PASSWORD = '2020503';
    localStorage.setItem('systemPassword', '2020503');
    showAlert('✅ 系统密码已重置为：2020503');
}

// 添加回车键提交支持
document.getElementById('confirmSystemPassword').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        submitSystemPasswordChange();
    }
});

// 修复管理员登录相关变量
let isAdmin = false;
let ADMIN_PASSWORD = 'admin888';  // 默认管理员密码
let adminTimer = null;

// 修复管理员登录切换函数
function toggleAdmin() {
    if (isAdmin) {
        isAdmin = false;
        if (adminTimer) {
            clearTimeout(adminTimer);
            adminTimer = null;
        }
        updateAdminUI();
        showAlert('已退出管理员模式');
    } else {
        showAdminLogin();
    }
}

// 修复管理员登录函数
function submitAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    
    if (!password) {
        showAlert('请输入管理员密码！');
        return;
    }

    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        updateAdminUI();
        closeAdminLogin();
        
        // 检查是否是首次登录（使用默认密码）
        if (password === 'admin888') {
            showAlert('首次登录需要修改密码以保护数据安全！');
            setTimeout(() => {
                showChangePasswordModal(true); // true 表示强制修改密码
            }, 1500);
        } else {
            showAlert('✅ 管理员登录成功！');
        }
        
        // 设置自动退出计时器
        resetAdminTimer();
    } else {
        showAlert('管理员密码错误！');
    }
}

// 修复自动退出计时器函数
function resetAdminTimer() {
    if (adminTimer) {
        clearTimeout(adminTimer);
    }
    if (isAdmin) {
        adminTimer = setTimeout(() => {
            if (isAdmin) {
                isAdmin = false;
                updateAdminUI();
                showAlert('由于长时间未操作，已自动退出管理员模式');
            }
        }, 5 * 60 * 1000); // 5分钟
    }
}
// 修复 UI 更新函数
function updateAdminUI() {
    const adminBtn = document.querySelector('.admin-btn');
    if (adminBtn) {
        adminBtn.textContent = isAdmin ? '退出管理员' : '管理员登录';
    }
    document.body.classList.toggle('admin-mode', isAdmin);
}

// 修复管理员登录相关函数
function showAdminLogin() {
    const modal = document.getElementById('adminLoginModal');
    const input = document.getElementById('adminPassword');
    if (modal && input) {
        modal.style.display = 'flex';
        input.value = '';
        input.focus();
    }
}

function closeAdminLogin() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 添加管理员密码验证
function validateAdminPassword(password) {
    return password && password.length >= 6;
}

function submitAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    
    if (!password) {
        showAlert('请输入管理员密码！');
        return;
    }

    const savedAdminPassword = localStorage.getItem('adminPassword') || 'admin888';

    if (password === savedAdminPassword) {
        isAdmin = true;
        updateAdminUI();
        closeAdminLogin();
        
        // 检查是否是首次登录
        if (password === 'admin888') {
            showAlert('首次登录需要修改密码以保护数据安全！');
            setTimeout(() => {
                showChangePasswordModal(true); // 强制修改密码
            }, 1500);
        } else {
            showAlert('✅ 管理员登录成功！');
        }
        
        // 设置自动退出计时器
        resetAdminTimer();
    } else {
        showAlert('管理员密码错误！');
    }
}

// 修复管理员状态更新函数
function updateAdminUI() {
    const adminBtn = document.querySelector('.admin-btn');
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    
    if (adminBtn) {
        adminBtn.textContent = isAdmin ? '退出管理员' : '管理员登录';
    }
    
    // 更新所有管理员专属元素的显示状态
    adminOnlyElements.forEach(el => {
        el.style.display = isAdmin ? 'inline-block' : 'none';
    });
    
    // 更新 body 类名
    document.body.classList.toggle('admin-mode', isAdmin);
}

// 修复管理员退出定时器
function resetAdminTimer() {
    if (adminTimer) {
        clearTimeout(adminTimer);
    }
    
    if (isAdmin) {
        adminTimer = setTimeout(() => {
            if (isAdmin) {
                isAdmin = false;
                updateAdminUI();
                showAlert('由于长时间未操作，已自动退出管理员模式');
            }
        }, 5 * 60 * 1000); // 5分钟
    }
}


// 修复修改管理员密码函数和相关函数
function handleChangePassword() {
    if (!isAdmin) {
        showAlert('需要管理员权限！');
        return;
    }
    
    const modal = document.getElementById('changePasswordModal');
    if (!modal) return;
    
    // 清空输入框
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    modal.style.display = 'flex';
    document.getElementById('oldPassword').focus();
}

function submitChangePassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        showAlert('请填写所有密码字段！');
        return;
    }

    // 从 localStorage 获取当前管理员密码
    const currentAdminPassword = localStorage.getItem('adminPassword') || 'admin888';

    if (oldPassword !== currentAdminPassword) {
        showAlert('原密码错误！');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('两次输入的新密码不一致！');
        return;
    }

    if (newPassword.length < 6) {
        showAlert('新密码长度不能少于6位！');
        return;
    }

    if (newPassword === 'admin888') {
        showAlert('新密码不能与默认密码相同！');
        return;
    }

    // 更新管理员密码
    ADMIN_PASSWORD = newPassword;
    localStorage.setItem('adminPassword', newPassword);
    
    // 关闭弹窗
    const modal = document.getElementById('changePasswordModal');
    modal.removeAttribute('data-forced');
    modal.style.display = 'none';
    
    showAlert('✅ 管理员密码修改成功！');
    resetAdminTimer();
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (!modal) return;
    
    if (modal.getAttribute('data-forced') === 'true') {
        showAlert('首次登录必须修改默认密码！');
        return;
    }
    modal.style.display = 'none';
}

// 添加回车键提交支持
document.addEventListener('DOMContentLoaded', function() {
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                submitChangePassword();
            }
        });
    }
});

// 添加触摸设备输入优化
if ('ontouchstart' in window) {
    document.addEventListener('DOMContentLoaded', () => {
        // 优化数字输入
        document.querySelectorAll('.score-input').forEach(input => {
            input.addEventListener('focus', function() {
                this.select();
                // 在某些移动浏览器中，选择文本后会出现选择菜单，这里延迟执行可以避免这个问题
                setTimeout(() => {
                    this.select();
                }, 10);
            });
        });

        // 添加快捷输入按钮
        const quickInputs = ['1', '2', '5', '10'];
        document.querySelectorAll('.student-card').forEach(card => {
            const input = card.querySelector('.score-input');
            if (input) {
                const quickInputContainer = document.createElement('div');
                quickInputContainer.className = 'quick-inputs';
                quickInputContainer.style.display = 'flex';
                quickInputContainer.style.justifyContent = 'center';
                quickInputContainer.style.gap = '5px';
                quickInputContainer.style.marginTop = '5px';
                
                quickInputs.forEach(value => {
                    const btn = document.createElement('button');
                    btn.textContent = value;
                    btn.className = 'quick-input-btn';
                    btn.onclick = () => {
                        input.value = value;
                    };
                    quickInputContainer.appendChild(btn);
                });
                
                if (!card.classList.contains('add-student-card')) {
                    input.parentNode.insertBefore(quickInputContainer, input.nextSibling);
                }
            }
        });
    });
}
