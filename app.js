const firebaseConfig = {
  apiKey: "AIzaSyC5XOdQPVlX8oaCuOtfWdJrrjvasuFLY50",
  authDomain: "appdespeses-66a31.firebaseapp.com",
  projectId: "appdespeses-66a31",
  storageBucket: "appdespeses-66a31.firebasestorage.app",
  messagingSenderId: "95148655068",
  appId: "1:95148655068:web:bf102cea2e8578b8cfcf19",
  measurementId: "G-C3E7CEC269"
};

// Inicialitzar Firebase
firebase.initializeApp(firebaseConfig);

// Firestore
const db = firebase.firestore();
const despesesRef = db.collection("despeses");

// DOM
const form = document.getElementById("form-despesa");
const inputDesc = document.getElementById("input-desc");
const inputImport = document.getElementById("input-import");
const selectCat = document.getElementById("select-cat");

const llista = document.getElementById("llista-despeses");

const totalEurosEl = document.getElementById("total-euros");
const totalItemsEl = document.getElementById("total-items");
const filterCatEl = document.getElementById("filter-cat");
const resumEl = document.getElementById("resum-categories");

// (Opcional) pill del layout horitzontal
const pill = document.getElementById("pill-filter");

let despesesCache = [];

// Utils
function formatEuros(n) {
  return `${Number(n || 0).toFixed(2).replace(".", ",")} €`;
}

function updatePill() {
  if (!pill) return;
  pill.textContent = (filterCatEl.value === "TOTES")
    ? "Vista: totes"
    : `Vista: ${filterCatEl.value}`;
}

// Render UI (filtre + totals + resum + llista)
function render() {
  const catFiltre = filterCatEl.value;

  const visibles = (catFiltre === "TOTES")
    ? despesesCache
    : despesesCache.filter(d => d.cat === catFiltre);

  // Llista
  llista.innerHTML = "";
  visibles.forEach(({ id, desc, amount, cat }) => {
    const li = document.createElement("li");
    li.classList.add("despesa");

    const safeCat = (cat || "Altres");
    const catClass = safeCat
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    li.classList.add(`cat-${catClass}`);

    const left = document.createElement("div");
    left.classList.add("desc");

    const title = document.createElement("span");
    title.textContent = desc;

    const meta = document.createElement("span");
    meta.classList.add("meta");
    meta.textContent = safeCat;

    left.appendChild(title);
    left.appendChild(meta);

    const amountEl = document.createElement("span");
    amountEl.classList.add("amount");
    amountEl.textContent = formatEuros(amount);

    const botoEliminar = document.createElement("button");
    botoEliminar.textContent = "Esborrar";
    botoEliminar.classList.add("boto-eliminar");
    botoEliminar.addEventListener("click", () => {
      despesesRef.doc(id).delete().catch((err) => {
        console.error("Error esborrant despesa:", err);
      });
    });

    li.appendChild(left);
    li.appendChild(amountEl);
    li.appendChild(botoEliminar);

    llista.appendChild(li);
  });

  // Stats
  const total = visibles.reduce((acc, d) => acc + Number(d.amount || 0), 0);
  totalEurosEl.textContent = formatEuros(total);
  totalItemsEl.textContent = String(visibles.length);

  // Resum per categories
  const map = {};
  visibles.forEach(d => {
    const key = d.cat || "Altres";
    map[key] = (map[key] || 0) + Number(d.amount || 0);
  });

  resumEl.innerHTML = "";
  const cats = Object.keys(map).sort();

  if (cats.length === 0) {
    const row = document.createElement("div");
    row.classList.add("resum-item");
    row.innerHTML = `<span>Cap despesa</span><strong>${formatEuros(0)}</strong>`;
    resumEl.appendChild(row);
  } else {
    cats.forEach(cat => {
      const row = document.createElement("div");
      row.classList.add("resum-item");
      row.innerHTML = `<span>${cat}</span><strong>${formatEuros(map[cat])}</strong>`;
      resumEl.appendChild(row);
    });
  }
}

// Filtre categoria
filterCatEl.addEventListener("change", () => {
  updatePill();
  render();
});
updatePill();

// Afegir despesa
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const desc = inputDesc.value.trim();
  const amount = Number(inputImport.value);
  const cat = selectCat.value;

  if (!desc || !cat || !Number.isFinite(amount) || amount <= 0) return;

  try {
    await despesesRef.add({
      desc,
      amount,
      cat,
      creatEl: firebase.firestore.FieldValue.serverTimestamp()
    });

    inputDesc.value = "";
    inputImport.value = "";
    selectCat.selectedIndex = 0;
    inputDesc.focus();
  } catch (error) {
    console.error("Error afegint despesa:", error);
  }
});

// Realtime
despesesRef
  .orderBy("creatEl", "desc")
  .onSnapshot((snapshot) => {
    despesesCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    render();
  }, (error) => {
    console.error("Error escoltant despeses:", error);
  });
