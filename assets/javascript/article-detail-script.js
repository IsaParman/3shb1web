// assets/javascript/article-detail-script.js

document.addEventListener('DOMContentLoaded', async function() {
    // Kontainer utama dan judul halaman
    const mainContentArea = document.getElementById('main-content-area');
    const pageTitle = document.querySelector('title');

    // [BARU] Kontainer spesifik untuk hasil pencarian di sidebar
    const sidebarSearchResultsContainer = document.getElementById('sidebar-search-results-container');
    const sidebarPaginationContainer = document.getElementById('sidebar-search-pagination');
    const sidebar = document.querySelector('.sidebar-right'); // Kontainer sidebar untuk event listener

    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    /**
     * Fungsi untuk memuat dan menampilkan satu artikel tunggal.
     * @param {string} id - ID artikel WordPress.
     */
    async function loadSingleArticle(id) {
        if (!id) {
            mainContentArea.innerHTML = '<p style="text-align: center; color: #cc0000;">ID artikel tidak valid.</p>';
            return;
        }

        mainContentArea.innerHTML = '<p style="text-align: center;">Memuat artikel...</p>';
        const wordpressApiUrl = `${WORDPRESS_URL}/wp-json/wp/v2/posts/${id}?_embed`;

        try {
            const response = await fetch(wordpressApiUrl);
            if (!response.ok) {
                throw new Error(response.status === 404 ? 'Artikel tidak ditemukan.' : 'Gagal memuat artikel.');
            }
            const article = await response.json();

            if (pageTitle) pageTitle.textContent = article.title.rendered + ' - Eshbi';

            const featuredImageUrl = article._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
            const featuredImageAlt = article._embedded?.['wp:featuredmedia']?.[0]?.alt_text || article.title.rendered;
            const postDate = new Date(article.date).toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
            });
            
            // [PERUBAHAN] Konten artikel tetap dirender di area utama, tetapi tidak ada lagi kontainer pagination di sini.
            const articleHTML = `
                <div id="single-article-content">
                    <div class="article-header">
                        <h1>${article.title.rendered}</h1>
                        <p class="article-meta">Dipublikasikan pada: ${postDate}</p>
                    </div>
                    ${featuredImageUrl ? `<img src="${featuredImageUrl}" alt="${featuredImageAlt}" class="article-featured-image">` : ''}
                    <div class="article-content">${article.content.rendered}</div>
                    <div class="article-actions">
                        <a href="blog.html" class="back-to-blog-button">← Kembali ke Blog</a>
                    </div>
                </div>
            `;
            mainContentArea.innerHTML = articleHTML;

        } catch (error) {
            console.error('Error fetching single article:', error);
            mainContentArea.innerHTML = `<p style="text-align: center; color: #cc0000;">Maaf, terjadi kesalahan: ${error.message}</p>`;
        }
    }

    // --- Inisialisasi Halaman ---
    if (articleId) {
        loadSingleArticle(articleId); // Muat artikel asli saat halaman pertama kali dibuka
    } else {
        mainContentArea.innerHTML = '<p style="text-align: center; color: #cc0000;">Artikel tidak ditemukan. ID artikel tidak disediakan.</p>';
    }

    // --- Logika Sidebar ---
    if (typeof loadLatestPosts === 'function') {
        loadLatestPosts('latest-posts-container', 5);
    }

    const sidebarSearchForm = document.getElementById('sidebar-search-form');
    const sidebarSearchInput = document.getElementById('sidebar-search-input');

    if (sidebarSearchForm) {
        sidebarSearchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const searchTerm = sidebarSearchInput.value.trim();

            if (searchTerm) {
                // [DIUBAH] Panggil fungsi pencarian untuk mengisi kontainer di sidebar.
                // Konten artikel utama tidak lagi diubah.
                if (typeof displaySearchResults === 'function') {
                    displaySearchResults('sidebar-search-results-container', 'sidebar-search-pagination', searchTerm, 1);
                }
            } else {
                // [DIUBAH] Jika input pencarian kosong, cukup kosongkan hasil di sidebar.
                if(sidebarSearchResultsContainer) sidebarSearchResultsContainer.innerHTML = '';
                if(sidebarPaginationContainer) sidebarPaginationContainer.innerHTML = '';
            }
        });
    }
    
    // [DIHAPUS] Event listener lama yang terikat pada 'mainContentArea' dihapus.
    // mainContentArea.addEventListener('click', ...);

    // [BARU] Event listener untuk pagination hasil pencarian di dalam sidebar.
    // Diletakkan pada parent element '.sidebar-right' untuk efisiensi.
    if (sidebar) {
        sidebar.addEventListener('click', (event) => {
            // Kita cari elemen <a> yang diklik yang berada di dalam kontainer pagination sidebar
            const clickedElement = event.target.closest('a');
            if (clickedElement && clickedElement.parentElement.id === 'sidebar-search-pagination') {
                event.preventDefault();
                const pageToLoad = parseInt(clickedElement.dataset.page);
                const searchTerm = sidebarSearchInput.value.trim();
                
                // Pastikan ada halaman dan kata kunci untuk dicari
                if (pageToLoad && searchTerm && typeof displaySearchResults === 'function') {
                    // Panggil lagi fungsi pencarian dengan nomor halaman yang baru
                    displaySearchResults('sidebar-search-results-container', 'sidebar-search-pagination', searchTerm, pageToLoad);
                    
                    // Scroll ke atas widget pencarian agar pengguna tahu kontennya diperbarui
                    sidebarSearchForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
});