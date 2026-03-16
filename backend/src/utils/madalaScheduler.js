import pool from '../database/connection.js';
import { sendMadalaReminderEmail } from './email.js';

const MADALA_MONTHLY_AMOUNT = 200;
const MADALA_FINE_AMOUNT = 50;

/**
 * Get the month name for a given date
 */
function getMonthName(date) {
  return date.toLocaleString('en-ZA', { month: 'long', year: 'numeric' });
}

/**
 * Check if today is 5 days before month end.
 */
function isFiveDaysBeforeMonthEnd() {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  return currentDay === (lastDay - 5);
}

/**
 * Check if today is the 1st of the month (to issue fines for previous month).
 */
function isFirstOfMonth() {
  return new Date().getDate() === 1;
}

/**
 * Get members who have NOT paid R200 for madala side in the given month/year.
 */
async function getMembersWithoutMadalaPayment(year, month) {
  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const endOfMonth = new Date(year, month, 0);
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')} 23:59:59`;

  const [members] = await pool.query(
    `SELECT u.id AS user_id, u.full_name, u.email, p.stokvel_id,
            COALESCE(SUM(c.amount), 0) AS madala_paid
     FROM profiles p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN contributions c ON c.user_id = u.id 
       AND c.stokvel_id = p.stokvel_id 
       AND c.contribution_type = 'madala-side' 
       AND c.status = 'confirmed'
       AND c.created_at >= ? AND c.created_at <= ?
     WHERE p.status = 'active' AND u.status = 'active' AND u.role = 'member'
     GROUP BY u.id, u.full_name, u.email, p.stokvel_id
     HAVING madala_paid < ?`,
    [startOfMonth, endStr, MADALA_MONTHLY_AMOUNT]
  );

  return members;
}

/**
 * Send reminders to members who haven't paid Madala Side 5 days before month end.
 */
async function sendMadalaReminders() {
  if (!isFiveDaysBeforeMonthEnd()) return;

  console.log('📧 Checking Madala Side payment reminders (5 days before month end)...');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthName = getMonthName(now);

  try {
    const unpaidMembers = await getMembersWithoutMadalaPayment(year, month);

    for (const member of unpaidMembers) {
      const amountDue = MADALA_MONTHLY_AMOUNT - parseFloat(member.madala_paid);

      // Send email reminder
      try {
        await sendMadalaReminderEmail(member.email, member.full_name, monthName, amountDue);
      } catch (err) {
        console.error(`Failed to send madala reminder to ${member.email}:`, err.message);
      }

      // Send in-app notification
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [
          member.user_id,
          'warning',
          'Madala Side Payment Due',
          `Your Madala Side payment of R${amountDue} for ${monthName} is due in 5 days. Pay before month end to avoid a R50 fine.`
        ]
      );
    }

    if (unpaidMembers.length > 0) {
      console.log(`📧 Sent ${unpaidMembers.length} Madala Side payment reminders`);
    } else {
      console.log('✅ All members have paid Madala Side for this month');
    }
  } catch (err) {
    console.error('Madala reminder error:', err);
  }
}

/**
 * Issue R50 fines to members who didn't pay R200 for Madala Side last month.
 * Runs on the 1st of each month.
 */
async function issueMadalaFines() {
  if (!isFirstOfMonth()) return;

  console.log('💰 Checking Madala Side non-payment fines...');

  const now = new Date();
  // Check previous month
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed, so this is previous month
  if (month === 0) { month = 12; year -= 1; }

  const prevMonthName = new Date(year, month - 1, 1).toLocaleString('en-ZA', { month: 'long', year: 'numeric' });

  // Skip December (Madala runs Jan-Nov)
  if (month === 12) {
    console.log('ℹ️  Skipping Madala fine check — December is excluded');
    return;
  }

  try {
    const unpaidMembers = await getMembersWithoutMadalaPayment(year, month);

    for (const member of unpaidMembers) {
      // Check if fine already issued for this month
      const fineRef = `madala-${year}-${String(month).padStart(2, '0')}`;
      const [existing] = await pool.query(
        "SELECT id FROM fines WHERE user_id = ? AND fine_type = 'madala_non_payment' AND reason LIKE ?",
        [member.user_id, `%${fineRef}%`]
      );

      if (existing.length > 0) continue; // Already fined

      // Issue the fine
      await pool.query(
        'INSERT INTO fines (user_id, stokvel_id, fine_type, amount, status, reason) VALUES (?, ?, ?, ?, ?, ?)',
        [member.user_id, member.stokvel_id, 'madala_non_payment', MADALA_FINE_AMOUNT, 'unpaid',
          `Non-payment of R${MADALA_MONTHLY_AMOUNT} Madala Side for ${prevMonthName} [${fineRef}]`]
      );

      // Notify the member
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [member.user_id, 'warning', 'Madala Side Fine',
          `You have been fined R${MADALA_FINE_AMOUNT} for not paying R${MADALA_MONTHLY_AMOUNT} towards Madala Side for ${prevMonthName}.`]
      );

      console.log(`⚠️  Fined ${member.full_name} R${MADALA_FINE_AMOUNT} for Madala non-payment (${prevMonthName})`);
    }

    if (unpaidMembers.length > 0) {
      console.log(`💰 Issued ${unpaidMembers.length} Madala non-payment fines`);
    } else {
      console.log('✅ All members paid Madala Side last month');
    }
  } catch (err) {
    console.error('Madala fines error:', err);
  }
}

/**
 * Run all scheduled Madala Side checks. Call this daily.
 */
export async function runMadalaChecks() {
  await sendMadalaReminders();
  await issueMadalaFines();
}

export { sendMadalaReminders, issueMadalaFines };
