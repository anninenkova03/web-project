// Auth page logic
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    if (authService.isAuthenticated()) {
        window.location.href = '../dashboard/dashboard.html';
        return;
    }

    initializeTabs();
    initializeForms();
});

function initializeTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active form
            forms.forEach(form => {
                if (form.id === targetTab + 'Form') {
                    form.classList.add('active');
                } else {
                    form.classList.remove('active');
                }
            });

            // Clear alerts and errors
            clearAlert();
            clearErrors();
        });
    });
}

function initializeForms() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

async function handleLogin(e) {
    e.preventDefault();
    clearErrors();
    clearAlert();

    const formData = new FormData(e.target);
    const login = formData.get('login');
    const password = formData.get('password');

    // Simple validation
    if (!login || !password) {
        showAlert('Моля попълнете всички полета', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Влизане...';

    try {
        await authService.login(login, password);
        
        showAlert('Успешен вход! Пренасочване...', 'success');
        
        setTimeout(() => {
            window.location.href = '../dashboard/dashboard.html';
        }, 1000);

    } catch (error) {
        showAlert(error.message || 'Грешка при вход', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Вход';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    clearErrors();
    clearAlert();

    const formData = new FormData(e.target);
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        full_name: formData.get('full_name'),
        password: formData.get('password'),
        password_confirmation: formData.get('password_confirmation')
    };

    // Client-side validation
    const errors = validateRegistration(data);
    if (Object.keys(errors).length > 0) {
        displayErrors(errors);
        return;
    }

    const submitBtn = e.target.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Регистрация...';

    try {
        await authService.register(data);
        
        showAlert('Успешна регистрация! Пренасочване...', 'success');
        
        setTimeout(() => {
            window.location.href = '../dashboard/dashboard.html';
        }, 1000);

    } catch (error) {
        const errorMessage = error.message || 'Грешка при регистрация';
        
        // Check if error contains field-specific errors
        if (error.message.includes('username')) {
            displayErrors({ username: [error.message] });
        } else if (error.message.includes('email')) {
            displayErrors({ email: [error.message] });
        } else {
            showAlert(errorMessage, 'error');
        }

        submitBtn.disabled = false;
        submitBtn.textContent = 'Регистрация';
    }
}

function validateRegistration(data) {
    const errors = {};

    // Username validation
    if (!data.username || data.username.length < 3) {
        errors.username = ['Потребителското име трябва да е поне 3 символа'];
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
        errors.username = ['Потребителското име може да съдържа само букви, цифри, _ и -'];
    }

    // Email validation
    if (!data.email || !isValidEmail(data.email)) {
        errors.email = ['Невалиден email адрес'];
    }

    // Full name validation
    if (!data.full_name || data.full_name.length < 2) {
        errors.full_name = ['Пълното име е задължително'];
    }

    // Password validation
    if (!data.password || data.password.length < 6) {
        errors.password = ['Паролата трябва да е поне 6 символа'];
    }

    // Password confirmation
    if (data.password !== data.password_confirmation) {
        errors.password_confirmation = ['Паролите не съвпадат'];
    }

    return errors;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function displayErrors(errors) {
    for (const [field, messages] of Object.entries(errors)) {
        const input = document.querySelector(`[name="${field}"]`);
        if (input) {
            const formGroup = input.closest('.form-group');
            formGroup.classList.add('error');
            const errorSpan = formGroup.querySelector('.error-message');
            if (errorSpan) {
                errorSpan.textContent = messages[0];
            }
        }
    }
}

function clearErrors() {
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });
}

function showAlert(message, type) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert alert-${type} show`;
}

function clearAlert() {
    const alert = document.getElementById('alert');
    alert.className = 'alert';
}
