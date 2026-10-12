// Sunrise Hotel - booking form logic
// Rates and capacities are kept in one place so they are easy to change.
const ROOMS = {
  single: { label: "Single Room", rate: 3500, maxGuests: 1 },
  double: { label: "Double Room", rate: 5000, maxGuests: 2 },
  family: { label: "Family Room", rate: 7500, maxGuests: 4 }
};
const BREAKFAST_RATE = 700;   // per person per day
const TRANSFER_RATE = 2000;
const LAUNDRY_RATE = 1000;    // individual requirement (last digit 4)

const form = document.getElementById("bookingForm");
const $ = (id) => document.getElementById(id);

function formatKsh(amount) {
  return "KSh " + amount.toLocaleString("en-KE");
}

function setError(fieldId, message) {
  $(fieldId + "Error").textContent = message;
  $(fieldId).classList.toggle("invalid", message !== "");
  return message === "";
}

// Dynamic feature 1: show max guests and warn if capacity exceeded
function checkRoomCapacity() {
  const room = ROOMS[$("roomType").value];
  const guests = parseInt($("guests").value, 10);
  const warning = $("capacityWarning");
  if (!room) {
    $("capacityInfo").textContent = "";
    warning.style.display = "none";
    return true;
  }
  $("capacityInfo").textContent = "Maximum guests for this room: " + room.maxGuests;
  if (guests > room.maxGuests) {
    warning.textContent = "Warning: " + room.label + " allows only " + room.maxGuests +
      " guest(s). Please reduce guests or choose a bigger room.";
    warning.style.display = "block";
    return false;
  }
  warning.style.display = "none";
  return true;
}

// Dynamic feature 2: show transfer details only when requested
function toggleTransferBox() {
  $("transferBox").style.display = $("transfer").checked ? "block" : "none";
}

function calculateBill() {
  const room = ROOMS[$("roomType").value];
  const nights = parseInt($("nights").value, 10) || 0;
  const guests = parseInt($("guests").value, 10) || 0;
  if (!room || nights < 1 || guests < 1) return 0;

  const roomCost = room.rate * nights;
  const breakfastCost = document.querySelector('input[name="breakfast"]:checked').value === "yes"
    ? BREAKFAST_RATE * guests * nights : 0;
  const transferCost = $("transfer").checked ? TRANSFER_RATE : 0;
  const laundryCost = $("laundry").checked ? LAUNDRY_RATE : 0;
  return roomCost + breakfastCost + transferCost + laundryCost;
}

// Dynamic feature 3: live summary + total
function updateSummary() {
  const room = ROOMS[$("roomType").value];
  if (room) {
    const breakfast = document.querySelector('input[name="breakfast"]:checked').value === "yes";
    $("summaryText").innerHTML =
      room.label + " for " + ($("nights").value || 0) + " night(s), " + ($("guests").value || 0) +
      " guest(s)<br>Breakfast: " + (breakfast ? "Yes" : "No") +
      " | Airport transfer: " + ($("transfer").checked ? "Yes" : "No") +
      " | Laundry: " + ($("laundry").checked ? "Yes" : "No");
  } else {
    $("summaryText").textContent = "Select a room to see your summary.";
  }
  $("totalDisplay").textContent = formatKsh(calculateBill());
}

function refreshAll() {
  checkRoomCapacity();
  toggleTransferBox();
  updateSummary();
}

function validateBooking() {
  let ok = true;
  const name = $("fullName").value.trim();
  ok = setError("fullName", name === "" ? "Full name is required." : "") && ok;

  ok = setError("idNumber", $("idNumber").value.trim() === "" ? "ID/Passport number is required." : "") && ok;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  ok = setError("email", emailPattern.test($("email").value.trim()) ? "" : "Enter a valid email address.") && ok;

  ok = setError("phone", /^\d{10}$/.test($("phone").value.trim()) ? "" : "Phone number must contain exactly 10 digits.") && ok;

  ok = setError("checkIn", $("checkIn").value === "" ? "Select a check-in date." : "") && ok;

  const nights = parseInt($("nights").value, 10);
  ok = setError("nights", (nights >= 1 && nights <= 14) ? "" : "Nights must be between 1 and 14.") && ok;

  ok = setError("roomType", $("roomType").value === "" ? "Please select a room type." : "") && ok;

  const guests = parseInt($("guests").value, 10);
  let guestMsg = "";
  if (!(guests > 0)) guestMsg = "Guests must be greater than zero.";
  else if (ROOMS[$("roomType").value] && guests > ROOMS[$("roomType").value].maxGuests)
    guestMsg = "Guests exceed the room capacity.";
  ok = setError("guests", guestMsg) && ok;

  return ok;
}

// Events: change, input, submit, click
["roomType", "transfer", "laundry"].forEach((id) => $(id).addEventListener("change", refreshAll));
document.querySelectorAll('input[name="breakfast"]').forEach((r) => r.addEventListener("change", refreshAll));
["nights", "guests"].forEach((id) => $(id).addEventListener("input", refreshAll));
form.addEventListener("submit", function (event) {
  if (!validateBooking()) event.preventDefault();
});
$("resetBtn").addEventListener("click", function () {
  setTimeout(function () {
    document.querySelectorAll(".error").forEach((e) => (e.textContent = ""));
    document.querySelectorAll(".invalid").forEach((e) => e.classList.remove("invalid"));
    refreshAll();
  }, 0);
});

// Do not allow past check-in dates in the picker
$("checkIn").min = new Date().toISOString().split("T")[0];
refreshAll();
