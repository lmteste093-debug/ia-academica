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
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLoading() {
  const loading = document.getElementById("lm-loading");
  if (loading) loading.remove();
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";
  setLoading();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    removeLoading();

    if (!response.ok) {
      addMessage(data.error || "Erro ao comunicar com a IA.", "ai");
      return;
    }

    addMessage(data.reply || "Sem resposta no momento.", "ai");
  } catch (error) {
    removeLoading();
    addMessage("Erro de ligação com o servidor.", "ai");
  }
});