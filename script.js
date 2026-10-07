document.addEventListener('DOMContentLoaded', function () {

    // =========================================================
    // 1. Nama Tamu dari URL (?to=Nama)
    // =========================================================
    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('to') || 'Bapak/Ibu/Saudara/i';
    document.getElementById('guest-name').innerText = guestName;

    // =========================================================
    // 2. Logika "Buka Undangan" & Animasi Loading
    // =========================================================
    const btnOpen     = document.getElementById('btn-open');
    const coverPage   = document.getElementById('cover-page');
    const coverContent = document.getElementById('cover-content');
    const loadingArt  = document.getElementById('loading-art');
    const mainContent = document.getElementById('main-content');
    const bgMusic     = document.getElementById('bg-music');
    const btnMusic    = document.getElementById('btn-music');
    let isPlaying = false;

    btnOpen.addEventListener('click', function () {
        coverContent.classList.add('hidden');
        loadingArt.classList.remove('hidden');

        bgMusic.play().then(() => {
            isPlaying = true;
            btnMusic.classList.add('rotating');
        }).catch(() => {});

        setTimeout(() => {
            coverPage.classList.add('slide-up');
            setTimeout(() => {
                coverPage.style.display = 'none';
                mainContent.classList.remove('hidden');
                void mainContent.offsetWidth;
                mainContent.classList.add('visible');
                btnMusic.style.display = 'block';
                initScrollFade();
            }, 1200);
        }, 3000);
    });

    // =========================================================
    // 3. Kontrol Musik
    // =========================================================
    btnMusic.addEventListener('click', function () {
        if (isPlaying) {
            bgMusic.pause();
            btnMusic.classList.remove('rotating');
            btnMusic.innerHTML = '<i class="fas fa-music"></i>';
        } else {
            bgMusic.play();
            btnMusic.classList.add('rotating');
            btnMusic.innerHTML = '<i class="fas fa-compact-disc"></i>';
        }
        isPlaying = !isPlaying;
    });

    // =========================================================
    // 4. Hitung Mundur (Countdown)
    // =========================================================
    const eventDate = new Date('Oct 15, 2026 14:00:00').getTime();

    const countdown = setInterval(function () {
        const now      = new Date().getTime();
        const distance = eventDate - now;

        if (distance < 0) {
            clearInterval(countdown);
            const cc = document.querySelector('.countdown-container');
            if (cc) cc.innerHTML = "<h3 style='color:#e6c883;'>Acara Telah Berlangsung / Selesai</h3>";
            return;
        }

        const days    = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours   = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').innerText    = pad(days);
        document.getElementById('hours').innerText   = pad(hours);
        document.getElementById('minutes').innerText = pad(minutes);
        document.getElementById('seconds').innerText = pad(seconds);
    }, 1000);

    function pad(n) { return n < 10 ? '0' + n : n; }

    // =========================================================
    // 5. Galeri Khusus (Password Protected)
    // =========================================================
    const GALLERY_PASSWORD = '07042008';

    const btnSecretGallery    = document.getElementById('btn-secret-gallery');
    const secretPassContainer = document.getElementById('secret-password-container');
    const secretPasswordInput = document.getElementById('secret-password');
    const btnSubmitPassword   = document.getElementById('btn-submit-password');
    const passwordError       = document.getElementById('password-error');
    const secretGallery       = document.getElementById('secret-gallery');

    if (btnSecretGallery) {
        btnSecretGallery.addEventListener('click', function () {
            if (secretPassContainer.classList.contains('hidden')) {
                secretPassContainer.classList.remove('hidden');
                btnSecretGallery.innerHTML = '<i class="fas fa-times"></i> Tutup';
            } else {
                secretPassContainer.classList.add('hidden');
                btnSecretGallery.innerHTML = '<i class="fas fa-lock"></i> Buka Galeri Khusus';
                passwordError.style.display = 'none';
            }
        });

        btnSubmitPassword.addEventListener('click', checkPassword);
        secretPasswordInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') checkPassword();
        });
    }

    function checkPassword() {
        if (secretPasswordInput.value === GALLERY_PASSWORD) {
            secretPassContainer.classList.add('hidden');
            secretGallery.classList.remove('hidden');
            btnSecretGallery.innerHTML = '<i class="fas fa-unlock"></i> Galeri Khusus';
            passwordError.style.display = 'none';
        } else {
            passwordError.style.display = 'block';
            secretPasswordInput.value = '';
            secretPasswordInput.focus();
        }
    }

    // =========================================================
    // 6. RSVP / Kirim Ucapan — disimpan di localStorage
    // =========================================================
    const rsvpForm    = document.getElementById('rsvp-form');
    const wishesList  = document.getElementById('wishes-list');

    // Ucapan awal bawaan
    const defaultWishes = [

    ];

    // Ambil ucapan dari localStorage (kalau ada)
let storedWishes = [];
try {
    storedWishes = JSON.parse(localStorage.getItem('jyesta_wishes')) || [];
} catch (e) {
    storedWishes = [];
}

    // Render semua ucapan (default dulu, lalu yang tersimpan)
    wishesList.innerHTML = '';
    const allWishes = [...defaultWishes, ...storedWishes];
    allWishes.forEach(function (w) { renderWish(w, false); });

    // Submit form
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name       = document.getElementById('rsvp-name').value.trim();
            const message    = document.getElementById('rsvp-message').value.trim();
            const attendance = document.getElementById('rsvp-attendance').value;

            if (!name || !message || !attendance) return;

            const wish = { name, message, attendance };

            // Simpan ke localStorage
            storedWishes.push(wish);
            try {
                localStorage.setItem('jyesta_wishes', JSON.stringify(storedWishes));
            } catch (e) {}

            // Tampilkan di UI
            renderWish(wish, true);

            // Scroll ke ucapan terbaru
            wishesList.scrollTop = wishesList.scrollHeight;

            // Reset form
            rsvpForm.reset();
        });
    }

    function renderWish(wish, isNew) {
        const initial   = encodeURIComponent(wish.name.charAt(0).toUpperCase());
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(wish.name)}&background=random&color=fff&size=46`;

        let badgeClass = 'badge-maybe';
        let badgeLabel = wish.attendance;
        if (wish.attendance === 'Akan Hadir' || wish.attendance === 'Hadir') {
            badgeClass = 'badge-present';
            badgeLabel = 'Akan Hadir';
        } else if (wish.attendance === 'Tidak Hadir') {
            badgeClass = 'badge-absent';
        }

        const div = document.createElement('div');
        div.className = 'wish-item';
        div.innerHTML = `
            <div class="wish-avatar">
                <img src="${avatarUrl}" alt="${escapeHtml(wish.name)}" loading="lazy">
            </div>
            <div class="wish-content">
                <div class="wish-header">
                    <strong>${escapeHtml(wish.name)}</strong>
                    <span class="badge ${badgeClass}">${escapeHtml(badgeLabel)}</span>
                </div>
                <p>${escapeHtml(wish.message)}</p>
            </div>
        `;

        if (isNew) {
            wishesList.insertBefore(div, wishesList.firstChild);
        } else {
            wishesList.appendChild(div);
        }
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }

    // =========================================================
    // 7. Scroll Fade-in untuk setiap section
    // =========================================================
    function initScrollFade() {
        const sections = document.querySelectorAll('.fade-in-section');
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        sections.forEach(function (s) { observer.observe(s); });
    }

});