
/**
 * Syst Team - Core Application & Authentication Manager
 * Gerenciamento de autenticação, sessão e avatares.
 */

const API_BASE_URL = window.location.origin;

/* =========================================
   UTILITÁRIOS
========================================= */

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function getInitials(name) {
    const parts = String(name || 'Usuário')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    return parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (parts[0]?.[0] || '?').toUpperCase();
}

/* =========================================
   AVATARES / GRAVATAR
========================================= */

const AvatarManager = {

    getGravatar(email) {
        if (!email || !window.md5) return null;

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return null;
        }

        const hash = window.md5(normalizedEmail);

        return `https://www.gravatar.com/avatar/${hash}?s=128&d=404`;
    },

    setupLoginPreview() {
        const emailInput = document.getElementById('login-email');
        const avatar = document.getElementById('login-avatar');
        const initial = document.getElementById('login-avatar-initial');
        const container = document.getElementById('login-avatar-container');

        if (!emailInput || !avatar || !initial || !container) return;

        let debounceTimer;

        function resetAvatar() {
            avatar.classList.remove('loaded');
            container.classList.remove('has-photo');
            avatar.removeAttribute('src');
        }

        emailInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);

            const email = emailInput.value.trim();
            const username = email.split('@')[0];

            initial.textContent = username
                ? getInitials(username)
                : '?';

            resetAvatar();

            if (!email.includes('@')) return;

            debounceTimer = setTimeout(() => {
                const imageUrl = AvatarManager.getGravatar(email);

                if (!imageUrl) return;

                avatar.dataset.requestedUrl = imageUrl;

                avatar.onload = () => {
                    if (avatar.dataset.requestedUrl !== imageUrl) return;

                    avatar.classList.add('loaded');
                    container.classList.add('has-photo');
                };

                avatar.onerror = () => {
                    if (avatar.dataset.requestedUrl !== imageUrl) return;

                    resetAvatar();
                };

                avatar.src = imageUrl;

            }, 450);
        });
    },

    createHeaderAvatar(user) {
        const initials = getInitials(
            user.firstName || user.name || user.email
        );

        const picture = user.picture || null;

        return `
            <div class="user-avatar">
                <span>${escapeHTML(initials)}</span>
                ${picture ? `
                    <img
                        src="${escapeHTML(picture)}"
                        alt="Foto de perfil"
                        referrerpolicy="no-referrer">
                ` : ''}
            </div>
        `;
    }
};

/* =========================================
   COOKIES
========================================= */

const CookieManager = {

    set(name, value, days = 7) {
        const expires = new Date(
            Date.now() + days * 864e5
        ).toUTCString();

        const secure = window.location.protocol === 'https:'
            ? '; Secure'
            : '';

        document.cookie =
            `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
    },

    get(name) {
        try {
            const cookie = document.cookie
                .split('; ')
                .find(item => item.startsWith(`${name}=`));

            return cookie
                ? decodeURIComponent(cookie.substring(name.length + 1))
                : '';

        } catch {
            return '';
        }
    },

    remove(name) {
        document.cookie =
            `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    }
};

/* =========================================
   AUTENTICAÇÃO
========================================= */

const Auth = {

    getUser() {
        const userCookie = CookieManager.get('syst_user');

        if (!userCookie) return null;

        try {
            return JSON.parse(userCookie);
        } catch {
            return null;
        }
    },

    setUserSession(userData, token = null) {
        CookieManager.set(
            'syst_user',
            JSON.stringify(userData),
            7
        );

        if (token) {
            CookieManager.set('syst_token', token, 7);
        }
    },

    logout() {
        CookieManager.remove('syst_user');
        CookieManager.remove('syst_token');

        window.location.reload();
    }
};

/* =========================================
   CABEÇALHO
========================================= */

function renderHeaderAuth() {

    const headerContainer = document.getElementById(
        'auth-header-container'
    );

    const mobileAuthItem = document.getElementById(
        'mobile-auth-item'
    );

    const user = Auth.getUser();

    if (!user) return;

    const firstName = user.firstName ||
        user.name?.split(' ')[0] ||
        user.email?.split('@')[0] ||
        'Usuário';

    if (headerContainer) {

        headerContainer.innerHTML = `
            <div class="user-profile-badge">

                ${AvatarManager.createHeaderAvatar(user)}

                <span>
                    Olá, <strong>${escapeHTML(firstName)}</strong>
                </span>

                <button
                    onclick="Auth.logout()"
                    class="btn-logout"
                    title="Sair da conta">
                    Sair
                </button>

            </div>
        `;

        const headerImage = headerContainer.querySelector(
            '.user-avatar img'
        );

        if (headerImage) {
            headerImage.addEventListener('error', () => {
                headerImage.remove();
            });
        }
    }

    if (mobileAuthItem) {

        mobileAuthItem.innerHTML = `
            <a
                href="#"
                onclick="event.preventDefault(); Auth.logout()"
                class="nav-mobile-link"
                style="color: var(--color-bordo);">
                Sair (${escapeHTML(firstName)})
            </a>
        `;
    }
}

/* =========================================
   ALERTAS
========================================= */

function showAlert(element, message, type) {

    if (!element) return;

    element.className = `alert-box ${type}`;
    element.textContent = message;
    element.style.display = 'block';
}

/* =========================================
   LOGIN / CADASTRO
========================================= */

async function handleAuthSubmit(event, type) {

    event.preventDefault();

    const alertBox = document.getElementById('auth-alert');

    if (alertBox) {
        alertBox.style.display = 'none';
    }

    let payload = {};

    if (type === 'login') {

        payload = {
            email: document.getElementById('login-email').value.trim(),
            password: document.getElementById('login-password').value
        };

    } else {

        payload = {
            firstName: document.getElementById('reg-firstname').value.trim(),
            lastName: document.getElementById('reg-lastname').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value
        };
    }

    try {

        /*
         * INTEGRAÇÃO COM BACKEND
         *
         * Quando o servidor estiver pronto, substitua
         * a simulação abaixo por uma requisição real.
         *
         * const response = await fetch(
         *     `${API_BASE_URL}/api/auth/${type}`,
         *     {
         *         method: 'POST',
         *         headers: {
         *             'Content-Type': 'application/json'
         *         },
         *         credentials: 'include',
         *         body: JSON.stringify(payload)
         *     }
         * );
         *
         * const data = await response.json();
         *
         * if (!response.ok) {
         *     throw new Error(data.message || 'Erro na autenticação');
         * }
         *
         * Auth.setUserSession(data.user);
         */

        // SIMULAÇÃO TEMPORÁRIA

        const gravatar = AvatarManager.getGravatar(payload.email);

        const dummyUser = {
            firstName: payload.firstName || payload.email.split('@')[0],
            lastName: payload.lastName || '',
            email: payload.email,
            picture: gravatar
        };

        Auth.setUserSession(
            dummyUser,
            'sample_jwt_token_syst_team'
        );

        showAlert(
            alertBox,
            'Sucesso! Redirecionando...',
            'success'
        );

        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1000);

    } catch (err) {

        showAlert(
            alertBox,
            err.message || 'Falha ao conectar com o servidor.',
            'error'
        );
    }
}

/* =========================================
   INICIALIZAÇÃO
========================================= */

document.addEventListener('DOMContentLoaded', () => {

    renderHeaderAuth();

    AvatarManager.setupLoginPreview();

});
