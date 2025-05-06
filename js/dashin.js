document.addEventListener("DOMContentLoaded", function () {
  const table = $("#containerTable").DataTable();
  const baseId = "appxekctFAWmMVFzc";
  const tableName = "data-cont";
  const token = "Bearer patiH2AOAO9YAtJhA.61cafc7228a34200466c4235f324b0a9368cf550d04e83656db17d3374ec35d4";

  const csvInput = document.getElementById("csvFile");
  const uploadBtn = document.getElementById("uploadBtn");
  const uploadStatus = document.getElementById("uploadStatus");

  function showStatus(message, type = "info") {
    uploadStatus.textContent = message;
    uploadStatus.className = `status ${type}`;
  }

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
        <td>${row["INCOMING PLAN"] || ""}</td>
        <td class="status-progress" data-status="${status}">
          <span class="label label-${status.toLowerCase()}">${status}</span>
        </td>
        
        <td>${timeIn}</td>
        <td>${unloadingTime}</td>
        <td>${finish}</td>
      </tr>
    `;
  }

  function loadAirtableData() {
    fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?pageSize=100`, {
      headers: { Authorization: token }
    })
      .then(res => res.json())
      .then(data => {
        table.clear();

        data.records.forEach((record, i) => {
          const html = renderRow(record.fields, i, record.id);
          if (html) table.row.add($(html));
        });

        table.draw();
      })
      .catch(err => console.error("❌ Gagal ambil data dari Airtable:", err));
  }

  loadAirtableData();

  setInterval(() => {
    console.log('Refreshing data...');
    loadAirtableData();
  }, 5000);
});
