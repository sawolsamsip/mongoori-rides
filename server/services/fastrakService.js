/**
 * Fastrak (toll) data – daily fetch and link to vehicle/booking/invoice.
 *
 * ─── API 키 넣는 곳: server/.env ───
 *   FASTRAK_API_KEY=your_api_key
 *
 * ─── 실제 API 호출 넣는 곳: 아래 fetchDailyTollsForVehicle() 안 ───
 *   Fastrak/통행료 제공처의 실제 API URL과 응답 형식에 맞게
 *   fetch(...) 호출과 items 배열을 채우면 됩니다.
 */

import Toll from "../models/Toll.js";

export async function fetchDailyTollsForVehicle(carId, date) {
  const apiKey = process.env.FASTRAK_API_KEY;
  if (!apiKey) {
    return { ok: false, count: 0, message: "FASTRAK_API_KEY not set" };
  }
  try {
    // ⬇️ 여기에 Fastrak(또는 사용하는 통행료 API) 실제 호출을 넣으세요.
    // 예: Fastrak API 문서에서 제공하는 URL·파라미터(차량/날짜 등)에 맞게 수정
    // const apiUrl = `https://api.fastrak.com/...?vehicle=${carId}&date=${date}`;
    // const res = await fetch(apiUrl, { headers: { "Authorization": `Bearer ${apiKey}` } });
    // if (!res.ok) throw new Error(await res.text());
    // const items = await res.json();  // 예: [{ id, amount, date, description }, ...]
    const items = [];
    let count = 0;
    for (const item of items) {
      const existing = await Toll.findOne({ source: "fastrak", externalId: item.id });
      if (!existing) {
        await Toll.create({
          car: carId,
          source: "fastrak",
          externalId: item.id,
          amount: item.amount,
          tollDate: item.date,
          description: item.description,
          raw: item,
        });
        count++;
      }
    }
    return { ok: true, count };
  } catch (e) {
    return { ok: false, count: 0, message: e.message };
  }
}

/**
 * Link tolls for a booking to its invoice (line items or attachment).
 */
export async function linkTollsToBooking(bookingId) {
  const tolls = await Toll.find({ booking: bookingId });
  for (const t of tolls) {
    t.linkedToInvoice = true;
    await t.save();
  }
  return tolls.length;
}
