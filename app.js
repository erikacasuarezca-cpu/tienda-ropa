/* ==========================================================
   CONFIG
=========================================================== */
const API_URL =
  "https://script.google.com/macros/s/AKfycbw79uiejhooA4GMM9bNLB1_dHZ5sjVkM_zJhTakhneJoJoVKXPkiA-t5rTmlgibVCheHg/exec";

let usuarioActual = null;
let productos = [];
let carrito = [];

/* ==========================================================
   OCULTAR MODALES AL INICIAR
=========================================================== */
pagoFinalizado.classList.add("hidden");
procesandoPago.classList.add("hidden");
modalPago.classList.add("hidden");

/* ==========================================================
   LOGIN / REGISTRO
=========================================================== */
goRegister.onclick = () => {
  loginBox.classList.add("hidden");
  registerBox.classList.remove("hidden");
};

goLogin.onclick = () => {
  registerBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
};

btnRegister.onclick = async () => {
  let u = regUser.value.trim();
  let p = regPass.value.trim();

  if (!u || !p) return (registerError.textContent = "Completa ambos campos.");

  let usersRaw = await fetch(`${API_URL}?sheet=Usuarios`);
  let users = await usersRaw.json();

  if (users.some((row) => row[0] === u))
    return (registerError.textContent = "Ese usuario ya existe.");

  await fetch(`${API_URL}?sheet=Usuarios`, {
    method: "POST",
    body: JSON.stringify({
      usuario: u,
      contraseña: p,
      fecha_creación: new Date().toLocaleString(),
    }),
  });

  registerError.style.color = "lightgreen";
  registerError.textContent = "Usuario creado";

  setTimeout(() => {
    registerBox.classList.add("hidden");
    loginBox.classList.remove("hidden");
  }, 700);
};

btnLogin.onclick = async () => {
  let usr = loginUser.value.trim();
  let pass = loginPass.value.trim();

  let usersRaw = await fetch(`${API_URL}?sheet=Usuarios`);
  let users = await usersRaw.json();

  let ok = users.find((row) => row[0] === usr && row[1] === pass);
  if (!ok) return (loginError.textContent = "Datos incorrectos");

  usuarioActual = usr;
  mostrarTienda(usr);
};

btnLogout.onclick = () => {
  usuarioActual = null;
  location.reload();
};

/* ==========================================================
   MOSTRAR TIENDA
=========================================================== */
function mostrarTienda(u) {
  authContainer.classList.add("hidden");
  bienvenidaBox.classList.remove("hidden");
  adminBtnBox.classList.remove("hidden");
  categoriasBox.classList.remove("hidden");
  catalogo.classList.remove("hidden");
  nombreUsuario.textContent = u;
}

/* ==========================================================
   CARGAR PRODUCTOS DESDE SHEETS
=========================================================== */
async function cargarProductos() {
  let res = await fetch(`${API_URL}?sheet=Productos`);
  let data = await res.json();

  productos = data.slice(1).map((row) => ({
    id: parseInt(row[0]),
    nombre: row[1],
    precio: parseInt(row[2]),
    categoria: row[3],
    img: row[4],
  }));

  mostrarCatalogo();
  generarListaAdmin();
}

cargarProductos();

/* ==========================================================
   CATÁLOGO / FILTRO
=========================================================== */
let filtroActual = "Todos";

function filtrar(cat) {
  filtroActual = cat;

  document.querySelectorAll(".catBtn").forEach((b) => b.classList.remove("activo"));
  [...document.querySelectorAll(".catBtn")].find((b) => b.innerText === cat).classList.add("activo");

  mostrarCatalogo();
}

function mostrarCatalogo() {
  catalogo.innerHTML = "";

  productos
    .filter((p) => filtroActual === "Todos" || p.categoria === filtroActual)
    .forEach((p) => {
      catalogo.innerHTML += `
        <div class="card">
          <img src="${p.img}">
          <h3>${p.nombre}</h3>
          <p class="precio">$${p.precio.toLocaleString()}</p>
          <button class="btnAdd" onclick="agregarCarrito(${p.id})">Agregar al carrito</button>
        </div>
      `;
    });
}

/* ==========================================================
   CARRITO
=========================================================== */
carritoWidget.onclick = () => carritoPanel.classList.remove("hidden");
btnCerrarCarrito.onclick = () => carritoPanel.classList.add("hidden");

function agregarCarrito(id) {
  carrito.push(id);
  cartCount.textContent = carrito.length;
  actualizarCarrito();
}

function actualizarCarrito() {
  carritoItems.innerHTML = "";

  let agrupado = {};
  carrito.forEach((id) => (agrupado[id] = (agrupado[id] || 0) + 1));

  let total = 0;

  for (let id in agrupado) {
    let p = productos.find((x) => x.id == id);
    let cantidad = agrupado[id];
    let subtotal = p.precio * cantidad;
    total += subtotal;

    carritoItems.innerHTML += `
      <div class="carritoItem">
        <img src="${p.img}">
        <div class="infoCarrito">
          <h4>${p.nombre} (x${cantidad})</h4>
          <p>Unitario: $${p.precio.toLocaleString()}</p>
          <p>Subtotal: $${subtotal.toLocaleString()}</p>

          <div class="cantBtns">
            <button onclick="sumar(${id})">+</button>
            <button onclick="restar(${id})">-</button>
          </div>
        </div>

        <button class="btnQuitar" onclick="eliminarTodo(${id})">🗑️</button>
      </div>
    `;
  }

  totalCarrito.textContent = total.toLocaleString();
}

function sumar(id) {
  carrito.push(id);
  actualizarCarrito();
  cartCount.textContent = carrito.length;
}

function restar(id) {
  let index = carrito.indexOf(id);
  if (index !== -1) carrito.splice(index, 1);
  actualizarCarrito();
  cartCount.textContent = carrito.length;
}

function eliminarTodo(id) {
  carrito = carrito.filter((x) => x !== id);
  actualizarCarrito();
  cartCount.textContent = carrito.length;
}

/* ==========================================================
   ADMINISTRADOR
=========================================================== */
btnAdminPanel.onclick = () => {
  let clave = prompt("Ingrese clave de administrador:");
  if (clave === "admin") adminPanel.classList.remove("hidden");
  else alert("Clave incorrecta.");
};

btnExitAdmin.onclick = () => adminPanel.classList.add("hidden");

newImageFile.onchange = () => {
  let reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewImage.classList.remove("hidden");
  };
  reader.readAsDataURL(newImageFile.files[0]);
};

btnAddProduct.onclick = () => {
  if (!newName.value || !newPrice.value || !newImageFile.files[0])
    return alert("Completa todos los campos");

  let reader = new FileReader();

  reader.onload = async (e) => {
    let nuevo = {
      id: Date.now(),
      nombre: newName.value,
      precio: newPrice.value,
      categoria: newCategory.value,
      imagen: e.target.result,
    };

    await fetch(`${API_URL}?sheet=Productos`, {
      method: "POST",
      body: JSON.stringify(nuevo),
    });

    await cargarProductos();
  };

  reader.readAsDataURL(newImageFile.files[0]);
};

function generarListaAdmin() {
  adminDeleteList.innerHTML = "";

  productos.forEach((p) => {
    adminDeleteList.innerHTML += `
      <div class="delItem">
        ${p.nombre} (${p.categoria}) - $${p.precio.toLocaleString()}
        <button onclick="alert('La eliminación desde Sheets aún no está implementada.');">❌</button>
      </div>
    `;
  });
}

/* ==========================================================
   FINALIZAR COMPRA
=========================================================== */
btnSimularCompra.onclick = () => modalPago.classList.remove("hidden");
btnCerrarPago.onclick = () => modalPago.classList.add("hidden");

btnProcesarPago.onclick = async () => {
  if (!metodoPago.value) return alert("Seleccione un método");

  modalPago.classList.add("hidden");
  procesandoPago.classList.remove("hidden");

  setTimeout(async () => {
    procesandoPago.classList.add("hidden");
    pagoFinalizado.classList.remove("hidden");

    await fetch(`${API_URL}?sheet=Compras`, {
      method: "POST",
      body: JSON.stringify({
        usuario: usuarioActual,
        total: totalCarrito.textContent,
        fecha: new Date().toLocaleString(),
        productos: JSON.stringify(carrito),
      }),
    });

    carrito = [];
    actualizarCarrito();
    cartCount.textContent = 0;

  }, 2000);
};

btnCerrarFinal.onclick = () => pagoFinalizado.classList.add("hidden");
