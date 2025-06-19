/**
 * =================================================================
 * SCRIPT UTAMA (FINAL DENGAN NAVIGASI DINAMIS & MULTI-BAHASA)
 * =================================================================
 */
document.addEventListener("DOMContentLoaded", () => {
  /**
   * Memuat konten HTML dari file lain (header/footer).
   */
  const loadHTML = async (url, elementId) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Gagal memuat ${url}: ${response.statusText}`);
      }
      const data = await response.text();
      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = data;
      } else {
        console.error(`Elemen dengan ID '${elementId}' tidak ditemukan.`);
      }
    } catch (error) {
      console.error("Error saat memuat HTML:", error);
      throw error;
    }
  };

  /**
   * Mengatur menu hamburger, termasuk logika "click outside to close".
   */
  const setupHamburger = () => {
    const hamburger = document.querySelector(".hamburger");
    const navGroup = document.querySelector(".nav-group-right");
    if (!hamburger || !navGroup) return;

    hamburger.addEventListener("click", (event) => {
      event.stopPropagation();
      navGroup.classList.toggle("active");
      hamburger.classList.toggle("active");
    });

    document.addEventListener("click", (event) => {
      if (navGroup.classList.contains("active")) {
        const isClickInsideMenu = navGroup.contains(event.target);
        const isClickOnHamburger = hamburger.contains(event.target);

        if (!isClickInsideMenu && !isClickOnHamburger) {
          navGroup.classList.remove("active");
          hamburger.classList.remove("active");
        }
      }
    });
  };

  /**
   * FUNGSI BARU: Mengatur semua link navigasi untuk dikontrol oleh JS.
   * Ini adalah solusi untuk masalah path di sub-folder.
   */
  const setupDynamicNavigation = () => {
    const links = document.querySelectorAll('a[data-page]');
    const isEnglish = window.location.pathname.startsWith('/en/');
    const langPrefix = isEnglish ? '/en/' : '/';

    links.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault(); // Mencegah link default berfungsi
        const page = link.dataset.page; // Ambil tujuan dari atribut data-page
        if (page) {
          window.location.href = langPrefix + page; // Arahkan ke URL yang benar
        }
      });
    });
  };

  /**
   * FUNGSI DIPERBARUI: Menandai link aktif berdasarkan data-page.
   */
  const setActiveLink = () => {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('a[data-page]');

    links.forEach(link => {
      const pageName = link.dataset.page; // "index.html", "profile.html", dll.
      
      // Cek apakah path saat ini diakhiri dengan nama halaman dari data-page
      if (currentPath.endsWith(pageName)) {
        link.classList.add('active');
      }
      
      // Kasus khusus untuk halaman utama (root)
      const isRootPage = currentPath === '/' || currentPath === '/en/';
      if (isRootPage && pageName === 'index.html') {
        // Cari link beranda secara spesifik dan aktifkan
        const homeLink = document.querySelector('a[data-page="index.html"]');
        if(homeLink) homeLink.classList.add('active');
      }
    });
  };

  /**
   * Mengatur tombol pilihan bahasa (tidak perlu diubah).
   */
  const setupLanguageSwitcher = () => {
    const switcher = document.getElementById("lang-switcher");
    if (!switcher) return;

    const currentPath = window.location.pathname;
    const isEnglish = currentPath.startsWith("/en/");

    if (isEnglish) {
      const newPath = currentPath.replace(/^\/en/, "");
      switcher.href = newPath === "" ? "/" : newPath;
      switcher.innerHTML = `
          <img src="https://upload.wikimedia.org/wikipedia/en/a/ae/Flag_of_the_United_Kingdom.svg" alt="UK Flag"/>
          <span>ENG</span>
      `;
    } else {
      let destinationPath = "/en" + (currentPath.endsWith('/') ? 'index.html' : currentPath);
      if (currentPath === "/" || currentPath.endsWith("/index.html")) {
        destinationPath = "/en/index.html";
      }
      switcher.href = destinationPath;
      switcher.innerHTML = `
          <img src="https://upload.wikimedia.org/wikipedia/commons/9/9f/Flag_of_Indonesia.svg" alt="Indonesian Flag"/>
          <span>IND</span>
      `;
    }
  };

  /**
   * FUNGSI DIPERBARUI: Memuat semua komponen dan menjalankan semua skrip.
   */
  const initializePartials = async () => {
    const currentPath = window.location.pathname;
    const isEnglish = currentPath.startsWith("/en/");
    const loader = document.getElementById("loader-wrapper");

    const headerFile = isEnglish ? "/partials/header-en.html" : "/partials/header-id.html";
    const footerFile = isEnglish ? "/partials/footer-en.html" : "/partials/footer-id.html";

    try {
      await Promise.all([
        loadHTML(headerFile, "header-container"),
        loadHTML(footerFile, "footer-container"),
      ]);

      // Hapus 'updateNavigationLinks' dan panggil fungsi yang baru
      setupHamburger();
      setupLanguageSwitcher();
      setupDynamicNavigation(); // <- INI FUNGSI BARU UNTUK NAVIGASI
      setActiveLink();       // <- FUNGSI INI SEKARANG BEKERJA DENGAN BENAR
    } catch (error) {
      console.error("Salah satu komponen penting gagal dimuat.", error);
    } finally {
      if (loader) {
        loader.classList.add("loader-hidden");
      }
    }
  };

  // Fungsi di bawah ini tidak diubah
  const initSlider = () => {
    const slidesWrapper = document.querySelector(".slides-wrapper");
    const dots = document.querySelectorAll(".dot");
    if (!slidesWrapper || dots.length === 0) return;
    let currentSlide = 0;
    let slideInterval;
    const goToSlide = (slideIndex) => {
      slidesWrapper.style.transform = `translateX(-${slideIndex * 100}vw)`;
      dots.forEach((dot, index) =>
        dot.classList.toggle("active", index === slideIndex)
      );
      currentSlide = slideIndex;
    };
    const startSlider = () => {
      slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % dots.length;
        goToSlide(currentSlide);
      }, 5000);
    };
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        goToSlide(index);
        clearInterval(slideInterval);
        startSlider();
      });
    });
    goToSlide(0);
    startSlider();
  };

  const initScrollTopButton = () => {
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    if (!scrollTopBtn) return;
    window.addEventListener("scroll", () => {
      const isScrolled = document.body.scrollTop > 100 || document.documentElement.scrollTop > 100;
      scrollTopBtn.style.display = isScrolled ? "block" : "none";
    });
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  };

  // --- EKSEKUSI SEMUA FUNGSI ---
  initializePartials();
  initSlider();
  initScrollTopButton();
});