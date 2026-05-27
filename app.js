const STORAGE_KEY = "adorshoForumData";

const today = new Date().toISOString().slice(0, 10);
const defaultData = {
  members: [],
  deposits: [],
};

const memberForm = document.querySelector("#memberForm");
const depositForm = document.querySelector("#depositForm");
const memberMessage = document.querySelector("#memberMessage");
const depositMessage = document.querySelector("#depositMessage");
const memberTable = document.querySelector("#memberTable");
const depositTable = document.querySelector("#depositTable");
const depositMember = document.querySelector("#depositMember");
const exportButton = document.querySelector("#exportButton");
const clearDataButton = document.querySelector("#clearDataButton");

document.querySelector("#memberJoinDate").value = today;
document.querySelector("#depositDate").value = today;

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultData;

  try {
    const parsed = JSON.parse(saved);
    return {
      members: Array.isArray(parsed.members) ? parsed.members : [],
      deposits: Array.isArray(parsed.deposits) ? parsed.deposits : [],
    };
  } catch {
    return defaultData;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatMoney(amount) {
  return new Intl.NumberFormat("bn-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}

function showMessage(element, text) {
  element.textContent = text;
  window.setTimeout(() => {
    element.textContent = "";
  }, 3200);
}

function render() {
  const data = loadData();
  const totalDeposit = data.deposits.reduce((sum, item) => sum + Number(item.amount), 0);

  document.querySelector("#memberCount").textContent = data.members.length;
  document.querySelector("#totalDeposit").textContent = formatMoney(totalDeposit);
  document.querySelector("#recordCount").textContent = data.deposits.length;

  depositMember.innerHTML = data.members.length
    ? '<option value="">সদস্য নির্বাচন করুন</option>'
    : '<option value="">আগে সদস্য যোগ করুন</option>';

  data.members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member.phone;
    option.textContent = `${member.name} (${member.phone})`;
    depositMember.appendChild(option);
  });

  memberTable.innerHTML = "";
  if (!data.members.length) {
    memberTable.innerHTML = '<tr><td colspan="4">এখনও কোনো সদস্য নেই।</td></tr>';
  } else {
    data.members.forEach((member) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${member.name}</td>
        <td>${member.phone}</td>
        <td>${member.address}</td>
        <td>${member.joinDate}</td>
      `;
      memberTable.appendChild(row);
    });
  }

  depositTable.innerHTML = "";
  if (!data.deposits.length) {
    depositTable.innerHTML = '<tr><td colspan="5">এখনও কোনো জমার রেকর্ড নেই।</td></tr>';
  } else {
    data.deposits.forEach((deposit) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${deposit.memberName}</td>
        <td>${formatMoney(Number(deposit.amount))}</td>
        <td>${deposit.method}</td>
        <td>${deposit.reference}</td>
        <td>${deposit.date}</td>
      `;
      depositTable.appendChild(row);
    });
  }
}

memberForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = loadData();
  const member = {
    name: document.querySelector("#memberName").value.trim(),
    phone: document.querySelector("#memberPhone").value.trim(),
    address: document.querySelector("#memberAddress").value.trim(),
    joinDate: document.querySelector("#memberJoinDate").value,
  };

  if (data.members.some((item) => item.phone === member.phone)) {
    showMessage(memberMessage, "এই মোবাইল নম্বর দিয়ে সদস্য আগে থেকেই আছে।");
    return;
  }

  data.members.push(member);
  saveData(data);
  memberForm.reset();
  document.querySelector("#memberJoinDate").value = today;
  showMessage(memberMessage, "সদস্য সেভ হয়েছে।");
  render();
});

depositForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = loadData();
  const selectedPhone = depositMember.value;
  const member = data.members.find((item) => item.phone === selectedPhone);

  if (!member) {
    showMessage(depositMessage, "আগে সদস্য নির্বাচন করুন।");
    return;
  }

  data.deposits.push({
    memberPhone: member.phone,
    memberName: member.name,
    amount: Number(document.querySelector("#depositAmount").value),
    method: document.querySelector("#depositMethod").value,
    reference: document.querySelector("#depositReference").value.trim(),
    date: document.querySelector("#depositDate").value,
  });

  saveData(data);
  depositForm.reset();
  document.querySelector("#depositDate").value = today;
  showMessage(depositMessage, "জমার রেকর্ড সেভ হয়েছে।");
  render();
});

exportButton.addEventListener("click", () => {
  const data = loadData();
  const rows = [
    ["Type", "Member Name", "Phone", "Amount", "Method", "Reference", "Date", "Address"],
    ...data.members.map((member) => [
      "Member",
      member.name,
      member.phone,
      "",
      "",
      "",
      member.joinDate,
      member.address,
    ]),
    ...data.deposits.map((deposit) => [
      "Deposit",
      deposit.memberName,
      deposit.memberPhone,
      deposit.amount,
      deposit.method,
      deposit.reference,
      deposit.date,
      "",
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "adorsho-forum-records.csv";
  link.click();
  URL.revokeObjectURL(url);
});

clearDataButton.addEventListener("click", () => {
  const confirmed = confirm("সব সদস্য ও জমার ডেমো ডাটা মুছে ফেলবেন?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  render();
});

render();
