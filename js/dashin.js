document.addEventListener("DOMContentLoaded", function () {
  const table = $("#containerTable").DataTable();

  // Konfigurasi Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyBYdbo6du0u3ZxT53lFEXpNccPwTu8czN4",
    authDomain: "incoming-schedule-monitoring.firebaseapp.com",
    projectId: "incoming-schedule-monitoring",
    storageBucket: "incoming-schedule-monitoring.firebasestorage.app",
    messagingSenderId: "460704037681",
    appId: "1:460704037681:web:311d272b7ca9250f130e10",
    databaseURL: "https://incoming-schedule-monitoring-default-rtdb.asia-southeast1.firebasedatabase.app/"
  };

  // Inisialisasi Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();

  function getStatusProgress(timeIn, unloadingTime, finish) {
    timeIn = typeof timeIn === 'string' ? timeIn.trim() : (timeIn ? String(timeIn).trim() : "");
    unloadingTime = typeof unloadingTime === 'string' ? unloadingTime.trim() : (unloadingTime ? String(unloadingTime).trim() : "");
    finish = typeof finish === 'string' ? finish.trim() : (finish ? String(finish).trim() : "");

    const allEmpty = [timeIn, unloadingTime, finish].every(val => val === "");
    const allDash = [timeIn, unloadingTime, finish].every(val => val === "-");

    if (allEmpty) return "Outstanding";
    if (allDash) return "Reschedule";
    if (timeIn && timeIn !== "-" && (!unloadingTime || unloadingTime === "-")) return "Waiting";
    if (timeIn && unloadingTime && timeIn !== "-" && unloadingTime !== "-" && (!finish || finish === "-")) return "Processing";
    if (timeIn && unloadingTime && finish && timeIn !== "-" && unloadingTime !== "-" && finish !== "-") return "Finish";

    return "";
  }

  function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const shortYear = year.toString().slice(-2);
  return `${day}-${monthNames[month]}-${shortYear}`;
}

  function renderRow(row, index, id) {
    if (!row || !row["FEET"] || !row["PACKAGE"]) return "";

    const feet = row["FEET"].trim().toUpperCase();
    const packageVal = row["PACKAGE"].trim().toUpperCase();
    let np20 = "", np40 = "", p20 = "", p40 = "";
    const isBag = packageVal.includes("BAG");

    if (feet === '1X20' && isBag) np20 = '✔';
    else if (feet === '1X40' && isBag) np40 = '✔';
    else if (feet === '1X20' && !isBag) p20 = '✔';
    else if (feet === '1X40' && !isBag) p40 = '✔';

    const timeIn = row["TIME IN"] === "-" ? "" : (row["TIME IN"] || "");
    const unloadingTime = row["UNLOADING TIME"] === "-" ? "" : (row["UNLOADING TIME"] || "");
    const finish = row["FINISH"] === "-" ? "" : (row["FINISH"] || "");
    const status = getStatusProgress(timeIn, unloadingTime, finish);

    return `
      <tr data-id="${id}">
        <td>${index + 1}</td>
        <td>${row["NO CONTAINER"] || ""}</td>
        <td>${feet}</td>
        <td>${np20}</td>
        <td>${np40}</td>
        <td>${p20}</td>
        <td>${p40}</td>
        <td>${row["INVOICE NO"] || ""}</td>
        <td>${row["PACKAGE"] || ""}</td>
        <td>${formatDate(row["INCOMING PLAN"])}</td>
        <td class="status-progress" data-status="${status}">
          <span class="label label-${status.toLowerCase()}">${status}</span>
        </td>
        <td>${timeIn}</td>
        <td>${unloadingTime}</td>
        <td>${finish}</td>
      </tr>
    `;
  }

  function loadFirebaseData() {
    const ref = database.ref('incoming_schedule'); // ✅ Perbaikan path

    ref.once('value')
      .then(snapshot => {
        const data = snapshot.val();
        table.clear();

        let index = 0;
        for (const id in data) {
          const row = data[id];
          const html = renderRow(row, index++, id);
          if (html) table.row.add($(html));
        }

        table.draw();
      })
      .catch(err => console.error("❌ Gagal ambil data dari Firebase:", err));
  }

  // Load data dari Firebase saat halaman siap
  loadFirebaseData();

  // Optional: auto-refresh data setiap 30 detik
  // setInterval(loadFirebaseData, 30000);
});
