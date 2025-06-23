/**
 * =================================================================================
 * SCRIPT INTEGRASI WORDPRESS (VERSI REVISI FINAL - DIRAPIKAN)
 * =================================================================================
 * Revisi:
 * 1. [KRITIS] Variabel WORDPRESS_URL harus diubah ke URL produksi.
 * 2. Mengoptimalkan manipulasi DOM secara signifikan.
 * 3. Menambahkan fungsi 'createDOMElement' untuk keamanan (mencegah XSS) dan keterbacaan.
 * 4. Merapikan logika fetch dan error handling.
 * 5. Mengubah tautan artikel di createPostCard agar mengarah ke article-detail.html
 * 6. [PERBAIKAN] Memperbaiki logika pemuatan artikel untuk memastikan parameter
 * pencarian (search) selalu menjadi prioritas utama.
 * 7. [PEMBERSIHAN] Menghapus blok kode yang berulang (redundan) di dalam DOMContentLoaded.
 * 8. [BARU] Menambahkan fungsi untuk memuat artikel terbaru di sidebar.
 * =================================================================================
 */

// --- KONFIGURASI GLOBAL ---
// [!! PENTING !!] GANTI URL INI DENGAN ALAMAT SITUS WORDPRESS ANDA YANG SUDAH ONLINE
const WORDPRESS_URL = "http://eshbi-local.local"; // <--- GANTI DENGAN URL WORDPRESS PRODUKSI ANDA
const POSTS_PER_PAGE = 4;
let currentPage = 1;
let totalPages = 1;

/**
 * Fungsi baru untuk memotong kutipan (excerpt) berdasarkan jumlah kata.
 * @param {string} htmlString - Teks excerpt dari WordPress (mengandung HTML).
 * @param {number} wordLimit - Batas maksimal kata yang ingin ditampilkan.
 * @returns {string} - Teks yang sudah dipotong.
 */
function truncateExcerpt(htmlString, wordLimit) {
  const plainText = htmlString.replace(/<[^>]*>/g, "");
  const words = plainText.split(/\s+/);
  if (words.length > wordLimit) {
    return words.slice(0, wordLimit).join(" ") + "...";
  }
  return plainText;
}

/**
 * Membuat elemen DOM dengan aman untuk menghindari XSS.
 * @param {string} tag - Tag HTML (e.g., 'div', 'h3').
 * @param {string} className - Class untuk elemen.
 * @param {string} [textContent] - Teks di dalam elemen.
 * @returns {HTMLElement}
 */
function createDOMElement(tag, className, textContent) {
  const element = document.createElement(tag);
  element.className = className;
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
}

/**
 * Membuat dan merender kartu postingan dengan aman.
 * @param {object} post - Objek postingan dari WordPress API.
 * @returns {HTMLElement} - Elemen artikel yang sudah jadi.
 */
function createPostCard(post) {
  const imageUrl =
    post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
    "https://via.placeholder.com/400x250/e0e0e0/cccccc?text=No+Image";
  const postDate = new Date(post.date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const card = createDOMElement("article", "article-card");
  const link = document.createElement("a");
  link.href = `article-detail.html?id=${post.id}`;
  link.target = "_self";
  link.style.textDecoration = "none";
  link.style.color = "inherit";

  const imageContainer = createDOMElement("div", "card-image-container");
  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = post.title.rendered;
  const dateOverlay = createDOMElement("div", "date-overlay");
  dateOverlay.innerHTML = `<span>${postDate}</span>`;
  imageContainer.append(img, dateOverlay);

  const content = createDOMElement("div", "card-content");
  content.setAttribute("data-date", postDate);
  const title = createDOMElement("h3", "card-title", post.title.rendered);
  const excerpt = createDOMElement("div", "card-excerpt");
  excerpt.textContent = truncateExcerpt(post.excerpt.rendered, 15);

  const readMore = createDOMElement("a", "card-read-more", "Baca Artikel >");
  readMore.href = `article-detail.html?id=${post.id}`;
  readMore.target = "_self";

  content.append(title, excerpt, readMore);
  link.append(imageContainer, content);
  card.appendChild(link);

  return card;
}

/**
 * Membuat dan merender link postingan sederhana untuk sidebar.
 * @param {object} post - Objek postingan dari WordPress API.
 * @returns {HTMLElement} - Elemen anchor <a> yang sudah jadi.
 */
function createSidebarPostLink(post) {
  const link = document.createElement("a");
  link.href = `article-detail.html?id=${post.id}`;
  link.className = "sidebar-post-link";

  const imageUrl =
    post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.thumbnail
      ?.source_url ||
    "https://via.placeholder.com/60x60/e0e0e0/cccccc?text=...";
  const imageAlt = post.title.rendered;

  const postDate = new Date(post.date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  link.innerHTML = `
        <img src="${imageUrl}" alt="${imageAlt}" class="sidebar-post-image">
        <div class="sidebar-post-content">
            <span class="sidebar-post-title">${post.title.rendered}</span>
            <span class="sidebar-post-date">${postDate}</span>
        </div>
    `;
  return link;
}

/**
 * Render elemen ke dalam kontainer target.
 * @param {HTMLElement} container - Kontainer DOM untuk merender.
 * @param {Array<HTMLElement>} elements - Array elemen untuk dirender.
 * @param {string} fallbackMessage - Pesan jika tidak ada elemen.
 */
function renderElements(container, elements, fallbackMessage) {
  container.innerHTML = "";
  if (elements && elements.length > 0) {
    container.append(...elements);
  } else {
    container.textContent = fallbackMessage;
  }
}

/**
 * Merender pagination.
 */
function renderPagination() {
  const paginationContainer = document.getElementById("pagination-container");
  if (!paginationContainer) return;

  let paginationHTML = "";
  if (currentPage > 1) {
    paginationHTML += `<a href="#" class="arrow" title="Halaman Sebelumnya" data-page="${
      currentPage - 1
    }">&lt;</a>`;
  }
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    paginationHTML += `<a href="#" class="page-number" data-page="1">1</a>`;
    if (startPage > 2) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const activeClass = i === currentPage ? "active" : "";
    paginationHTML += `<a href="#" class="page-number ${activeClass}" data-page="${i}">${i}</a>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
    paginationHTML += `<a href="#" class="page-number" data-page="${totalPages}">${totalPages}</a>`;
  }

  if (currentPage < totalPages) {
    paginationHTML += `<a href="#" class="arrow" title="Halaman Berikutnya" data-page="${
      currentPage + 1
    }">&gt;</a>`;
  }
  paginationContainer.innerHTML = paginationHTML;
}

// Buka file: assets/javascript/scripts-wp.js

/**
 * Fungsi utama untuk memuat dan menampilkan postingan (untuk halaman blog/arsip).
 * @param {number} page - Nomor halaman.
 * @param {string} filterQuery - String kueri filter (mis: "search=keyword" atau "tags=12").
 * @param {boolean} shouldScroll - Apakah halaman harus di-scroll.
 */
async function loadAndDisplayPosts(
  page = 1,
  filterQuery = "",
  shouldScroll = false
) {
  // <-- UBAH NAMA PARAMETER
  const mainContainer = document.getElementById("article-grid-container");
  if (!mainContainer) return;

  if (shouldScroll) {
    mainContainer.scrollIntoView({ behavior: "smooth" });
  }

  mainContainer.innerHTML = `<p style="text-align: center; width: 100%;">Memuat artikel...</p>`;

  // --- UBAH LOGIKA DI BAWAH INI ---
  let endpoint = `posts?_embed=1&per_page=${POSTS_PER_PAGE}&page=${page}`;
  if (filterQuery) {
    // Langsung tambahkan string filter, membuatnya lebih fleksibel
    endpoint += `&${filterQuery}`;
  }
  // --- BATAS PERUBAHAN ---

  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/${endpoint}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    totalPages = parseInt(response.headers.get("X-WP-TotalPages")) || 1;
    currentPage = page;
    const posts = await response.json();

    const postElements = posts.map(createPostCard);
    renderElements(mainContainer, postElements, "Artikel tidak ditemukan.");
    renderPagination();
  } catch (error) {
    console.error("Gagal memuat postingan:", error);
    mainContainer.innerHTML =
      '<p style="text-align: center; width: 100%;">Gagal memuat artikel. Periksa koneksi atau URL WordPress Anda.</p>';
  }
}

/**
 * [FUNGSI BARU] Memuat dan menampilkan hasil pencarian di kontainer target.
 * @param {string} targetContainerId - ID kontainer untuk menampilkan hasil.
 * @param {string} paginationContainerId - ID kontainer untuk menampilkan pagination.
 * @param {string} searchTerm - Kata kunci pencarian.
 * @param {number} page - Halaman hasil pencarian.
 */
async function displaySearchResults(
  targetContainerId,
  paginationContainerId,
  searchTerm,
  page = 1
) {
  const targetContainer = document.getElementById(targetContainerId);
  const paginationContainer = document.getElementById(paginationContainerId);
  if (!targetContainer || !paginationContainer) return;

  targetContainer.innerHTML = `<p style="text-align: center; width: 100%;">Mencari artikel untuk "${searchTerm}"...</p>`;
  paginationContainer.innerHTML = ""; // Kosongkan pagination lama

  // Menggunakan 5 post per halaman untuk hasil pencarian sidebar agar tidak terlalu panjang
  const POSTS_PER_SEARCH_PAGE = 5;
  const endpoint = `${WORDPRESS_URL}/wp-json/wp/v2/posts?_embed=1&per_page=${POSTS_PER_SEARCH_PAGE}&page=${page}&search=${encodeURIComponent(
    searchTerm
  )}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const totalPagesSearch =
      parseInt(response.headers.get("X-WP-TotalPages")) || 1;
    const posts = await response.json();

    // [DIUBAH] Menggunakan createSidebarPostLink, bukan createPostCard, untuk tampilan yang sesuai dengan sidebar.
    const postElements = posts.map(createSidebarPostLink);

    // [DIUBAH] Menghapus div "article-grid" yang tidak perlu dan langsung merender elemen ke kontainer target.
    // Hal ini akan membuat hasil ditampilkan sebagai daftar vertikal, bukan grid.
    if (postElements.length > 0) {
      targetContainer.innerHTML = ""; // Hapus pesan "Mencari..."

      // Buat sebuah wrapper untuk memberikan jarak antar item
      const resultsWrapper = createDOMElement("div", "latest-posts-container");
      resultsWrapper.style.flexDirection = "column";
      resultsWrapper.style.gap = "15px";
      resultsWrapper.append(...postElements);

      targetContainer.appendChild(resultsWrapper);
    } else {
      targetContainer.innerHTML = `<p style="text-align: center; width: 100%;">Artikel dengan kata kunci "${searchTerm}" tidak ditemukan.</p>`;
    }

    // Render pagination baru untuk hasil pencarian
    // Menggunakan fungsi renderPagination yang sudah ada dan fleksibel
    renderPagination(paginationContainerId, page, totalPagesSearch);
  } catch (error) {
    console.error("Gagal melakukan pencarian:", error);
    targetContainer.innerHTML =
      '<p style="text-align: center; width: 100%;">Gagal memuat hasil pencarian.</p>';
  }
}

// [PERUBAHAN] Fungsi renderPagination dimodifikasi agar lebih fleksibel
function renderPagination(containerId, currentPage, totalPages) {
  const paginationContainer = document.getElementById(containerId);
  if (!paginationContainer) return;

  let paginationHTML = "";
  if (currentPage > 1) {
    paginationHTML += `<a href="#" class="arrow" title="Halaman Sebelumnya" data-page="${
      currentPage - 1
    }">&lt;</a>`;
  }
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    paginationHTML += `<a href="#" class="page-number" data-page="1">1</a>`;
    if (startPage > 2) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const activeClass = i === currentPage ? "active" : "";
    paginationHTML += `<a href="#" class="page-number ${activeClass}" data-page="${i}">${i}</a>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
    paginationHTML += `<a href="#" class="page-number" data-page="${totalPages}">${totalPages}</a>`;
  }

  if (currentPage < totalPages) {
    paginationHTML += `<a href="#" class="arrow" title="Halaman Berikutnya" data-page="${
      currentPage + 1
    }">&gt;</a>`;
  }
  paginationContainer.innerHTML = paginationHTML;
}

/**
 * Memuat postingan terbaru ke dalam sidebar.
 * @param {string} containerId - ID elemen kontainer.
 * @param {number} count - Jumlah postingan yang ingin ditampilkan.
 */
async function loadLatestPosts(containerId, count = 5) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `<p>Memuat...</p>`;
  const endpoint = `${WORDPRESS_URL}/wp-json/wp/v2/posts?_embed=1&per_page=${count}&page=1`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const posts = await response.json();
    const postElements = posts.map(createSidebarPostLink);
    renderElements(container, postElements, "Belum ada artikel terbaru.");
  } catch (error) {
    console.error("Gagal memuat postingan terbaru:", error);
    container.innerHTML = "<p>Gagal memuat artikel.</p>";
  }
}

/**
 * Memuat 3 artikel untuk homepage.
 */
async function loadHomepagePosts() {
  const mainArticleContainer = document.getElementById(
    "article-grid-container"
  );
  if (!mainArticleContainer) return;

  mainArticleContainer.innerHTML = `<p style="text-align: center; width: 100%;">Memuat artikel...</p>`;
  const endpoint = `${WORDPRESS_URL}/wp-json/wp/v2/posts?_embed=1&per_page=3&page=1`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const posts = await response.json();
    const postElements = posts.map(createPostCard);
    renderElements(
      mainArticleContainer,
      postElements,
      "Saat ini belum ada artikel."
    );
  } catch (error) {
    console.error("Gagal memuat postingan homepage:", error);
    mainArticleContainer.innerHTML =
      '<p style="text-align: center; width: 100%;">Gagal memuat artikel. Periksa koneksi atau URL WordPress Anda.</p>';
  }
}

// --- EVENT LISTENERS (DIRAPIKAN DAN DIPERBAIKI) ---
document.addEventListener("DOMContentLoaded", async () => {
  
  // Ambil semua elemen yang mungkin dibutuhkan
  const mainArticleContainer = document.getElementById(
    "article-grid-container"
  );
  const popularContainer = document.getElementById(
    "popular-articles-container"
  );
  const tagsContainer = document.getElementById("hashtags-container");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const paginationContainer = document.getElementById("pagination-container");

  // --- LOGIKA PEMUATAN ARTIKEL (HANYA JIKA ADA #article-grid-container) ---
  if (mainArticleContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get("search");
    const tagId = urlParams.get("tag");

    // --- UBAH BAGIAN DI BAWAH INI ---
    if (searchTerm) {
      // PRIORITAS 1: Jika ada parameter 'search', jalankan pencarian.
      loadAndDisplayPosts(1, `search=${encodeURIComponent(searchTerm)}`, false);
    } else if (tagId) {
      // PRIORITAS 2: Jika ada parameter 'tag', jalankan filter tag.
      loadAndDisplayPosts(1, `tags=${tagId}`, false);
    } else if (window.location.pathname.includes("blog.html")) {
      // --- BATAS PERUBAHAN ---
      // PRIORITAS 3: Jika ini adalah halaman blog.html tanpa parameter, muat semua artikel.
      loadAndDisplayPosts(1, "", false);
    } else {
      // FALLBACK: Jika tidak ada kondisi di atas (misal di index.html), muat 3 artikel homepage.
      loadHomepagePosts();
    }
  }

  // --- PEMUATAN KONTEN SIDEBAR (POPULER & TAGS) ---
  if (popularContainer) {
    try {
      // --- GANTI BAGIAN INI ---
      const popularResponse = await fetch(
        `${WORDPRESS_URL}/wp-json/wp/v2/posts?_embed=1&per_page=2&sticky=true`
      );
      // Penjelasan:
      // Hapus: &orderby=comment_count&order=desc
      // Tambah: &sticky=true
      // Ini akan mengambil 2 postingan terakhir yang Anda tandai sebagai "lekatkan ke atas laman" (sticky).

      if (!popularResponse.ok)
        throw new Error("Gagal mengambil artikel unggulan");
      const popularPosts = await popularResponse.json();

      // [PENTING] Cek jika tidak ada artikel unggulan
      if (popularPosts.length === 0) {
        popularContainer.innerHTML =
          "<p>Saat ini tidak ada artikel unggulan.</p>";
      } else {
        const popularElements = popularPosts.map(createPostCard);
        renderElements(
          popularContainer,
          popularElements,
          "Gagal memuat artikel unggulan."
        );
      }
    } catch (e) {
      console.error("Gagal memuat artikel unggulan:", e);
      popularContainer.textContent = "Gagal memuat artikel unggulan.";
    }
  }

  if (tagsContainer) {
    try {
      const tagsResponse = await fetch(
        `${WORDPRESS_URL}/wp-json/wp/v2/tags?orderby=count&order=desc&per_page=8`
      );
      if (!tagsResponse.ok) throw new Error("Gagal mengambil data tags");
      const tags = await tagsResponse.json();
      if (tags && tags.length > 0) {
        const tagsHTML = tags
          .map(
            (tag) =>
              `<a href="blog.html?tag=${tag.id}" class="hashtag-pill">#${tag.name}</a>`
          )
          .join("");
        tagsContainer.innerHTML = tagsHTML;
      } else {
        tagsContainer.textContent = "Gagal memuat hashtag.";
      }
    } catch (e) {
      console.error("Gagal memuat hashtags:", e);
      tagsContainer.textContent = "Gagal memuat hashtag.";
    }
  }

  // --- EVENT LISTENER UNTUK SEARCH FORM & PAGINATION ---
  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const searchTerm = searchInput.value.trim();
      // --- UBAH BARIS DI BAWAH INI ---
      loadAndDisplayPosts(1, `search=${encodeURIComponent(searchTerm)}`, true);
      // --- BATAS PERUBAHAN ---
    });
  }

  if (paginationContainer) {
    paginationContainer.addEventListener("click", (event) => {
      event.preventDefault();
      const clickedElement = event.target.closest("a");
      if (clickedElement && clickedElement.dataset.page) {
        const pageToLoad = parseInt(clickedElement.dataset.page);

        // --- GANTI LOGIKA DI BAWAH INI ---
        const urlParams = new URLSearchParams(window.location.search);
        const currentTagId = urlParams.get("tag");
        const currentSearchTerm = searchInput ? searchInput.value.trim() : "";

        let filterQuery = "";
        if (currentSearchTerm) {
          // Jika ada isi di kotak pencarian, prioritaskan itu
          filterQuery = `search=${encodeURIComponent(currentSearchTerm)}`;
        } else if (currentTagId) {
          // Jika tidak, periksa apakah kita sedang di halaman tag
          filterQuery = `tags=${currentTagId}`;
        }

        if (pageToLoad !== currentPage) {
          loadAndDisplayPosts(pageToLoad, filterQuery, true);
        }
        // --- BATAS PERUBAHAN ---
      }
    });
  }
});
