// ============================================================
//  KONFIGURASI FIREBASE
//  Ganti nilai di bawah dengan config dari Firebase Console Anda:
//  Firebase Console → Project Settings → Your apps → Web app → Config
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey:            "AIzaSyDrpa04ObffFh2xjCY39KMRpmkGPh8XgoQ",
    authDomain:        "um-jyesta-indrawan.firebaseapp.com",
    projectId:         "um-jyesta-indrawan",
    storageBucket:     "um-jyesta-indrawan.firebasestorage.app",
    messagingSenderId: "942276168597",
    appId:             "1:942276168597:web:7d73628f0ea1280678849c",
    measurementId:     "G-GCBY97XTB4"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ============================================================
//  UCAPAN BAWAAN (hanya ditampilkan di UI, tidak disimpan ulang ke Firestore)
// ============================================================
const defaultWishes = [
    { name: 'Hendra',                    message: 'Selamat gigi baru lin sorry gabisa dateng 😭', attendance: 'Tidak Hadir' },
    { name: 'desi wardani ( alumni sd )', message: 'semoga lancar sampai hari H na',               attendance: 'Hadir'       },
    { name: 'Junk ary',                  message: 'Rahajeng metatah/untu anyar ya gek liana cantikk. Rahayu kenanggih swaha 🙏😇💛❤️', attendance: 'Tidak Hadir' }
];

// ============================================================
document.addEventListener('DOMContentLoaded', function () {

    // 1. Nama Tamu dari URL (?to=Nama)
    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('to') || 'Bapak/Ibu/Saudara/i';
    document.getElementById('guest-name').innerText = guestName;

    // 2. Logika "Buka Undangan" & Animasi Loading
    const btnOpen      = document.getElementById('btn-open');
    const coverPage    = document.getElementById('cover-page');
    const coverContent = document.getElementById('cover-content');
    const loadingArt   = document.getElementById('loading-art');
    const mainContent  = document.getElementById('main-content');
    const bgMusic      = document.getElementById('bg-music');
    const btnMusic     = document.getElementById('btn-music');
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

    // 3. Kontrol Musik
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

    // 4. Hitung Mundur (Countdown)
    const eventDate = new Date('Oct 15, 2026 14:00:00').getTime();
    const countdown = setInterval(function () {
        const now      = new Date().getTime();
        const distance = eventDate - now;
        if (distance < 0) {
            clearInterval(countdown);
            const cc = document.querySelector('.countdown-container');
            if (cc) cc.innerHTML = "<h3 style='color:#e6c883;'>Acara Telah Berlangsung 🙏</h3>";
            return;
        }
        document.getElementById('days').innerText    = pad(Math.floor(distance / 86400000));
        document.getElementById('hours').innerText   = pad(Math.floor((distance % 86400000) / 3600000));
        document.getElementById('minutes').innerText = pad(Math.floor((distance % 3600000) / 60000));
        document.getElementById('seconds').innerText = pad(Math.floor((distance % 60000) / 1000));
    }, 1000);

    function pad(n) { return n < 10 ? '0' + n : n; }

    // 5. Galeri Khusus (Password Protected)
    const GALLERY_PASSWORD    = '07042008';
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
        secretPasswordInput.addEventListener('keydown', e => { if (e.key === 'Enter') checkPassword(); });
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

    // ============================================================
    // 6. RSVP / Kirim Ucapan — Firebase Firestore (real-time, semua orang bisa lihat)
    // ============================================================
    const rsvpForm        = document.getElementById('rsvp-form');
    const wishesContainer = document.getElementById('wishes-container');
    const submitBtn       = rsvpForm ? rsvpForm.querySelector('.btn-submit-rsvp') : null;

    // Render ucapan bawaan dulu
    defaultWishes.forEach(w => renderWish(w, wishesContainer, false));

    // Dengarkan perubahan Firestore secara real-time (terbaru di atas)
    const q = query(collection(db, 'ucapan'), orderBy('waktu', 'desc'));
    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                // Sisipkan di paling atas (sebelum ucapan bawaan)
                renderWish(change.doc.data(), wishesContainer, true);
            }
        });
    }, (error) => {
        console.error('Firestore error:', error);
    });

    // Submit ucapan baru ke Firestore
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name       = document.getElementById('rsvp-name').value.trim();
            const message    = document.getElementById('rsvp-message').value.trim();
            const attendance = document.getElementById('rsvp-attendance').value;

            if (!name || !message || !attendance) return;

            // Tampilkan loading di tombol
            submitBtn.disabled  = true;
            submitBtn.innerText = 'Mengirim...';

            try {
                await addDoc(collection(db, 'ucapan'), {
                    name,
                    message,
                    attendance,
                    waktu: serverTimestamp()
                });
                rsvpForm.reset();
            } catch (err) {
                console.error('Gagal kirim ucapan:', err);
                alert('Gagal mengirim ucapan. Periksa koneksi internet Anda.');
            } finally {
                submitBtn.disabled  = false;
                submitBtn.innerText = 'Kirimkan Ucapan';
            }
        });
    }

    function renderWish(wish, container, prepend) {
        const avatarUrl  = `https://ui-avatars.com/api/?name=${encodeURIComponent(wish.name)}&background=random&color=fff&size=46`;
        const attendance = wish.attendance || '';

        let badgeClass = 'badge-maybe';
        let badgeLabel = attendance;
        if (attendance === 'Hadir' || attendance === 'Akan Hadir') {
            badgeClass = 'badge-present';
            badgeLabel = 'Akan Hadir';
        } else if (attendance === 'Tidak Hadir') {
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

        if (prepend && container.firstChild) {
            container.insertBefore(div, container.firstChild);
        } else {
            container.appendChild(div);
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 7. Scroll Fade-in
    function initScrollFade() {
        const sections = document.querySelectorAll('.fade-in-section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        sections.forEach(s => observer.observe(s));
    }

});