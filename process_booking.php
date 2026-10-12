<?php
// Sunrise Hotel - server-side booking processing.
// The total is recalculated here; any amount from JavaScript is ignored.

const ROOMS = [
    'single' => ['label' => 'Single Room', 'rate' => 3500, 'max' => 1],
    'double' => ['label' => 'Double Room', 'rate' => 5000, 'max' => 2],
    'family' => ['label' => 'Family Room', 'rate' => 7500, 'max' => 4],
];
const BREAKFAST_RATE = 700;
const TRANSFER_RATE  = 2000;
const LAUNDRY_RATE   = 1000;   // individual requirement (last digit 4)

function clean(string $key): string {
    return trim($_POST[$key] ?? '');
}

function showPage(string $title, string $body): void {
    echo "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <title>" . htmlspecialchars($title) . "</title><link rel='stylesheet' href='style.css'></head><body>
    <header><h1>Sunrise Hotel</h1><nav><a href='index.html'>Home</a><a href='booking.html'>Book a Room</a></nav></header>
    <div class='confirm'>$body</div><footer>&copy; Sunrise Hotel</footer></body></html>";
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    showPage('Error', "<h2 style='color:#c0392b'>Invalid request</h2><p>Please use the <a href='booking.html'>booking form</a>.</p>");
}

$name      = clean('fullName');
$idNumber  = clean('idNumber');
$email     = clean('email');
$phone     = clean('phone');
$checkIn   = clean('checkIn');
$nights    = (int) clean('nights');
$roomType  = clean('roomType');
$guests    = (int) clean('guests');
$breakfast = clean('breakfast') === 'yes';
$transfer  = clean('transfer') === 'yes';
$laundry   = clean('laundry') === 'yes';

// Server-side validation
$errors = [];
if ($name === '') $errors[] = 'Customer name is required.';
if ($idNumber === '') $errors[] = 'National ID/Passport number is required.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Email address is invalid.';
if (!preg_match('/^\d{10}$/', $phone)) $errors[] = 'Phone number must contain exactly 10 digits.';
$date = DateTime::createFromFormat('Y-m-d', $checkIn);
if (!$date || $date->format('Y-m-d') !== $checkIn) $errors[] = 'Check-in date is invalid.';
if ($nights < 1 || $nights > 14) $errors[] = 'Number of nights must be between 1 and 14.';
if (!isset(ROOMS[$roomType])) $errors[] = 'Please select a valid room type.';
if ($guests < 1) $errors[] = 'Number of guests must be greater than zero.';
elseif (isset(ROOMS[$roomType]) && $guests > ROOMS[$roomType]['max'])
    $errors[] = 'Guests exceed the maximum of ' . ROOMS[$roomType]['max'] . ' for a ' . ROOMS[$roomType]['label'] . '.';

if ($errors) {
    $list = '';
    foreach ($errors as $e) $list .= '<li>' . htmlspecialchars($e) . '</li>';
    showPage('Booking Error', "<h2 style='color:#c0392b'>BOOKING NOT CONFIRMED</h2><ul>$list</ul>
        <p><a class='btn' href='booking.html'>Go back to the form</a></p>");
}

// Independent bill calculation
$room          = ROOMS[$roomType];
$roomCost      = $room['rate'] * $nights;
$breakfastCost = $breakfast ? BREAKFAST_RATE * $guests * $nights : 0;
$transferCost  = $transfer ? TRANSFER_RATE : 0;
$laundryCost   = $laundry ? LAUNDRY_RATE : 0;
$total         = $roomCost + $breakfastCost + $transferCost + $laundryCost;

$yesNo = fn(bool $v): string => $v ? 'Yes' : 'No';
$h = fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

$body = "<h2>BOOKING CONFIRMED</h2><table>
  <tr><td>Customer:</td><td>{$h($name)}</td></tr>
  <tr><td>ID/Passport:</td><td>{$h($idNumber)}</td></tr>
  <tr><td>Email:</td><td>{$h($email)}</td></tr>
  <tr><td>Phone:</td><td>{$h($phone)}</td></tr>
  <tr><td>Check-in Date:</td><td>{$h($checkIn)}</td></tr>
  <tr><td>Room:</td><td>{$h($room['label'])}</td></tr>
  <tr><td>Guests:</td><td>$guests</td></tr>
  <tr><td>Number of Nights:</td><td>$nights</td></tr>
  <tr><td>Breakfast:</td><td>{$yesNo($breakfast)}</td></tr>
  <tr><td>Airport Transfer:</td><td>{$yesNo($transfer)}</td></tr>
  <tr><td>Laundry Service:</td><td>{$yesNo($laundry)}</td></tr>
</table>
<p class='total'>TOTAL AMOUNT: KSh " . number_format($total) . "</p>
<p style='text-align:center'>Thank you for choosing Sunrise Hotel.</p>
<p style='text-align:center'><a class='btn' href='index.html'>Back to Home</a></p>";

showPage('Booking Confirmed', $body);
