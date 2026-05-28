// ==========================================
// SheetDB Live Database Connector
// ==========================================

// নিচের লাইনে আপনার SheetDB থেকে প্রাপ্ত আসল লিংকটি বসিয়ে দিন
const API_URL = "এখানে_আপনার_SHEETDB_থেকে_কপি_করা_লিংকটি_বসান"; 

const ADMIN_PIN = "1234"; 
let appData = { members: [], transactions: [] };

const memberForm = document.querySelector("#memberForm");
const depositForm = document.querySelector("#depositForm");
const depositMemberSelect = document.querySelector("#depositMember");
const memberTable = document.querySelector("#memberTable");
const depositTable = document.querySelector("#depositTable");

window.addEventListener("DOMContentLoaded", () => {
  loadLiveDatabase();
});

// ডাটাবেজ থেকে ডাটা আনা
function loadLiveDatabase() {
  if (!API_URL || API_URL.includes("এখানে_আপনার")) return;

  // ১. মেম্বার লিস্ট আনা (Sheet1 / Members)
  fetch(`${API_URL}?sheet=Members`)
    .then(res => res.json())
    .then(data => {
      appData.members = Array.isArray(data) ? data : [];
      renderMembers();
    }).catch(err => console.error(err));

  // ২. ট্রানজেকশন লিস্ট আনা (Transactions)
  fetch(`${API_URL}?sheet=Transactions`)
    .then(res => res.json())
    .then(data => {
      appData.transactions = Array.isArray(data) ? data : [];
      renderTransactions();
      updateMetrics();
    }).catch(err => console.error(err));
}

function renderMembers() {
  if (!memberTable) return;
  memberTable.innerHTML = "";
  if (appData.members.length === 0) {
    memberTable.innerHTML = "<tr><td colspan='4'>কোনো সদস্য পাওয়া যায়নি।</td></tr>";
    return;
  }
  if (depositMemberSelect) {
    depositMemberSelect.innerHTML = "<option value=''>সদস্য নির্বাচন করুন</option>";
    appData.members.forEach(m => {
      depositMemberSelect.insertAdjacentHTML("beforeend", `<option value="${m.Name}">${m.Name}</option>`);
    });
  }
  appData.members.forEach(m => {
    memberTable.insertAdjacentHTML("beforeend", `<tr><td><strong>${m.Name}</strong></td><td>${m.Phone}</td><td>${m.Address}</td><td>${m.JoinDate}</td></tr>`);
  });
}

function renderTransactions() {
  if (!depositTable) return;
  depositTable.innerHTML = "";
  appData.transactions.forEach(t => {
    let badge = t.Status === "Approved" ? `<span class="badge-approved">অনুমোদিত</span>` : `<span class="badge-pending">পেন্ডিং</span>`;
    depositTable.insertAdjacentHTML("beforeend", `<tr><td><strong>${t.Member}</strong></td><td>৳${t.Amount}</td><td>${t.Method}</td><td><code>${t.Reference}</code></td><td>${t.Date}</td><td>${badge}</td></tr>`);
  });
}

function updateMetrics() {
  if(document.querySelector("#memberCount")) document.querySelector("#memberCount").textContent = appData.members.length;
  if(document.querySelector("#recordCount")) document.querySelector("#recordCount").textContent = appData.transactions.length;
  let total = appData.transactions.reduce((sum, t) => sum + parseFloat(t.Amount || 0), 0);
  if(document.querySelector("#totalDeposit")) document.querySelector("#totalDeposit").textContent = "৳" + total;
}

// নতুন মেম্বার সেভ করা
if (memberForm) {
  memberForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      Name: document.querySelector("#memberName").value.trim(),
      Phone: document.querySelector("#memberPhone").value.trim(),
      Address: document.querySelector("#memberAddress").value.trim(),
      JoinDate: document.querySelector("#memberJoinDate").value
    };
    fetch(`${API_URL}?sheet=Members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [data] })
    }).then(() => { alert("সদস্য ডাটাবেজে সেভ হয়েছে!"); location.reload(); });
  });
}

// নতুন ট্রানজেকশন সেভ করা
if (depositForm) {
  depositForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      Member: document.querySelector("#depositMember").value,
      Amount: document.querySelector("#depositAmount").value,
      Method: document.querySelector("#depositMethod").value,
      Reference: document.querySelector("#depositReference").value.trim(),
      Date: document.querySelector("#depositDate").value,
      Status: "Pending"
    };
    fetch(`${API_URL}?sheet=Transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [data] })
    }).then(() => { alert("জমার রিকোয়েস্ট পাঠানো হয়েছে!"); location.reload(); });
  });
}
