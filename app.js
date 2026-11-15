/**
 * Syst Team — Client application
 * Real authentication against the Syst Team REST API.
 */
(() => {
    'use strict';

    const API_BASE_URL = 'https://syst-server.onrender.com/api/v1';
    const SESSION_TOKEN_KEY = 'syst_access_token';
    const SESSION_USER_KEY = 'syst_user';

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    function getInitials(name) {
        const parts = String(name || 'Usuário').trim().split(/\s+/).filter(Boolean);
        return (parts.length > 1 ? parts[0][0] + parts.at(-1)[0] : parts[0]?.[0] || '?').toUpperCase();
    }

    async function apiRequest(path, options = {}) {
        const headers = new Headers(options.headers || {});
        if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

        const token = Auth.getToken();
        if (token && options.auth !== false) headers.set('Authorization', `Bearer ${token}`);

        let response;
        try {
            response = await fetch(`${API_BASE_URL}${path}`, {
                ...options,
                headers,
                cache: 'no-store',
                credentials: 'omit'
            });
        } catch {
            throw new Error('Não foi possível conectar à Syst API. Verifique sua conexão e tente novamente.');
        }

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            const error = new Error(payload?.error?.message || 'Não foi possível concluir a solicitação.');
            error.status = response.status;
            error.code = payload?.error?.code;
            error.fields = payload?.error?.fields || [];
            throw error;
        }
        return payload;
    }

    const Auth = {
        getToken() {
            try { return sessionStorage.getItem(SESSION_TOKEN_KEY) || ''; }
            catch { return ''; }
        },
        getUser() {
            try { return JSON.parse(sessionStorage.getItem(SESSION_USER_KEY) || 'null'); }
            catch { return null; }
        },
        setUserSession(user, token) {
            sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
            sessionStorage.setItem(SESSION_TOKEN_KEY, token);
        },
        clearSession() {
            sessionStorage.removeItem(SESSION_USER_KEY);
            sessionStorage.removeItem(SESSION_TOKEN_KEY);
        },
        async restoreSession() {
            const cachedUser = this.getUser();
            if (!this.getToken()) return null;
            try {
                const result = await apiRequest('/auth/me');
                sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(result.data.user));
                return result.data.user;
            } catch (error) {
                if (error.status === 401 || error.status === 403) this.clearSession();
                // Keep the cached header during temporary network/API outages; protected actions still require the server.
                return this.getUser() || cachedUser;
            }
        },
        async logout() {
            try {
                if (this.getToken()) await apiRequest('/auth/logout', { method: 'POST' });
            } catch (error) {
                console.warn('A sessão será removida localmente:', error.message);
            } finally {
                this.clearSession();
                window.location.reload();
            }
        }
    };

    const AvatarManager = {
        getGravatar(email) {
            if (!email || typeof window.md5 !== 'function') return null;
            const normalized = email.trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;
            return `https://www.gravatar.com/avatar/${window.md5(normalized)}?s=128&d=404`;
        },
        setupLoginPreview() {
            const emailInput = document.getElementById('login-email');
            const avatar = document.getElementById('login-avatar');
            const initial = document.getElementById('login-avatar-initial');
            const container = document.getElementById('login-avatar-container');
            if (!emailInput || !avatar || !initial || !container) return;

            let timer;
            let version = 0;
            const reset = () => {
                avatar.classList.remove('loaded');
                container.classList.remove('has-photo');
                avatar.removeAttribute('src');
            };
            emailInput.addEventListener('input', () => {
                clearTimeout(timer);
                const email = emailInput.value.trim();
                initial.textContent = email.split('@')[0] ? getInitials(email.split('@')[0]) : '?';
                reset();
                const current = ++version;
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
                timer = setTimeout(() => {
                    const url = this.getGravatar(email);
                    if (!url) return;
                    avatar.onload = () => {
                        if (current !== version) return;
                        avatar.classList.add('loaded');
                        container.classList.add('has-photo');
                    };
                    avatar.onerror = () => { if (current === version) reset(); };
                    avatar.src = url;
                }, 450);
            });
        },
        createHeaderAvatar(user) {
            const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
            const url = this.getGravatar(user.email);
            return `<div class="user-avatar"><span>${escapeHTML(getInitials(name))}</span>${url ? `<img src="${escapeHTML(url)}" alt="" referrerpolicy="no-referrer">` : ''}</div>`;
        }
    };

    function renderHeaderAuth(user) {
        const headerContainer = document.getElementById('auth-header-container');
        const mobileAuthItem = document.getElementById('mobile-auth-item');
        if (!user) return;

        const firstName = user.firstName || user.fullName?.split(' ')[0] || 'Usuário';
        if (headerContainer) {
            headerContainer.innerHTML = `<div class="user-profile-badge">${AvatarManager.createHeaderAvatar(user)}<span>Olá, <strong>${escapeHTML(firstName)}</strong></span><button type="button" id="syst-logout" class="btn-logout" title="Sair da conta">Sair</button></div>`;
            headerContainer.querySelector('#syst-logout')?.addEventListener('click', () => Auth.logout());
            headerContainer.querySelector('.user-avatar img')?.addEventListener('error', (event) => event.currentTarget.remove());
        }
        if (mobileAuthItem) {
            mobileAuthItem.innerHTML = `<a href="#" id="syst-mobile-logout" class="nav-mobile-link">Sair (${escapeHTML(firstName)})</a>`;
            mobileAuthItem.querySelector('#syst-mobile-logout')?.addEventListener('click', (event) => {
                event.preventDefault();
                Auth.logout();
            });
        }
    }

    function showAlert(element, message, type) {
        if (!element) return;
        element.className = `alert-box ${type}`;
        element.textContent = message;
        element.style.display = 'block';
    }

    async function handleAuthSubmit(event, type) {
        event.preventDefault();
        const alertBox = document.getElementById('auth-alert');
        const form = event.currentTarget;
        const submitButton = form.querySelector('[type="submit"]');
        if (alertBox) alertBox.style.display = 'none';
        if (submitButton) submitButton.disabled = true;

        const payload = type === 'login' ? {
            email: document.getElementById('login-email').value.trim(),
            password: document.getElementById('login-password').value
        } : {
            firstName: document.getElementById('reg-firstname').value.trim(),
            lastName: document.getElementById('reg-lastname').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value
        };

        try {
            const result = await apiRequest(`/auth/${type === 'register' ? 'register' : 'login'}`, {
                method: 'POST',
                auth: false,
                body: JSON.stringify(payload)
            });
            Auth.setUserSession(result.data.user, result.data.accessToken);
            showAlert(alertBox, type === 'register' ? 'Conta criada! Redirecionando...' : 'Login realizado! Redirecionando...', 'success');
            window.setTimeout(() => { window.location.href = '../index.html'; }, 650);
        } catch (error) {
            let message = error.message;
            if (error.code === 'VALIDATION_ERROR' && error.fields?.length) {
                message = error.fields.map((field) => field.message).join(' ');
            }
            showAlert(alertBox, message, 'error');
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    }

    window.Auth = Auth;
    window.SystAPI = { request: apiRequest, baseUrl: API_BASE_URL };
    window.handleAuthSubmit = handleAuthSubmit;

    document.addEventListener('DOMContentLoaded', async () => {
        AvatarManager.setupLoginPreview();
        if (document.getElementById('auth-header-container')) {
            const user = await Auth.restoreSession();
            renderHeaderAuth(user);
        }
    });
})();
