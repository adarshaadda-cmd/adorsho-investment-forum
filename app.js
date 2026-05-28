const STORAGE_KEY = "adorshoForumData";

// আপনার তৈরি করা SheetDB API URL এখানে বসানো হয়েছে
const API_URL = "https://sheetdb.io/api/v1/lmrf3oyr8moj7"; 

// অ্যাকাউন্টস প্যানেলের গোপন পিনকোড (আপনি চাইলে আপনার ইচ্ছামতো ৪ ডিজিটের পিন দিতে পারেন)
const ADMIN_PIN = "1234"; 

const today = new Date().toISOString().slice(0, 10);
const defaultSettings = {
  bankAccountName: "Adorsho Adda Investment Forum",
  bankAccountNumber: "000000000000",
  bankBranch: "আপনার ব্যাংকের তথ্য দিন",
  bkashNumber: "01XXXXXXXXX",
  bkashType: "Personal/Merchant",
  nagadNumber: "01XXXXXXXXX",
  nagadType: "Personal/Merchant",
  cashReceiver: "কমিটির দায়িত্বপ্রাপ্ত ব্যক্তি",
};
const defaultData = {
  members: [],
  deposits: [],
  paymentSettings: defaultSettings,
};

// DOM এলিমেন্টসমূহ
const memberForm = document.querySelector("#memberForm");
const depositForm = document.querySelector("#depositForm");
const memberMessage = document.querySelector("#memberMessage");
const depositMessage = document.querySelector("#depositMessage");
const memberTable = document.querySelector("#memberTable");
const depositTable = document.querySelector("#depositTable");
const depositMember = document.querySelector("#depositMember");
const exportButton = document.querySelector("#exportButton");

// অ্যাকাউন্টস প্যানেল এলিমেন্টসমূহ
const loginAdminBtn = document.querySelector("#loginAdminBtn");
const adminPinInput = document.querySelector("#adminPin");
const adminContent = document.querySelector("#adminContent");
const adminPendingTable = document.querySelector("#adminPendingTable");

if(document.querySelector("#memberJoinDate")) document.querySelector("#memberJoinDate").value = today;
if(document.querySelector("#depositDate")) document.querySelector("#depositDate").value = today;

let currentAppData = { ...defaultData };

// ১. গুগল শিট থেকে লাইভ ডাটা লোড করার ফাংশন
async function loadData() {
  try {
    const response = await fetch(API_URL);
    const rows = await response.json();
    
    if (rows && rows.length > 0 && rows[0].data) {
      const parsed = JSON.parse(rows[0].data);
      currentAppData = {
        members: Array.isArray(parsed.members) ? parsed.members : [],
        deposits: Array.isArray(parsed.deposits) ? parsed.deposits : [],
        paymentSettings: { ...defaultSettings, ...(parsed.paymentSettings || {}) }
      };
    }
  } catch (error) {
    console.error("ডাটা লোড করতে সমস্যা হয়েছে:", error);
  }
  renderApp();
}

// ২. গুগল শিটে লাইভ ডাটা সেভ করার ফাংশন
async function saveData(data) {
  currentAppData = data;
  const payload = { data: { id: "1", data: JSON.stringify(data) } };
  try {
    await fetch(`${API_URL}/id/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    loadData(); // সেভ শেষে ডাটা রিফ্রেশ করা
  } catch (error) {
    console.error("ডাটা সেভ করা যায়নি:", error);
  }
}

// ৩. টাকার বাংলা ফরম্যাট
function formatMoney(amount) {
  return "৳" + Number(amount).toLocaleString('bn-BD');
}

// ৪. ইন্টারফেস আপডেট এবং ড্যাশবোর্ড রেন্ডার করার মূল ফাংশন
function renderApp() {
  // শুধুমাত্র অ্যাকাউন্টস মেম্বার দ্বারা অনুমোদিত (Approved) জমার হিসাব করা হবে
  const approvedDeposits = currentAppData.deposits.filter(d => d.status === "Approved");
  
  if(document.querySelector("#memberCount")) document.querySelector("#memberCount").innerText = currentAppData.members.length;
  if(document.querySelector("#recordCount")) document.querySelector("#recordCount").innerText = currentAppData.deposits.length;
  
  const totalSum = approvedDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
  if(document.querySelector("#totalDeposit")) document.querySelector("#totalDeposit").innerText = formatMoney(totalSum);

  // জমার ফরমে নিবন্ধিত মেম্বারদের ড্রপডাউন লিস্ট সচল করা
  if (depositMember) {
    depositMember.innerHTML = '<option value="">সদস্য নির্বাচন করুন</option>';
    currentAppData.members.forEach(m => {
      depositMember.innerHTML += `<option value="${m.name}">${m.name} (${m.phone})</option>`;
    });
  }

  // সদস্য তালিকা টেবিল তৈরি
  if (memberTable) {
    if (currentAppData.members.length === 0) {
      memberTable.innerHTML = '<tr><td colspan="4">এখনও কোনো সদস্য নেই।</td></tr>';
    } else {
      memberTable.innerHTML = currentAppData.members.map(m => `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td>${m.phone}</td>
          <td>${m.address}</td>
          <td>${m.date}</td>
        </tr>
      `).join('');
    }
  }

  // সাধারণ জমার তালিকা টেবিল তৈরি (পেন্ডিং ও অনুমোদিত উভয়ই দেখাবে)
  if (depositTable) {
    if (currentAppData.deposits.length === 0) {
      depositTable.innerHTML = '<tr><td colspan="6">এখনও কোনো জমার রেকর্ড নেই।</td></tr>';
    } else {
      depositTable.innerHTML = currentAppData.deposits.map(d => `
        <tr>
          <td><strong>${d.member}</strong></td>
          <td>${formatMoney(d.amount)}</td>
          <td>${d.method}</td>
          <td><code>${d.reference}</code></td>
          <td>${d.date}</td>
          <td><span class="${d.status === 'Approved' ? 'badge-approved' : 'badge-pending'}">${d.status === 'Approved' ? 'অনুমোদিত' : 'পেন্ডিং'}</span></td>
        </tr>
      `).join('');
    }
  }

  // অ্যাকাউন্টস মেম্বারের ভেরিফিকেশন প্যানেলের টেবিল আপডেট
  renderAdminTable();
}

// ৫. অ্যাকাউন্টস মেম্বারের পেন্ডিং টেবিল জেনারেট করা
function renderAdminTable() {
  if (!adminPendingTable) return;
  const pendingList = currentAppData.deposits.filter(d => d.status === "Pending");

  if (pendingList.length === 0) {
    adminPendingTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: green; font-weight: bold; padding: 15px;">সব ট্রানজেকশন চেক করা শেষ! কোনো পেন্ডিং রিকোয়েস্ট নেই।</td></tr>';
  } else {
    adminPendingTable.innerHTML = pendingList.map(d => `
      <tr>
        <td><strong>${d.member}</strong></td>
        <td><span style="color: #2e7d32; font-weight: bold;">${formatMoney(d.amount)}</span></td>
        <td><mark>${d.method}</mark></td>
        <td><code>${d.reference}</code></td>
        <td><button class="admin-btn" onclick="approvePayment('${d.reference}')">Approve</button></td>
      </tr>
    `).join('');
  }
}

// ৬. পেমেন্ট রিকোয়েস্ট অনুমোদন করার গ্লোবাল ফাংশন
window.approvePayment = async function(trxId) {
  const updatedDeposits = currentAppData.deposits.map(d => {
    if (d.reference === trxId) {
      d.status = "Approved";
    }
    return d;
  });

  currentAppData.deposits = updatedDeposits;
  if(depositMessage) depositMessage.innerText = "পেমেন্টটি অনুমোদন করা হচ্ছে, দয়া করে অপেক্ষা করুন...";
  await saveData(currentAppData);
  alert("পেমেন্টটি সফলভাবে অনুমোদিত হয়েছে এবং মূল ব্যালেন্সে যোগ হয়েছে!");
};

// ৭. নতুন সদস্য ফর্ম হ্যান্ডলার
if (memberForm) {
  memberForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.querySelector("#memberName").value.trim();
    const phone = document.querySelector("#memberPhone").value.trim();
    const address = document.querySelector("#memberAddress").value.trim();
    const date = document.querySelector("#memberJoinDate").value;

    if (currentAppData.members.some(m => m.phone === phone)) {
      if(memberMessage) memberMessage.innerText = "⚠️ এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত!";
      return;
    }

    currentAppData.members.push({ name, phone, address, date });
    if(memberMessage) memberMessage.innerText = "সদস্য ডাটা সেভ হচ্ছে...";
    await saveData(currentAppData);
    if(memberMessage) memberMessage.innerText = "✅ সদস্য সফলভাবে নিবন্ধিত হয়েছে!";
    memberForm.reset();
    document.querySelector("#memberJoinDate").value = today;
  });
}

// ৮. জমার তথ্য ফর্ম হ্যান্ডলার (ডিফল্টভাবে 'Pending' থাকবে)
if (depositForm) {
  depositForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const member = document.querySelector("#depositMember").value;
    const amount = document.querySelector("#depositAmount").value;
    const method = document.querySelector("#depositMethod").value;
    const reference = document.querySelector("#depositReference").value.trim();
    const date = document.querySelector("#depositDate").value;

    if (currentAppData.deposits.some(d => d.reference === reference)) {
      if(depositMessage) depositMessage.innerText = "⚠️ এই ট্রানজেকশন নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে!";
      return;
    }

    currentAppData.deposits.push({ member, amount, method, reference, date, status: "Pending" });
    if(depositMessage) depositMessage.innerText = "জমার রিকোয়েস্ট ডাটাবেজে পাঠানো হচ্ছে...";
    await saveData(currentAppData);
    if(depositMessage) depositMessage.innerText = "✅ রিকোয়েস্ট পাঠানো হয়েছে! অ্যাকাউন্টস মেম্বারের অনুমোদনের পর ড্যাশবোর্ডে যোগ হবে।";
    depositForm.reset();
    document.querySelector("#depositDate").value = today;
  });
}

// ৯. অ্যাকাউন্টস মেম্বার পিন ভেরিফিকেশন লগইন হ্যান্ডলার
if (loginAdminBtn) {
  loginAdminBtn.addEventListener("click", () => {
    const enteredPin = adminPinInput.value;
    if (enteredPin === ADMIN_PIN) {
      adminContent.style.display = "block";
      document.querySelector("#adminAuth").style.display = "none";
    } else {
      alert("⚠️ ভুল পিনকোড! অ্যাকাউন্টস মেম্বারের সঠিক পিন দিয়ে আবার চেষ্টা করুন।");
      adminPinInput.value = "";
    }
  });
}

// ১০. চুড়ান্ত অনুমোদিত রেকর্ডের CSV এক্সপোর্ট ডাটা ডাউনলোড ফাংশন
if (exportButton) {
  exportButton.addEventListener("click", () => {
    let csv = "সদস্য,পরিমাণ,পেমেন্ট মাধ্যম,রেফারেন্স,তারিখ,স্ট্যাটাস\n";
    currentAppData.deposits.forEach(d => {
      csv += `"${d.member}","${d.amount}","${d.method}","${d.reference}","${d.date}","${d.status}"\n`;
    });
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Adorsho_Forum_Records_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// অ্যাপ্লিকেশন স্টার্টআপ ও প্রথমবার ডাটা সিঙ্ক
loadData();
