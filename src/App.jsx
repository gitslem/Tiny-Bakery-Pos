import React, { useEffect, useMemo, useState } from "react";

/**
 * Tiny Bakery POS – single-file React app
 * Inventory (cakes sell by slice), cashier/manager roles,
 * Buy 4 Get 1 Free promo, immutable prices, localStorage persistence.
 */

const LS_KEY = "tiny-bakery-pos-v2";

function loadState() {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function saveState(state) { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {} }
function currency(n) { return n.toLocaleString(undefined, { style: "currency", currency: "USD" }); }

function initialInventory() {
  return [
    { id: "cake-choc", name: "Chocolate Cake", price: 24, itemType: "cake", slicesPerCake: 6, slicesAvailable: 12 },
    { id: "cake-spice", name: "Spice Cake",    price: 18, itemType: "cake", slicesPerCake: 8, slicesAvailable: 8  },
    { id: "pastry-croissant", name: "Croissant", price: 3.5, itemType: "pastry", stockUnits: 30 },
    { id: "bread-baguette",   name: "Baguette",  price: 4.25, itemType: "bread",  stockUnits: 12 },
  ];
}

// Buy 4 Get 1 Free
function applyBuy4Get1Free(qty) { return qty - Math.floor(qty / 5); }

export default function App() {
  const restored = loadState();
  const [role, setRole] = useState(restored?.role || "cashier");
  const [promoEnabled, setPromoEnabled] = useState(!!restored?.promoEnabled);
  const [inventory, setInventory] = useState(restored?.inventory || initialInventory());
  const [cart, setCart] = useState(restored?.cart || []);
  const [ledger, setLedger] = useState(restored?.ledger || []);
  const [revenue, setRevenue] = useState(restored?.revenue || 0);

  useEffect(() => { saveState({ role, promoEnabled, inventory, cart, ledger, revenue }); },
    [role, promoEnabled, inventory, cart, ledger, revenue]);

  const products = inventory;

  const lowStock = useMemo(() => {
    const alerts = [];
    for (const p of products) {
      if (p.itemType === "cake") {
        if (p.slicesAvailable <= 12) alerts.push(`Cake ${p.name} low: ${p.slicesAvailable} slices`);
      } else {
        if ((p.stockUnits ?? 0) <= 5) alerts.push(`${p.name} low: ${p.stockUnits} units`);
      }
    }
    return alerts;
  }, [products]);

  function findProduct(id) { return products.find(p => p.id === id); }
  function pricePer(p, unit /* "unit" | "slice" */) {
    return p.itemType === "cake" && unit === "slice" ? p.price / p.slicesPerCake : p.price;
  }

  // ---------------- Cart ops ----------------
  function addToCart(id, unit, qty) {
    const p = findProduct(id); if (!p) return;
    qty = Number(qty) || 0; if (qty <= 0) return;

    const available = (p.itemType === "cake" && unit === "slice") ? p.slicesAvailable : (p.stockUnits ?? 0);
    if (qty > available) { alert(`Cannot add ${qty} – only ${available} ${unit === "slice" ? "slices" : "units"} remain.`); return; }

    setCart(prev => {
      const existing = prev.find(l => l.id === id && l.unit === unit);
      if (existing) return prev.map(l => l === existing ? { ...l, qty: l.qty + qty } : l);
      return [...prev, { id, name: p.name, unit, qty, price: pricePer(p, unit) }];
    });
  }
  function removeLine(idx) { setCart(prev => prev.filter((_, i) => i !== idx)); }
  function clearCart() { setCart([]); }

  const cartTotals = useMemo(() => {
    let subtotal = 0, saved = 0;
    const detailed = cart.map(line => {
      const chargeableQty = promoEnabled ? applyBuy4Get1Free(line.qty) : line.qty;
      const lineTotal = chargeableQty * line.price;
      const lineSaved = (line.qty - chargeableQty) * line.price;
      subtotal += lineTotal; saved += lineSaved;
      return { ...line, chargeableQty, lineTotal, lineSaved };
    });
    return { detailed, subtotal, saved };
  }, [cart, promoEnabled]);

  function checkout() {
    if (cart.length === 0) return;
    const newInv = products.map(p => ({ ...p }));
    for (const line of cartTotals.detailed) {
      const p = newInv.find(pp => pp.id === line.id); if (!p) continue;
      const needed = line.qty;
      if (p.itemType === "cake" && line.unit === "slice") {
        if (needed > p.slicesAvailable) { alert("Stock changed – not enough slices."); return; }
        p.slicesAvailable -= needed;
      } else {
        if (needed > (p.stockUnits ?? 0)) { alert("Stock changed – not enough units."); return; }
        p.stockUnits -= needed;
      }
    }
    setInventory(newInv);
    setRevenue(r => r + cartTotals.subtotal);
    const msg = `Sale: ${cartTotals.detailed.map(d => `${d.qty}${d.unit === "slice" ? "sl" : "u"} ${d.name}`).join(", ")} | subtotal ${currency(cartTotals.subtotal)} ` +
                (cartTotals.saved > 0 ? `(saved ${currency(cartTotals.saved)})` : "");
    setLedger(l => [msg, ...l]);
    clearCart();
  }

  // --------------- Manager ops ---------------
  function restock(id, amount, unit /* "unit" | "slice" */) {
    amount = Number(amount) || 0; if (amount <= 0) return;
    setInventory(prev => prev.map(p => {
      if (p.id !== id) return p;
      if (p.itemType === "cake" && unit === "slice") return { ...p, slicesAvailable: p.slicesAvailable + amount };
      if (p.itemType !== "cake" && unit === "unit") return { ...p, stockUnits: (p.stockUnits ?? 0) + amount };
      return p;
    }));
  }
  function addNewItem(data) {
    const id = `${data.type}-${Date.now()}`;
    if (data.type === "cake") {
      const p = { id, name: data.name, price: Number(data.price), itemType: "cake",
                  slicesPerCake: Number(data.slicesPerCake), slicesAvailable: Number(data.slicesAvailable || 0) };
      setInventory(prev => [p, ...prev]);
    } else {
      const p = { id, name: data.name, price: Number(data.price), itemType: data.type,
                  stockUnits: Number(data.stockUnits || 0) };
      setInventory(prev => [p, ...prev]);
    }
  }

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tiny Bakery POS</h1>
        <div className="flex items-center gap-4">
          <PromoToggle enabled={promoEnabled} onChange={setPromoEnabled} role={role} />
          <RoleSwitcher role={role} onChange={setRole} />
        </div>
      </header>

      <main className="p-4 grid md:grid-cols-5 gap-4">
        {/* Products */}
        <section className="md:col-span-3 bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Products</h2>
          <ProductList products={products} addToCart={addToCart} />
          {role === "manager" && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Manager: Restock</h3>
                <RestockPanel products={products} restock={restock} />
              </div>
              <div>
                <h3 className="font-medium mb-2">Manager: Add New Item</h3>
                <AddItemForm onAdd={addNewItem} />
              </div>
            </div>
          )}
        </section>

        {/* Cart */}
        <section className="md:col-span-2 bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Cart</h2>
          <CartView
            detailed={cartTotals.detailed}
            saved={cartTotals.saved}
            subtotal={cartTotals.subtotal}
            removeLine={removeLine}
            clearCart={clearCart}
            checkout={checkout}
          />
          <div className="mt-6">
            <h3 className="font-medium mb-2">Revenue</h3>
            <div className="p-3 rounded-lg bg-gray-100">{currency(revenue)}</div>
          </div>
          <div className="mt-6">
            <h3 className="font-medium mb-2">Low Stock Alerts</h3>
            {lowStock.length === 0 ? (
              <div className="text-sm text-gray-500">All good!</div>
            ) : (
              <ul className="list-disc pl-5 text-sm">
                {lowStock.map((a, i) => (<li key={i}>{a}</li>))}
              </ul>
            )}
          </div>
        </section>

        {/* Ledger */}
        <section className="md:col-span-5 bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Ledger</h2>
          {ledger.length === 0 ? (
            <div className="text-sm text-gray-500">No sales yet.</div>
          ) : (
            <ul className="text-sm space-y-1">
              {ledger.map((l, i) => (<li key={i} className="border-b py-1 last:border-none">{l}</li>))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

/* ---------------- Components ---------------- */

function RoleSwitcher({ role, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      Role
      <select className="border rounded-md px-2 py-1" value={role} onChange={e => onChange(e.target.value)}>
        <option value="cashier">Cashier</option>
        <option value="manager">Manager</option>
      </select>
    </label>
  );
}

function PromoToggle({ enabled, onChange, role }) {
  return (
    <label className={`flex items-center gap-2 text-sm ${role === "manager" ? "" : "opacity-60"}`}>
      <input type="checkbox" disabled={role !== "manager"} checked={enabled} onChange={e => onChange(e.target.checked)} />
      Buy 4 Get 1 Free
    </label>
  );
}

function ProductList({ products, addToCart }) {
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("unit");
  const [selected, setSelected] = useState(products[0]?.id || "");

  useEffect(() => {
    const p = products.find(pp => pp.id === selected); if (!p) return;
    setUnit(p.itemType === "cake" ? "slice" : "unit");
  }, [selected, products]);

  const selectedProduct = products.find(p => p.id === selected);

  return (
    <div className="space-y-3">
      <select className="w-full border rounded-md px-2 py-2" value={selected} onChange={e => setSelected(e.target.value)}>
        {products.map(p => (
          <option key={p.id} value={p.id}>
            {p.name} — {p.itemType === "cake" ? `${p.slicesAvailable} sl @ ${currency(p.price / p.slicesPerCake)} /slice` : `${p.stockUnits} u @ ${currency(p.price)}`}
          </option>
        ))}
      </select>

      <select className="w-full border rounded-md px-2 py-2" value={unit} onChange={e => setUnit(e.target.value)} disabled={selectedProduct?.itemType === "cake" ? false : true}>
        <option value="unit">Unit</option>
        <option value="slice">Slice</option>
      </select>

      <input className="w-full border rounded-md px-2 py-2" type="number" min={1} value={qty} onChange={e => setQty(parseInt(e.target.value || "0"))} />

      <button className="w-full bg-indigo-600 text-white rounded-md py-2 hover:bg-indigo-700" onClick={() => selected && addToCart(selected, unit, qty)}>
        Add to cart
      </button>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-1">Name</th><th className="py-1">Type</th><th className="py-1">Inventory</th><th className="py-1">Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b last:border-none">
                <td className="py-1">{p.name}</td>
                <td className="py-1 capitalize">{p.itemType}</td>
                <td className="py-1">
                  {p.itemType === "cake"
                    ? <span>{p.slicesAvailable} slices ({Math.floor(p.slicesAvailable / p.slicesPerCake)} whole)</span>
                    : <span>{p.stockUnits} units</span>}
                </td>
                <td className="py-1">
                  {p.itemType === "cake"
                    ? <span>{currency(p.price)} / cake · {currency(p.price / p.slicesPerCake)} / slice</span>
                    : <span>{currency(p.price)} / unit</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CartView({ detailed, saved, subtotal, removeLine, clearCart, checkout }) {
  if (detailed.length === 0) return <div className="text-sm text-gray-500">Cart is empty.</div>;
  return (
    <div className="space-y-3">
      {detailed.map((l, i) => (
        <div key={i} className="flex items-start justify-between gap-3 border-b pb-2">
          <div>
            <div className="font-medium">{l.name}</div>
            <div className="text-sm text-gray-600">
              {l.qty} {l.unit === "slice" ? "slice(s)" : "unit(s)"} · {currency(l.price)} each{" "}
              {l.chargeableQty !== l.qty && <span className="text-green-700">— promo: pay {l.chargeableQty}, free {l.qty - l.chargeableQty}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{currency(l.lineTotal)}</div>
            <button className="text-red-600 text-sm" onClick={() => removeLine(i)}>Remove</button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <div>Saved: {currency(saved)}</div>
        <div className="font-semibold">Subtotal: {currency(subtotal)}</div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 rounded-md border px-3 py-2" onClick={clearCart}>Clear</button>
        <button className="flex-1 rounded-md bg-indigo-600 text-white px-3 py-2 hover:bg-indigo-700" onClick={checkout}>Checkout</button>
      </div>
    </div>
  );
}

function RestockPanel({ products, restock }) {
  const [id, setId] = useState(products[0]?.id || "");
  const [unit, setUnit] = useState("unit");
  const [qty, setQty] = useState(10);

  useEffect(() => {
    const p = products.find(pp => pp.id === id); if (!p) return;
    setUnit(p.itemType === "cake" ? "slice" : "unit");
  }, [id, products]);

  return (
    <div className="grid md:grid-cols-3 gap-3">
      <select className="w-full border rounded-md px-2 py-2" value={id} onChange={e => setId(e.target.value)}>
        {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
      </select>

      <select className="w-full border rounded-md px-2 py-2" value={unit} onChange={e => setUnit(e.target.value)}>
        <option value="unit">Unit</option>
        <option value="slice">Slice</option>
      </select>

      <input className="w-full border rounded-md px-2 py-2" type="number" min={1} value={qty}
             onChange={e => setQty(parseInt(e.target.value || "0"))} />

      <div className="md:col-span-3">
        <button className="w-full bg-amber-600 text-white rounded-md py-2 hover:bg-amber-700"
                onClick={() => restock(id, qty, unit)}>Add Stock</button>
      </div>
    </div>
  );
}

function AddItemForm({ onAdd }) {
  const [type, setType] = useState("pastry");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stockUnits, setStockUnits] = useState("");
  const [slicesPerCake, setSlicesPerCake] = useState("");
  const [slicesAvailable, setSlicesAvailable] = useState("")

  function submit() {
    if (!name || !price) return alert("Name and price are required");
    const data = { type, name, price, stockUnits, slicesPerCake, slicesAvailable };
    onAdd(data);
    setName(""); setPrice(""); setStockUnits(""); setSlicesPerCake(""); setSlicesAvailable("");
  }

  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div>
        <div className="text-sm font-medium mb-1">Type</div>
        <select className="w-full border rounded-md px-2 py-2" value={type} onChange={e => setType(e.target.value)}>
          <option value="pastry">Pastry</option>
          <option value="bread">Bread</option>
          <option value="cake">Cake</option>
        </select>
      </div>

      <div>
        <div className="text-sm font-medium mb-1">Name</div>
        <input className="w-full border rounded-md px-2 py-2" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div>
        <div className="text-sm font-medium mb-1">Price ($)</div>
        <input className="w-full border rounded-md px-2 py-2" type="number" step="0.01"
               value={price} onChange={e => setPrice(e.target.value)} />
      </div>

      {type === "cake" ? (
        <>
          <div>
            <div className="text-sm font-medium mb-1">Slices / cake</div>
            <input className="w-full border rounded-md px-2 py-2" type="number"
                   value={slicesPerCake} onChange={e => setSlicesPerCake(e.target.value)} />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Initial slices</div>
            <input className="w-full border rounded-md px-2 py-2" type="number"
                   value={slicesAvailable} onChange={e => setSlicesAvailable(e.target.value)} />
          </div>
        </>
      ) : (
        <div className="md:col-span-2">
          <div className="text-sm font-medium mb-1">Initial units</div>
          <input className="w-full border rounded-md px-2 py-2" type="number"
                 value={stockUnits} onChange={e => setStockUnits(e.target.value)} />
        </div>
      )}

      <div className="md:col-span-2">
        <button className="w-full bg-emerald-600 text-white rounded-md py-2 hover:bg-emerald-700" onClick={submit}>
          Add Item
        </button>
      </div>
    </div>
  );
}
