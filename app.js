const STORAGE_KEY = "adorshoForumData";
// এখানে আপনার SheetDB থেকে পাওয়া API URL-টি বসান
const API_URL = "https://docs.google.com/spreadsheets/d/1i7gBAeVTNil38oTL44vYcp8lxJCHJXGsw5hK0fqYojA/edit?gid=0#gid=0"; 

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

const memberForm = document.querySelector("#memberForm");
const depositForm = document.querySelector("#depositForm");
const paymentSettingsForm = document.querySelector("#paymentSettingsForm");
const memberMessage = document.querySelector("#memberMessage");
const depositMessage = document.querySelector("#depositMessage");
const paymentSettingsMessage = document.querySelector("#paymentSettingsMessage");
const memberTable = document.querySelector("#memberTable");
const depositTable = document.querySelector("#depositTable");
const depositMember = document.querySelector("#depositMember");
const exportButton = document.querySelector("#exportButton");
const clearDataButton = document.querySelector("#clearDataButton");

if(document.querySelector("#memberJoinDate")) document.querySelector("#memberJoinDate").value = today;
if(document.querySelector("#depositDate")) document.querySelector("#depositDate").value = today;

// গ্লোবাল ভেরিয়েবল যা অ্যাপের বর্তমান ডাটা হোল্ড করবে
let currentAppData = { ...defaultData };

// গুগল শিট থেকে লাইভ ডাটা লোড করার ফাংশন
async function loadData() {
  try {
    const response = await fetch(API_URL);
    const rows = await response.json();
    
    if (rows && rows.length > 0 && rows[0].data) {
      const parsed = JSON.parse(rows[0].data);
      currentAppData = {
        members: Array.isArray(parsed.members) ? parsed.members : [],
        deposits: Array.isArray(parsed.deposits) ? parsed.deposits : [],
        paymentSettings: {
          ...defaultSettings,
          ...(parsed.paymentSettings || {}),
        },
      };
      return currentAppData;
    }
  } catch (error) {
    console.error("গুগল শিট থেকে ডাটা লোড করতে সমস্যা হয়েছে, লোকাল ডাটা ব্যবহার করা হচ্ছে:", error);
  }
  
  // কোনো কারণে সার্ভার ফেইল করলে বা ডাটা না থাকলে ডিফল্ট ডাটা রিটার্ন করবে
  return currentAppData;
}

// গুগল শিটে লাইভ ডাটা সেভ করার ফাংশন
async function saveData(data) {
  currentAppData = data; // গ্লোবাল ডাটা আপডেট
  
  const payload = {
    data: {
      id: "1",
      data: JSON.stringify(data)
    }
  };

  try {
    // গুগল শিটের ১ নম্বর আইডি-র ডাটা আপডেট করার জন্য PUT রিকোয়েস্ট
    await fetch(`${API_URL}/id/1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    console.log("ডাটা সফলভাবে গুগল শিটে সিঙ্ক হয়েছে।");
  } catch (error) {
    console.error("গুগল শিটে ডাটা সেভ করা যায়নি:", error);
  }
}

function formatMoney(amount) {
