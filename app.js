// Runs inside Shopify admin. Data comes straight from the Admin API through App Bridge (no server).
(function () {
  const CONFIG = window.ROAST_CONFIG;
  const $ = (id) => document.getElementById(id);
  document.getElementById("sheet-css").textContent = RoastRender.CSS;
  $("days").value = String(CONFIG.lookbackDays);

  async function gql(query, variables) {
    const res = await fetch(`shopify:admin/api/${CONFIG.apiVersion}/graphql.json`, {
      method: "POST",
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`Shopify returned ${res.status}`);
    return res.json();
  }

  let html = "";
  async function load() {
    $("status").textContent = "Pulling open orders from Shopify…";
    $("refresh").disabled = true;
    try {
      const { orders, truncated, warnings } = await RoastSheet.fetchOrders(gql, CONFIG);
      const sheet = RoastSheet.buildSheet(orders, { config: CONFIG, truncated, warnings, lookbackDays: parseInt($("days").value, 10) });
      html = RoastRender.render(sheet, CONFIG);
      $("paper").innerHTML = html;
      $("status").textContent = `Pulled ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · ${sheet.orders.length} orders · ${sheet.totals.batches} batches · ${Math.round(sheet.totals.roastedLb)} lb roasted`;
    } catch (e) {
      $("paper").innerHTML = `<div class="err">Couldn't load orders: ${String(e.message || e)}<br>Check that your staff account has access to orders, then press Refresh.</div>`;
      $("status").textContent = "Load failed";
    } finally {
      $("refresh").disabled = false;
    }
  }

  // Standalone printable page in a new tab — fallback if printing inside the admin frame is blocked.
  function openTab() {
    const doc = `<!doctype html><html><head><meta charset="utf-8"><title>Roast sheet</title><style>@page{size:letter;margin:0.45in}body{margin:0}${RoastRender.CSS}</style></head><body>${html}<script>setTimeout(()=>print(),300)<\/script></body></html>`;
    const url = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
    window.open(url, "_blank");
  }

  $("refresh").addEventListener("click", load);
  $("days").addEventListener("change", load);
  $("print").addEventListener("click", () => {
    try { window.print(); } catch (e) { openTab(); }
  });
  $("tab").addEventListener("click", openTab);
  load();
})();
