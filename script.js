const toggleButton = document.querySelector('.mobile-menu-toggle');
const body = document.body;
const THEME_STORAGE_KEY = 'clientflow_theme';

const readThemePreference = () => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  const legacyTheme = localStorage.getItem('clientflow-theme');
  return legacyTheme === 'dark' || legacyTheme === 'light' ? legacyTheme : 'light';
};

const writeThemePreference = (theme) => {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

  try {
    localStorage.setItem('clientflow-theme', nextTheme);
  } catch (error) {
    // Ignore legacy key write failures to keep the app responsive.
  }
};

if (toggleButton) {
  toggleButton.addEventListener('click', () => {
    const isOpen = body.classList.toggle('sidebar-open');

    toggleButton.setAttribute('aria-expanded', String(isOpen));
  });
}

const suggestionButtons = document.querySelectorAll('.suggestion-chip');
const aiInput = document.querySelector('#clientflow-ai-input');

suggestionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (!aiInput) {
      return;
    }

    aiInput.value = button.textContent.trim();
    aiInput.focus();
  });
});

const themeToggle = document.querySelector('.theme-toggle');

const applyTheme = (theme) => {
  const isDarkMode = theme === 'dark';
  body.classList.toggle('dark-mode', isDarkMode);

  if (themeToggle) {
    themeToggle.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggle.setAttribute('aria-pressed', String(isDarkMode));
  }
};

const savedTheme = readThemePreference();
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    writeThemePreference(nextTheme);
    applyTheme(nextTheme);
  });
}

const clientSeedData = [
  { id: 1, name: 'Sarah Johnson', company: 'Nova Studio', project: 'Website Redesign', status: 'Active', revenue: 2400, email: 'sarah@novastudio.com', lastActivity: 'Today', activityOrder: 0 },
  { id: 2, name: 'Michael Chen', company: 'TechFlow', project: 'AI Dashboard', status: 'Active', revenue: 3200, email: 'michael@techflow.com', lastActivity: 'Today', activityOrder: 1 },
  { id: 3, name: 'Emma Williams', company: 'Bright Media', project: 'Landing Page', status: 'Pending', revenue: 1800, email: 'emma@brightmedia.com', lastActivity: 'Yesterday', activityOrder: 2 },
  { id: 4, name: 'David Miller', company: 'Orbit Labs', project: 'E-commerce UI', status: 'Active', revenue: 2750, email: 'david@orbitlabs.com', lastActivity: '2 days ago', activityOrder: 3 },
  { id: 5, name: 'Sophia Davis', company: 'Pixel House', project: 'Mobile App UI', status: 'Completed', revenue: 4100, email: 'sophia@pixelhouse.com', lastActivity: '3 days ago', activityOrder: 4 },
  { id: 6, name: 'James Wilson', company: 'GrowthHub', project: 'SaaS Website', status: 'Active', revenue: 2950, email: 'james@growthhub.com', lastActivity: '4 days ago', activityOrder: 5 },
  { id: 7, name: 'Olivia Brown', company: 'Creative Labs', project: 'Brand Website', status: 'Pending', revenue: 1600, email: 'olivia@creativelabs.com', lastActivity: '5 days ago', activityOrder: 6 },
  { id: 8, name: 'Daniel Taylor', company: 'NextWave', project: 'Dashboard UI', status: 'Active', revenue: 3500, email: 'daniel@nextwave.com', lastActivity: '1 week ago', activityOrder: 7 }
];

const loadStoredData = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      return fallback;
    }

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
};

const persistClientRows = () => {
  localStorage.setItem('clientflow_clients', JSON.stringify(clientRows));
};

let clientRows = loadStoredData('clientflow_clients', [...clientSeedData]);
let newestFirst = true;
let activeActionMenu = null;

const clientTableBody = document.querySelector('#clients-table-body');
const clientSearchInput = document.querySelector('#client-search-input');
const clientStatusFilter = document.querySelector('#client-status-filter');
const clientSortButton = document.querySelector('#client-sort-button');
const clientEmptyState = document.querySelector('#clients-empty-state');
const addClientTrigger = document.querySelector('.add-client-trigger');
const clientModalBackdrop = document.querySelector('#client-modal-backdrop');
const clientForm = document.querySelector('#client-form');
const modalCloseButtons = document.querySelectorAll('[data-close-modal], .modal-close');

const getInitials = (fullName) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

const updateClientSummary = () => {
  const total = clientRows.length;
  const active = clientRows.filter((client) => client.status === 'Active').length;
  const pending = clientRows.filter((client) => client.status === 'Pending').length;

  const totalEl = document.querySelector('[data-summary="total"]');
  const activeEl = document.querySelector('[data-summary="active"]');
  const pendingEl = document.querySelector('[data-summary="pending"]');

  if (totalEl) totalEl.textContent = total;
  if (activeEl) activeEl.textContent = active;
  if (pendingEl) pendingEl.textContent = pending;
  persistClientRows();
};

const sortClients = (list) => {
  const sorted = [...list];
  sorted.sort((a, b) => {
    if (newestFirst) {
      return b.activityOrder - a.activityOrder;
    }
    return a.activityOrder - b.activityOrder;
  });
  return sorted;
};

const getFilteredClients = () => {
  const query = (clientSearchInput?.value || '').trim().toLowerCase();
  const status = clientStatusFilter?.value || 'All Status';

  return sortClients(
    clientRows.filter((client) => {
      const matchesStatus = status === 'All Status' || client.status === status;
      const haystack = `${client.name} ${client.company} ${client.project}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesStatus && matchesQuery;
    })
  );
};

const closeActionMenus = () => {
  document.querySelectorAll('.client-menu').forEach((menu) => {
    menu.classList.remove('is-open');
  });
  activeActionMenu = null;
};

const renderClients = () => {
  const filteredClients = getFilteredClients();

  if (!clientTableBody) {
    return;
  }

  if (!filteredClients.length) {
    clientTableBody.innerHTML = '';
    if (clientEmptyState) {
      clientEmptyState.hidden = false;
    }
    return;
  }

  if (clientEmptyState) {
    clientEmptyState.hidden = true;
  }

  clientTableBody.innerHTML = filteredClients
    .map(
      (client) => `
        <tr data-client-id="${client.id}">
          <td>
            <div class="client-name-cell">
              <div class="client-avatar" aria-hidden="true">${getInitials(client.name)}</div>
              <div class="client-identity">
                <strong>${client.name}</strong>
              </div>
            </div>
          </td>
          <td class="company-name">${client.company}</td>
          <td class="project-name">${client.project}</td>
          <td><span class="status-badge ${client.status.toLowerCase()}">${client.status}</span></td>
          <td class="client-revenue">$${Number(client.revenue).toLocaleString()}</td>
          <td class="last-activity">${client.lastActivity}</td>
          <td class="client-actions">
            <button class="client-action-button" type="button" aria-label="Open actions for ${client.name}">⋮</button>
            <div class="client-menu" role="menu" aria-label="Client actions menu">
              <button type="button" data-action="view">View Client</button>
              <button type="button" data-action="edit">Edit</button>
              <button type="button" data-action="delete">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
};

if (clientTableBody) {
  clientTableBody.addEventListener('click', (event) => {
    const actionButton = event.target.closest('.client-action-button');
    if (actionButton) {
      event.stopPropagation();
      const row = actionButton.closest('tr');
      const menu = row?.querySelector('.client-menu');
      if (!menu) {
        return;
      }

      const shouldOpen = activeActionMenu !== menu;
      closeActionMenus();
      if (shouldOpen) {
        menu.classList.add('is-open');
        activeActionMenu = menu;
      }
      return;
    }

    const menuActionButton = event.target.closest('.client-menu button');
    if (!menuActionButton) {
      return;
    }

    const row = menuActionButton.closest('tr');
    const clientId = Number(row?.dataset.clientId || 0);
    const action = menuActionButton.dataset.action;

    if (!clientId) {
      return;
    }

    const client = clientRows.find((item) => item.id === clientId);
    if (!client) {
      return;
    }

    if (action === 'delete') {
      const confirmed = window.confirm(`Delete ${client.name} from the client list?`);
      if (!confirmed) {
        closeActionMenus();
        return;
      }

      clientRows = clientRows.filter((item) => item.id !== clientId);
      updateClientSummary();
      renderClients();
    }

    if (action === 'view') {
      window.alert(`${client.name} • ${client.company} • ${client.project}`);
    }

    if (action === 'edit') {
      openClientModal(client);
    }

    closeActionMenus();
  });
}

const openClientModal = (client = null) => {
  if (!clientModalBackdrop) {
    return;
  }

  const title = clientModalBackdrop.querySelector('#client-modal-title');
  const form = clientModalBackdrop.querySelector('#client-form');
  const submitButton = form?.querySelector('button[type="submit"]');

  if (title) {
    title.textContent = client ? 'Edit Client' : 'Add New Client';
  }

  if (submitButton) {
    submitButton.textContent = client ? 'Save Client' : 'Create Client';
  }

  if (form) {
    const fields = form.elements;
    if (client) {
      fields.name.value = client.name;
      fields.company.value = client.company;
      fields.email.value = client.email || '';
      fields.project.value = client.project;
      fields.status.value = client.status;
      fields.revenue.value = client.revenue;
      form.dataset.editingId = String(client.id);
    } else {
      form.reset();
      fields.status.value = 'Active';
      delete form.dataset.editingId;
    }
  }

  clientModalBackdrop.hidden = false;
};

const closeClientModal = () => {
  if (!clientModalBackdrop) {
    return;
  }
  clientModalBackdrop.hidden = true;
  if (clientForm) {
    clientForm.reset();
    delete clientForm.dataset.editingId;
  }
};

if (clientSearchInput) {
  clientSearchInput.addEventListener('input', renderClients);
}

if (clientStatusFilter) {
  clientStatusFilter.addEventListener('change', renderClients);
}

if (clientSortButton) {
  clientSortButton.addEventListener('click', () => {
    newestFirst = !newestFirst;
    clientSortButton.textContent = newestFirst ? 'Newest First' : 'Oldest First';
    renderClients();
  });
}

if (addClientTrigger) {
  addClientTrigger.addEventListener('click', () => openClientModal());
}

if (clientForm) {
  clientForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const company = String(formData.get('company') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const project = String(formData.get('project') || '').trim();
    const status = String(formData.get('status') || 'Active');
    const revenue = Number(formData.get('revenue') || 0);

    if (!name || !company || !email || !project || !revenue) {
      return;
    }

    const editingId = form.dataset.editingId ? Number(form.dataset.editingId) : null;

    if (editingId) {
      clientRows = clientRows.map((client) =>
        client.id === editingId
          ? {
              ...client,
              name,
              company,
              email,
              project,
              status,
              revenue,
              lastActivity: 'Just now',
              activityOrder: client.activityOrder || 0
            }
          : client
      );
    } else {
      clientRows.push({
        id: Date.now(),
        name,
        company,
        email,
        project,
        status,
        revenue,
        lastActivity: 'Just now',
        activityOrder: clientRows.length
      });
    }

    updateClientSummary();
    renderClients();
    closeClientModal();
  });
}

if (clientModalBackdrop) {
  clientModalBackdrop.addEventListener('click', (event) => {
    if (event.target === clientModalBackdrop) {
      closeClientModal();
    }
  });
}

modalCloseButtons.forEach((button) => {
  button.addEventListener('click', () => closeClientModal());
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.client-action-button') && !event.target.closest('.client-menu')) {
    closeActionMenus();
  }
});

updateClientSummary();
renderClients();

const taskSeedData = [
  { id: 1, task: 'Finalize homepage design', project: 'Website Redesign', priority: 'High', status: 'In Progress', deadline: '2026-09-24', deadlineLabel: 'Today' },
  { id: 2, task: 'Send project proposal', project: 'AI Dashboard', priority: 'Medium', status: 'To Do', deadline: '2026-09-25', deadlineLabel: 'Tomorrow' },
  { id: 3, task: 'Review client feedback', project: 'Mobile App UI', priority: 'High', status: 'In Progress', deadline: '2026-09-24', deadlineLabel: 'Sep 24' },
  { id: 4, task: 'Update landing page', project: 'SaaS Landing Page', priority: 'Low', status: 'To Do', deadline: '2026-09-26', deadlineLabel: 'Sep 26' },
  { id: 5, task: 'Complete dashboard UI', project: 'Analytics Platform', priority: 'High', status: 'Completed', deadline: '2026-09-22', deadlineLabel: 'Sep 22' },
  { id: 6, task: 'Fix mobile responsive issues', project: 'E-commerce Dashboard', priority: 'Medium', status: 'In Progress', deadline: '2026-09-28', deadlineLabel: 'Sep 28' },
  { id: 7, task: 'Prepare final presentation', project: 'Brand Website', priority: 'Low', status: 'To Do', deadline: '2026-10-01', deadlineLabel: 'Oct 1' },
  { id: 8, task: 'Test AI landing page', project: 'AI Landing Page', priority: 'High', status: 'Completed', deadline: '2026-09-23', deadlineLabel: 'Sep 23' }
];

const taskSearchInput = document.querySelector('#tasks-search-input');
const taskStatusFilter = document.querySelector('#task-status-filter');
const taskPriorityFilter = document.querySelector('#task-priority-filter');
const taskList = document.querySelector('#tasks-list');
const taskEmptyState = document.querySelector('#tasks-empty-state');
const addTaskTrigger = document.querySelector('.add-task-trigger');
const taskModalBackdrop = document.querySelector('#task-modal-backdrop');
const taskDetailsBackdrop = document.querySelector('#task-details-backdrop');
const taskForm = document.querySelector('#task-form');
const taskModalTitle = document.querySelector('#task-modal-title');
const taskModalCloseButton = document.querySelector('.task-modal-close');
const taskCancelButton = document.querySelector('.task-cancel-button');
const taskDetailsCloseButton = document.querySelector('.task-details-close');
const taskDetailsContent = document.querySelector('#task-details-content');

let taskRows = loadStoredData('clientflow_tasks', [...taskSeedData]);

const persistTasks = () => {
  localStorage.setItem('clientflow_tasks', JSON.stringify(taskRows));
};

const getTaskDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTaskDeadline = (value) => {
  if (!value) {
    return 'No deadline';
  }

  const date = getTaskDateValue(value);
  if (!date) {
    return value;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const statusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');

const updateTaskSummary = () => {
  const total = taskRows.length;
  const completed = taskRows.filter((task) => task.status === 'Completed').length;
  const inProgress = taskRows.filter((task) => task.status === 'In Progress').length;
  const overdue = taskRows.filter((task) => {
    if (task.status === 'Completed') {
      return false;
    }

    const deadlineDate = getTaskDateValue(task.deadline);
    if (!deadlineDate) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate.getTime() < today.getTime();
  }).length;

  const summaryEls = {
    total: document.querySelector('[data-task-summary="total"]'),
    completed: document.querySelector('[data-task-summary="completed"]'),
    'in-progress': document.querySelector('[data-task-summary="in-progress"]'),
    overdue: document.querySelector('[data-task-summary="overdue"]')
  };

  if (summaryEls.total) summaryEls.total.textContent = total;
  if (summaryEls.completed) summaryEls.completed.textContent = completed;
  if (summaryEls['in-progress']) summaryEls['in-progress'].textContent = inProgress;
  if (summaryEls.overdue) summaryEls.overdue.textContent = overdue;

  persistTasks();
};

const getFilteredTasks = () => {
  const query = (taskSearchInput?.value || '').trim().toLowerCase();
  const status = taskStatusFilter?.value || 'All Status';
  const priority = taskPriorityFilter?.value || 'All Priority';

  return [...taskRows].filter((task) => {
    const matchesQuery = !query || `${task.task} ${task.project}`.toLowerCase().includes(query);
    const matchesStatus = status === 'All Status' || task.status === status;
    const matchesPriority = priority === 'All Priority' || task.priority === priority;
    return matchesQuery && matchesStatus && matchesPriority;
  }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
};

const closeTaskMenus = () => {
  document.querySelectorAll('.task-action-menu').forEach((menu) => menu.classList.remove('is-open'));
};

const openTaskDetails = (task) => {
  if (!taskDetailsBackdrop || !taskDetailsContent) {
    return;
  }

  taskDetailsContent.innerHTML = `
    <div class="task-detail-item">
      <span>Task</span>
      <strong>${task.task}</strong>
    </div>
    <div class="task-detail-item">
      <span>Project</span>
      <strong>${task.project}</strong>
    </div>
    <div class="task-detail-item">
      <span>Priority</span>
      <strong>${task.priority}</strong>
    </div>
    <div class="task-detail-item">
      <span>Status</span>
      <strong>${task.status}</strong>
    </div>
    <div class="task-detail-item">
      <span>Deadline</span>
      <strong>${task.deadlineLabel || formatTaskDeadline(task.deadline)}</strong>
    </div>
    <div class="task-detail-item">
      <span>Due Date</span>
      <strong>${task.deadline || 'Not set'}</strong>
    </div>
  `;

  taskDetailsBackdrop.hidden = false;
};

const closeTaskDetails = () => {
  if (taskDetailsBackdrop) {
    taskDetailsBackdrop.hidden = true;
  }
};

const renderTasks = () => {
  const filteredTasks = getFilteredTasks();

  if (!taskList) {
    return;
  }

  if (!filteredTasks.length) {
    taskList.innerHTML = '';
    if (taskEmptyState) {
      taskEmptyState.hidden = false;
    }
    return;
  }

  if (taskEmptyState) {
    taskEmptyState.hidden = true;
  }

  taskList.innerHTML = filteredTasks.map((task) => `
    <article class="task-card ${task.status === 'Completed' ? 'is-complete' : ''}" data-task-id="${task.id}">
      <label class="task-check-wrap">
        <input type="checkbox" class="task-complete-toggle" ${task.status === 'Completed' ? 'checked' : ''} aria-label="Mark ${task.task} complete" />
      </label>

      <div class="task-card-main">
        <div class="task-card-header">
          <div class="task-copy-block">
            <h3>${task.task}</h3>
            <p>${task.project}</p>
          </div>

          <div class="task-menu-wrap">
            <button class="task-menu-button" type="button" aria-label="Open actions for ${task.task}">⋮</button>
            <div class="task-action-menu" role="menu" aria-label="Task actions menu">
              <button type="button" data-task-action="view">View Task</button>
              <button type="button" data-task-action="edit">Edit Task</button>
              <button type="button" data-task-action="delete">Delete Task</button>
            </div>
          </div>
        </div>

        <div class="task-meta-row">
          <span class="status-badge ${statusClass(task.status)}">${task.status}</span>
          <span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
          <span class="task-deadline">Due ${task.deadlineLabel || formatTaskDeadline(task.deadline)}</span>
        </div>
      </div>
    </article>
  `).join('');
};

if (taskList) {
  taskList.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.task-complete-toggle');
    if (!checkbox) {
      return;
    }

    const card = checkbox.closest('.task-card');
    const taskId = Number(card?.dataset.taskId || 0);
    const task = taskRows.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    task.status = checkbox.checked ? 'Completed' : 'In Progress';
    task.deadlineLabel = formatTaskDeadline(task.deadline);
    updateTaskSummary();
    renderTasks();
  });

  taskList.addEventListener('click', (event) => {
    const menuButton = event.target.closest('.task-menu-button');
    if (menuButton) {
      event.stopPropagation();
      const menu = menuButton.nextElementSibling;
      if (!menu) {
        return;
      }

      const shouldOpen = !menu.classList.contains('is-open');
      closeTaskMenus();
      if (shouldOpen) {
        menu.classList.add('is-open');
      }
      return;
    }

    const taskActionButton = event.target.closest('.task-action-menu button');
    if (!taskActionButton) {
      return;
    }

    const card = taskActionButton.closest('.task-card');
    const taskId = Number(card?.dataset.taskId || 0);
    const action = taskActionButton.dataset.taskAction;
    const task = taskRows.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    if (action === 'view') {
      openTaskDetails(task);
    }

    if (action === 'edit') {
      openTaskModal(task);
    }

    if (action === 'delete') {
      const confirmed = window.confirm(`Delete the task "${task.task}"?`);
      if (!confirmed) {
        closeTaskMenus();
        return;
      }
      taskRows = taskRows.filter((item) => item.id !== taskId);
      updateTaskSummary();
      renderTasks();
    }

    closeTaskMenus();
  });
}

const closeTaskModal = () => {
  if (taskModalBackdrop) {
    taskModalBackdrop.hidden = true;
  }

  if (taskForm) {
    taskForm.reset();
    delete taskForm.dataset.editingId;
  }
};

const openTaskModal = (task = null) => {
  if (!taskModalBackdrop || !taskForm) {
    return;
  }

  if (taskModalTitle) {
    taskModalTitle.textContent = task ? 'Edit Task' : 'Add New Task';
  }

  const submitButton = taskForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = task ? 'Save Task' : 'Create Task';
  }

  if (task) {
    taskForm.elements.taskName.value = task.task;
    taskForm.elements.project.value = task.project;
    taskForm.elements.priority.value = task.priority;
    taskForm.elements.status.value = task.status;
    taskForm.elements.deadline.value = task.deadline;
    taskForm.dataset.editingId = String(task.id);
  } else {
    taskForm.reset();
    taskForm.elements.priority.value = 'Medium';
    taskForm.elements.status.value = 'To Do';
    delete taskForm.dataset.editingId;
  }

  taskModalBackdrop.hidden = false;
};

if (taskSearchInput) {
  taskSearchInput.addEventListener('input', renderTasks);
}

if (taskStatusFilter) {
  taskStatusFilter.addEventListener('change', renderTasks);
}

if (taskPriorityFilter) {
  taskPriorityFilter.addEventListener('change', renderTasks);
}

if (addTaskTrigger) {
  addTaskTrigger.addEventListener('click', () => openTaskModal());
}

if (taskModalCloseButton) {
  taskModalCloseButton.addEventListener('click', closeTaskModal);
}

if (taskCancelButton) {
  taskCancelButton.addEventListener('click', closeTaskModal);
}

if (taskDetailsCloseButton) {
  taskDetailsCloseButton.addEventListener('click', closeTaskDetails);
}

if (taskModalBackdrop) {
  taskModalBackdrop.addEventListener('click', (event) => {
    if (event.target === taskModalBackdrop) {
      closeTaskModal();
    }
  });
}

if (taskDetailsBackdrop) {
  taskDetailsBackdrop.addEventListener('click', (event) => {
    if (event.target === taskDetailsBackdrop) {
      closeTaskDetails();
    }
  });
}

if (taskForm) {
  taskForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(taskForm);
    const taskName = String(formData.get('taskName') || '').trim();
    const project = String(formData.get('project') || '').trim();
    const priority = String(formData.get('priority') || 'Medium');
    const status = String(formData.get('status') || 'To Do');
    const deadline = String(formData.get('deadline') || '').trim();

    if (!taskName || !project || !deadline) {
      return;
    }

    const editingId = taskForm.dataset.editingId ? Number(taskForm.dataset.editingId) : null;
    const deadlineLabel = formatTaskDeadline(deadline);

    if (editingId) {
      taskRows = taskRows.map((task) =>
        task.id === editingId
          ? {
              ...task,
              task: taskName,
              project,
              priority,
              status,
              deadline,
              deadlineLabel
            }
          : task
      );
    } else {
      taskRows.unshift({
        id: Date.now(),
        task: taskName,
        project,
        priority,
        status,
        deadline,
        deadlineLabel
      });
    }

    updateTaskSummary();
    renderTasks();
    closeTaskModal();
  });
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('.task-menu-button') && !event.target.closest('.task-action-menu')) {
    closeTaskMenus();
  }
});

updateTaskSummary();
renderTasks();

const searchInput = document.querySelector('.search input');
const searchContainer = document.querySelector('.search');
const searchSamples = [
  { name: 'Sarah Johnson', type: 'Client' },
  { name: 'Michael Chen', type: 'Client' },
  { name: 'Website Redesign', type: 'Project' },
  { name: 'AI Landing Page', type: 'Project' },
  { name: 'Finalize homepage design', type: 'Task' },
  { name: 'Review dashboard UI', type: 'Task' }
];

if (searchContainer && searchInput) {
  const searchDropdown = document.createElement('div');
  searchDropdown.className = 'search-dropdown';
  searchDropdown.setAttribute('role', 'listbox');
  searchContainer.appendChild(searchDropdown);

  const renderSearchResults = (query = '') => {
    const term = query.trim().toLowerCase();
    const matches = !term
      ? searchSamples
      : searchSamples.filter((item) => {
          const haystack = `${item.name} ${item.type}`.toLowerCase();
          return haystack.includes(term);
        });

    if (!matches.length) {
      searchDropdown.innerHTML = '<div class="search-empty">No results found</div>';
      searchDropdown.classList.add('is-open');
      return;
    }

    searchDropdown.innerHTML = matches
      .map(
        (item) => `
          <button type="button" class="search-result" data-name="${item.name}">
            <span class="search-result-name">${item.name}</span>
            <span class="search-result-type">${item.type}</span>
          </button>
        `
      )
      .join('');

    searchDropdown.classList.add('is-open');

    const resultButtons = searchDropdown.querySelectorAll('.search-result');
    resultButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const selected = button.dataset.name || button.textContent.trim();
        searchInput.value = selected;
        searchDropdown.classList.remove('is-open');
      });
    });
  };

  const closeSearchDropdown = () => {
    searchDropdown.classList.remove('is-open');
  };

  searchInput.addEventListener('focus', () => {
    renderSearchResults(searchInput.value);
  });

  searchInput.addEventListener('input', () => {
    renderSearchResults(searchInput.value);
  });

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSearchDropdown();
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (!searchContainer.contains(event.target)) {
      closeSearchDropdown();
    }
  });
}

const notificationButton = document.querySelector('.icon-button[aria-label="Notifications"]');
const notificationBadge = document.querySelector('.badge');

const notificationItems = [
  {
    title: 'New client added',
    description: 'Sarah Johnson was added as a new client',
    time: '10 minutes ago',
    iconClass: 'notification-icon--teal',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.67 0-8 1.34-8 4v1h10.5A5.5 5.5 0 0 1 8 14Zm8 0c2.12 0 4.5.76 6 2.1V18h-6.5A5.5 5.5 0 0 1 16 14Zm3-8a3 3 0 1 0-3 3 3 3 0 0 0 3-3Z"/></svg>'
  },
  {
    title: 'Project updated',
    description: 'Website Redesign reached 75% completion',
    time: '35 minutes ago',
    iconClass: 'notification-icon--mint',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 4h10v2H7V8Zm0 4h8v2H7v-2Zm0 4h5v2H7v-2Z"/></svg>'
  },
  {
    title: 'New message',
    description: 'Michael Chen sent you a new message',
    time: '1 hour ago',
    iconClass: 'notification-icon--amber',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9.5l-3.5 3v-3H8a3 3 0 0 1-3-3V5Zm3 3h8v2H8V8Zm0 4h6v2H8v-2Z"/></svg>'
  }
];

if (notificationButton) {
  const notificationPanel = document.createElement('div');
  notificationPanel.className = 'notification-panel';
  notificationPanel.setAttribute('role', 'dialog');
  notificationPanel.setAttribute('aria-label', 'Notifications');
  notificationPanel.innerHTML = `
    <div class="notification-panel-header">
      <h3>Notifications</h3>
      <button type="button" class="mark-read-button">Mark all as read</button>
    </div>
    <div class="notification-list">
      ${notificationItems
        .map(
          (item) => `
            <div class="notification-item">
              <div class="notification-icon ${item.iconClass}" aria-hidden="true">${item.icon}</div>
              <div class="notification-copy">
                <strong>${item.title}</strong>
                <p>${item.description}</p>
                <span class="notification-time">${item.time}</span>
              </div>
            </div>
          `
        )
        .join('')}
    </div>
  `;
  document.body.appendChild(notificationPanel);

  const closeNotificationPanel = () => {
    notificationPanel.classList.remove('is-open');
    notificationButton.setAttribute('aria-expanded', 'false');
  };

  const positionNotificationPanel = () => {
    const buttonRect = notificationButton.getBoundingClientRect();
    const panelWidth = notificationPanel.offsetWidth || 320;
    notificationPanel.style.left = `${Math.min(buttonRect.left + buttonRect.width - panelWidth, window.innerWidth - panelWidth - 12)}px`;
    notificationPanel.style.top = `${buttonRect.bottom + 12}px`;
  };

  notificationButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const shouldOpen = !notificationPanel.classList.contains('is-open');
    notificationPanel.classList.toggle('is-open', shouldOpen);
    notificationButton.setAttribute('aria-expanded', String(shouldOpen));

    if (shouldOpen) {
      positionNotificationPanel();
    }
  });

  const markReadButton = notificationPanel.querySelector('.mark-read-button');
  markReadButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (notificationBadge) {
      notificationBadge.textContent = '0';
      notificationBadge.style.display = 'none';
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (!notificationButton.contains(event.target) && !notificationPanel.contains(event.target)) {
      closeNotificationPanel();
    }
  });

  window.addEventListener('resize', () => {
    if (notificationPanel.classList.contains('is-open')) {
      positionNotificationPanel();
    }
  });
}

const quickActionCards = document.querySelectorAll('.quick-action-card');

const showQuickActionToast = (message = 'Feature coming soon') => {
  let toast = document.querySelector('.quick-action-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'quick-action-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('visible');

  window.clearTimeout(showQuickActionToast.timeoutId);
  showQuickActionToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove('visible');
  }, 1800);
};

quickActionCards.forEach((card) => {
  card.addEventListener('click', () => {
    showQuickActionToast('Feature coming soon');
  });
});

const addNewButton = document.querySelector('.add-button');
const addNewMenu = document.querySelector('#add-new-menu');
const addNewMenuItems = document.querySelectorAll('.add-new-menu-item');

const closeAddNewMenu = () => {
  if (!addNewMenu) {
    return;
  }

  addNewMenu.hidden = true;
  addNewButton?.setAttribute('aria-expanded', 'false');
};

if (addNewButton && addNewMenu) {
  addNewButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = addNewMenu.hidden;
    addNewMenu.hidden = !willOpen;
    addNewButton.setAttribute('aria-expanded', String(willOpen));
  });

  addNewMenuItems.forEach((menuItem) => {
    menuItem.addEventListener('click', (event) => {
      event.stopPropagation();
      const targetPage = menuItem.dataset.addNewTarget;
      if (!targetPage) {
        closeAddNewMenu();
        return;
      }

      if (typeof showPage === 'function') {
        showPage(targetPage);
      }
      closeAddNewMenu();
    });
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!target || (!addNewButton.contains(target) && !addNewMenu.contains(target))) {
      closeAddNewMenu();
    }
  });
}

const activityItems = document.querySelectorAll('.activity-item');

activityItems.forEach((item) => {
  item.addEventListener('mouseenter', () => {
    item.classList.add('is-hovered');
  });

  item.addEventListener('mouseleave', () => {
    item.classList.remove('is-hovered');
  });

  item.addEventListener('focusin', () => {
    item.classList.add('is-hovered');
  });

  item.addEventListener('focusout', () => {
    item.classList.remove('is-hovered');
  });
});

const calendarStorageKey = 'clientflow_calendar_events';
const calendarSampleEvents = [
  { id: 1, title: 'Client Meeting', type: 'Meeting', date: '2026-09-28', time: '10:00', related: 'Sarah Johnson', notes: 'Discuss homepage direction and approval timeline.' },
  { id: 2, title: 'Project Deadline', type: 'Deadline', date: '2026-09-30', time: '17:00', related: 'Website Redesign', notes: 'Final assets due to client for review.' },
  { id: 3, title: 'Design Review', type: 'Meeting', date: '2026-10-02', time: '14:00', related: 'Michael Chen', notes: 'Review dashboard UI and motion prototype.' },
  { id: 4, title: 'Project Delivery', type: 'Deadline', date: '2026-10-08', time: '16:00', related: 'E-commerce Dashboard', notes: 'Deliver final beta build and stakeholder summary.' },
  { id: 5, title: 'Team Meeting', type: 'Meeting', date: '2026-10-10', time: '11:00', related: 'Analytics Platform', notes: 'Sprint check-in and launch review.' }
];

let calendarEvents = loadStoredData(calendarStorageKey, [...calendarSampleEvents]);
const calendarState = {
  currentDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  view: 'month'
};

const calendarCurrentMonth = document.querySelector('#calendar-current-month');
const calendarMonthView = document.querySelector('#calendar-month-view');
const calendarWeekView = document.querySelector('#calendar-week-view');
const calendarListView = document.querySelector('#calendar-list-view');
const calendarMonthGrid = document.querySelector('#calendar-month-grid');
const calendarWeekGrid = document.querySelector('#calendar-week-grid');
const calendarListItems = document.querySelector('#calendar-list-items');
const calendarEventModalBackdrop = document.querySelector('#calendar-event-modal-backdrop');
const calendarDetailsBackdrop = document.querySelector('#calendar-event-details-backdrop');
const calendarForm = document.querySelector('#calendar-event-form');
const calendarEventModalTitle = document.querySelector('#calendar-event-modal-title');
const calendarEventSubmit = document.querySelector('#calendar-event-submit');
const calendarEventDetailsContent = document.querySelector('#calendar-event-details-content');

const formatDateKey = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const parseDateKey = (dateKey) => new Date(`${dateKey}T12:00:00`);

const formatMonthLabel = (date) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

const getStartOfWeek = (date) => {
  const result = new Date(date);
  const startOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - startOffset);
  result.setHours(0, 0, 0, 0);
  return result;
};

const updateCalendarStorage = () => {
  localStorage.setItem(calendarStorageKey, JSON.stringify(calendarEvents));
};

const openCalendarModal = (eventItem = null) => {
  if (!calendarEventModalBackdrop || !calendarForm) {
    return;
  }

  calendarForm.reset();
  delete calendarForm.dataset.editingId;
  const selectedDate = formatDateKey(calendarState.currentDate);

  if (eventItem) {
    calendarEventModalTitle.textContent = 'Edit Event';
    calendarEventSubmit.textContent = 'Save Changes';
    calendarForm.dataset.editingId = String(eventItem.id);
    calendarForm.elements.title.value = eventItem.title;
    calendarForm.elements.type.value = eventItem.type;
    calendarForm.elements.date.value = eventItem.date;
    calendarForm.elements.time.value = eventItem.time;
    calendarForm.elements.related.value = eventItem.related;
    calendarForm.elements.notes.value = eventItem.notes || '';
  } else {
    calendarEventModalTitle.textContent = 'Add Event';
    calendarEventSubmit.textContent = 'Create Event';
    calendarForm.elements.date.value = selectedDate;
    calendarForm.elements.type.value = 'Meeting';
  }

  calendarEventModalBackdrop.hidden = false;
};

const closeCalendarModal = () => {
  if (!calendarEventModalBackdrop || !calendarForm) {
    return;
  }

  calendarEventModalBackdrop.hidden = true;
  calendarForm.reset();
  delete calendarForm.dataset.editingId;
  calendarEventModalTitle.textContent = 'Add Event';
  calendarEventSubmit.textContent = 'Create Event';
};

const closeCalendarDetails = () => {
  if (calendarDetailsBackdrop) {
    calendarDetailsBackdrop.hidden = true;
  }
};

const openCalendarEventDetails = (eventId) => {
  if (!calendarDetailsBackdrop || !calendarEventDetailsContent) {
    return;
  }

  const eventItem = calendarEvents.find((item) => item.id === Number(eventId));
  if (!eventItem) {
    return;
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parseDateKey(eventItem.date));
  const notesText = eventItem.notes ? eventItem.notes : 'No notes provided.';

  calendarEventDetailsContent.innerHTML = `
    <div class="calendar-detail-section">
      <div class="calendar-detail-row"><span>Event</span><strong>${eventItem.title}</strong></div>
      <div class="calendar-detail-row"><span>Type</span><strong>${eventItem.type}</strong></div>
      <div class="calendar-detail-row"><span>Date</span><strong>${formattedDate}</strong></div>
      <div class="calendar-detail-row"><span>Time</span><strong>${eventItem.time}</strong></div>
      <div class="calendar-detail-row"><span>Client / Project</span><strong>${eventItem.related}</strong></div>
      <div class="calendar-detail-row"><span>Notes</span><strong>${notesText}</strong></div>
    </div>
    <div class="calendar-detail-actions">
      <button type="button" class="secondary-button" data-calendar-action="edit" data-event-id="${eventItem.id}">Edit</button>
      <button type="button" class="primary-button" data-calendar-action="delete" data-event-id="${eventItem.id}">Delete</button>
    </div>
  `;

  calendarDetailsBackdrop.hidden = false;
};

const renderCalendarMonth = () => {
  if (!calendarMonthGrid) {
    return;
  }

  const monthDate = new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth(), 1);
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthOffset = (monthStart.getDay() + 6) % 7;
  const currentMonthStart = new Date(monthStart);
  currentMonthStart.setDate(monthStart.getDate() - monthOffset);
  const todayKey = formatDateKey(new Date());

  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(currentMonthStart);
    date.setDate(currentMonthStart.getDate() + index);
    const dateKey = formatDateKey(date);
    const isCurrentMonth = date.getMonth() === monthDate.getMonth();
    const isToday = dateKey === todayKey;
    const items = calendarEvents
      .filter((event) => event.date === dateKey)
      .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

    const eventMarkup = items.length
      ? items
          .map(
            (item) => `
              <button type="button" class="calendar-event-pill ${item.type.toLowerCase()}" data-event-id="${item.id}" title="${item.title}">
                ${item.title}
              </button>
            `
          )
          .join('')
      : '';

    cells.push(`
      <div class="calendar-day ${isCurrentMonth ? '' : 'is-outside-month'} ${isToday ? 'is-today' : ''}">
        <span class="calendar-day-number">${date.getDate()}</span>
        <div class="calendar-day-events">${eventMarkup}</div>
      </div>
    `);
  }

  calendarMonthGrid.innerHTML = cells.join('');

  document.querySelectorAll('.calendar-event-pill').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openCalendarEventDetails(Number(event.currentTarget.dataset.eventId));
    });
  });
};

const renderCalendarWeek = () => {
  if (!calendarWeekGrid) {
    return;
  }

  const weekStart = getStartOfWeek(calendarState.currentDate);
  const todayKey = formatDateKey(new Date());

  const columns = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const dateKey = formatDateKey(date);
    const items = calendarEvents
      .filter((event) => event.date === dateKey)
      .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

    const eventMarkup = items.length
      ? items
          .map(
            (item) => `
              <button type="button" class="calendar-event-pill ${item.type.toLowerCase()}" data-event-id="${item.id}" title="${item.title}">
                ${item.title}
              </button>
            `
          )
          .join('')
      : '<div class="calendar-week-empty">No events</div>';

    return `
      <div class="calendar-week-column">
        <div class="calendar-week-column-header ${dateKey === todayKey ? 'is-today' : ''}">
          <span>${new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)}</span>
          <strong>${date.getDate()}</strong>
        </div>
        <div class="calendar-week-column-body">${eventMarkup}</div>
      </div>
    `;
  }).join('');

  calendarWeekGrid.innerHTML = columns;

  document.querySelectorAll('.calendar-event-pill').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openCalendarEventDetails(Number(event.currentTarget.dataset.eventId));
    });
  });
};

const renderCalendarList = () => {
  if (!calendarListItems) {
    return;
  }

  const sortedEvents = [...calendarEvents].sort((a, b) => {
    const dateComparison = new Date(a.date + 'T' + a.time + ':00') - new Date(b.date + 'T' + b.time + ':00');
    return dateComparison;
  });

  if (!sortedEvents.length) {
    calendarListItems.innerHTML = '<div class="calendar-list-empty">No upcoming events scheduled.</div>';
    return;
  }

  calendarListItems.innerHTML = sortedEvents
    .map((event) => {
      const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parseDateKey(event.date));
      return `
        <div class="calendar-list-item" data-event-id="${event.id}" tabindex="0" role="button" aria-label="View details for ${event.title}">
          <div class="calendar-list-item-date">${date}</div>
          <div>
            <h4 class="calendar-list-item-title">${event.title}</h4>
            <div class="calendar-list-item-meta">
              <span>${event.time}</span>
              <span>•</span>
              <span>${event.related}</span>
            </div>
          </div>
          <div class="calendar-list-item-type ${event.type.toLowerCase()}">${event.type}</div>
        </div>
      `;
    })
    .join('');

  document.querySelectorAll('.calendar-list-item').forEach((item) => {
    item.addEventListener('click', () => {
      openCalendarEventDetails(Number(item.dataset.eventId));
    });

    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCalendarEventDetails(Number(item.dataset.eventId));
      }
    });
  });
};

const setCalendarView = (viewName) => {
  calendarState.view = viewName;

  const viewButtons = document.querySelectorAll('.calendar-view-button');
  viewButtons.forEach((button) => {
    const isActive = button.dataset.calendarView === viewName;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  if (calendarMonthView) {
    calendarMonthView.hidden = viewName !== 'month';
  }

  if (calendarWeekView) {
    calendarWeekView.hidden = viewName !== 'week';
  }

  if (calendarListView) {
    calendarListView.hidden = viewName !== 'list';
  }

  if (viewName === 'month') {
    renderCalendarMonth();
  }

  if (viewName === 'week') {
    renderCalendarWeek();
  }

  if (viewName === 'list') {
    renderCalendarList();
  }
};

const renderCalendarHeader = () => {
  if (calendarCurrentMonth) {
    calendarCurrentMonth.textContent = formatMonthLabel(calendarState.currentDate);
  }
};

const renderCalendar = () => {
  renderCalendarHeader();
  renderCalendarMonth();
  renderCalendarWeek();
  renderCalendarList();
  setCalendarView(calendarState.view);
};

const changeCalendarMonth = (direction) => {
  const nextMonth = new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() + direction, 1);
  calendarState.currentDate = nextMonth;
  renderCalendar();
};

if (calendarForm) {
  calendarForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(calendarForm);
    const title = String(formData.get('title') || '').trim();
    const type = String(formData.get('type') || '').trim();
    const date = String(formData.get('date') || '').trim();
    const time = String(formData.get('time') || '').trim();
    const related = String(formData.get('related') || '').trim();
    const notes = String(formData.get('notes') || '').trim();

    if (!title || !type || !date || !time || !related) {
      window.alert('Please complete all required event details.');
      return;
    }

    const editingId = calendarForm.dataset.editingId ? Number(calendarForm.dataset.editingId) : null;

    if (editingId) {
      calendarEvents = calendarEvents.map((item) =>
        item.id === editingId ? { ...item, title, type, date, time, related, notes } : item
      );
    } else {
      calendarEvents.push({
        id: Date.now(),
        title,
        type,
        date,
        time,
        related,
        notes
      });
    }

    updateCalendarStorage();
    renderCalendar();
    closeCalendarModal();
  });
}

const calendarAddTrigger = document.querySelector('.calendar-add-trigger');
if (calendarAddTrigger) {
  calendarAddTrigger.addEventListener('click', () => openCalendarModal());
}

const calendarNavButtons = document.querySelectorAll('.calendar-nav-button');
calendarNavButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const direction = Number(button.dataset.calendarStep || 0);
    changeCalendarMonth(direction);
  });
});

const calendarViewButtons = document.querySelectorAll('.calendar-view-button');
calendarViewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setCalendarView(button.dataset.calendarView);
  });
});

document.querySelector('.calendar-today-button')?.addEventListener('click', () => {
  calendarState.currentDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  renderCalendar();
});

if (calendarEventModalBackdrop) {
  calendarEventModalBackdrop.addEventListener('click', (event) => {
    if (event.target === calendarEventModalBackdrop) {
      closeCalendarModal();
    }
  });
}

if (calendarDetailsBackdrop) {
  calendarDetailsBackdrop.addEventListener('click', (event) => {
    if (event.target === calendarDetailsBackdrop) {
      closeCalendarDetails();
    }
  });
}

document.querySelector('.calendar-modal-close')?.addEventListener('click', closeCalendarModal);
document.querySelector('.calendar-cancel-button')?.addEventListener('click', closeCalendarModal);
document.querySelector('.details-close')?.addEventListener('click', closeCalendarDetails);

document.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-calendar-action]');
  if (!actionButton) {
    return;
  }

  const eventId = Number(actionButton.dataset.eventId);
  const actionType = actionButton.dataset.calendarAction;

  if (actionType === 'edit') {
    const matchingEvent = calendarEvents.find((item) => item.id === eventId);
    if (matchingEvent) {
      closeCalendarDetails();
      openCalendarModal(matchingEvent);
    }
    return;
  }

  if (actionType === 'delete') {
    const matchingEvent = calendarEvents.find((item) => item.id === eventId);
    if (!matchingEvent) {
      return;
    }

    const confirmed = window.confirm(`Delete "${matchingEvent.title}"?`);
    if (!confirmed) {
      return;
    }

    calendarEvents = calendarEvents.filter((item) => item.id !== eventId);
    updateCalendarStorage();
    renderCalendar();
    closeCalendarDetails();
  }
});

renderCalendar();

const messageStorageKey = 'clientflow_messages';
const messageSeedData = [
  {
    id: 'sarah-johnson',
    clientName: 'Sarah Johnson',
    company: 'Nova Studio',
    avatar: 'SJ',
    online: true,
    unread: 1,
    messages: [
      { id: 'msg-1', sender: 'client', text: 'Hi Asmat, how is the homepage redesign going?', time: '10:42 AM' },
      { id: 'msg-2', sender: 'me', text: "Hi Sarah! It's going well. I've completed most of the homepage design.", time: '10:45 AM' },
      { id: 'msg-3', sender: 'client', text: 'Great! Can you send me the latest version?', time: '10:48 AM' },
      { id: 'msg-4', sender: 'me', text: "Sure, I'll send it shortly.", time: '10:51 AM' }
    ]
  },
  {
    id: 'michael-chen',
    clientName: 'Michael Chen',
    company: 'TechFlow',
    avatar: 'MC',
    online: true,
    unread: 1,
    messages: [
      { id: 'msg-5', sender: 'client', text: 'The dashboard looks great. I have one small change.', time: '9:18 AM' },
      { id: 'msg-6', sender: 'me', text: 'Thanks Michael, tell me what you want adjusted.', time: '9:22 AM' }
    ]
  },
  {
    id: 'emma-williams',
    clientName: 'Emma Williams',
    company: 'Bright Media',
    avatar: 'EW',
    online: false,
    unread: 0,
    messages: [
      { id: 'msg-7', sender: 'client', text: "I've reviewed the landing page.", time: 'Yesterday' }
    ]
  },
  {
    id: 'david-miller',
    clientName: 'David Miller',
    company: 'Orbit Labs',
    avatar: 'DM',
    online: true,
    unread: 0,
    messages: [
      { id: 'msg-8', sender: 'client', text: 'When can we review the final version?', time: 'Yesterday' }
    ]
  },
  {
    id: 'sophia-davis',
    clientName: 'Sophia Davis',
    company: 'Pixel House',
    avatar: 'SD',
    online: false,
    unread: 0,
    messages: [
      { id: 'msg-9', sender: 'client', text: 'Thank you for the update!', time: 'Sep 23' }
    ]
  }
];

let messageConversations = loadStoredData(messageStorageKey, [...messageSeedData]);
let activeMessageId = messageConversations[0]?.id || null;

const messageSidebarList = document.querySelector('#messages-list');
const messagesSearchInput = document.querySelector('#messages-search-input');
const messagesThreadBody = document.querySelector('#messages-thread-body');
const messagesInput = document.querySelector('#messages-input');
const messagesSendButton = document.querySelector('#messages-send-button');
const messageModalBackdrop = document.querySelector('#message-modal-backdrop');
const newMessageForm = document.querySelector('#new-message-form');
const newMessageTrigger = document.querySelector('.new-message-trigger');
const activeConversationName = document.querySelector('#active-conversation-name');
const activeConversationCompany = document.querySelector('#active-conversation-company');
const activeConversationAvatar = document.querySelector('#active-conversation-avatar');
const activeConversationStatus = document.querySelector('#active-conversation-status');
const messagePageShell = document.querySelector('#page-messages');

const getMessageInitials = (fullName) => fullName
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part.charAt(0).toUpperCase())
  .join('');

const persistMessageConversations = () => {
  localStorage.setItem(messageStorageKey, JSON.stringify(messageConversations));
  updateMessagesSidebarBadge();
};

const updateMessagesSidebarBadge = () => {
  const sidebarItem = document.querySelector('.sidebar-item[data-page="messages"]');
  if (!sidebarItem) {
    return;
  }

  const unreadCount = messageConversations.reduce((total, conversation) => total + (conversation.unread ? 1 : 0), 0);
  let badge = sidebarItem.querySelector('.sidebar-badge');

  if (!badge && unreadCount > 0) {
    badge = document.createElement('span');
    badge.className = 'sidebar-badge';
    sidebarItem.appendChild(badge);
  }

  if (badge) {
    badge.textContent = unreadCount > 0 ? String(unreadCount) : '';
    badge.hidden = unreadCount === 0;
  }
};

const getMessageConversationById = (id) => messageConversations.find((conversation) => conversation.id === id) || null;

const getFilteredMessageConversations = () => {
  const query = (messagesSearchInput?.value || '').trim().toLowerCase();

  if (!query) {
    return [...messageConversations];
  }

  return messageConversations.filter((conversation) => {
    const haystack = `${conversation.clientName} ${conversation.company} ${conversation.messages.map((message) => message.text).join(' ')}`.toLowerCase();
    return haystack.includes(query);
  });
};

const syncMessagesMobileView = () => {
  if (!messagePageShell) {
    return;
  }

  if (window.innerWidth <= 760) {
    messagePageShell.classList.toggle('messages-thread-open', Boolean(activeMessageId));
  } else {
    messagePageShell.classList.remove('messages-thread-open');
  }
};

const renderMessagesList = () => {
  if (!messageSidebarList) {
    return;
  }

  const filteredConversationList = getFilteredMessageConversations();

  if (!filteredConversationList.length) {
    messageSidebarList.innerHTML = '<div class="messages-empty-state">No conversations found.</div>';
    return;
  }

  messageSidebarList.innerHTML = filteredConversationList
    .map((conversation) => {
      const lastMessage = conversation.messages[conversation.messages.length - 1] || { text: 'No messages yet', time: '' };
      const isActive = conversation.id === activeMessageId;

      return `
        <button type="button" class="message-conversation ${isActive ? 'is-active' : ''}" data-message-id="${conversation.id}" aria-label="Open conversation with ${conversation.clientName}">
          <div class="message-avatar" aria-hidden="true">${conversation.avatar || getMessageInitials(conversation.clientName)}</div>
          <div class="message-summary">
            <div class="message-summary-top">
              <strong>${conversation.clientName}</strong>
              <span>${lastMessage.time}</span>
            </div>
            <div class="message-summary-bottom">
              <span class="message-preview">${lastMessage.text}</span>
              ${conversation.unread ? `<span class="message-unread">${conversation.unread}</span>` : ''}
            </div>
          </div>
        </button>
      `;
    })
    .join('');

  messageSidebarList.querySelectorAll('.message-conversation').forEach((button) => {
    button.addEventListener('click', () => {
      const nextId = button.dataset.messageId;
      const targetConversation = getMessageConversationById(nextId);
      if (!targetConversation) {
        return;
      }

      activeMessageId = nextId;
      messageConversations = messageConversations.map((conversation) => (
        conversation.id === nextId ? { ...conversation, unread: 0 } : conversation
      ));
      persistMessageConversations();
      renderMessagesList();
      renderActiveThread();
      syncMessagesMobileView();
    });
  });
};

const renderActiveThread = () => {
  if (!messagesThreadBody) {
    return;
  }

  const activeConversation = getMessageConversationById(activeMessageId) || messageConversations[0] || null;

  if (!activeConversation) {
    messagesThreadBody.innerHTML = '<div class="messages-empty-thread">No conversation selected.</div>';
    if (activeConversationName) activeConversationName.textContent = 'No conversation';
    if (activeConversationCompany) activeConversationCompany.textContent = '';
    if (activeConversationAvatar) activeConversationAvatar.textContent = '—';
    if (activeConversationStatus) {
      activeConversationStatus.textContent = 'Offline';
      activeConversationStatus.classList.remove('online');
      activeConversationStatus.classList.add('offline');
    }
    return;
  }

  if (activeConversationName) activeConversationName.textContent = activeConversation.clientName;
  if (activeConversationCompany) activeConversationCompany.textContent = activeConversation.company;
  if (activeConversationAvatar) activeConversationAvatar.textContent = activeConversation.avatar || getMessageInitials(activeConversation.clientName);
  if (activeConversationStatus) {
    const isOnline = activeConversation.online;
    activeConversationStatus.textContent = isOnline ? 'Online' : 'Offline';
    activeConversationStatus.classList.toggle('online', isOnline);
    activeConversationStatus.classList.toggle('offline', !isOnline);
  }

  messagesThreadBody.innerHTML = activeConversation.messages
    .map((message) => `
      <div class="message-item ${message.sender === 'me' ? 'outgoing' : 'incoming'}">
        <div class="message-bubble">
          <p>${message.text}</p>
          <span>${message.time}</span>
        </div>
      </div>
    `)
    .join('');

  messagesThreadBody.scrollTop = messagesThreadBody.scrollHeight;
};

const addMessageToConversation = (conversationId, text, sender = 'me') => {
  const conversation = getMessageConversationById(conversationId);
  if (!conversation) {
    return;
  }

  conversation.messages.push({
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    sender,
    text,
    time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date())
  });

  if (sender === 'me') {
    conversation.unread = 0;
  }

  persistMessageConversations();
  renderMessagesList();
  renderActiveThread();
};

const sendTypedMessage = () => {
  if (!activeMessageId) {
    return;
  }

  const value = (messagesInput?.value || '').trim();
  if (!value) {
    return;
  }

  addMessageToConversation(activeMessageId, value, 'me');
  if (messagesInput) {
    messagesInput.value = '';
    messagesInput.focus();
  }
};

if (messagesSendButton) {
  messagesSendButton.addEventListener('click', sendTypedMessage);
}

if (messagesInput) {
  messagesInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendTypedMessage();
    }
  });
}

const handleMessageAction = (action) => {
  const activeConversation = getMessageConversationById(activeMessageId);
  if (!activeConversation) {
    return;
  }

  if (action === 'mark-unread') {
    messageConversations = messageConversations.map((conversation) =>
      conversation.id === activeMessageId ? { ...conversation, unread: 1 } : conversation
    );
    persistMessageConversations();
    renderMessagesList();
    return;
  }

  if (action === 'delete') {
    const confirmed = window.confirm(`Delete the conversation with ${activeConversation.clientName}?`);
    if (!confirmed) {
      return;
    }

    messageConversations = messageConversations.filter((conversation) => conversation.id !== activeMessageId);
    activeMessageId = messageConversations[0]?.id || null;
    persistMessageConversations();
    renderMessagesList();
    renderActiveThread();
    syncMessagesMobileView();
  }
};

const updateMessageMoreMenu = (shouldShow) => {
  const menu = document.querySelector('.messages-more-menu');
  if (!menu) {
    return;
  }
  menu.classList.toggle('is-open', shouldShow);
};

document.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-message-action]');
  if (actionButton) {
    handleMessageAction(actionButton.dataset.messageAction);
    updateMessageMoreMenu(false);
    return;
  }

  const moreButton = event.target.closest('.messages-more-button');
  if (moreButton) {
    const menu = document.querySelector('.messages-more-menu');
    if (menu) {
      menu.classList.toggle('is-open');
    }
    return;
  }

  if (!event.target.closest('.messages-more-button') && !event.target.closest('.messages-more-menu')) {
    updateMessageMoreMenu(false);
  }
});

if (newMessageTrigger) {
  newMessageTrigger.addEventListener('click', () => {
    const recipients = [...new Set(messageConversations.map((conversation) => conversation.clientName))];
    const select = document.querySelector('#message-recipient-select');
    if (select) {
      select.innerHTML = recipients.map((name) => `<option value="${name}">${name}</option>`).join('');
      if (!recipients.length) {
        select.innerHTML = '<option value="">No clients available</option>';
      }
    }

    if (messageModalBackdrop) {
      messageModalBackdrop.hidden = false;
    }
  });
}

if (messageModalBackdrop) {
  messageModalBackdrop.addEventListener('click', (event) => {
    if (event.target === messageModalBackdrop) {
      messageModalBackdrop.hidden = true;
      if (newMessageForm) {
        newMessageForm.reset();
      }
    }
  });
}

document.querySelector('.message-modal-close')?.addEventListener('click', () => {
  if (messageModalBackdrop) {
    messageModalBackdrop.hidden = true;
  }
  if (newMessageForm) {
    newMessageForm.reset();
  }
});

document.querySelector('.message-cancel-button')?.addEventListener('click', () => {
  if (messageModalBackdrop) {
    messageModalBackdrop.hidden = true;
  }
  if (newMessageForm) {
    newMessageForm.reset();
  }
});

if (newMessageForm) {
  newMessageForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(newMessageForm);
    const recipient = String(formData.get('recipient') || '').trim();
    const body = String(formData.get('message') || '').trim();

    if (!recipient || !body) {
      window.alert('Please select a client and enter a message.');
      return;
    }

    let conversation = messageConversations.find((item) => item.clientName.toLowerCase() === recipient.toLowerCase());

    if (!conversation) {
      conversation = {
        id: `conversation-${Date.now()}`,
        clientName: recipient,
        company: 'New Client',
        avatar: getMessageInitials(recipient),
        online: true,
        unread: 0,
        messages: []
      };
      messageConversations.unshift(conversation);
    }

    conversation.messages.push({
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      sender: 'me',
      text: body,
      time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date())
    });

    activeMessageId = conversation.id;
    conversation.unread = 0;
    persistMessageConversations();
    renderMessagesList();
    renderActiveThread();
    syncMessagesMobileView();
    if (messageModalBackdrop) {
      messageModalBackdrop.hidden = true;
    }
    newMessageForm.reset();
  });
}

if (messagesSearchInput) {
  messagesSearchInput.addEventListener('input', renderMessagesList);
}

if (messagePageShell) {
  document.querySelector('.messages-back-button')?.addEventListener('click', () => {
    messagePageShell.classList.remove('messages-thread-open');
  });
}

const initMessagesPage = () => {
  updateMessagesSidebarBadge();
  if (!activeMessageId && messageConversations.length) {
    activeMessageId = messageConversations[0].id;
  }
  renderMessagesList();
  renderActiveThread();
  syncMessagesMobileView();
};

initMessagesPage();

const defaultProfileSettings = {
  fullName: 'Asmat',
  role: 'Account Manager',
  email: 'asmat@example.com',
  phone: '+93'
};

const defaultNotificationSettings = {
  emailNotifications: true,
  newClientNotifications: true,
  projectUpdates: true,
  taskReminders: true,
  newMessages: true
};

const defaultWorkspaceSettings = {
  workspaceName: 'ClientFlow AI',
  currency: 'USD',
  timeZone: 'Afghanistan Time'
};

const loadStoredObject = (key, fallback) => {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : fallback;
  } catch (error) {
    return fallback;
  }
};

const getBooleanSetting = (key, fallback) => {
  const rawValue = localStorage.getItem(key);
  if (rawValue === null) {
    return fallback;
  }
  return rawValue === 'true';
};

const showSettingsToast = (message) => {
  let toast = document.querySelector('.settings-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'settings-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('visible');

  window.clearTimeout(showSettingsToast.timeoutId);
  showSettingsToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove('visible');
  }, 2200);
};

const setSettingsSection = (sectionKey) => {
  document.querySelectorAll('.settings-nav-item').forEach((button) => {
    const isActive = button.dataset.settingsSection === sectionKey;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  document.querySelectorAll('.settings-section').forEach((section) => {
    const isActive = section.dataset.settingsSectionContent === sectionKey;
    section.classList.toggle('is-active', isActive);
    section.hidden = !isActive;
  });
};

const applyCompactSidebarPreference = (isCompact) => {
  body.classList.toggle('compact-sidebar', Boolean(isCompact));
  const compactToggle = document.querySelector('#settings-compact-sidebar');
  if (compactToggle) {
    compactToggle.checked = Boolean(isCompact);
  }
  localStorage.setItem('clientflow_compact_sidebar', String(Boolean(isCompact)));
};

const syncAppearanceInputs = (theme) => {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.querySelectorAll('input[name="settings-theme"]').forEach((input) => {
    input.checked = input.value === nextTheme;
  });

  writeThemePreference(nextTheme);
  applyTheme(nextTheme);
};

const renderProfileSettings = () => {
  const profileSettings = loadStoredObject('clientflow_profile', defaultProfileSettings);
  const profileForm = document.querySelector('#profile-settings-form');

  if (profileForm) {
    profileForm.elements.fullName.value = profileSettings.fullName || defaultProfileSettings.fullName;
    profileForm.elements.role.value = profileSettings.role || defaultProfileSettings.role;
    profileForm.elements.email.value = profileSettings.email || defaultProfileSettings.email;
    profileForm.elements.phone.value = profileSettings.phone || defaultProfileSettings.phone;
  }

  const displayName = document.querySelector('#settings-profile-display-name');
  const displayRole = document.querySelector('#settings-profile-display-role');
  const avatar = document.querySelector('#settings-profile-avatar');
  const topbarUserName = document.querySelector('.user-name');
  const topbarUserRole = document.querySelector('.user-role');
  const topbarAvatar = document.querySelector('.user-menu .avatar');
  const fullName = profileSettings.fullName || defaultProfileSettings.fullName;
  const roleName = profileSettings.role || defaultProfileSettings.role;
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  if (displayName) {
    displayName.textContent = fullName;
  }

  if (displayRole) {
    displayRole.textContent = roleName;
  }

  if (topbarUserName) {
    topbarUserName.textContent = fullName;
  }

  if (topbarUserRole) {
    topbarUserRole.textContent = roleName;
  }

  if (avatar) {
    avatar.textContent = initials;
  }

  if (topbarAvatar) {
    topbarAvatar.textContent = initials;
  }
};

const renderAppearanceSettings = () => {
  const savedTheme = readThemePreference();
  const compactPreference = getBooleanSetting('clientflow_compact_sidebar', false);
  syncAppearanceInputs(savedTheme);
  applyCompactSidebarPreference(compactPreference);
};

const renderNotificationSettings = () => {
  const notificationSettings = loadStoredObject('clientflow_notification_settings', defaultNotificationSettings);

  document.querySelectorAll('#notification-settings-form input[type="checkbox"]').forEach((checkbox) => {
    const key = checkbox.name;
    checkbox.checked = Boolean(notificationSettings[key]);
  });
};

const renderWorkspaceSettings = () => {
  const workspaceSettings = loadStoredObject('clientflow_workspace', defaultWorkspaceSettings);
  const workspaceForm = document.querySelector('#workspace-settings-form');

  if (workspaceForm) {
    workspaceForm.elements.workspaceName.value = workspaceSettings.workspaceName || defaultWorkspaceSettings.workspaceName;
    workspaceForm.elements.currency.value = workspaceSettings.currency || defaultWorkspaceSettings.currency;
    workspaceForm.elements.timeZone.value = workspaceSettings.timeZone || defaultWorkspaceSettings.timeZone;
  }
};

const profileForm = document.querySelector('#profile-settings-form');
if (profileForm) {
  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(profileForm);
    const nextProfile = {
      fullName: String(formData.get('fullName') || '').trim() || defaultProfileSettings.fullName,
      role: String(formData.get('role') || '').trim() || defaultProfileSettings.role,
      email: String(formData.get('email') || '').trim() || defaultProfileSettings.email,
      phone: String(formData.get('phone') || '').trim() || defaultProfileSettings.phone
    };

    localStorage.setItem('clientflow_profile', JSON.stringify(nextProfile));
    renderProfileSettings();
    showSettingsToast('Profile updated successfully.');
  });

  document.querySelector('[data-settings-reset="profile"]')?.addEventListener('click', () => {
    const currentProfile = loadStoredObject('clientflow_profile', defaultProfileSettings);
    profileForm.elements.fullName.value = currentProfile.fullName || defaultProfileSettings.fullName;
    profileForm.elements.role.value = currentProfile.role || defaultProfileSettings.role;
    profileForm.elements.email.value = currentProfile.email || defaultProfileSettings.email;
    profileForm.elements.phone.value = currentProfile.phone || defaultProfileSettings.phone;
  });
}

const appearanceForm = document.querySelector('#appearance-settings-form');
if (appearanceForm) {
  appearanceForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const selectedTheme = document.querySelector('input[name="settings-theme"]:checked')?.value || 'light';
    const isCompact = document.querySelector('#settings-compact-sidebar')?.checked || false;

    syncAppearanceInputs(selectedTheme);
    applyCompactSidebarPreference(isCompact);
    showSettingsToast('Changes saved successfully.');
  });
}

const notificationForm = document.querySelector('#notification-settings-form');
if (notificationForm) {
  notificationForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const nextSettings = {};
    Array.from(notificationForm.querySelectorAll('input[type="checkbox"]')).forEach((checkbox) => {
      nextSettings[checkbox.name] = checkbox.checked;
    });

    localStorage.setItem('clientflow_notification_settings', JSON.stringify(nextSettings));
    showSettingsToast('Changes saved successfully.');
  });
}

const workspaceForm = document.querySelector('#workspace-settings-form');
if (workspaceForm) {
  workspaceForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(workspaceForm);
    const nextWorkspace = {
      workspaceName: String(formData.get('workspaceName') || '').trim() || defaultWorkspaceSettings.workspaceName,
      currency: String(formData.get('currency') || '').trim() || defaultWorkspaceSettings.currency,
      timeZone: String(formData.get('timeZone') || '').trim() || defaultWorkspaceSettings.timeZone
    };

    localStorage.setItem('clientflow_workspace', JSON.stringify(nextWorkspace));
    showSettingsToast('Workspace saved successfully.');
  });
}

const passwordModalBackdrop = document.querySelector('#password-modal-backdrop');
const passwordForm = document.querySelector('#password-form');

const closePasswordModal = () => {
  if (passwordModalBackdrop) {
    passwordModalBackdrop.hidden = true;
  }

  if (passwordForm) {
    passwordForm.reset();
  }
};

document.querySelector('#open-password-modal')?.addEventListener('click', () => {
  if (passwordModalBackdrop) {
    passwordModalBackdrop.hidden = false;
  }
});

document.querySelector('.settings-modal-close')?.addEventListener('click', closePasswordModal);
document.querySelector('.settings-password-cancel')?.addEventListener('click', closePasswordModal);

if (passwordModalBackdrop) {
  passwordModalBackdrop.addEventListener('click', (event) => {
    if (event.target === passwordModalBackdrop) {
      closePasswordModal();
    }
  });
}

if (passwordForm) {
  passwordForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(passwordForm);
    const currentPassword = String(formData.get('currentPassword') || '').trim();
    const newPassword = String(formData.get('newPassword') || '').trim();
    const confirmPassword = String(formData.get('confirmPassword') || '').trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      window.alert('Please complete all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      window.alert('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      window.alert('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      window.alert('New password must be different from the current password.');
      return;
    }

    closePasswordModal();
    showSettingsToast('Password updated successfully.');
  });
}

const exportDataButton = document.querySelector('#export-data-button');
if (exportDataButton) {
  exportDataButton.addEventListener('click', () => {
    const exportPayload = {
      profile: loadStoredObject('clientflow_profile', defaultProfileSettings),
      theme: localStorage.getItem('clientflow_theme') || localStorage.getItem('clientflow-theme') || 'light',
      notificationSettings: loadStoredObject('clientflow_notification_settings', defaultNotificationSettings),
      workspace: loadStoredObject('clientflow_workspace', defaultWorkspaceSettings),
      clients: JSON.parse(localStorage.getItem('clientflow_clients') || '[]'),
      projects: JSON.parse(localStorage.getItem('clientflow_projects') || '[]'),
      tasks: JSON.parse(localStorage.getItem('clientflow_tasks') || '[]'),
      messages: JSON.parse(localStorage.getItem('clientflow_messages') || '[]')
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clientflow-ai-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSettingsToast('Data export downloaded.');
  });
}

const clearLocalDataButton = document.querySelector('#clear-local-data-button');
if (clearLocalDataButton) {
  clearLocalDataButton.addEventListener('click', () => {
    const confirmed = window.confirm('This will clear saved ClientFlow data from this browser. Continue?');
    if (!confirmed) {
      return;
    }

    const storageKeys = [
      'clientflow_profile',
      'clientflow_theme',
      'clientflow_notification_settings',
      'clientflow_workspace',
      'clientflow_clients',
      'clientflow_projects',
      'clientflow_tasks',
      'clientflow_messages',
      'clientflow_compact_sidebar',
      'clientflow-theme'
    ];

    storageKeys.forEach((key) => localStorage.removeItem(key));
    document.body.classList.remove('dark-mode', 'compact-sidebar');
    applyTheme('light');
    applyCompactSidebarPreference(false);
    renderProfileSettings();
    renderAppearanceSettings();
    renderNotificationSettings();
    renderWorkspaceSettings();
    showSettingsToast('Local data cleared.');
  });
}

document.querySelectorAll('.settings-nav-item').forEach((button) => {
  button.addEventListener('click', () => {
    setSettingsSection(button.dataset.settingsSection);
  });
});

renderProfileSettings();
renderAppearanceSettings();
renderNotificationSettings();
renderWorkspaceSettings();
setSettingsSection('profile');

const pageSections = {
  dashboard: document.querySelector('.dashboard-main'),
  clients: document.querySelector('.clients-page-shell'),
  projects: document.querySelector('.projects-page-shell'),
  tasks: document.querySelector('#page-tasks'),
  calendar: document.querySelector('#page-calendar'),
  messages: document.querySelector('#page-messages'),
  settings: document.querySelector('#page-settings'),
  'help-support': document.querySelector('#page-help-support')
};

const sidebarItems = document.querySelectorAll('.sidebar-item');

const showPage = (pageKey) => {
  Object.entries(pageSections).forEach(([key, section]) => {
    if (section) {
      section.hidden = key !== pageKey;
    }
  });

  sidebarItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.page === pageKey);
  });

  const scrollTargets = [window, document.documentElement, document.body];
  scrollTargets.forEach((target) => {
    if (!target) {
      return;
    }

    if (typeof target.scrollTo === 'function') {
      target.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    if (typeof target.scrollTop === 'number') {
      target.scrollTop = 0;
    }
  });

  const mainContent = document.querySelector('.app-shell') || document.querySelector('.dashboard-main');
  if (mainContent && typeof mainContent.scrollTo === 'function') {
    mainContent.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
  if (mainContent && typeof mainContent.scrollTop === 'number') {
    mainContent.scrollTop = 0;
  }

  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  if (body.classList.contains('sidebar-open') && mobileToggle) {
    body.classList.remove('sidebar-open');
    mobileToggle.setAttribute('aria-expanded', 'false');
  }
};

sidebarItems.forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    const pageKey = item.dataset.page;
    if (!pageKey) {
      return;
    }

    showPage(pageKey);
  });
});

const projectSeedData = [
  { id: 1, name: 'Website Redesign', client: 'Sarah Johnson', category: 'Web Design', status: 'In Progress', progress: 75, deadline: '2026-09-28', revenue: 2400, sortOrder: 7 },
  { id: 2, name: 'AI Dashboard', client: 'Michael Chen', category: 'SaaS UI', status: 'In Progress', progress: 60, deadline: '2026-10-02', revenue: 3200, sortOrder: 6 },
  { id: 3, name: 'Mobile App UI', client: 'Sophia Davis', category: 'UI/UX Design', status: 'Completed', progress: 100, deadline: '2026-09-20', revenue: 4100, sortOrder: 5 },
  { id: 4, name: 'E-commerce Dashboard', client: 'David Miller', category: 'Web Application', status: 'In Progress', progress: 45, deadline: '2026-10-08', revenue: 2750, sortOrder: 4 },
  { id: 5, name: 'SaaS Landing Page', client: 'Emma Williams', category: 'Web Design', status: 'Pending', progress: 20, deadline: '2026-10-12', revenue: 1800, sortOrder: 3 },
  { id: 6, name: 'Brand Website', client: 'Olivia Brown', category: 'Web Development', status: 'Completed', progress: 100, deadline: '2026-09-18', revenue: 1600, sortOrder: 2 },
  { id: 7, name: 'Analytics Platform', client: 'James Wilson', category: 'Dashboard', status: 'In Progress', progress: 55, deadline: '2026-10-15', revenue: 3900, sortOrder: 1 },
  { id: 8, name: 'AI Landing Page', client: 'Daniel Taylor', category: 'AI SaaS', status: 'Completed', progress: 100, deadline: '2026-09-22', revenue: 3500, sortOrder: 0 }
];

const persistProjectRows = () => {
  localStorage.setItem('clientflow_projects', JSON.stringify(projectRows));
};

let projectRows = loadStoredData('clientflow_projects', [...projectSeedData]);
let projectSummary = {
  total: projectRows.length,
  inProgress: projectRows.filter((project) => project.status === 'In Progress').length,
  completed: projectRows.filter((project) => project.status === 'Completed').length,
  revenue: projectRows.reduce((sum, project) => sum + Number(project.revenue || 0), 0)
};

const projectGrid = document.querySelector('#projects-grid');
const projectSearchInput = document.querySelector('#projects-search-input');
const projectStatusFilter = document.querySelector('#project-status-filter');
const projectSortSelect = document.querySelector('#project-sort-select');
const projectEmptyState = document.querySelector('#projects-empty-state');
const createProjectTrigger = document.querySelector('.create-project-trigger');
const projectModalBackdrop = document.querySelector('#project-modal-backdrop');
const projectDetailsBackdrop = document.querySelector('#project-details-backdrop');
const projectForm = document.querySelector('#project-form');
const projectDetailsContent = document.querySelector('#project-details-content');
const projectModalCloseButton = document.querySelector('.project-modal-close');
const projectCancelButton = document.querySelector('.project-cancel-button');
const detailsCloseButton = document.querySelector('.details-close');

const formatCurrency = (value) => `$${Number(value).toLocaleString()}`;
const formatShortDate = (dateString) => {
  if (!dateString) {
    return 'Not set';
  }

  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const projectStatusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');

const updateProjectSummaryUI = () => {
  projectSummary = {
    total: projectRows.length,
    inProgress: projectRows.filter((project) => project.status === 'In Progress').length,
    completed: projectRows.filter((project) => project.status === 'Completed').length,
    revenue: projectRows.reduce((sum, project) => sum + Number(project.revenue || 0), 0)
  };

  const totalEl = document.querySelector('[data-project-summary="total"]');
  const inProgressEl = document.querySelector('[data-project-summary="in-progress"]');
  const completedEl = document.querySelector('[data-project-summary="completed"]');
  const revenueEl = document.querySelector('[data-project-summary="revenue"]');

  if (totalEl) {
    totalEl.textContent = projectSummary.total;
  }

  if (inProgressEl) {
    inProgressEl.textContent = projectSummary.inProgress;
  }

  if (completedEl) {
    completedEl.textContent = projectSummary.completed;
  }

  if (revenueEl) {
    revenueEl.textContent = formatCurrency(projectSummary.revenue);
  }

  persistProjectRows();
};

const getFilteredProjects = () => {
  const query = (projectSearchInput?.value || '').trim().toLowerCase();
  const status = projectStatusFilter?.value || 'All Status';
  const mode = projectSortSelect?.value || 'newest';

  let filtered = projectRows.filter((project) => {
    const matchesStatus = status === 'All Status' || project.status === status;
    const haystack = `${project.name} ${project.client} ${project.category}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesStatus && matchesQuery;
  });

  filtered = [...filtered].sort((a, b) => {
    if (mode === 'oldest') {
      return new Date(a.deadline) - new Date(b.deadline);
    }

    if (mode === 'highest-revenue') {
      return b.revenue - a.revenue;
    }

    if (mode === 'lowest-revenue') {
      return a.revenue - b.revenue;
    }

    return new Date(b.deadline) - new Date(a.deadline);
  });

  return filtered;
};

const closeProjectActionMenus = () => {
  document.querySelectorAll('.project-action-menu').forEach((menu) => {
    menu.classList.remove('is-open');
  });
};

const openProjectDetails = (project) => {
  if (!projectDetailsBackdrop || !projectDetailsContent) {
    return;
  }

  projectDetailsContent.innerHTML = `
    <div class="project-detail-list">
      <div class="project-detail-item">
        <span>Project</span>
        <strong>${project.name}</strong>
      </div>
      <div class="project-detail-item">
        <span>Client</span>
        <strong>${project.client}</strong>
      </div>
      <div class="project-detail-item">
        <span>Category</span>
        <strong>${project.category}</strong>
      </div>
      <div class="project-detail-item">
        <span>Status</span>
        <strong>${project.status}</strong>
      </div>
      <div class="project-detail-item">
        <span>Progress</span>
        <strong>${project.progress}%</strong>
      </div>
      <div class="project-detail-item">
        <span>Deadline</span>
        <strong>${formatShortDate(project.deadline)}</strong>
      </div>
      <div class="project-detail-item">
        <span>Revenue</span>
        <strong>${formatCurrency(project.revenue)}</strong>
      </div>
    </div>
  `;

  projectDetailsBackdrop.hidden = false;
};

const closeProjectDetails = () => {
  if (projectDetailsBackdrop) {
    projectDetailsBackdrop.hidden = true;
  }
};

const renderProjects = () => {
  const filteredProjects = getFilteredProjects();

  if (!projectGrid) {
    return;
  }

  if (!filteredProjects.length) {
    projectGrid.innerHTML = '';
    if (projectEmptyState) {
      projectEmptyState.hidden = false;
    }
    return;
  }

  if (projectEmptyState) {
    projectEmptyState.hidden = true;
  }

  projectGrid.innerHTML = filteredProjects.map((project) => `
    <article class="project-card" data-project-id="${project.id}">
      <div class="project-card-header">
        <div>
          <p class="project-card-small-label">${project.category}</p>
          <h3>${project.name}</h3>
        </div>
        <div class="project-menu-wrap">
          <button class="project-menu-button" type="button" aria-label="Open actions for ${project.name}">⋮</button>
          <div class="project-action-menu" role="menu" aria-label="Project actions menu">
            <button type="button" data-project-action="view">View Project</button>
            <button type="button" data-project-action="edit">Edit Project</button>
            <button type="button" data-project-action="delete">Delete Project</button>
          </div>
        </div>
      </div>

      <div class="project-meta-row">
        <span>Client</span>
        <strong>${project.client}</strong>
      </div>

      <div class="project-meta-row">
        <span>Status</span>
        <span class="status-badge ${projectStatusClass(project.status)}">${project.status}</span>
      </div>

      <div class="project-progress-block">
        <div class="project-progress-header">
          <span>Progress</span>
          <strong>${project.progress}%</strong>
        </div>
        <div class="project-progress-track" aria-label="Project progress: ${project.progress}%">
          <span style="width: ${project.progress}%"></span>
        </div>
      </div>

      <div class="project-meta-grid">
        <div class="project-metric">
          <span>Deadline</span>
          <strong>${formatShortDate(project.deadline)}</strong>
        </div>
        <div class="project-metric">
          <span>Revenue</span>
          <strong>${formatCurrency(project.revenue)}</strong>
        </div>
      </div>
    </article>
  `).join('');

};

if (projectGrid) {
  projectGrid.addEventListener('click', (event) => {
    const menuButton = event.target.closest('.project-menu-button');
    if (menuButton) {
      event.stopPropagation();
      const menu = menuButton.nextElementSibling;
      if (!menu) {
        return;
      }

      const shouldOpen = !menu.classList.contains('is-open');
      closeProjectActionMenus();
      if (shouldOpen) {
        menu.classList.add('is-open');
      }
      return;
    }

    const projectActionButton = event.target.closest('.project-action-menu button');
    if (!projectActionButton) {
      return;
    }

    const card = projectActionButton.closest('.project-card');
    const projectId = Number(card?.dataset.projectId || 0);
    const action = projectActionButton.dataset.projectAction;
    const project = projectRows.find((item) => item.id === projectId);

    if (!project) {
      return;
    }

    if (action === 'view') {
      openProjectDetails(project);
    }

    if (action === 'edit') {
      openProjectModal(project);
    }

    if (action === 'delete') {
      const confirmed = window.confirm(`Delete ${project.name} from the project list?`);
      if (!confirmed) {
        closeProjectActionMenus();
        return;
      }

      projectRows = projectRows.filter((item) => item.id !== projectId);
      updateProjectSummaryUI();
      renderProjects();
    }

    closeProjectActionMenus();
  });
}

const closeProjectModal = () => {
  if (projectModalBackdrop) {
    projectModalBackdrop.hidden = true;
  }

  if (projectForm) {
    projectForm.reset();
    delete projectForm.dataset.editingId;
  }
};

const openProjectModal = (project = null) => {
  if (!projectModalBackdrop || !projectForm) {
    return;
  }

  const title = document.querySelector('#project-modal-title');
  const submitButton = projectForm.querySelector('button[type="submit"]');

  if (title) {
    title.textContent = project ? 'Edit Project' : 'Create New Project';
  }

  if (submitButton) {
    submitButton.textContent = project ? 'Save Project' : 'Create Project';
  }

  if (project) {
    projectForm.elements.projectName.value = project.name;
    projectForm.elements.clientName.value = project.client;
    projectForm.elements.category.value = project.category;
    projectForm.elements.status.value = project.status;
    projectForm.elements.progress.value = project.progress;
    projectForm.elements.deadline.value = project.deadline;
    projectForm.elements.revenue.value = project.revenue;
    projectForm.dataset.editingId = String(project.id);
  } else {
    projectForm.reset();
    projectForm.elements.status.value = 'In Progress';
    delete projectForm.dataset.editingId;
  }

  projectModalBackdrop.hidden = false;
};

if (projectSearchInput) {
  projectSearchInput.addEventListener('input', renderProjects);
}

if (projectStatusFilter) {
  projectStatusFilter.addEventListener('change', renderProjects);
}

if (projectSortSelect) {
  projectSortSelect.addEventListener('change', renderProjects);
}

if (createProjectTrigger) {
  createProjectTrigger.addEventListener('click', () => openProjectModal());
}

if (projectModalCloseButton) {
  projectModalCloseButton.addEventListener('click', closeProjectModal);
}

if (projectCancelButton) {
  projectCancelButton.addEventListener('click', closeProjectModal);
}

if (detailsCloseButton) {
  detailsCloseButton.addEventListener('click', closeProjectDetails);
}

if (projectModalBackdrop) {
  projectModalBackdrop.addEventListener('click', (event) => {
    if (event.target === projectModalBackdrop) {
      closeProjectModal();
    }
  });
}

if (projectDetailsBackdrop) {
  projectDetailsBackdrop.addEventListener('click', (event) => {
    if (event.target === projectDetailsBackdrop) {
      closeProjectDetails();
    }
  });
}

if (projectForm) {
  projectForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(projectForm);
    const projectName = String(formData.get('projectName') || '').trim();
    const clientName = String(formData.get('clientName') || '').trim();
    const category = String(formData.get('category') || '').trim();
    const status = String(formData.get('status') || 'In Progress');
    const progress = Number(formData.get('progress') || 0);
    const deadline = String(formData.get('deadline') || '');
    const revenue = Number(formData.get('revenue') || 0);

    if (!projectName || !clientName || !category || !deadline || !revenue) {
      return;
    }

    const editingId = projectForm.dataset.editingId ? Number(projectForm.dataset.editingId) : null;

    if (editingId) {
      projectRows = projectRows.map((project) =>
        project.id === editingId
          ? {
              ...project,
              name: projectName,
              client: clientName,
              category,
              status,
              progress,
              deadline,
              revenue
            }
          : project
      );
    } else {
      const newProject = {
        id: Date.now(),
        name: projectName,
        client: clientName,
        category,
        status,
        progress,
        deadline,
        revenue,
        sortOrder: projectRows.length + 1
      };

      projectRows.unshift(newProject);
    }

    updateProjectSummaryUI();
    renderProjects();
    closeProjectModal();
  });
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('.project-menu-button') && !event.target.closest('.project-action-menu')) {
    closeProjectActionMenus();
  }
});

updateProjectSummaryUI();
renderProjects();