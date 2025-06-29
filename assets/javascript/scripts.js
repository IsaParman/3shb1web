/**
 * =================================================================
 * SCRIPT UTAMA (FINAL DENGAN NAVIGASI DINAMIS & MULTI-BAHASA)
 * =================================================================
 * Perubahan:
 * - Menambahkan logika untuk menonaktifkan tombol bahasa khusus di halaman article-detail.html
 * - Menambahkan efek sembunyi/tampil pada navbar saat scroll.
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
   * Mengatur semua link navigasi untuk dikontrol oleh JS.
   */
  const setupDynamicNavigation = () => {
    const links = document.querySelectorAll("a[data-page]");
    const isEnglish = window.location.pathname.startsWith("/en/");
    const langPrefix = isEnglish ? "/en/" : "/";

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault(); // Mencegah link default berfungsi
        const page = link.dataset.page; // Ambil tujuan dari atribut data-page
        if (page) {
          window.location.href = langPrefix + page; // Arahkan ke URL yang benar
        }
      });
    });
  };

  /**
   * Menandai link aktif berdasarkan data-page.
   */
  const setActiveLink = () => {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll("a[data-page]");

    links.forEach((link) => {
      const pageName = link.dataset.page; // "index.html", "profile.html", dll.

      if (currentPath.endsWith(pageName)) {
        link.classList.add("active");
      }

      const isRootPage = currentPath === "/" || currentPath === "/en/";
      if (isRootPage && pageName === "index.html") {
        const homeLink = document.querySelector('a[data-page="index.html"]');
        if (homeLink) homeLink.classList.add("active");
      }
    });
  };

  /**
   * Mengatur tombol pilihan bahasa.
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
      let destinationPath =
        "/en" + (currentPath.endsWith("/") ? "index.html" : currentPath);
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
   * [FUNGSI BARU] Mengatur efek hide/show pada navbar saat scroll.
   */
  const initNavbarScroll = () => {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    let lastScrollTop = 0;
    const navbarHeight = navbar.offsetHeight;

    window.addEventListener("scroll", () => {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // Kondisi untuk menyembunyikan navbar:
      // - Scroll ke bawah (scrollTop > lastScrollTop)
      // - Telah scroll melewati tinggi navbar (scrollTop > navbarHeight)
      if (scrollTop > lastScrollTop && scrollTop > navbarHeight) {
        // Scroll ke Bawah
        navbar.classList.add("navbar-hidden");
      } else {
        // Scroll ke Atas
        navbar.classList.remove("navbar-hidden");
      }

      // Update posisi scroll terakhir
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
  };

  /**
   * Memuat semua komponen dan menjalankan semua skrip inisialisasi.
   */
  const initializePartials = async () => {
    const currentPath = window.location.pathname;
    const isEnglish = currentPath.startsWith("/en/");
    const loader = document.getElementById("loader-wrapper");

    const headerFile = isEnglish
      ? "/partials/header-en.html"
      : "/partials/header-id.html";
    const footerFile = isEnglish
      ? "/partials/footer-en.html"
      : "/partials/footer-id.html";

    try {
      await Promise.all([
        loadHTML(headerFile, "header-container"),
        loadHTML(footerFile, "footer-container"),
      ]);

      // Jalankan fungsi-fungsi setup setelah header dan footer dimuat
      setupHamburger();

      // Cek halaman dan tentukan status tombol bahasa
      if (window.location.pathname.includes("article-detail.html")) {
        const langSwitcherButton = document.getElementById("lang-switcher");
        if (langSwitcherButton) {
          langSwitcherButton.style.pointerEvents = "none";
          langSwitcherButton.style.opacity = "0.5";
        }
      } else {
        setupLanguageSwitcher();
      }

      setupDynamicNavigation();
      setActiveLink();
      
      // [PEMANGGILAN FUNGSI BARU] Panggil fungsi efek scroll navbar
      initNavbarScroll();

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
      const isScrolled =
        document.body.scrollTop > 100 ||
        document.documentElement.scrollTop > 100;
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

document.addEventListener("DOMContentLoaded", () => {
  const statsSection = document.querySelector(".stats-section");

  const animateCount = (element, start, end, duration) => {
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      element.innerText = Math.floor(progress * (end - start) + start) + "+";
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  const animateKCount = (element, start, end, duration) => {
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      element.innerText = Math.floor(progress * (end - start) + start) + "K+";
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(
            document.getElementById("brand-partner-count"),
            0,
            20,
            2000
          );
          animateCount(
            document.getElementById("customer-satisfaction-count"),
            0,
            2000,
            2000
          );
          animateKCount(
            document.getElementById("product-distribution-count"),
            0,
            100,
            2000
          );
          observer.unobserve(statsSection); // Hentikan pengamatan setelah animasi berjalan
        }
      });
    },
    { threshold: 0.5 }
  ); // Animasi berjalan ketika 50% bagian terlihat

  if (statsSection) {
      observer.observe(statsSection);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // --- Kode untuk animasi hitung (dari permintaan sebelumnya) ---
  const statsSection = document.querySelector(".stats-section");
  // ... (sisa kode animasi hitung yang sudah ada)
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // ... (kode animateCount)
          if(statsSection) {
            statsObserver.unobserve(statsSection);
          }
        }
      });
    },
    { threshold: 0.5 }
  );
  if (statsSection) {
    statsObserver.observe(statsSection);
  }

  // --- KODE BARU UNTUK ANIMASI SCROLL ---
  const sectionsToAnimate = document.querySelectorAll(".fade-in-section");

  if (sectionsToAnimate.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          // Jika elemen masuk ke viewport
          if (entry.isIntersecting) {
            // Tambahkan kelas 'is-visible' untuk memicu animasi
            entry.target.classList.add("is-visible");
            // Hentikan pengamatan pada elemen ini agar animasi tidak berulang
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null, // relatif terhadap viewport
        threshold: 0.1, // picu animasi saat 10% elemen terlihat
        rootMargin: "0px 0px -50px 0px", // picu sedikit lebih awal sebelum elemen benar-benar di posisi
      }
    );

    sectionsToAnimate.forEach((section) => {
      sectionObserver.observe(section);
    });
  }
});