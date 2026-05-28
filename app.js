// ==========================================
// Google Sheets Live Engine V3.1 (With One-Click Approval System)
// ==========================================

// ⚠️ এখানে আপনার ধাপ ১-এ তৈরি করা নতুন Apps Script Deployment URL-টি বসান
const API_URL = "https://script.google.com/macros/s/AKfycbyuy2PGMhbuwyGZGg7BQmQ8lnwe60aKsnIhibPVMUPYd0HRMUKW_EFlPSuqiniEk5i4/exec"; 

const ADMIN_PIN = "1234"; // এডিট, নোটিশ ও পেমেন্ট অ্যাপ্রুভ করার পিনকোড
let appData = { members: [], transactions: [], updates: [] };

window.addEventListener("DOMContentLoaded", () => {
  loadLiveDatabase();
  setupFormListeners();
});

function loadLiveDatabase() {
  if (!API_URL || API_URL.includes("YOUR_WEB_APP_URL")) return;

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      appData.members = data.members || [];
      appData.transactions = data.transactions || [];
      appData.updates = data.updates || [];
      
      renderMembers();
      renderTransactions();
      renderNoticeAndBlogs();
      updateMetrics();
    })
    .catch(err => console.error("Error loading data:", err));
}

function renderMembers() {
  const memberTable = document.querySelector("#memberTable");
  const depositMemberSelect = document.querySelector("#depositMember");
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
  
  appData.members.forEach(m => {
    let phoneDisplay = m.phone ? m.phone : "<span style='color:#aaa; font-style:italic;'>দেওয়া হয়নি</span>";
    let addressDisplay = m.address ? m.address : "<span style='color:#aaa; font-style:italic;'>দেওয়া হয়নি</span>";
    
    memberTable.insertAdjacentHTML("beforeend", `
      <tr>
        <td><strong>${m.name}</strong></td>
        <td>${phoneDisplay}</td>
        <td>${addressDisplay}</td>
        <td>${m.joinDate}</td>
        <td>
          <button onclick="editMember('${m.name}', '${m.phone || ''}', '${m.address || ''}')" style="background:#0284c7; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">✏️ এডিট</button>
        </td>
      </tr>
    `);
  });
}

function editMember(currentName, currentPhone, currentAddress) {
  const pin = prompt("মেম্বারের তথ্য পরিবর্তন করতে এডমিন পিন (PIN) দিন:");
  if (pin !== ADMIN_PIN) { alert("ভুল পিন!"); return; }
  
  const newPhone = prompt(`'${currentName}' এর নতুন মোবাইল নাম্বার দিন:`, currentPhone);
  const newAddress = prompt(`'${currentName}' এর নতুন ঠিকানা দিন:`, currentAddress);
  
  if (newPhone === null || newAddress === null) return;

  const updatedData = {
    action: "addMember",
    name: currentName,
    phone: newPhone.trim(),
    address: newAddress.trim()
  };

  alert("তথ্য আপডেট হচ্ছে... অনুগ্রহ করে ১০ সেকেন্ড অপেক্ষা করুন।");
  fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(updatedData) }).then(() => location.reload());
}

// ট্রানজেকশন রেন্ডার করার ফাংশন (যেখানে এখন অ্যাপ্রুভাল বাটন লাইভ থাকবে)
function renderTransactions() {
  const depositTable = document.querySelector("#depositTable");
  if (!depositTable) return;
  depositTable.innerHTML = "";
  
  if (appData.transactions.length === 0) {
    depositTable.innerHTML = "<tr><td colspan='6' style='text-align:center;'>কোনো ট্রানজেকশন রেকর্ড নেই।</td></tr>";
    return;
  }
  
  // গুগল শিটের ২ নম্বর লাইন থেকে ডেটা শুরু হয়, তাই index + 2 ব্যবহার করে ট্র্যাকিং করা হচ্ছে
  appData.transactions.forEach((t, index) => {
    let badge = "";
    let actionBtn = "";
    
    if (t.status === "Approved") {
      badge = `<span style="background:#bbf7d0; color:#166534; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:600;">অনুমোদিত</span>`;
      actionBtn = `<span style="color:#22c55e; font-size:13px; font-weight:bold;">✓ সম্পন্ন</span>`;
    } else {
      badge = `<span style="background:#fef08a; color:#854d0e; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:600;">পেন্ডিং</span>`;
      // পেন্ডিং ডাটার পাশে শুধুমাত্র এডমিনের জন্য ক্লিকেবল বাটন থাকবে
      actionBtn = `<button onclick="approveTransaction(${index + 2})" style="background:#16a34a; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,0.1);">✅ Approve</button>`;
    }
    
    depositTable.insertAdjacentHTML("beforeend", `
      <tr>
        <td><strong>${t.member}</strong></td>
        <td><span style="color:#0f172a; font-weight:600;">৳${t.amount}</span></td>
        <td><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:13px;">${t.method}</span></td>
        <td><code>${t.reference}</code></td>
        <td>${t.date}</td>
        <td style="display:flex; justify-content:center; align-items:center; gap:8px; border-bottom:none;">${badge} ${actionBtn}</td>
      </tr>
    `);
  });
}

// ওয়েবসাইট থেকে সরাসরি অ্যাপ্রুভ করার সিকিউর ফাংশন
function approveTransaction(rowId) {
  const pin = prompt("এই পেমেন্টটি অনুমোদন করতে এডমিন পিন (PIN) দিন:");
  if (pin !== ADMIN_PIN) { alert("ভুল পিন নম্বর!"); return; }
  
  const updatedData = {
    action: "approveTransaction",
    rowId: rowId
  };
  
  alert("পেমেন্টটি অনুমোদন হচ্ছে... অনুগ্রহ করে ১০ সেকেন্ড অপেক্ষা করুন।");
  
  fetch(API_URL, { 
    method: 'POST', 
    mode: 'no-cors', 
    body: JSON.stringify(updatedData) 
  }).then(() => {
    alert("পেমেন্টটি সফলভাবে অনুমোদিত হয়েছে এবং মোট জমার সাথে যোগ হয়েছে!");
    location.reload();
  }).catch(err => {
    alert("দুঃখিত, কোনো কারিগরি সমস্যা হয়েছে।");
    console.error(err);
  });
}

function renderNoticeAndBlogs() {
  const noticeBoard = document.querySelector("#liveNoticeBoard");
  const blogFeed = document.querySelector("#liveBlogFeed");
  
  if(noticeBoard) noticeBoard.innerHTML = "";
  if(blogFeed) blogFeed.innerHTML = "";

  let notices = appData.updates.filter(u => u.type === "notice");
  let blogs = appData.updates.filter(u => u.type === "blog");

  if(notices.length === 0 && noticeBoard) {
    noticeBoard.innerHTML = "<p style='color:#777; font-style:italic;'>কোনো লাইভ নোটিশ নেই।</p>";
  } else if(noticeBoard) {
    notices.reverse().forEach(n => {
      noticeBoard.insertAdjacentHTML("beforeend", `
        <div class="notice-item" style="background:#fef2f2; border-left:4px solid #ef4444; padding:12px; margin-bottom:10px; border-radius:4px;">
          <h4 style="color:#b91c1c; margin:0 0 5px 0;">📌 ${n.title} <span style="font-size:11px; color:#666; font-weight:normal;">(${n.date})</span></h4>
          <p style="margin:0; font-size:14px; color:#333;">${n.content}</p>
        </div>
      `);
    });
  }

  if(blogs.length === 0 && blogFeed) {
    blogFeed.innerHTML = "<p style='color:#777; font-style:italic;'>কোনো ব্লগ পোস্ট পাওয়া যায়নি।</p>";
  } else if(blogFeed) {
    blogs.reverse().forEach(b => {
      blogFeed.insertAdjacentHTML("beforeend", `
        <div class="blog-item" style="background:#fff; border:1px solid #e2e8f0; padding:15px; margin-bottom:12px; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <h4 style="color:#0f172a; margin:0 0 6px 0; font-size:16px;">📝 ${b.title}</h4>
          <p style="margin:0 0 8px 0; font-size:14px; color:#475569; line-height:1.5;">${b.content}</p>
          <small style="color:#94a3b8;">তারিখ: ${b.date}</small>
        </div>
      `);
    });
  }
}

function updateMetrics() {
  if(document.querySelector("#memberCount")) document.querySelector("#memberCount").textContent = appData.members.length;
  if(document.querySelector("#recordCount")) document.querySelector("#recordCount").textContent = appData.transactions.length;
  let total = appData.transactions.filter(t => t.status === "Approved").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  if(document.querySelector("#totalDeposit")) document.querySelector("#totalDeposit").textContent = "৳" + total;
}

function setupFormListeners() {
  const memberForm = document.querySelector("#memberForm");
  const depositForm = document.querySelector("#depositForm");
  const postForm = document.querySelector("#postForm");

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
      fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) }).then(() => { alert("মেম্বার ডাটা সেভ হয়েছে!"); location.reload(); });
    });
  }

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
      fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) }).then(() => { alert("জমার রিকোয়েস্ট পাঠানো হয়েছে!"); location.reload(); });
    });
  }

  if (postForm) {
    postForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const pin = prompt("পোস্টটি লাইভ করতে সিকিউরিটি পিন (PIN) দিন:");
      if (pin !== ADMIN_PIN) { alert("ভুল পিন নাম্বার!"); return; }

      const today = new Date();
      const formattedDate = today.getDate() + "/" + (today.getMonth()+1) + "/" + today.getFullYear();

      const data = {
        action: "addBlogNotice",
        type: document.querySelector("#postType").value,
        title: document.querySelector("#postTitle").value.trim(),
        content: document.querySelector("#postContent").value.trim(),
        date: formattedDate
      };

      alert("পোস্টটি পাবলিশ হচ্ছে... অনুগ্রহ করে কিছু মুহূর্ত অপেক্ষা করুন।");
      fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) }).then(() => { 
        alert("সফলভাবে ওয়েবসাইটে পাবলিশ করা হয়েছে!"); 
        location.reload(); 
      });
    });
  }
}
