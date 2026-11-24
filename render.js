// Nostalgica Roast Sheet — printable HTML (letter, portrait). Same output on screen and paper.
(function (root) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
  const n0 = (n) => Math.round(n).toLocaleString("en-US");
  const fmtDay = (iso) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const fmtLong = (iso) => new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const boxes = (n) => `<span class="bx">${"<i></i>".repeat(n)}</span>`;

  // Jost is the closest free match to Futura; Futura is used first where installed.
  const FONT_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap" rel="stylesheet">`;

  const CSS = `
  .rs{--plum:#413851;--coral:#EC6872;--cream:#f7f5f0;--ink:#24202b;--soft:#7a7482;--line:#e4e0d8;--rule:#cfc9bd;
    font-family:"Futura PT",Futura,Jost,"Century Gothic","Avenir Next",sans-serif;color:var(--ink);font-size:11px;line-height:1.4;max-width:7.6in;margin:0 auto;font-variant-numeric:tabular-nums}
  .rs *{box-sizing:border-box}
  .rs .page+.page{break-before:page;page-break-before:always}
  .rs .hd{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:10px;border-bottom:2px solid var(--plum)}
  .rs .mark{font-size:9px;font-weight:600;letter-spacing:.32em;color:var(--coral)}
  .rs h1{margin:2px 0 0;font-size:24px;font-weight:600;letter-spacing:-.01em;color:var(--plum)}
  .rs .when{text-align:right}
  .rs .when b{display:block;font-size:13px;font-weight:600;color:var(--plum)}
  .rs .when span{font-size:10px;color:var(--soft)}
  .rs .stats{display:grid;grid-template-columns:repeat(4,1fr);margin:12px 0 2px;border:1px solid var(--line);border-radius:6px;overflow:hidden}
  .rs .stats div{padding:6px 12px;border-left:1px solid var(--line)}
  .rs .stats div:first-child{border-left:0;background:var(--cream)}
  .rs .stats small{display:block;font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}
  .rs .stats strong{font-size:20px;font-weight:600;color:var(--plum)}
  .rs .stats em{font-style:normal;font-size:10px;color:var(--soft);margin-left:3px}
  .rs .note{margin:12px 0 0;padding:8px 12px;background:var(--cream);border-left:3px solid var(--coral);font-size:10px;color:#4a4450}
  .rs .note p{margin:0 0 3px}.rs .note p:last-child{margin:0}
  .rs .note b{color:var(--ink);font-weight:600}
  .rs .sec{display:flex;justify-content:space-between;align-items:baseline;margin:14px 0 0;padding-bottom:5px;border-bottom:1px solid var(--plum)}
  .rs .sec h2{margin:0;font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--plum)}
  .rs .sec span{font-size:9.5px;color:var(--soft)}
  .rs table{width:100%;border-collapse:collapse}
  .rs th{font-size:8.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);text-align:left;padding:7px 6px 5px;border-bottom:1px solid var(--rule)}
  .rs td{padding:5px 6px;border-bottom:1px solid var(--line);vertical-align:middle}
  .rs .r{text-align:right}.rs .c{text-align:center}
  .rs .name{font-size:12px;font-weight:600}
  .rs .tag{display:block;font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);margin-top:1px}
  .rs .hint{display:block;font-size:9.5px;font-style:italic;color:var(--coral);margin-top:2px}
  .rs .bt{font-size:16px;font-weight:600;color:var(--plum);line-height:1}
  .rs .ex{display:block;font-size:8.5px;color:var(--soft);margin-top:2px}
  .rs .dim{color:var(--soft)}
  .rs tr.blend td{background:var(--cream);border-bottom:0}
  .rs tr.comp td{border-bottom:1px solid var(--line)}
  .rs tr.comp td:first-child{padding-left:18px;position:relative}
  .rs tr.comp td:first-child:before{content:"";position:absolute;left:7px;top:0;bottom:0;border-left:2px solid var(--plum);opacity:.35}
  .rs tr.comp .bt{font-size:14px}
  .rs tr.tot td{border-top:1.5px solid var(--plum);border-bottom:0;font-weight:600;padding-top:8px}
  .rs .bx{display:inline-flex;flex-wrap:wrap;gap:3px;max-width:120px;vertical-align:middle}
  .rs .bx i{width:11px;height:11px;border:1.2px solid var(--plum);border-radius:2px}
  .rs .q{font-size:14px;font-weight:600;color:var(--ink)}
  .rs .z{color:#cfc9bd}
  .rs tr.first td{border-top:1px solid var(--rule)}
  .rs tbody tr.first:first-child td{border-top:0}
  .rs .foot{margin-top:8px;font-size:9px;color:var(--soft);line-height:1.5}
  .rs .pack td{padding:6px}
  .rs .pack tr:nth-child(even) td{background:#fbfaf7}
  .rs .pack .ord{font-weight:600}
  .rs .pack .items b{font-weight:600}
  .rs .empty{margin-top:20px;padding:28px;text-align:center;color:var(--soft);border:1px dashed var(--rule);border-radius:6px}
  @media screen{.rs .page+.page{margin-top:36px;padding-top:28px;border-top:1px dashed var(--rule)}}
  @media print{.rs{max-width:none}.rs *{-webkit-print-color-adjust:exact;print-color-adjust:exact}.rs tr{break-inside:avoid}}`;

  function hint(c) {
    const frac = c.exactBatches - Math.floor(c.exactBatches);
    if (c.exactBatches < 0.35) return `<span class="hint">Small need — check the shelf first</span>`;
    if (!c.components && c.batches > 1 && frac > 0 && frac <= 0.1) {
      const whole = Math.floor(c.exactBatches);
      const short = c.roastedLb - whole * c.yieldLb;
      return `<span class="hint">Or ${whole} batch${whole > 1 ? "es" : ""} + ${f1(short)} lb from shelf</span>`;
    }
    return "";
  }

  function header(title, s, right) {
    return `<div class="hd"><div><div class="mark">NOSTALGICA COFFEE</div><h1>${title}</h1></div>
      <div class="when"><b>${fmtLong(s.generatedAt)}</b><span>${right || `Pulled ${fmtTime(s.generatedAt)} · last ${s.lookbackDays} days`}</span></div></div>`;
  }

  function render(s, config) {
    const blendBt = config.batches.blend, soBt = config.batches.so;
    const a = s.alerts, notes = [];
    if (a.stale.length) notes.push(`<b>${a.stale.length} older open orders not included.</b> Fulfill or close in Shopify: ${a.stale.slice(0, 14).map(esc).join(", ")}${a.stale.length > 14 ? "…" : ""}`);
    if (a.pickupCount) notes.push(`<b>${a.pickupCount}${a.truncated ? "+" : ""} orders waiting at “Ready for pickup.”</b> Already bagged, so left off — mark them picked up to clear.`);
    a.unknown.forEach((u) => notes.push(`<b>Check by hand:</b> ${esc(u)}`));
    a.notes.forEach((n) => notes.push(esc(n)));
    if (a.namesHidden) notes.push(`<b>Customer names hidden.</b> Turn on “Name” under Protected customer data in the Dev Dashboard.`);
    const noteBox = notes.length ? `<div class="note">${notes.map((n) => `<p>${n}</p>`).join("")}</div>` : "";

    if (!s.orders.length) return `<div class="rs"><div class="page">${header("Daily roast sheet", s)}${noteBox}<div class="empty">Nothing to roast — no open coffee orders in the last ${s.lookbackDays} days.</div></div></div>`;

    // ---------- page 1: roaster ----------
    const stats = `<div class="stats">
      <div><small>Batches</small><strong>${s.totals.batches}</strong></div>
      <div><small>Green to load</small><strong>${n0(s.totals.greenLb)}</strong><em>lb</em></div>
      <div><small>Roasted needed</small><strong>${n0(s.totals.roastedLb)}</strong><em>lb</em></div>
      <div><small>Orders</small><strong>${s.orders.length}</strong></div></div>`;

    const row = (c, cls, label) => `
      <tr class="${cls}"><td>${label}</td>
        <td class="r">${f1(c.roastedLb)}</td>
        <td class="c"><span class="bt">${c.batches}</span><span class="ex">${c.exactBatches.toFixed(2)}</span></td>
        <td class="r">${n0(c.greenLb)}</td>
        <td class="r dim">+${f1(c.extraLb)}</td>
        <td>${boxes(c.batches)}</td></tr>`;

    const roastRows = s.coffees.map((c) => {
      if (!c.components) return row(c, "", `<span class="name">${esc(c.name)}</span><span class="tag">${c.type === "blend" ? "Blend" : "Single origin"}</span>${hint(c)}`);
      const total = c.components.reduce((t, k) => t + k.ratio, 0);
      const parent = `
      <tr class="blend"><td><span class="name">${esc(c.name)}</span><span class="tag">Post-roast blend · ${c.ratio} by batch</span>${hint(c)}</td>
        <td class="r"><b>${f1(c.roastedLb)}</b></td><td class="c"><span class="bt">${c.batches}</span><span class="ex">total</span></td>
        <td class="r"><b>${n0(c.greenLb)}</b></td><td class="r dim">+${f1(c.extraLb)}</td><td></td></tr>`;
      return parent + c.components.map((k) => row(k, "comp", `${esc(k.name)} <span class="dim">· ${k.ratio} of ${total}</span>`)).join("");
    }).join("");

    const roaster = `<div class="page">${header("Roast sheet", s)}${stats}${noteBox}
      <div class="sec"><h2>Roaster</h2><span>Weights in lb</span></div>
      <table><thead><tr><th>Coffee</th><th class="r">Roasted need</th><th class="c">Batches</th><th class="r">Green</th><th class="r">Extra</th><th>Done</th></tr></thead>
      <tbody>${roastRows}
      <tr class="tot"><td>Total</td><td class="r">${f1(s.totals.roastedLb)}</td><td class="c">${s.totals.batches}</td><td class="r">${n0(s.totals.greenLb)}</td><td></td><td></td></tr></tbody></table>
      <div class="foot">Blend batch ${blendBt.greenLb} lb → ${f1(blendBt.greenLb * (1 - blendBt.moistureLoss))} lb roasted · SO batch ${soBt.greenLb} lb → ${f1(soBt.greenLb * (1 - soBt.moistureLoss))} lb roasted · Small number under batches = exact need · Extra goes to the shelf.</div></div>`;

    // ---------- page 2: bagging ----------
    let last = null;
    const bagRows = s.skus.map((k) => {
      const first = k.coffee !== last; last = k.coffee;
      return `<tr class="${first ? "first" : ""}"><td>${first ? `<span class="name">${esc(k.coffee)}</span>` : ""}</td><td class="${k.grind === "Whole bean" ? "dim" : ""}">${esc(k.grind)}</td>
        ${s.sizeColumns.map((sz) => `<td class="c">${k.sizes[sz] ? `<span class="q">${k.sizes[sz]}</span>` : `<span class="z">·</span>`}</td>`).join("")}
        <td class="r dim">${f1(k.totalLb)}</td><td>${boxes(1)}</td></tr>`;
    }).join("");
    const bagStats = `<div class="stats" style="grid-template-columns:repeat(${Math.min(s.sizeColumns.length + 1, 5)},1fr)">
      <div><small>Total bags</small><strong>${Object.values(s.totals.bagsBySize).reduce((t, v) => t + v, 0)}</strong></div>
      ${s.sizeColumns.slice(0, 4).map((sz) => `<div><small>${sz} bags</small><strong>${s.totals.bagsBySize[sz]}</strong></div>`).join("")}</div>`;
    const bagger = `<div class="page">${header("Bagging sheet", s)}${bagStats}
      <div class="sec"><h2>Bags to fill</h2><span>Totals across all open orders</span></div>
      <table><thead><tr><th>Coffee</th><th>Grind</th>${s.sizeColumns.map((sz) => `<th class="c">${sz}</th>`).join("")}<th class="r">Lb</th><th>Done</th></tr></thead>
      <tbody>${bagRows}
      <tr class="tot"><td colspan="2">Total</td>${s.sizeColumns.map((sz) => `<td class="c">${s.totals.bagsBySize[sz]}</td>`).join("")}<td class="r">${f1(s.totals.roastedLb)}</td><td></td></tr></tbody></table>
      <div class="foot">Subscription bags are whole bean.</div></div>`;

    // ---------- page 3: pack and ship ----------
    const orderRows = s.orders.slice().reverse().map((o) => {
      const parts = o.items.map((b) => `<b>${b.bags}×</b> ${esc(b.coffee)} ${b.sizeLabel}${b.grind !== "Whole bean" ? ` <span class="dim">(${esc(b.grind)})</span>` : ""}`);
      return `<tr><td style="width:22px">${boxes(1)}</td><td class="ord">${esc(o.name)}</td><td>${o.customer ? esc(o.customer) : `<span class="z">—</span>`}</td><td class="dim">${fmtDay(o.createdAt)}</td><td class="items">${parts.join(" &nbsp;·&nbsp; ")}</td></tr>`;
    }).join("");
    const pack = `<div class="page">${header("Pack and ship list", s, `Pulled ${fmtTime(s.generatedAt)} · ${s.orders.length} orders, oldest first`)}
      <table class="pack" style="margin-top:12px"><thead><tr><th></th><th style="width:52px">Order</th><th style="width:150px">Customer</th><th style="width:78px">Placed</th><th>Bags</th></tr></thead><tbody>${orderRows}</tbody></table>
      <div class="foot">Mark each order fulfilled in Shopify as it ships — the next pull drops it off automatically.</div></div>`;

    return `<div class="rs">${roaster}${bagger}${pack}</div>`;
  }

  const api = { render, CSS, FONT_LINK };
  if (typeof module !== "undefined") module.exports = api;
  else root.RoastRender = api;
})(this);
