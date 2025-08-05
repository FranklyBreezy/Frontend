const API_URL = "https://nondescripttodolistapp.onrender.com";

// DOM Elements
const spinner = document.getElementById("spinner");
const taskList = document.getElementById("task-list");
const message = document.getElementById("message");
const taskForm = document.getElementById("task-form");
const toast = document.getElementById("toast");
const toggleThemeBtn = document.getElementById("toggle-theme");

// Utility
function showSpinner() { spinner.classList.remove("hidden"); }
function hideSpinner() { spinner.classList.add("hidden"); }

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

function validateInput(title, priority, deadline) {
  if (!title.trim()) return "Title is required.";
  if (!Number.isInteger(priority) || priority < 1 || priority > 3) return "Priority must be 1-3.";
  if (deadline && isNaN(Date.parse(deadline))) return "Deadline is invalid.";
  return null;
}

// API Calls
async function fetchTasks() {
  showSpinner();
  try {
    const res = await fetch(`${API_URL}/tasks`);
    if (!res.ok) throw new Error(`GET failed (${res.status})`);

    const tasks = await res.json();
    renderTaskList(tasks);
  } catch (e) {
    showToast("Error fetching tasks: " + e.message);
  } finally {
    hideSpinner();
  }
}

function renderTaskList(tasks) {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const li = document.createElement("li");
    li.textContent = "🎉 No tasks yet!";
    taskList.appendChild(li);
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement("li");
    if (task.completed) li.classList.add("completed");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.disabled = true;

    const span = document.createElement("span");
    span.textContent = `${task.title} (Priority: ${task.priority}) Deadline: ${task.deadline || "None"}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Delete Task";
    deleteBtn.addEventListener("click", () => handleDelete(task.id, task.title));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

async function handleDelete(id, title) {
  if (!id) {
    showToast("Missing task ID");
    return;
  }

  const confirmDelete = confirm(`Delete "${title}"?`);
  if (!confirmDelete) return;

  showSpinner();
  try {
    const res = await fetch(`${API_URL}/tasks?id=eq.${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    showToast("Task deleted");
    await fetchTasks();
  } catch (e) {
    showToast("Error deleting: " + e.message);
  } finally {
    hideSpinner();
  }
}

// Event: Form Submission
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const priorityInput = document.getElementById("priority").value;
  const deadline = document.getElementById("deadline").value;
  const priority = Number(priorityInput) || 2;

  const error = validateInput(title, priority, deadline);
  if (error) {
    showToast(error);
    return;
  }

  showSpinner();
  try {
    const res = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority, deadline })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Unknown error");
    }

    showToast("Task added!");
    taskForm.reset();
    await fetchTasks();
  } catch (e) {
    showToast("Error adding: " + e.message);
  } finally {
    hideSpinner();
  }
});

// Theme toggle
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

// Init
(function init() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  fetchTasks();
})();
