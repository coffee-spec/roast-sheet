// Nostalgica Roast Sheet — data pull + math. Pure functions except fetchOrders().
(function (root) {
  const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

  const ORDER_FIELDS = `
    name createdAt displayFulfillmentStatus
    lineItems(first: 100) { nodes {
      unfulfilledQuantity variantTitle
      product { title tags productType }
      variant { selectedOptions { name value } inventoryItem { measurement { weight { value unit } } } }
    } }`;

  const QUERY = `query RoastSheet($q: String!, $after: String) {
    orders(first: 100, after: $after, sortKey: CREATED_AT, reverse: true, query: $q) {
      pageInfo { hasNextPage endCursor }
      nodes { ${ORDER_FIELDS} }
    } }`;

  function startOfDayMinus(days, now) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - days);
    return d;
  }

  // Pull every open (unfulfilled / partial) order. `gql` is a function(query, variables) -> json.
  async function fetchOrders(gql, config) {
    const q = "(fulfillment_status:unfulfilled OR fulfillment_status:partial) AND -status:cancelled";
    let after = null, orders = [], pages = 0, truncated = false;
    do {
      const res = await gql(QUERY, { q, after });
      if (res.errors) throw new Error(res.errors.map((e) => e.message).join("; "));
      const conn = res.data.orders;
      orders = orders.concat(conn.nodes);
      after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
      pages++;
      if (after && pages >= config.maxPages) { truncated = true; break; }
    } while (after);
    return { orders, truncated };
  }

  // ---------- parsing ----------
  function parseSize(text) {
    if (!text) return null;
    const m = String(text).match(/(?:(\d+)\s*x\s*|\b(one|two|three|four|five|six)\s+)?(\d+(?:\.\d+)?)\s*(lbs?|pounds?|oz|ounces?)\b/i);
    if (!m) return null;
    const count = m[1] ? parseInt(m[1], 10) : m[2] ? WORDS[m[2].toLowerCase()] : 1;
    const n = parseFloat(m[3]);
    const isOz = /^o/i.test(m[4]);
    return { count, lb: isOz ? n / 16 : n, label: isOz ? `${trim(n)} oz` : `${trim(n)} lb` };
  }
  function weightToSize(w) {
    if (!w || !w.value) return null;
    const lb = { POUNDS: 1, OUNCES: 1 / 16, GRAMS: 1 / 453.592, KILOGRAMS: 2.20462 }[w.unit] * w.value;
    if (!lb) return null;
    // Snap to common bag sizes so 907 g reads as 2 lb.
    const std = [5, 2, 1, 0.75, 0.5, 0.25];
    const hit = std.find((s) => Math.abs(s - lb) / s < 0.04);
    const v = hit || Math.round(lb * 100) / 100;
    return { count: 1, lb: v, label: v < 1 ? `${trim(v * 16)} oz` : `${trim(v)} lb` };
  }
  function trim(n) { return String(Math.round(n * 100) / 100); }

  function grindOf(options) {
    const o = (options || []).find((x) => /whole bean|ground|grind/i.test(x.name));
    if (!o) return "Whole bean";
    const v = o.value.toLowerCase();
    if (v.includes("whole")) return "Whole bean";
    if (v.includes("pour")) return "Pourover";
    if (v.includes("drip")) return "Drip";
    if (v.includes("french")) return "French press";
    if (v.includes("espresso")) return "Espresso";
    return "Ground";
  }

  function typeFromTags(tags) {
    const t = (tags || []).map((x) => x.toLowerCase());
    if (t.includes("blend")) return "blend";
    if (t.includes("single origin")) return "so";
    return null;
  }

  // Turn one line item into bag records: [{coffee, type, grind, sizeLb, sizeLabel, bags}] (+ notes)
  function lineToBags(li, config, learnedTypes) {
    const p = li.product;
    const qty = li.unfulfilledQuantity || 0;
    if (!p || qty <= 0) return { bags: [], skipped: p ? null : "custom item" };
    const tags = (p.tags || []).map((x) => x.toLowerCase());
    const isSub = tags.some((t) => t.startsWith("appstle_subscribe"));
    const isCoffee = isSub || tags.includes("coffee") || /coffee/i.test(p.productType || "");
    if (!isCoffee) return { bags: [], skipped: null };

    const opts = (li.variant && li.variant.selectedOptions) || [];
    const notes = [];
    const canon = (n) => config.aliases[n] || n;

    if (isSub) {
      const sizeText = (opts.find((o) => /size|bag/i.test(o.name)) || {}).value || li.variantTitle;
      const size = parseSize(sizeText) || parseSize(li.variantTitle);
      const pick = opts.find((o) => /blend|espresso|coffee/i.test(o.name) && !/size/i.test(o.name));
      // legacy variants like "Paper Route / One 5 lb Bag"
      let name = pick ? pick.value : null;
      if (!name && li.variantTitle) {
        const part = li.variantTitle.split("/").map((s) => s.trim()).find((s) => !parseSize(s));
        if (part) name = part;
      }
      if (!size) return { bags: [], unknown: `${p.title} — ${li.variantTitle || "no variant"} (size not found)` };
      const n = size.count * qty;
      const mk = (coffee, type, bags) => ({ coffee, type, grind: "Whole bean", sizeLb: size.lb, sizeLabel: size.label, bags });
      if (/combo/i.test(p.title) && name) {
        const c = canon(name);
        const per = Math.ceil(size.count / 2);
        return { bags: [mk(c, typeOf(c, null, config, learnedTypes), per * qty), mk(config.soPickName, "so", (size.count - per) * qty)].filter((b) => b.bags > 0), notes };
      }
      if (!name || /single origin/i.test(p.title) && !pick) return { bags: [mk(config.soPickName, "so", n)], notes };
      const c = canon(name);
      return { bags: [mk(c, typeOf(c, null, config, learnedTypes), n)], notes };
    }

    const sizeOpt = opts.find((o) => /size/i.test(o.name));
    const size = parseSize(sizeOpt && sizeOpt.value) || parseSize(li.variantTitle) || parseSize(p.title) ||
      weightToSize(li.variant && li.variant.inventoryItem && li.variant.inventoryItem.measurement && li.variant.inventoryItem.measurement.weight);
    const coffee = canon(p.title);
    if (!size) return { bags: [], unknown: `${coffee} (bag size not found)` };
    const tagType = typeFromTags(p.tags);
    if (tagType) learnedTypes[coffee] = tagType;
    return { bags: [{ coffee, type: typeOf(coffee, tagType, config, learnedTypes), grind: grindOf(opts), sizeLb: size.lb, sizeLabel: size.label, bags: qty * size.count }], notes };
  }

  function typeOf(coffee, tagType, config, learned) {
    return tagType || learned[coffee] || config.knownTypes[coffee] || "blend";
  }

  // ---------- main calc ----------
  function buildSheet(rawOrders, opts) {
    const config = opts.config;
    const now = opts.now ? new Date(opts.now) : new Date();
    const lookback = opts.lookbackDays || config.lookbackDays;
    const since = startOfDayMinus(lookback, now);
    const active = new Set(config.activeStatuses);
    const learned = {};

    const inWindow = [], stale = [], pickup = [];
    for (const o of rawOrders) {
      if (o.displayFulfillmentStatus === "READY_FOR_PICKUP") { pickup.push(o); continue; }
      if (!active.has(o.displayFulfillmentStatus)) continue;
      if (new Date(o.createdAt) >= since) inWindow.push(o); else stale.push(o);
    }
    // learn blend/SO types from regular products first, so subscriptions can use them
    for (const o of inWindow) for (const li of o.lineItems.nodes) {
      const t = li.product && typeFromTags(li.product.tags);
      if (t) learned[config.aliases[li.product.title] || li.product.title] = t;
    }

    const notes = new Set(), unknown = [], orders = [];
    const skuMap = new Map();
    for (const o of inWindow) {
      const items = [];
      for (const li of o.lineItems.nodes) {
        const r = lineToBags(li, config, learned);
        (r.notes || []).forEach((n) => notes.add(n));
        if (r.unknown) unknown.push(`${o.name}: ${r.unknown}`);
        for (const b of r.bags) {
          items.push(b);
          const key = `${b.coffee}|${b.grind}`;
          if (!skuMap.has(key)) skuMap.set(key, { coffee: b.coffee, type: b.type, grind: b.grind, sizes: {} });
          const s = skuMap.get(key);
          s.sizes[b.sizeLabel] = (s.sizes[b.sizeLabel] || 0) + b.bags;
        }
      }
      if (items.length) orders.push({ name: o.name, createdAt: o.createdAt, status: o.displayFulfillmentStatus, items });
    }

    // size columns, biggest first
    const sizeLb = {};
    for (const o of orders) for (const b of o.items) sizeLb[b.sizeLabel] = b.sizeLb;
    const sizeColumns = Object.keys(sizeLb).sort((a, b) => sizeLb[b] - sizeLb[a]);

    // roaster math per coffee
    const coffeeMap = new Map();
    for (const o of orders) for (const b of o.items) {
      if (!coffeeMap.has(b.coffee)) coffeeMap.set(b.coffee, { name: b.coffee, type: b.type, roastedLb: 0 });
      coffeeMap.get(b.coffee).roastedLb += b.bags * b.sizeLb;
    }
    const coffees = [...coffeeMap.values()].map((c) => {
      const bt = config.batches[c.type];
      const yieldLb = bt.greenLb * (1 - bt.moistureLoss);
      const exact = c.roastedLb / yieldLb;
      const batches = Math.ceil(exact - 1e-9);
      return { ...c, batchGreenLb: bt.greenLb, yieldLb, exactBatches: exact, batches, greenLb: batches * bt.greenLb, extraLb: batches * yieldLb - c.roastedLb };
    }).sort((a, b) => (a.type === b.type ? b.roastedLb - a.roastedLb : a.type === "blend" ? -1 : 1));

    const order = new Map(coffees.map((c, i) => [c.name, i]));
    const gOrder = ["Whole bean", "Espresso", "Pourover", "Drip", "French press", "Ground"];
    const skus = [...skuMap.values()].map((s) => ({ ...s, totalLb: Object.entries(s.sizes).reduce((t, [k, v]) => t + v * sizeLb[k], 0) }))
      .sort((a, b) => order.get(a.coffee) - order.get(b.coffee) || gOrder.indexOf(a.grind) - gOrder.indexOf(b.grind));

    const isCoffeeOrder = (o) => o.lineItems.nodes.some((li) => li.product && ((li.product.tags || []).some((t) => /^coffee$|^appstle_subscribe/i.test(t))));
    const staleCoffee = stale.filter(isCoffeeOrder);

    return {
      generatedAt: now.toISOString(), since: since.toISOString(), lookbackDays: lookback,
      orders, coffees, skus, sizeColumns,
      totals: {
        roastedLb: coffees.reduce((t, c) => t + c.roastedLb, 0),
        greenLb: coffees.reduce((t, c) => t + c.greenLb, 0),
        batches: coffees.reduce((t, c) => t + c.batches, 0),
        bagsBySize: Object.fromEntries(sizeColumns.map((sz) => [sz, skus.reduce((t, s) => t + (s.sizes[sz] || 0), 0)])),
      },
      alerts: {
        stale: staleCoffee.map((o) => o.name), pickupCount: pickup.length, truncated: !!opts.truncated,
        notes: [...notes], unknown,
      },
    };
  }

  const api = { fetchOrders, buildSheet, parseSize, weightToSize, QUERY };
  if (typeof module !== "undefined") module.exports = api;
  else root.RoastSheet = api;
})(this);
