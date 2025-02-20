// 添加锁定相关变量和函数
let isLocked = true; // 默认锁定状态
let UNLOCK_PASSWORD = '2020503';  // 系统密码

// 检查登录状态
function checkLoginStatus() {
    const loginStatus = localStorage.getItem('loginStatus');
    const expiryTime = localStorage.getItem('loginExpiry');
    
    if (loginStatus && expiryTime) {
        if (new Date().getTime() < parseInt(expiryTime)) {
            unlockSystem();
            return true;
        } else {
            localStorage.removeItem('loginStatus');
            localStorage.removeItem('loginExpiry');
        }
    }
    return false;
}

// 切换锁定状态
window.toggleLock = () => {
    if (!isLocked) {
        lockSystem();
    } else {
        showPasswordModal();
    }
};

// 添加密码弹窗相关函数
function showPasswordModal() {
    const modal = document.getElementById('passwordModal');
    const input = document.getElementById('passwordInput');
    modal.style.display = 'flex';
    input.value = '';
    input.focus();
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
}

function submitPassword() {
    const password = document.getElementById('passwordInput').value;
    if (password === UNLOCK_PASSWORD) {
        closePasswordModal();
        unlockSystem();
        // 设置登录状态和过期时间（5分钟后过期）
        localStorage.setItem('loginStatus', 'true');
        localStorage.setItem('loginExpiry', (new Date().getTime() + 5 * 60 * 1000).toString());
        showAlert('✅ 验证成功，系统已解锁！');
    } else {
        showAlert('密码错误！');
    }
}

// 添加回车键提交密码功能
document.getElementById('passwordInput').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        submitPassword();
    }
});

// 点击弹窗外部关闭
document.getElementById('passwordModal').addEventListener('click', function(event) {
    if (event.target === this) {
        closePasswordModal();
    }
});

// 页面加载时检查登录状态
window.addEventListener('load', function() {
    checkLoginStatus();
});

// 更新锁定状态UI
const updateLockState = () => {
    const lockBtn = document.querySelector('.lock-btn');
    const controls = document.querySelectorAll('.controls button:not(.lock-btn), .student-card button, .student-name');
    
    if (isLocked) {
        lockBtn.textContent = '系统已锁定';
        lockBtn.classList.add('locked');
        controls.forEach(el => el.classList.add('disabled'));
    } else {
        lockBtn.textContent = '系统未锁定';
        lockBtn.classList.remove('locked');
        controls.forEach(el => el.classList.remove('disabled'));
    }
};

// 修改所有操作函数，添加锁定检查
const checkLock = (callback) => {
    if (isLocked) {
        showAlert('系统已锁定，请先解锁！');
        return false;
    }
    return callback();
};

// 添加自定义弹窗相关函数
let confirmCallback = null;

// 修改显示提示的函数
function showAlert(message, isWarning = false) {
    // 关闭其他所有弹窗
    const modals = document.querySelectorAll('.modal-base');
    modals.forEach(modal => {
        if (modal.id !== 'alertModal') {
            modal.style.display = 'none';
        }
    });

    const modal = document.getElementById('alertModal');
    const content = document.getElementById('alertContent');
    const alertClass = isWarning ? 'warning' : '';
    
    // 添加或移除 warning 类
    modal.className = `modal-base system-alert ${alertClass}`;
    
    // 根据消息类型设置不同的标题
    const title = modal.querySelector('.modal-title');
    title.textContent = isWarning ? '系统警告' : '系统提示';
    
    // 设置消息内容
    content.textContent = message;
    modal.style.display = 'flex';

    // 3秒后自动关闭
    setTimeout(() => {
        closeAlertModal();
    }, 3000);
}

// 修改关闭提示的函数
function closeAlertModal() {
    const modal = document.getElementById('alertModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showConfirm(message, callback) {
    const modal = document.getElementById('confirmModal');
    const content = document.getElementById('confirmContent');
    content.textContent = message;
    confirmCallback = callback;
    modal.style.display = 'flex';
}

function handleConfirm(result) {
    document.getElementById('confirmModal').style.display = 'none';
    if (confirmCallback) {
        confirmCallback(result);
        confirmCallback = null;
    }
}

// 初始化
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
    const savedAdminPassword = localStorage.getItem('adminPassword');
    if (savedPassword) {
        UNLOCK_PASSWORD = savedPassword;
    }
    if (savedAdminPassword) {
        ADMIN_PASSWORD = savedAdminPassword;
    }
    updateAdminUI();
});

// 点击弹窗外部关闭
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal-base');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
            if (modal.id === 'nameEditModal') {
                currentEditingId = null;
            }
        }
    });
});