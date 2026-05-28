// ==========================================
// Google Sheets Live Database Engine V2 (With Edit Feature)
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbyuy2PGMhbuwyGZGg7BQmQ8lnwe60aKsnIhibPVMUPYd0HRMUKW_EFlPSuqiniEk5i4/exec"; 

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

// ডাটাবেজ থেকে লাইভ ডাটা আনা
function loadLiveDatabase() {
  if (!API_URL || API_URL.includes("YOUR_WEB_APP_URL")) return;

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      appData.members = data.members || [];
      appData.transactions = data.transactions || [];
      renderMembers();
      renderTransactions();
      updateMetrics();
    })
    .catch(err => console.error("Error loading data:", err));
}

// সদস্য তালিকা রেন্ডার এবং এডিট বাটন যুক্ত করা
function renderMembers() {
  if (!memberTable) return;
  memberTable.innerHTML = "";
  
  if (appData.members.length === 0) {
    memberTable.innerHTML = "<tr><td colspan='5' style='text-align:center;'>কোনো সদস্য পাওয়া যায়নি।</td></tr>";
    return;
  }
  
  if (depositMemberSelect) {
    depositMemberSelect.innerHTML = "<option value=''>সদস্য নির্বাচন করুন</option>";
    appData.members.forEach(m => {
      depositMemberSelect.insertAdjacentHTML("beforeend", `<option value="${m.name}">${m.name}</option>`);
    });
  }
  
  appData.members.forEach((m, index) => {
    let phoneDisplay = m.phone ? m.phone : "<span style='color:#aaa; font-style:italic;'>দেওয়া হয়নি</span>";
    let addressDisplay = m.address ? m.address : "<span style='color:#aaa; font-style:italic;'>দেওয়া হয়নি</span>";
    
    memberTable.insertAdjacentHTML("beforeend", `
      <tr>
        <td><strong>${m.name}</strong></td>
        <td>${phoneDisplay}</td>
        <td>${addressDisplay}</td>
        <td>${m.joinDate}</td>
        <td>
          <button class="btn-edit" onclick="editMember('${m.name}', '${m.phone || ''}', '${m.address || ''}')" style="background:#0284c7; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">✏️ এডিট</button>
        </td>
      </tr>
    `);
  });
}

// সদস্যের তথ্য এডিট করার ফাংশন
function editMember(currentName, currentPhone, currentAddress) {
  const pin = prompt("তথ্য পরিবর্তন করতে এডমিন পিন (PIN) দিন:");
  if (pin !== ADMIN_PIN) {
    alert("ভুল পিন! আপনি তথ্য পরিবর্তন করতে পারবেন না।");
    return;
  }
  
  const newPhone = prompt(`'${currentName}' এর নতুন মোবাইল নাম্বার দিন (ফাঁকা রাখতে চাইলে সরাসরি OK চাপুন):`, currentPhone);
  const newAddress = prompt(`'${currentName}' এর নতুন ঠিকানা দিন (ফাঁকা রাখতে চাইলে সরাসরি OK চাপুন):`, currentAddress);
  
  if (newPhone === null || newAddress === null) return; // বাতিল করলে কিছু হবে না

  // গুগল স্ক্রিপ্টে এডিটেড ডাটা পাঠানো
  const updatedData = {
    action: "addMember", // আমরা একই অপশন দিয়ে শিটে নতুন ডাটা ওভাররাইট বা অ্যাপেন্ড করতে পারি
    name: currentName,
    phone: newPhone.trim(),
    address: newAddress.trim(),
    joinDate: new Date().toISOString().split('T')[0] // কারেন্ট ডেট
  };

  alert("তথ্য আপডেট হচ্ছে... দয়া করে শিটটি চেক করুন বা পেজ রিফ্রেশ দিন।");
  
  fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData)
  }).then(() => {
    location.reload();
  });
}

function renderTransactions() {
  if (!depositTable) return;
  depositTable.innerHTML = "";
  
  if (appData.transactions.length === 0) {
    depositTable.innerHTML = "<tr><td colspan='6' style='text-align:center;'>কোনো ট্রানজেকশন রেকর্ড নেই।</td></tr>";
    return;
  }

  appData.transactions.forEach(t => {
    let badge = t.status === "Approved" ? `<span class="badge-approved">অনুমোদিত</span>` : `<span class="badge-pending">পেন্ডিং</span>`;
    depositTable.insertAdjacentHTML("beforeend", `<tr><td><strong>${t.member}</strong></td><td>৳${t.amount}</td><td>${t.method}</td><td><code>${t.reference}</code></td><td>${t.date}</td><td>${badge}</td></tr>`);
  });
}

function updateMetrics() {
  if(document.querySelector("#memberCount")) document.querySelector("#memberCount").textContent = appData.members.length;
  if(document.querySelector("#recordCount")) document.querySelector("#recordCount").textContent = appData.transactions.length;
  
  let total = appData.transactions
    .filter(t => t.status === "Approved" || t.status === "Pending") 
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
  if(document.querySelector("#totalDeposit")) document.querySelector("#totalDeposit").textContent = "৳" + total;
}

// নতুন মেম্বার সেভ করা
if (memberForm) {
  memberForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      action: "addMember",
      name: document.querySelector("#memberName").value.trim(),
      phone: document.querySelector("#memberPhone").value.trim(),
      address: document.querySelector("#memberAddress").value.trim(),
      joinDate: document.querySelector("#memberJoinDate").value
    };
    
    fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(() => { 
      alert("সদস্য ডাটাবেজে সফলভাবে সাবমিট হয়েছে!"); 
      location.reload(); 
    });
  });
}

// নতুন ট্রানজেকশন সেভ করা
if (depositForm) {
  depositForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      action: "addTransaction",
      member: document.querySelector("#depositMember").value,
      amount: document.querySelector("#depositAmount").value,
      method: document.querySelector("#depositMethod").value,
      reference: document.querySelector("#depositReference").value.trim(),
      date: document.querySelector("#depositDate").value
    };
    
    fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(() => { 
      alert("জমার রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!"); 
      location.reload(); 
    });
  });
}
