/* ========================================================
   আদর্শ আড্ডা ও ইনভেস্ট ফোরাম - ড্যাশবোর্ড লজিক ইঞ্জিন (app.js)
   ======================================================== */

// পেজ পুরোপুরি লোড হওয়ার পর স্ক্রিপ্ট রান করবে
document.addEventListener("DOMContentLoaded", () => {
    // ডাটাবেজ ব্যাকআপ (LocalStorage) থেকে ডাটা নিয়ে আসা বা খালি অ্যারে তৈরি করা
    let members = JSON.parse(localStorage.getItem("forum_members")) || [];
    let deposits = JSON.parse(localStorage.getItem("forum_deposits")) || [];
    let posts = JSON.parse(localStorage.getItem("forum_posts")) || [];

    // ডোমের (DOM) এলিমেন্টগুলো সিলেক্ট করা
    const memberCountEl = document.getElementById("memberCount");
    const totalDepositEl = document.getElementById("totalDeposit");
    const recordCountEl = document.getElementById("recordCount");
    const memberTable = document.getElementById("memberTable");
    const depositTable = document.getElementById("depositTable");
    const depositMemberSelect = document.getElementById("depositMember");
    const liveNoticeBoard = document.getElementById("liveNoticeBoard");
    const liveBlogFeed = document.getElementById("liveBlogFeed");

    // ফর্ম এলিমেন্টসমূহ
    const memberForm = document.getElementById("memberForm");
    const depositForm = document.getElementById("depositForm");
    const postForm = document.getElementById("postForm");

    // ==========================================
    // ১. ড্যাশবোর্ড কাউন্টার ও স্ট্যাটিস্টিকস আপডেট
    // ==========================================
    function updateDashboardMetrics() {
        // মোট সদস্য সংখ্যা
        if(memberCountEl) memberCountEl.textContent = members.length;
        
        // মোট ট্রানজেকশন সংখ্যা
        if(recordCountEl) recordCountEl.textContent = deposits.length;

        // অনুমোদিত মোট জমার পরিমাণ হিসাব করা
        let totalAmount = 0;
        deposits.forEach(deposit => {
            // শুধুমাত্র Approved বা অনুমোদিত জমার টাকা যোগ হবে (অথবা অল ট্রানজেকশন)
            if (deposit.status === "অনুমোদিত") {
                totalAmount += parseFloat(deposit.amount) || 0;
            }
        });
        if(totalDepositEl) totalDepositEl.textContent = "৳" + totalAmount.toLocaleString('bn-BD');
    }

    // ==========================================
    // ২. নিবন্ধিত সদস্য তালিকা রেন্ডার করা
    // ==========================================
    function renderMembers() {
        if (!memberTable) return;
        
        if (members.length === 0) {
            memberTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8;">কোনো নিবন্ধিত সদস্য পাওয়া যায়নি।</td></tr>`;
            return;
        }

        memberTable.innerHTML = "";
        members.forEach((member, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${member.name}</td>
                <td>${member.phone || 'N/A'}</td>
                <td>${member.address || 'N/A'}</td>
                <td>${member.joinDate}</td>
                <td>
                    <button class="btn-delete" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" data-index="${index}">❌ বাদ দিন</button>
                </td>
            `;
            memberTable.appendChild(tr);
        });

        // সদস্য ড্রপডাউন (টাকা জমার ফর্মের জন্য) আপডেট করা
        updateMemberDropdown();
    }

    // টাকা জমা দেওয়ার ফরমে সদস্যদের নামের ড্রপডাউন তৈরি
    function updateMemberDropdown() {
        if (!depositMemberSelect) return;
        depositMemberSelect.innerHTML = `<option value="">সদস্য নির্বাচন করুন *</option>`;
        members.forEach(member => {
            const option = document.createElement("option");
            option.value = member.name;
            option.textContent = member.name;
            depositMemberSelect.appendChild(option);
        });
    }

    // ==========================================
    // ৩. জমার লাইভ রেকর্ড রেন্ডার করা (টেক্সট গোল্ডেনসহ)
    // ==========================================
    function renderDeposits() {
        if (!depositTable) return;

        if (deposits.length === 0) {
            depositTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">কোনো জমার রেকর্ড খুঁজে পাওয়া যায়নি।</td></tr>`;
            return;
        }

        depositTable.innerHTML = "";
        deposits.forEach((deposit, index) => {
            const tr = document.createElement("tr");
            
            // স্ট্যাটাস অনুযায়ী সিএসএস ক্লাস নির্ধারণ
            let statusClass = deposit.status === "অনুমোদিত" ? "status-approved" : "status-pending";

            tr.innerHTML = `
                <td>${deposit.memberName}</td>
                <td style="color: #D4AF37 !important; font-weight: 600;">৳${parseFloat(deposit.amount).toLocaleString('bn-BD')}</td>
                <td style="color: #D4AF37 !important; font-weight: 600;">${deposit.method}</td>
                <td style="color: #D4AF37 !important; font-weight: 500;">${deposit.reference}</td>
                <td>${deposit.date}</td>
                <td><span class="status-badge ${statusClass}" style="padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor:pointer;">${deposit.status}</span></td>
            `;

            // স্ট্যাটাস ব্যাজে ক্লিক করলে যেন Approved/Pending পরিবর্তন করা যায় (টগল লজিক)
            const statusBadge = tr.querySelector(".status-badge");
            statusBadge.addEventListener("click", () => {
                deposits[index].status = deposits[index].status === "অনুমোদিত" ? "অপেক্ষমান" : "অনুমোদিত";
                localStorage.setItem("forum_deposits", JSON.stringify(deposits));
                renderDeposits();
                updateDashboardMetrics();
            });

            depositTable.appendChild(tr);
        });
    }

    // ========================================================
    // ৪. নোটিশ বোর্ড ও ব্লগ রেন্ডার (রিলোড দিলে যেন ব্ল্যাঙ্ক না হয়)
    // ========================================================
    function renderPosts() {
        // এইচটিএমএল-এ আগে থেকে থাকা পার্মানেন্ট বা স্ট্যাটিক কন্টেন্ট ব্যাকআপ রাখা হচ্ছে
        const staticNotice = `
            <div class="premium-notice-item static-content">
                <h4>📌 জরুরি সাধারণ নোটিশ: মাসিক সঞ্চয় জমাদান প্রসঙ্গে</h4>
                <p>প্রিয় সম্মানিত সদস্যবৃন্দ, ফোরামের আর্থিক শৃঙ্খলা ও সকল ইনভেস্টমেন্ট প্রজেক্টের গতিশীলতা বজায় রাখার লক্ষ্যে স্মরণ করিয়ে দেওয়া যাচ্ছে যে, ফোরামের নিয়মানুযায়ী <strong>প্রত্যেক মাসের ১০ (দশ) তারিখের মধ্যে</strong> আপনার নির্ধারিত মাসিক সঞ্চয়ের টাকা জমা করা বাধ্যতামূলক। নির্দিষ্ট সময়ের তহবিল আমাদের রিনভেস্টমেন্ট প্ল্যানগুলো সঠিক সময়ে বাস্তবায়ন করতে সাহায্য করে।</p>
                <span class="post-meta">— পরিচালনা পর্ষদ</span>
            </div>
        `;

        const staticBlog = `
            <div class="premium-blog-item static-content">
                <h4>সঞ্চয় থেকে পুনঃবিনিয়োগ: কীভাবে ছোট পদক্ষেপ আমাদের বড় স্বপ্ন বাস্তবায়ন করছে</h4>
                <p>আর্থিক স্বাধীনতার স্বপ্ন আমরা সবাই দেখি, কিন্তু সেই স্বপ্নকে বাস্তবে রূপ দিতে প্রয়োজন সঠিক পরিকল্পনা, ধারাবাহিকতা এবং সঠিক সময়ে সঠিক সিদ্ধান্ত। আমাদের "আদর্শ আড্ডা ও ইনভেস্ট ফোরাম" ঠিক এই দর্শনটির ওপর ভিত্তি করেই গড়ে উঠেছে—যেখানে আমাদের আড্ডাগুলো শুধু গল্পেই সীমাবদ্ধ নয়, বরং তা রূপ নিচ্ছে যৌথ অর্থনৈতিক সাফল্যে।</p>
                <p>আজ যে লাভটি ছোট মনে হচ্ছে, আমাদের নতুন থিম <em>"সমৃদ্ধির পুনরাবৃত্তি: অর্জিত লাভে টেকসই ভবিষ্যৎ"</em> অনুযায়ী তা যদি পকেটে না তুলে সরাসরি আবার নতুন প্রজেক্টে পুনঃবিনিয়োগ বা রিনভেস্ট করা হয়, তবে আমাদের মূলধনের পরিমাণ জ্যামিতিক হারে বাড়তে থাকবে। আসুন, নিয়ম মেনে প্রতি মাসের ১০ তারিখের মধ্যে সঞ্চয় নিশ্চিত করি।</p>
                <span class="post-meta">ক্যাটাগরি: ইনভেস্টমেন্ট গাইড</span>
            </div>
        `;

        // প্রথমে বোর্ডগুলোতে ডিফল্ট বা স্থায়ী ব্যাকআপ রাইট করা
        if (liveNoticeBoard) liveNoticeBoard.innerHTML = staticNotice;
        if (liveBlogFeed) liveBlogFeed.innerHTML = staticBlog;

        // এবার ইউজারদের
