// Nostalgica Roast Sheet — printable HTML (letter, portrait). Same output on screen and paper.
(function (root) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
  const fmtDay = (iso) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const boxes = (n) => "☐".repeat(Math.min(n, 12)) + (n > 12 ? ` +${n - 12}` : "");

  const CSS = `
  .rs{--plum:#413851;--coral:#EC6872;--yellow:#FFD66B;--line:#d9d5cc;font-family:Futura,"Futura PT","Century Gothic","Avenir Next",Avenir,"Helvetica Neue",Arial,sans-serif;color:#1d1a22;font-size:11.5px;line-height:1.35;max-width:7.6in;margin:0 auto}
  .rs h1{font-size:20px;margin:0;letter-spacing:.04em;color:var(--plum)}
  .rs h2{font-size:13px;margin:16px 0 6px;padding:4px 8px;background:var(--plum);color:#fff;letter-spacing:.06em;text-transform:uppercase}
  .rs .top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid var(--plum);padding-bottom:6px}
  .rs .brand{font-size:10px;letter-spacing:.3em;color:var(--coral);font-weight:700}
  .rs .meta{text-align:right;font-size:10.5px;color:#555}
  .rs table{width:100%;border-collapse:collapse}
  .rs th{font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:#666;text-align:left;border-bottom:1.5px solid var(--plum);padding:4px 5px}
  .rs td{border-bottom:1px solid var(--line);padding:5px 5px;vertical-align:top}
  .rs .num{text-align:right;font-variant-numeric:tabular-nums}
  .rs .ctr{text-align:center}
  .rs .big{font-size:17px;font-weight:700;color:var(--plum)}
  .rs .muted{color:#888;font-size:10px}
  .rs .tot td{border-top:1.5px solid var(--plum);border-bottom:none;font-weight:700}
  .rs .type{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#777}
  .rs .chk{font-size:15px;letter-spacing:2px;white-space:nowrap}
  .rs .grp td{border-top:1.5px solid #bbb}
  .rs .alert{border:1.5px solid var(--coral);padding:6px 9px;margin-top:10px;font-size:10.5px}
  .rs .alert b{color:#b23a44}
  .rs .alert ul{margin:3px 0 0 16px;padding:0}
  .rs .foot{font-size:9.5px;color:#777;margin-top:5px}
  .rs .pb{break-before:page;page-break-before:always}
  .rs .empty{padding:24px;text-align:center;color:#666;border:1px dashed var(--line)}
  @media screen{.rs .pb{border-top:2px dashed #cfc9bd;margin:30px 0 20px}}
  @media print{.rs{max-width:none}.rs h2{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;

  function hint(c) {
    const frac = c.exactBatches - Math.floor(c.exactBatches);
    if (c.exactBatches < 0.35) return `<div class="muted">Small need — check the shelf before roasting</div>`;
    if (c.batches > 1 && frac > 0 && frac <= 0.1) {
      const short = c.roastedLb - Math.floor(c.exactBatches) * c.yieldLb;
      return `<div class="muted">${Math.floor(c.exactBatches)} batch${Math.floor(c.exactBatches) > 1 ? "es" : ""} + ${f1(short)} lb from shelf also works</div>`;
    }
    return "";
  }

  function render(s, config) {
    const blendBt = config.batches.blend, soBt = config.batches.so;
    const head = `
      <div class="top">
        <div><div class="brand">NOSTALGICA COFFEE</div><h1>Daily roast sheet</h1></div>
        <div class="meta"><b>${fmtDay(s.generatedAt)}</b> · pulled ${fmtTime(s.generatedAt)}<br>
        ${s.orders.length} open orders since ${fmtDay(s.since)} (${s.lookbackDays} days)</div>
      </div>`;

    const a = s.alerts, alertItems = [];
    if (a.stale.length) alertItems.push(`<b>${a.stale.length} open coffee orders older than ${s.lookbackDays} days are not on this sheet</b> — fulfill or close them: ${a.stale.slice(0, 18).map(esc).join(", ")}${a.stale.length > 18 ? "…" : ""}`);
    if (a.pickupCount) alertItems.push(`<b>${a.pickupCount}${a.truncated ? "+" : ""} orders sit at "Ready for pickup"</b> — already bagged, so they're left off. Mark them picked up in Shopify to clear them.`);
    a.unknown.forEach((u) => alertItems.push(`<b>Check by hand:</b> ${esc(u)}`));
    a.notes.forEach((n) => alertItems.push(esc(n)));
    const alerts = alertItems.length ? `<div class="alert"><ul>${alertItems.map((x) => `<li>${x}</li>`).join("")}</ul></div>` : "";

    if (!s.orders.length) return `<div class="rs">${head}${alerts}<div class="empty">Nothing to roast — no open coffee orders in the last ${s.lookbackDays} days.</div></div>`;

    const roastRows = s.coffees.map((c) => `
      <tr><td><b>${esc(c.name)}</b><div class="type">${c.type === "blend" ? "Blend" : "Single origin"}</div>${hint(c)}</td>
      <td class="num">${f1(c.roastedLb)} lb</td>
      <td class="ctr"><span class="big">${c.batches}</span> <span class="muted">(${c.exactBatches.toFixed(2)})</span></td>
      <td class="num">${c.greenLb} lb</td>
      <td class="num muted">+${f1(c.extraLb)} lb</td>
      <td class="chk">${boxes(c.batches)}</td></tr>`).join("");

    const roaster = `
      <h2>Roaster</h2>
      <table><thead><tr><th>Coffee</th><th class="num">Roasted needed</th><th class="ctr">Batches</th><th class="num">Green to load</th><th class="num">Extra</th><th>Done</th></tr></thead>
      <tbody>${roastRows}
      <tr class="tot"><td>Total</td><td class="num">${f1(s.totals.roastedLb)} lb</td><td class="ctr">${s.totals.batches}</td><td class="num">${s.totals.greenLb} lb</td><td></td><td></td></tr></tbody></table>
      <div class="foot">Blends: ${blendBt.greenLb} lb green → ${f1(blendBt.greenLb * (1 - blendBt.moistureLoss))} lb roasted (${Math.round(blendBt.moistureLoss * 100)}% loss). Single origins: ${soBt.greenLb} lb green → ${f1(soBt.greenLb * (1 - soBt.moistureLoss))} lb roasted (${Math.round(soBt.moistureLoss * 100)}% loss). Batches round up; the number in parentheses is the exact need, and "extra" is what goes to the shelf.</div>`;

    let last = null;
    const bagRows = s.skus.map((k) => {
      const first = k.coffee !== last; last = k.coffee;
      return `<tr class="${first ? "grp" : ""}"><td>${first ? `<b>${esc(k.coffee)}</b>` : ""}</td><td>${esc(k.grind)}</td>
        ${s.sizeColumns.map((sz) => `<td class="ctr">${k.sizes[sz] ? `<span class="big" style="font-size:14px">${k.sizes[sz]}</span>` : `<span class="muted">–</span>`}</td>`).join("")}
        <td class="num muted">${f1(k.totalLb)} lb</td><td class="chk">☐</td></tr>`;
    }).join("");
    const bagger = `
      <div class="pb"></div>
      <div class="top"><div><div class="brand">NOSTALGICA COFFEE</div><h1>Bagging sheet</h1></div><div class="meta"><b>${fmtDay(s.generatedAt)}</b> · pulled ${fmtTime(s.generatedAt)}<br>${Object.entries(s.totals.bagsBySize).map(([k, v]) => `${v} × ${k}`).join(" · ")}</div></div>
      <h2>Bagging</h2>
      <table><thead><tr><th>Coffee</th><th>Grind</th>${s.sizeColumns.map((sz) => `<th class="ctr">${sz}</th>`).join("")}<th class="num">Lb</th><th>Done</th></tr></thead>
      <tbody>${bagRows}
      <tr class="tot"><td colspan="2">Total bags</td>${s.sizeColumns.map((sz) => `<td class="ctr">${s.totals.bagsBySize[sz]}</td>`).join("")}<td class="num">${f1(s.totals.roastedLb)} lb</td><td></td></tr></tbody></table>
      <div class="foot">Counts are bags to fill, totalled across all open orders. Subscription bags are whole bean.</div>`;

    const orderRows = s.orders.slice().reverse().map((o) => {
      const parts = o.items.map((b) => `${b.bags}× ${esc(b.coffee)} ${b.sizeLabel}${b.grind !== "Whole bean" ? ` (${esc(b.grind)})` : ""}`);
      return `<tr><td class="chk">☐</td><td><b>${esc(o.name)}</b></td><td>${fmtDay(o.createdAt)}</td><td>${parts.join(" · ")}</td></tr>`;
    }).join("");
    const packList = `
      <div class="pb"></div>
      <div class="top"><div><div class="brand">NOSTALGICA COFFEE</div><h1>Pack and ship list</h1></div><div class="meta"><b>${fmtDay(s.generatedAt)}</b> · pulled ${fmtTime(s.generatedAt)}</div></div>
      <h2>Orders, oldest first</h2>
      <table><thead><tr><th style="width:24px"></th><th style="width:60px">Order</th><th style="width:80px">Placed</th><th>Bags</th></tr></thead><tbody>${orderRows}</tbody></table>
      <div class="foot">Mark each order fulfilled in Shopify as it ships — the next pull drops it off automatically.</div>`;

    return `<div class="rs">${head}${alerts}${roaster}${bagger}${packList}</div>`;
  }

  const api = { render, CSS };
  if (typeof module !== "undefined") module.exports = api;
  else root.RoastRender = api;
})(this);
