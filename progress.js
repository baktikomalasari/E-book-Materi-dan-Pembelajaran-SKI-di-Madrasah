/*
  progress.js
  Pelacak progres belajar SEDERHANA, tersimpan di localStorage browser
  pengguna masing-masing (bukan di server/database — jadi progres ini
  hanya terlihat di perangkat & browser yang sama, dan tidak disinkron
  antar-perangkat sampai ada backend sungguhan seperti Supabase).

  Dipakai oleh:
  - Setiap halaman bab (lewat quiz-engine.js): mencatat bab yang sudah
    dibuka (markVisited) dan sudah diselesaikan (markComplete).
  - index.html: membaca ringkasan progres (getSummary) untuk menampilkan
    persentase asli, menandai bab yang sudah selesai, dan mengarahkan
    tombol "Lanjutkan Belajar" ke bab yang tepat.
*/

(function () {
  const KEY = 'ski-madrasah-progress-v1';
  const TOTAL_CHAPTERS = 16;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : { completed: {}, lastVisited: null };
    } catch (e) {
      // localStorage tidak tersedia (mis. mode private ketat) — jangan sampai error mematikan halaman
      return { completed: {}, lastVisited: null };
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* abaikan diam-diam jika penyimpanan gagal/penuh */
    }
  }

  function markVisited(chapterId) {
    const data = load();
    data.lastVisited = chapterId;
    save(data);
  }

  function markComplete(chapterId, score) {
    const data = load();
    data.completed[chapterId] = { score: score ?? null, at: new Date().toISOString() };
    data.lastVisited = chapterId;
    save(data);
  }

  function getSummary() {
    const data = load();
    const completedIds = Object.keys(data.completed).map(Number);
    const percent = Math.round((completedIds.length / TOTAL_CHAPTERS) * 100);

    // Bab pertama yang BELUM diselesaikan → target tombol "Lanjutkan Belajar"
    let nextChapter = 1;
    for (let i = 1; i <= TOTAL_CHAPTERS; i++) {
      if (!data.completed[i]) { nextChapter = i; break; }
      nextChapter = TOTAL_CHAPTERS; // semua selesai → arahkan ke bab terakhir
    }

    return {
      completedIds,
      completedCount: completedIds.length,
      percent,
      lastVisited: data.lastVisited,
      nextChapter,
      totalChapters: TOTAL_CHAPTERS,
      isChapterComplete: (id) => Boolean(data.completed[id]),
    };
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* abaikan */ }
  }

  window.SKIProgress = { markVisited, markComplete, getSummary, reset };
})();
