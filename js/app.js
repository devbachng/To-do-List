document.addEventListener("DOMContentLoaded", () => {
  const columns = document.querySelectorAll(".kanban-board");

  document.querySelectorAll(".task-container").forEach((container) => {
    new Sortable(container, {
      group: "shared",
      animation: 150,
      onEnd: (evt) => {
        updateLocalStorage();
        const targetColumn = evt.to.closest(".kanban-board");
        if (
          targetColumn &&
          targetColumn.getAttribute("data-column") === "done"
        ) {
          triggerConfetti();
        }
      },
    });
  });

  columns.forEach((column) => {
    const columnName = column.getAttribute("data-column");
    const taskContainer = column.querySelector(".task-container");
    const tasks = JSON.parse(localStorage.getItem(columnName)) || [];

    tasks.forEach((task) => {
      const taskCard = createTaskCard(task);
      taskContainer.appendChild(taskCard);
    });

    const addButton = column.querySelector(".add-task-btn");
    if (addButton) {
      const inputField = column.querySelector(".task-input");

      addButton.addEventListener("click", () => {
        const title = inputField.value.trim();
        if (title === "") {
          alert("Vui lòng nhập tiêu đề nhiệm vụ!");
          return;
        }

        const task = {
          title,
          description: "",
          startDate: "",
          endDate: "",
          priority: "",
          subtasks: [],
        };
        const taskCard = createTaskCard(task);
        taskContainer.appendChild(taskCard);

        inputField.value = "";
        updateLocalStorage();
      });
    }
  });

  document.getElementById("searchInput").addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase();
    document.querySelectorAll(".card-task").forEach((card) => {
      const title =
        card.querySelector("strong")?.textContent?.toLowerCase() || "";
      const description =
        card.querySelector(".text-muted")?.textContent?.toLowerCase() || "";
      const dates =
        card.querySelector("small")?.textContent?.toLowerCase() || "";
      const priority = card.getAttribute("data-priority")?.toLowerCase() || "";

      const isVisible =
        title.includes(keyword) ||
        description.includes(keyword) ||
        dates.includes(keyword) ||
        priority.includes(keyword);

      card.style.display = isVisible ? "block" : "none";
    });
  });

  // Implement priority filter functionality
  document.getElementById("priorityFilter").addEventListener("change", (e) => {
    const selectedPriority = e.target.value;

    document.querySelectorAll(".card-task").forEach((card) => {
      if (selectedPriority === "all") {
        card.style.display = "block";
      } else {
        const cardPriority = card.getAttribute("data-priority");
        card.style.display =
          cardPriority === selectedPriority ? "block" : "none";
      }
    });
  });
});

function createTaskCard(task) {
  const card = document.createElement("div");
  card.className = `card-task ${getPriorityClass(task.priority)}`;
  card.setAttribute("data-priority", task.priority);
  card.setAttribute("data-start", task.startDate || "");
  card.setAttribute("data-end", task.endDate || "");
  card.setAttribute("data-subtasks", JSON.stringify(task.subtasks || []));

  card.innerHTML = `
    <div><strong>${task.title}</strong></div>
    <div class="text-muted">${task.description || ""}</div>
    <small class="text-secondary">Tạo: ${task.startDate || "-"} - ${
    task.endDate || "-"
  }</small>
    <div class="mt-2 d-flex justify-content-end gap-1">
      <button class="btn btn-sm btn-outline-danger delete-btn">Xóa</button>
    </div>
  `;

  if (task.subtasks && task.subtasks.length > 0) {
    const completed = task.subtasks.filter((sub) => sub.completed).length;
    const total = task.subtasks.length;

    const progressDiv = document.createElement("div");
    progressDiv.className = "progress my-2";
    progressDiv.innerHTML = `
      <div class="progress-bar bg-success" role="progressbar" 
           style="width: ${(completed / total) * 100}%" 
           aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="${total}">
        ${completed}/${total}
      </div>
    `;

    card.appendChild(progressDiv);
  }

  card.querySelector(".delete-btn").addEventListener("click", () => {
    card.remove();
    updateLocalStorage();
  });

  return card;
}

function getPriorityClass(label) {
  if (label === "Cao") return "high";
  if (label === "Trung bình") return "medium";
  if (label === "Thấp") return "low";
  return "";
}

function updateLocalStorage() {
  document.querySelectorAll(".kanban-board").forEach((column) => {
    const columnName = column.getAttribute("data-column");
    const taskCards = column.querySelectorAll(".card-task");

    const tasks = [...taskCards].map((card) => {
      const title = card.querySelector("strong")?.textContent || "";
      const description = card.querySelector(".text-muted")?.textContent || "";
      const startDate = card.getAttribute("data-start") || "";
      const endDate = card.getAttribute("data-end") || "";
      let priority = "";
      if (card.classList.contains("high")) priority = "Cao";
      if (card.classList.contains("medium")) priority = "Trung bình";
      if (card.classList.contains("low")) priority = "Thấp";

      const subtasks = JSON.parse(card.getAttribute("data-subtasks") || "[]");

      return { title, description, startDate, endDate, priority, subtasks };
    });

    localStorage.setItem(columnName, JSON.stringify(tasks));
  });
}

// Modal chỉnh sửa task

document.body.insertAdjacentHTML(
  "beforeend",
  `
<div class="modal fade" id="editTaskModal" tabindex="-1" aria-labelledby="editTaskLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="editTaskLabel">Chỉnh sửa nhiệm vụ</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label class="form-label">Tên nhiệm vụ</label>
          <input type="text" id="editTitle" class="form-control">
        </div>
        <div class="mb-3">
          <label class="form-label">Mô tả</label>
          <textarea id="editDescription" class="form-control" rows="3"></textarea>
        </div>
        <div class="row">
          <div class="col">
            <label class="form-label">Ngày bắt đầu</label>
            <input type="date" id="editStartDate" class="form-control">
          </div>
          <div class="col">
            <label class="form-label">Ngày kết thúc</label>
            <input type="date" id="editEndDate" class="form-control">
          </div>
        </div>
        <div class="mb-3 mt-3">
          <label class="form-label">Độ ưu tiên</label>
          <select id="editPriority" class="form-select">
            <option value="">-- Chọn --</option>
            <option value="Cao">Cao</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Thấp">Thấp</option>
          </select>
        </div>
        <div class="mb-3">
  <label class="form-label">Công việc con</label>
  <ul id="editSubtaskList" class="list-unstyled"></ul>
  <input type="text" id="newSubtaskInput" class="form-control mt-2" placeholder="Nhập công việc con và nhấn Enter">
  <div class="progress my-2">
    <div class="progress-bar bg-success" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="0"></div>
  </div>
</div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
        <button class="btn btn-primary" id="saveTaskChanges">Lưu thay đổi</button>
      </div>
    </div>
  </div>
</div>
`
);

let editingCard = null;
let currentTaskData = null;

document.addEventListener("click", function (e) {
  if (e.target.closest(".card-task") && !e.target.closest("button")) {
    const card = e.target.closest(".card-task");
    editingCard = card;

    const title = card.querySelector("strong")?.textContent || "";
    const description = card.querySelector(".text-muted")?.textContent || "";
    const priority = card.classList.contains("high")
      ? "Cao"
      : card.classList.contains("medium")
      ? "Trung bình"
      : card.classList.contains("low")
      ? "Thấp"
      : "";
    const startDate = card.getAttribute("data-start") || "";
    const endDate = card.getAttribute("data-end") || "";
    const subtasks = JSON.parse(card.getAttribute("data-subtasks") || "[]");

    currentTaskData = {
      title,
      description,
      priority,
      startDate,
      endDate,
      subtasks,
    };

    document.getElementById("editTitle").value = title;
    document.getElementById("editDescription").value = description;
    document.getElementById("editPriority").value = priority;
    document.getElementById("editStartDate").value = startDate;
    document.getElementById("editEndDate").value = endDate;

    const subtaskList = document.getElementById("editSubtaskList");
    subtaskList.innerHTML = "";
    subtasks.forEach((sub, index) => {
      const li = document.createElement("li");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = sub.completed;
      checkbox.className = "form-check-input me-1";
      checkbox.addEventListener("change", () => {
        sub.completed = checkbox.checked;
      });
      const span = document.createElement("span");
      span.textContent = sub.title;
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "X";
      deleteBtn.className = "btn btn-sm btn-danger ms-2";
      deleteBtn.addEventListener("click", () => {
        li.remove();
        currentTaskData.subtasks.splice(index, 1);
      });
      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      subtaskList.appendChild(li);
    });

    new bootstrap.Modal(document.getElementById("editTaskModal")).show();
  }
});

document.getElementById("newSubtaskInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter" && e.target.value.trim()) {
    const title = e.target.value.trim();
    currentTaskData.subtasks.push({ title, completed: false });
    e.target.value = "";

    const li = document.createElement("li");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "form-check-input me-1";
    const span = document.createElement("span");
    span.textContent = title;
    li.appendChild(checkbox);
    li.appendChild(span);
    document.getElementById("editSubtaskList").appendChild(li);
  }
});

document.getElementById("saveTaskChanges").addEventListener("click", () => {
  if (!editingCard || !currentTaskData) return;

  const title = document.getElementById("editTitle").value.trim();
  const description = document.getElementById("editDescription").value.trim();
  const priority = document.getElementById("editPriority").value;
  const startDate = document.getElementById("editStartDate").value;
  const endDate = document.getElementById("editEndDate").value;

  if (!title) {
    alert("Vui lòng nhập tiêu đề nhiệm vụ!");
    return;
  }

  currentTaskData.title = title;
  currentTaskData.description = description;
  currentTaskData.priority = priority;
  currentTaskData.startDate = startDate;
  currentTaskData.endDate = endDate;

  const subtaskList = document.getElementById("editSubtaskList").children;
  currentTaskData.subtasks = [...subtaskList].map((li, index) => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    const title = li.querySelector("span").textContent;
    return {
      title,
      completed: checkbox.checked,
    };
  });

  editingCard.querySelector("strong").textContent = title || "Không tiêu đề";
  editingCard.querySelector(".text-muted").textContent = description;

  const dateDisplay = editingCard.querySelector("small");
  if (dateDisplay) {
    dateDisplay.textContent = `Tạo: ${startDate || "-"} - ${endDate || "-"}`;
  }

  editingCard.classList.remove("high", "medium", "low");
  if (priority === "Cao") editingCard.classList.add("high");
  if (priority === "Trung bình") editingCard.classList.add("medium");
  if (priority === "Thấp") editingCard.classList.add("low");

  editingCard.setAttribute("data-priority", priority);
  editingCard.setAttribute("data-start", startDate);
  editingCard.setAttribute("data-end", endDate);
  editingCard.setAttribute(
    "data-subtasks",
    JSON.stringify(currentTaskData.subtasks)
  );

  const oldProgress = editingCard.querySelector(".progress");
  if (oldProgress) oldProgress.remove();

  if (currentTaskData.subtasks.length > 0) {
    const completed = currentTaskData.subtasks.filter(
      (sub) => sub.completed
    ).length;
    const total = currentTaskData.subtasks.length;

    const progressDiv = document.createElement("div");
    progressDiv.className = "progress my-2";
    progressDiv.innerHTML = `
      <div class="progress-bar bg-success" role="progressbar" 
           style="width: ${(completed / total) * 100}%" 
           aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="${total}">
        ${completed}/${total}
      </div>
    `;

    editingCard.appendChild(progressDiv);
  }

  editingCard.style.transition = "background-color 0.3s";
  editingCard.style.backgroundColor = "#e0ffe0";
  setTimeout(() => {
    editingCard.style.backgroundColor = "";
  }, 300);

  bootstrap.Modal.getInstance(document.getElementById("editTaskModal")).hide();
  updateLocalStorage();

  const toast = new bootstrap.Toast(document.getElementById('saveToast'));
  toast.show();
});

function triggerConfetti() {
  const canvas = document.createElement("canvas");
  canvas.id = "confettiCanvas";
  canvas.style.position = "fixed";
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = 9999;
  document.body.appendChild(canvas);

  const confetti = window.confetti.create(canvas, { resize: true });
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
  });

  setTimeout(() => {
    canvas.remove();
  }, 3000);
}

// Load Confetti script
(function () {
  const script = document.createElement("script");
  script.src =
    "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
  script.async = true;
  document.head.appendChild(script);
})();

function updateModalProgress() {
  const completed = currentTaskData.subtasks.filter(
    (sub) => sub.completed
  ).length;
  const total = currentTaskData.subtasks.length;
  const progressBar = document.querySelector("#editTaskModal .progress-bar");
  if (progressBar) {
    progressBar.style.width = `${(completed / total) * 100}%`;
    progressBar.textContent = `${completed}/${total}`;
  }
}
