/*
  quiz-engine.js
  Mesin uji formatif BERSAMA untuk seluruh halaman bab (1.html–16.html).

  Sebelumnya, logika render soal + skoring + unduh hasil di-copy-paste
  di setiap file bab (~150 baris x 16 file). Sekarang logikanya cukup
  ditulis SEKALI di sini. Setiap halaman bab tinggal mendefinisikan
  data soalnya sendiri (PG, ES) lalu memanggil initQuizEngine({...}).

  Contoh pemakaian di bagian bawah tiap file bab:

    <script src="assets/js/progress.js"></script>
    <script src="assets/js/quiz-engine.js"></script>
    <script>
      const PG = [ { q:'...', o:['...'], k:2, p:'...' }, ... ];
      const ES = [ { q:'...', rub:'...', model:'...' }, ... ];
      initQuizEngine({
        chapterId: 1,
        chapterLabel: 'Bab 1',
        PG, ES,
        pointsPerQuestionPG: 4,   // poin per soal PG benar
        maxScorePG: 100,          // skor PG maksimal
        showConversion: false,    // true untuk bab UTS/UAS yang punya #sKonversi
        downloadFileName: 'Skor-Uji-Formatif-Bab1-SKI.txt',
        resultTitlePrefix: 'HASIL UJI FORMATIF BAB 1',
      });
    </script>
*/

const H_OPT = ['A', 'B', 'C', 'D', 'E'];

function initQuizEngine(config) {
  const {
    chapterId,
    PG = [],
    ES = [],
    pointsPerQuestionPG,
    maxScorePG,
    showConversion = false,
    essayWeightPerQuestion = null, // mis. 20 (Bab biasa) atau 8 (UTS) — tampil di rubrik & catatan unduhan
    downloadFileName = 'Hasil-Uji-Formatif-SKI.txt',
    resultTitlePrefix = 'HASIL UJI FORMATIF',
  } = config;

  const pgBox = document.getElementById('pgBox');
  const esBox = document.getElementById('esBox');
  const rubrikBox = document.getElementById('rubrikBox');

  // ---------- Render soal pilihan ganda ----------
  if (pgBox) {
    pgBox.innerHTML = PG.map((s, i) => `
      <div class="q-card" id="qc${i}">
        <div class="q-text"><span class="q-num">${i + 1}</span><span>${s.q}</span></div>
        <div class="opts">
          ${s.o.map((o, j) => `<label class="opt" id="op${i}-${j}"><input type="radio" name="q${i}" value="${j}"><span><b>${H_OPT[j]}.</b> ${o}</span></label>`).join('')}
        </div>
        <div class="feedback" id="fb${i}"></div>
      </div>
    `).join('');
  }

  // ---------- Render soal essay ----------
  if (esBox) {
    esBox.innerHTML = ES.map((s, i) => `
      <div class="q-card">
        <div class="q-text"><span class="q-num">${i + 1}</span><span>${s.q}</span></div>
        <textarea class="essay" id="es${i}" placeholder="Tulis jawaban argumentatif Anda di sini..."></textarea>
      </div>
    `).join('');
  }

  // ---------- Render pedoman penskoran essay (untuk dosen) ----------
  if (rubrikBox) {
    rubrikBox.innerHTML = ES.map((s, i) => `
      <p><b>Soal ${i + 1}${essayWeightPerQuestion ? ` — Bobot ${essayWeightPerQuestion}` : ''}.</b><br><b>Rubrik:</b> ${s.rub}</p>
      ${s.model ? `<p><b>Jawaban model/contoh:</b> ${s.model}</p>` : ''}
    `).join('');
  }

  let submitted = false;

  // ---------- Kirim jawaban & lihat hasil ----------
  const btnSubmit = document.getElementById('btnSubmit');
  if (btnSubmit) {
    btnSubmit.onclick = () => {
      const nama = (document.getElementById('fNama')?.value || '').trim();
      const nim = (document.getElementById('fNim')?.value || '').trim();

      if (!nama || !nim) {
        alert('⚠️ Silakan isi Nama Lengkap dan NIM terlebih dahulu.');
        document.getElementById('identitas')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      let benar = 0;
      PG.forEach((s, i) => {
        const pick = document.querySelector(`input[name="q${i}"]:checked`);
        const val = pick ? parseInt(pick.value) : -1;
        const fb = document.getElementById('fb' + i);
        if (val === s.k) {
          benar++;
          fb.textContent = '✔ Benar';
          fb.className = 'feedback ok';
          document.getElementById(`op${i}-${s.k}`)?.classList.add('correct');
        } else {
          fb.textContent = `✘ Salah — Kunci jawaban: ${H_OPT[s.k]}`;
          fb.className = 'feedback no';
          if (val > -1) document.getElementById(`op${i}-${val}`)?.classList.add('wrong');
          document.getElementById(`op${i}-${s.k}`)?.classList.add('correct');
        }
        document.querySelectorAll(`input[name="q${i}"]`).forEach(r => r.disabled = true);
      });

      const skorPG = benar * pointsPerQuestionPG;
      const nilaiKonversi = Math.round((skorPG / maxScorePG) * 100);

      let esTerjawab = 0;
      ES.forEach((_, i) => {
        const ta = document.getElementById('es' + i);
        if (!ta) return;
        ta.disabled = true;
        if (ta.value.trim()) esTerjawab++;
      });

      setText('sAkhir', skorPG);
      setText('sBenar', benar);
      setText('sEs', esTerjawab);
      if (showConversion) setText('sKonversi', nilaiKonversi);

      setText('rBig', `${skorPG} / ${maxScorePG}`);
      setText('rName', `👤 ${nama} · NIM ${nim}`);
      setText('rPG', showConversion
        ? `${skorPG}/${maxScorePG} (Nilai Konversi: ${nilaiKonversi}/100)`
        : `${skorPG}/${maxScorePG} (${benar} benar dari ${PG.length})`);
      setText('rEs', `${esTerjawab}/${ES.length} terjawab`);

      const rb = document.getElementById('reviewBox');
      if (rb) {
        rb.innerHTML = PG.map((s, i) => {
          const pick = document.querySelector(`input[name="q${i}"]:checked`);
          const val = pick ? parseInt(pick.value) : -1;
          return `
            <div class="q-card">
              <div class="q-text"><span class="q-num">${i + 1}</span><span>${s.q}</span></div>
              <p style="font-size:.88rem;margin-bottom:.4rem">Jawaban Anda: <b>${val > -1 ? H_OPT[val] : '—'}</b> · Kunci: <b>${H_OPT[s.k]}</b></p>
              <div class="pembahasan"><b>Pembahasan:</b> ${s.p}</div>
            </div>
          `;
        }).join('');
      }

      show('hasil');
      show('reviewSec');
      document.getElementById('hasil')?.scrollIntoView({ behavior: 'smooth' });
      submitted = true;

      // Catat progres bab ini secara lokal di perangkat/browser pengguna
      if (window.SKIProgress) {
        window.SKIProgress.markComplete(chapterId, nilaiKonversi);
      }
    };
  }

  // ---------- Unduh hasil sebagai .txt ----------
  const btnTxt = document.getElementById('btnTxt');
  if (btnTxt) {
    btnTxt.onclick = () => {
      if (!submitted) {
        alert('Silakan kirim jawaban terlebih dahulu.');
        return;
      }
      const g = id => document.getElementById(id)?.value || '-';
      let t = `=== ${resultTitlePrefix} — SKI MADRASAH ===\n\n`;
      t += 'Nama\t: ' + g('fNama') + '\n';
      t += 'NIM\t: ' + g('fNim') + '\n';
      t += 'Tanggal\t: ' + g('fTgl') + '\n';
      t += 'Fakultas/Institusi\t: ' + g('fFak') + '\n';
      t += 'Prodi\t: ' + g('fProdi') + '\n';
      t += 'Semester\t: ' + g('fSmt') + '\n';
      t += 'Kelas\t: ' + g('fKls') + '\n\n';

      t += '--- BAGIAN A: PILIHAN GANDA ---\n';
      let benar = 0;
      PG.forEach((s, i) => {
        const pick = document.querySelector(`input[name="q${i}"]:checked`);
        const val = pick ? parseInt(pick.value) : -1;
        const ok = val === s.k;
        if (ok) benar++;
        t += `No ${i + 1}: ${val > -1 ? H_OPT[val] : '-'} (kunci ${H_OPT[s.k]}) ${ok ? 'BENAR' : 'SALAH'}\n`;
      });

      const skorPG = benar * pointsPerQuestionPG;
      t += `\nSkor PG: ${skorPG} / ${maxScorePG}\n`;
      if (showConversion) t += `Nilai Konversi: ${Math.round((skorPG / maxScorePG) * 100)} / 100\n`;

      t += '\n--- BAGIAN B: ESSAY ---\n';
      ES.forEach((s, i) => {
        t += `\nEssay ${i + 1}: ${s.q}\nJawaban:\n${document.getElementById('es' + i)?.value || '(kosong)'}\n`;
      });
      t += essayWeightPerQuestion
        ? `\nCatatan: Essay dinilai manual oleh dosen berdasarkan rubrik (maks ${essayWeightPerQuestion} poin per soal, total ${essayWeightPerQuestion * ES.length} poin).\n`
        : '\nCatatan: Essay dinilai manual oleh dosen berdasarkan rubrik.\n';

      const blob = new Blob([t], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = downloadFileName;
      a.click();
    };
  }

  // ---------- Garis progres bacaan (di bagian paling atas halaman) ----------
  const rbar = document.getElementById('rbar');
  if (rbar) {
    addEventListener('scroll', () => {
      const h = document.documentElement;
      const p = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      rbar.style.width = p + '%';
    }, { passive: true });
  }

  // Catat bahwa bab ini baru saja dibuka (dipakai fitur "Lanjutkan Belajar")
  if (window.SKIProgress) {
    window.SKIProgress.markVisited(chapterId);
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
}
