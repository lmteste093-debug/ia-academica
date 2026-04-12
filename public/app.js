const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatBox = document.getElementById("chatBox");

function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.className = `lm-msg ${type === "user" ? "lm-msg-user" : "lm-msg-ai"}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function setLoading() {
  const loading = document.createElement("div");
  loading.className = "lm-msg lm-msg-ai";
  loading.id = "lm-loading";
  loading.textContent = "A pensar...";
  chatBox.appendChild(loading);
}

function removeLoading() {
  const loading = document.getElementById("lm-loading");
  if (loading) loading.remove();
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("lm_access_token");
  if (!token) {
    alert("Precisas entrar primeiro.");
    window.location.href = "/login.html";
    return;
  }

  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";
  setLoading();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    removeLoading();

    if (!response.ok) {
      addMessage(data.error || "Erro ao comunicar com a IA.", "ai");
      return;
    }

    addMessage(data.reply, "ai");
  } catch (error) {
    removeLoading();
    addMessage("Erro de ligação com o servidor.", "ai");
  }
});

async function loadUserStatus() {
  const token = localStorage.getItem("lm_access_token");
  const box = document.getElementById("lmUserStatus");
  if (!token || !box) return;

  try {
    const response = await fetch("/api/me", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      box.textContent = "Sessão inválida.";
      return;
    }

    const u = data.user;

    box.textContent =
      `Plano: ${u.plan.toUpperCase()} | Uso hoje: ${u.usage_today}/${u.plan === "premium" ? 100 : u.daily_limit}`;
  } catch {
    box.textContent = "Erro ao carregar dados.";
  }
}

loadUserStatus();