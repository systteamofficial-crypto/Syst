(() => {
    'use strict';

    const API = 'https://syst-server.onrender.com/api/v1';
    const $ = (selector) => document.querySelector(selector);

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    async function request(path, options = {}) {
        const headers = new Headers(options.headers || {});
        const token = sessionStorage.getItem('syst_access_token');
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (options.body) headers.set('Content-Type', 'application/json');

        const response = await fetch(`${API}${path}`, {
            ...options, headers, cache: 'no-store', credentials: 'omit'
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error?.message || 'Não foi possível carregar as avaliações.');
        return body;
    }

    function formatDate(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
    }

    function renderReviews(items) {
        const list = $('#reviews-list');
        if (!list) return;
        if (!items.length) {
            list.innerHTML = '<p class="reviews-empty">Ainda não há avaliações publicadas. Seja a primeira pessoa a compartilhar sua experiência.</p>';
            return;
        }
        list.innerHTML = items.map((item) => `
            <article class="review-card">
                <div class="review-card-top">
                    <span class="review-card-stars" aria-label="${Number(item.rating)} de 5 estrelas">${'★'.repeat(Number(item.rating))}${'☆'.repeat(5 - Number(item.rating))}</span>
                    <time class="review-card-date" datetime="${escapeHTML(item.createdAt)}">${escapeHTML(formatDate(item.createdAt))}</time>
                </div>
                ${item.title ? `<h3 class="review-card-title">${escapeHTML(item.title)}</h3>` : ''}
                <p class="review-card-comment">${escapeHTML(item.comment)}</p>
                <p class="review-card-author">${escapeHTML(item.author || 'Cliente Syst Team')}</p>
            </article>`).join('');
    }

    function updateSummary(meta) {
        const average = $('#reviews-average');
        const stars = $('#reviews-summary-stars');
        const count = $('#reviews-count');
        if (average) average.textContent = Number(meta.averageRating || 0).toFixed(1).replace('.', ',');
        if (stars) stars.textContent = meta.total ? '★'.repeat(Math.round(meta.averageRating)) + '☆'.repeat(5 - Math.round(meta.averageRating)) : '☆☆☆☆☆';
        if (count) count.textContent = `${meta.total || 0} ${meta.total === 1 ? 'avaliação publicada' : 'avaliações publicadas'}`;
    }

    function setFeedback(message, isError = false) {
        const element = $('#review-feedback');
        if (!element) return;
        element.textContent = message;
        element.style.color = isError ? '#FFD1D1' : '#F5DABF';
    }

    function showMyReview(review) {
        const statusBox = $('#my-review-status');
        const form = $('#review-form');
        if (!review || !statusBox || !form) return;
        const labels = { pending: 'Sua avaliação está aguardando aprovação.', approved: 'Sua avaliação foi aprovada e já pode aparecer publicamente.', rejected: 'Sua avaliação não foi aprovada. Você pode editar e enviar novamente.' };
        statusBox.hidden = false;
        statusBox.textContent = labels[review.status] || 'Você já enviou uma avaliação.';
        const selectedRating = form.querySelector(`[name="review-rating"][value="${Number(review.rating)}"]`);
        if (selectedRating) selectedRating.checked = true;
        form.querySelector('#review-title').value = review.title || '';
        form.querySelector('#review-comment').value = review.comment || '';
        const submit = $('#review-submit');
        if (submit) submit.textContent = 'Atualizar avaliação';
    }

    async function init() {
        if (!$('#reviews-list')) return;
        try {
            const result = await request('/reviews', { auth: false });
            renderReviews(result.data || []);
            updateSummary(result.meta || {});
        } catch (error) {
            $('#reviews-list').innerHTML = `<p class="reviews-empty">${escapeHTML(error.message)}</p>`;
            $('#reviews-count').textContent = 'Não foi possível consultar agora';
        }

        const token = sessionStorage.getItem('syst_access_token');
        const authPrompt = $('#review-auth-prompt');
        const form = $('#review-form');
        if (!token || !form || !authPrompt) return;

        authPrompt.hidden = true;
        form.hidden = false;
        try {
            const mine = await request('/reviews/mine');
            if (mine.data) showMyReview(mine.data);
        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                sessionStorage.removeItem('syst_access_token');
                sessionStorage.removeItem('syst_user');
                form.hidden = true;
                authPrompt.hidden = false;
                setFeedback('Sua sessão expirou. Entre novamente para avaliar.', true);
                return;
            }
            if (error.message) setFeedback(error.message, true);
        }

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const submit = $('#review-submit');
            const rating = Number(form.querySelector('[name="review-rating"]:checked')?.value || 0);
            const title = $('#review-title').value.trim();
            const comment = $('#review-comment').value.trim();
            if (!rating) return setFeedback('Selecione uma nota de 1 a 5 estrelas.', true);
            if (comment.length < 10) return setFeedback('O comentário precisa ter pelo menos 10 caracteres.', true);

            submit.disabled = true;
            setFeedback('Enviando sua avaliação...');
            try {
                const result = await request('/reviews', {
                    method: 'POST',
                    body: JSON.stringify({ rating, title, comment })
                });
                showMyReview(result.data);
                setFeedback('Avaliação enviada! Ela ficará visível após aprovação.');
            } catch (error) {
                setFeedback(error.message, true);
            } finally {
                submit.disabled = false;
            }
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
