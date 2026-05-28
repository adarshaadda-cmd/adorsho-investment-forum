// =================================================================
// Official Live Data Engine: Adorsho Adda & Invest Forum
// Connects UI with Google Sheets Database via Google Apps Script API
// =================================================================

// আপনার তৈরি করা গুগল অ্যাপ স্ক্রিপ্টের লাইভ "Web App URL" টি নিচের লাইনে বসান
const API_URL = "https://script.google.com/macros/s/AKfycbz1-Z_A4eB2zH98V-bZ2T6z_Vf4bM3pXyzR8Hk7f7g/exec"; 
// [নোট: যদি উপরের লিংকে ডাটা সেভ না হয়, তবে আপনার ডিলপয়েন্ট থেকে প্রাপ্ত আসল সম্পূর্ণ লিংকটি এখানে বসিয়ে দেবেন]

const ADMIN_PIN = "1234"; // অ্যাকাউন্টস প্যানেলের ডিফল্ট ৪ ডিজিট পিনকোড

let appData = {
  members: [],
  transactions: []
};

// DOM Elements
const memberForm = document.querySelector("#memberForm");
const depositForm = document.querySelector("#depositForm");
const depositMemberSelect = document.querySelector("#depositMember");
const memberTable = document.querySelector("#memberTable");
const depositTable = document.querySelector("#depositTable");
const adminPendingTable = document.querySelector("#adminPendingTable");

// Metrics Counter Elements
const memberCountEl = document.querySelector("#memberCount");
const totalDepositEl = document.querySelector("#totalDeposit");
const recordCountEl = document.querySelector("#recordCount");

// Messages
const memberMessage = document.querySelector("#memberMessage");
const depositMessage = document.querySelector("#depositMessage");

// App Init - ল্যাপটপ বা মোবাইল রিফ্রেশ দিলে ডাটাবেজ থেকে লাইভ ডাটা আনবে
window.addEventListener("DOMContentLoaded", () => {
  // সেটআপ আজকের তারিখ
  const today = new Date().toISOString().slice(0, 10);
  if(document.querySelector("#memberJoinDate")) document.querySelector("#memberJoinDate").value = today;
  if(document.querySelector("#depositDate")) document.querySelector("#depositDate").value = today;
  
  loadLiveDatabase();
});

// ১. গুগল শিট ডাটাবেজ থেকে ডাটা লোড করার ফাংশন
function loadLiveDatabase() {
  if (!API_URL || API_URL.includes("YOUR_WEB_APP_URL")) {
    console.log("Database URL is not set yet.");
    return;
  }

  // লোডিং টেক্সট দেখানো
  if(depositMemberSelect) depositMemberSelect.innerHTML = "<option>ডাটা লোড হচ্ছে...</option>";

  fetch(API_URL)
    .then(response => response.json())
    .then(data => {
      appData.members = data.members || [];
      appData.transactions = data.transactions || [];
      
      // UI আপডেট করা
      renderMembers();
      renderTransactions();
      updateMetrics();
    })
    .catch(error => {
      console.error("Error fetching live data:", error);
    });
}

// ২. মেম্বার ডাটা রেন্ডার করা
function renderMembers() {
  if (!memberTable) return;
  memberTable.innerHTML = "";
  
  if (appData.members.length === 0) {
    memberTable.innerHTML = "<tr><td colspan='4' style='text-align:center;'>কোনো নিবন্ধিত সদস্য পাওয়া যায়নি।</td></tr>";
    if(depositMemberSelect) depositMemberSelect.innerHTML = "<option value=''>প্রথমে সদস্য নিবন্ধন করুন</option>";
    return;
  }

  // ড্রপডাউন অপশন আপডেট
  if (depositMemberSelect) {
    depositMemberSelect.innerHTML = "<option value=''>সদস্য নির্বাচন করুন</option>";
    appData.members.forEach(m => {
      let option = document.createElement("option");
      option.value = m.name;
      option.textContent = `${m.name} (${m.phone})`;
      depositMemberSelect.appendChild(option);
    });
  }

  // টেবিল তৈরি
  appData.members.forEach(m => {
    let row = `<tr>
      <td><strong>${m.name}</strong></td>
      <td>${m.phone}</td>
      <td>${m.address}</td>
      <td>${formatDate(m.joinDate)}</td>
    </tr>`;
    memberTable.insertAdjacentHTML("beforeend", row);
  });
}

// ৩. ট্রানজেকশন ডাটা রেন্ডার করা
function renderTransactions() {
  if (!depositTable) return;
  depositTable.innerHTML = "";
  
  if (appData.transactions.length === 0) {
    depositTable.innerHTML = "<tr><td colspan='6' style='text-align:center;'>কোনো ট্রানজেকশন রেকর্ড পাওয়া যায়নি।</td></tr>";
    return;
  }

  appData.transactions.forEach(t => {
    let statusBadge = t.status === "Approved" 
      ? `<span class="badge-approved">অনুমোদিত</span>` 
      : `<span class="badge-pending">পেন্ডিং</span>`;

    let row = `<tr>
      <td><strong>${t.member}</strong></td>
      <td>৳${parseFloat(t.amount).toLocaleString('bn-BD')}</td>
      <td>${translateMethod(t.method)}</td>
      <td><code style='background:#f1f5f9; padding:2px 6px; border-radius:4px;'>${t.reference}</code></td>
      <td>${formatDate(t.date)}</td>
      <td>${statusBadge}</td>
    </tr>`;
    depositTable.insertAdjacentHTML("beforeend", row);
  });

  // অ্যাকাউন্টস পেন্ডিং তালিকা আপডেট (যদি এডমিন লগইন থাকে)
  renderAdminPending();
}

// ৪. মূল ড্যাশবোর্ডের হিসাব-নিকাশ কাউন্টার আপডেট করা
function updateMetrics() {
  if (memberCountEl) memberCountEl.textContent = appData.members.length.toLocaleString('bn-BD');
  if (recordCountEl) recordCountEl.textContent = appData.transactions.length.toLocaleString('bn-BD');
  
  // শুধুমাত্র অনুমোদিত (Approved) টাকার যোগফল হিসাব করা হবে
  let totalApproved = appData.transactions
    .filter(t => t.status === "Approved")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
  if (totalDepositEl) totalDepositEl.textContent = "৳" + totalApproved.toLocaleString('bn-BD');
}

// ৫. গুগল শিটে নতুন মেম্বার ডাটা পাঠানো (POST Request)
if (memberForm) {
  memberForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const submitBtn = memberForm.querySelector("button");
    submitBtn.disabled = true;
    submitBtn.textContent = "ডাটাবেজে সেভ হচ্ছে...";
    memberMessage.textContent = "";

    const newMember = {
      action: "addMember",
      name: document.querySelector("#memberName").value.trim(),
      phone: document.querySelector("#memberPhone").value.trim(),
      address: document.querySelector("#memberAddress").value.trim(),
      joinDate: document.querySelector("#memberJoinDate").value
    };

    fetch(API_URL, {
      method: "POST",
      mode: "no-cors", // ব্রাউজার ক্রস-অরিজিন পলিসির জটিলতা এড়াতে
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMember)
    })
    .then(() => {
      memberMessage.style.color = "#10b981";
      memberMessage.textContent = "🎉 সদস্য সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে! পেজ রিফ্রেশ করুন।";
      memberForm.reset();
      // লোকাললি পুশ করে তাৎক্ষণিক দেখানো
      appData.members.push(newMember);
      renderMembers();
      updateMetrics();
    })
    .catch(err => {
      memberMessage.style.color = "#dc2626";
      memberMessage.textContent = "ত্রুটি ঘটেছে! আবার চেষ্টা করুন।";
      console.error(err);
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = "সদস্য যুক্ত করুন";
    });
  });
}

// ৬. গুগল শিটে জমার রিকোয়েস্ট পাঠানো (POST Request)
if (depositForm) {
  depositForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const submitBtn = depositForm.querySelector("button");
    submitBtn.disabled = true;
    submitBtn.textContent = "রিকোয়েস্ট পাঠানো হচ্ছে...";
    depositMessage.textContent = "";

    const newTx = {
      action: "addTransaction",
      member: document.querySelector("#depositMember").value,
      amount: document.querySelector("#depositAmount").value,
      method: document.querySelector("#depositMethod").value,
      reference: document.querySelector("#depositReference").value.trim(),
      date: document.querySelector("#depositDate").value
    };

    fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTx)
    })
    .then(() => {
      depositMessage.style.color = "#10b981";
      depositMessage.textContent = "💸 জমার রিকোয়েস্ট পাঠানো হয়েছে! এডমিন অনুমোদনের পর যোগ হবে।";
      depositForm.reset();
      
      newTx.status = "Pending";
      appData.transactions.push(newTx);
      renderTransactions();
      updateMetrics();
    })
    .catch(err => {
      depositMessage.style.color = "#dc2626";
      depositMessage.textContent = "পেমেন্ট সাবমিট ব্যর্থ হয়েছে।";
      console.error(err);
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = "জমার রিকোয়েস্ট পাঠান";
    });
  });
}

// এডমিন ভেরিফিকেশন প্যানেল লজিক
const loginAdminBtn = document.querySelector("#loginAdminBtn");
if (loginAdminBtn) {
  loginAdminBtn.addEventListener("click", () => {
    const pinInput = document.querySelector("#adminPin").value;
    if (pinInput === ADMIN_PIN) {
      document.querySelector("#adminAuth").style.display = "none";
      document.querySelector("#adminContent").style.display = "block";
      renderAdminPending();
    } else {
      alert("ভুল পিনকোড! দয়া করে সঠিক ৪ ডিজিট পিন দিন।");
    }
  });
}

function renderAdminPending() {
  if (!adminPendingTable || document.querySelector("#adminContent").style.display === "none") return;
  adminPendingTable.innerHTML = "";

  let pendings = appData.transactions.filter(t => t.status === "Pending" || !t.status);
  
  if (pendings.length === 0) {
    adminPendingTable.innerHTML = "<tr><td colspan='5' style='text-align:center; color:green;'>কোনো পেন্ডিং ট্রানজেকশন নেই!</td></tr>";
    return;
  }

  pendings.forEach((t, index) => {
    let row = `<tr>
      <td>${t.member}</td>
      <td>৳${t.amount}</td>
      <td>${translateMethod(t.method)}</td>
      <td>${t.reference}</td>
      <td><button class='admin-btn' onclick='alert("গুগল শিট থেকে সরাসরি Row-এর Status কলামটি Approved লিখে দিন।")'>অনুমোদন</button></td>
    </tr>`;
    adminPendingTable.insertAdjacentHTML("beforeend", row);
  });
}

// ইউটিলিটি হেল্পার ফাংশনসমূহ
function formatDate(dateStr) {
  if(!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if(isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch(e) { return dateStr; }
}

function translateMethod(m) {
  const methods = { bKash: "বিকাশ", Nagad: "নগদ", Bank: "ব্যাংক", Cash: "ক্যাশ" };
  return methods[m] || m;
}

// এক্সেল ডাউনলোড লজিক
if(document.querySelector("#exportButton")) {
  document.querySelector("#exportButton").addEventListener("click", () => {
    if(appData.transactions.length === 0) return alert("ডাউনলোড করার মতো কোনো ডাটা নেই।");
    let csv = "সদস্যের নাম,জমার পরিমাণ,মাধ্যম,রেফারেন্স ID,তারিখ,স্ট্যাটাস\n";
    appData.transactions.forEach(t => {
      csv += `"${t.member}","${t.amount}","${translateMethod(t.method)}","${t.reference}","${t.date}","${t.status}"\n`;
    });
    let blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Investment_Forum_Ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
