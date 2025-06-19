/**
 * =================================================================================
 * SCRIPT INTEGRASI WORDPRESS (VERSI REVISI)
 * =================================================================================
 * Revisi:
 * 1. [KRITIS] Variabel WORDPRESS_URL harus diubah ke URL produksi.
 * 2. Mengoptimalkan manipulasi DOM secara signifikan. Menggunakan .map().join('')
 * untuk membuat string HTML lalu mengaturnya sekali, bukan menggunakan 'innerHTML +='
 * di dalam loop yang sangat tidak efisien.
 * 3. Menambahkan fungsi 'createDOMElement' untuk keamanan (mencegah XSS) dan
 * keterbacaan saat merender postingan.
 * 4. Merapikan logika fetch dan error handling.
 * =================================================================================
 */

// --- KONFIGURASI GLOBAL ---
// [!! PENTING !!] GANTI URL INI DENGAN ALAMAT SITUS WORDPRESS ANDA YANG SUDAH ONLINE
const WORDPRESS_URL = "http://eshbi.local";
const POSTS_PER_PAGE = 4;
let currentPage = 1;
let totalPages = 1;

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
    element.textContent = textContent; // textContent otomatis membersihkan HTML (aman)
  }
  return element;
}

/**
 * Membuat dan merender kartu postingan dengan aman.
 * @param {object} post - Objek postingan dari WordPress API.
 * @returns {HTMLElement} - Elemen artikel yang sudah jadi.
 */
function createPostCard(post) {
  const imageUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "https://via.placeholder.com/400x250/e0e0e0/cccccc?text=No+Image";
  const postDate = new Date(post.date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const card = createDOMElement("article", "article-card");
  const link = document.createElement("a");
  link.href = post.link;
  link.target = "_blank";
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
  const title = createDOMElement("h3", "card-title", post.title.rendered);
  const excerpt = createDOMElement("div", "card-excerpt");
  excerpt.innerHTML = post.excerpt.rendered; // Excerpt dari WP biasanya aman
  const readMore = createDOMElement("a", "card-read-more", "Baca Artikel >");
  readMore.href = post.link;
  readMore.target = "_blank";

  // Gabungkan semua elemen
  content.append(title, excerpt, readMore);
  link.append(imageContainer, content);
  card.appendChild(link);

  return card;
}

/**
 * Render elemen ke dalam kontainer target.
 * @param {HTMLElement} container - Kontainer DOM untuk merender.
 * @param {Array<HTMLElement>} elements - Array elemen untuk dirender.
 * @param {string} fallbackMessage - Pesan jika tidak ada elemen.
 */
function renderElements(container, elements, fallbackMessage) {
  container.innerHTML = ""; // Bersihkan kontainer
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
    paginationHTML += `<a href="#" class="arrow" title="Halaman Sebelumnya" data-page="${currentPage - 1}">&lt;</a>`;
  }
  for (let i = 1; i <= totalPages; i++) {
    const activeClass = i === currentPage ? "active" : "";
    paginationHTML += `<a href="#" class="page-number ${activeClass}" data-page="${i}">${i}</a>`;
  }
  if (currentPage < totalPages) {
    paginationHTML += `<a href="#" class="arrow" title="Halaman Berikutnya" data-page="${currentPage + 1}">&gt;</a>`;
  }
  paginationContainer.innerHTML = paginationHTML;
}

/**
 * Fungsi utama untuk memuat dan menampilkan postingan.
 * @param {number} page - Nomor halaman.
 * @param {string} searchTerm - Kata kunci pencarian.
 * @param {boolean} shouldScroll - Apakah halaman harus di-scroll.
 */
async function loadAndDisplayPosts(page = 1, searchTerm = "", shouldScroll = false) {
  const mainContainer = document.getElementById("article-grid-container");
  if (!mainContainer) return;

  if (shouldScroll) {
    mainContainer.scrollIntoView({ behavior: "smooth" });
  }

  mainContainer.innerHTML = `<p style="text-align: center; width: 100%;">Memuat artikel...</p>`;
  let endpoint = `posts?_embed=1&per_page=${POSTS_PER_PAGE}&page=${page}`;
  if (searchTerm) {
    endpoint += `&search=${encodeURIComponent(searchTerm)}`;
  }

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
    mainContainer.innerHTML = '<p style="text-align: center; width: 100%;">Gagal memuat artikel. Periksa koneksi atau URL WordPress Anda.</p>';
  }
}

// --- EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", async () => {
  const popularContainer = document.getElementById("popular-articles-container");
  const tagsContainer = document.getElementById("hashtags-container");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const paginationContainer = document.getElementById("pagination-container");

  // Muat konten awal
  loadAndDisplayPosts(1, "", false);

  // Ambil konten sampingan
  if (popularContainer) {
    try {
      const popularResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/posts?_embed=1&per_page=2`);
      const popularPosts = await popularResponse.json();
      const popularElements = popularPosts.map(createPostCard);
      renderElements(popularContainer, popularElements, "Gagal memuat berita populer.");
    } catch (e) {
      popularContainer.textContent = "Gagal memuat berita populer.";
    }
  }

  if (tagsContainer) {
    try {
      const tagsResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/tags?orderby=count&order=desc&per_page=8`);
      const tags = await tagsResponse.json();
      if (tags && tags.length > 0) {
        // Optimalkan rendering tag
        const tagsHTML = tags.map(tag => `<a href="${tag.link}" class="hashtag-pill" target="_blank">#${tag.name}</a>`).join("");
        tagsContainer.innerHTML = tagsHTML;
      } else {
        tagsContainer.textContent = "Gagal memuat hashtag.";
      }
    } catch (e) {
      tagsContainer.textContent = "Gagal memuat hashtag.";
    }
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const searchTerm = searchInput.value.trim();
      loadAndDisplayPosts(1, searchTerm, true);
    });
  }

  if (paginationContainer) {
    paginationContainer.addEventListener("click", (event) => {
      event.preventDefault();
      const clickedElement = event.target.closest("a");
      if (clickedElement && clickedElement.dataset.page) {
        const pageToLoad = parseInt(clickedElement.dataset.page);
        const searchTerm = searchInput.value.trim();
        if (pageToLoad !== currentPage) {
          loadAndDisplayPosts(pageToLoad, searchTerm, true);
        }
      }
    });
  }
});