// main.js

document.addEventListener('DOMContentLoaded', () => {
  const appWrapper = document.getElementById('appWrapper');
  const authWrapper = document.getElementById('authWrapper');
  const authForm = document.getElementById('authForm');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authToggleBtn = document.getElementById('authToggleBtn');
  const authToggleText = document.getElementById('authToggleText');
  const authError = document.getElementById('authError');
  const logoutBtn = document.getElementById('logoutBtn');
  
  let isSignupMode = false;
  
  function getAuthHeader() {
    const userId = localStorage.getItem('lockr_user_id');
    return userId ? { 'Authorization': `Bearer ${userId}` } : {};
  }
  
  function checkAuthState() {
    const userId = localStorage.getItem('lockr_user_id');
    const userName = localStorage.getItem('lockr_user_name');
    if (userId) {
      authWrapper.style.display = 'none';
      appWrapper.style.display = 'flex';
      
      const greeting = document.getElementById('dashboardGreeting');
      if (greeting) {
        greeting.innerText = (userName && userName !== 'null' && userName !== 'undefined') ? `Hello, ${userName.split(' ')[0]}` : 'Hello, User';
      }
      
      const userAvatar = document.getElementById('userAvatar');
      if (userAvatar) {
        const initial = (userName && userName !== 'null' && userName !== 'undefined') ? userName.charAt(0).toUpperCase() : 'U';
        userAvatar.innerHTML = `<span style="font-size: 18px; font-weight: 600; color: white;">${initial}</span>`;
        userAvatar.style.backgroundColor = 'var(--primary-blue)';
        userAvatar.style.display = 'flex';
        userAvatar.style.justifyContent = 'center';
        userAvatar.style.alignItems = 'center';
      }
      
      loadPasswords();
    } else {
      authWrapper.style.display = 'flex';
      appWrapper.style.display = 'none';
    }
  }

  // Toggle Auth Mode
  if (authToggleBtn) {
    authToggleBtn.addEventListener('click', () => {
      isSignupMode = !isSignupMode;
      authError.style.display = 'none';
      const authNameGroup = document.getElementById('authNameGroup');
      const authNameInput = document.getElementById('authName');
      
      if (isSignupMode) {
        if (authNameGroup) authNameGroup.style.display = 'block';
        if (authNameInput) authNameInput.required = true;
        authTitle.innerText = 'Create Account';
        authSubtitle.innerText = 'Sign up to start securing your vault.';
        authSubmitBtn.innerText = 'Sign Up';
        authToggleText.innerHTML = `Already have an account? <span id="authToggleBtn" style="color: var(--primary-blue); font-weight: 600; cursor: pointer;">Sign in</span>`;
      } else {
        if (authNameGroup) authNameGroup.style.display = 'none';
        if (authNameInput) authNameInput.required = false;
        authTitle.innerText = 'Welcome Back';
        authSubtitle.innerText = 'Please enter your details to sign in.';
        authSubmitBtn.innerText = 'Sign In';
        authToggleText.innerHTML = `Don't have an account? <span id="authToggleBtn" style="color: var(--primary-blue); font-weight: 600; cursor: pointer;">Sign up</span>`;
      }
      
      // Rebind toggle since we replaced innerHTML
      document.getElementById('authToggleBtn').addEventListener('click', authToggleBtn.click);
    });
  }

  // Auth Password visibility toggle
  const authPasswordToggleBtn = document.getElementById('authPasswordToggleBtn');
  const authPasswordInput = document.getElementById('authPassword');
  
  if (authPasswordToggleBtn && authPasswordInput) {
    authPasswordToggleBtn.addEventListener('click', () => {
      const type = authPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      authPasswordInput.setAttribute('type', type);
      
      const icon = authPasswordToggleBtn.querySelector('i');
      if (type === 'text') {
        icon.classList.remove('ph-eye');
        icon.classList.add('ph-eye-slash');
      } else {
        icon.classList.remove('ph-eye-slash');
        icon.classList.add('ph-eye');
      }
    });
  }

  // Handle Auth Form Submit
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value;
      const password = document.getElementById('authPassword').value;
      const name = document.getElementById('authName')?.value;
      
      authSubmitBtn.innerText = 'Processing...';
      authError.style.display = 'none';
      
      const endpoint = isSignupMode ? '/api/signup' : '/api/login';
      const payload = isSignupMode ? { name, email, password } : { email, password };
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('lockr_user_id', data.id);
          if (data.name) localStorage.setItem('lockr_user_name', data.name);
          authForm.reset();
          checkAuthState();
        } else {
          authError.innerText = data.error || 'Authentication failed';
          authError.style.display = 'block';
        }
      } catch (err) {
        console.error(err);
        authError.innerText = 'Network error. Please try again.';
        authError.style.display = 'block';
      } finally {
        authSubmitBtn.innerText = isSignupMode ? 'Sign Up' : 'Sign In';
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('lockr_user_id');
      passwordsCache = [];
      renderMainPasswordList([]);
      checkAuthState();
    });
  }
  
  // Profile menu toggle
  const userAvatarEl = document.getElementById('userAvatar');
  const profileMenu = document.getElementById('profileMenu');
  
  if (userAvatarEl && profileMenu) {
    userAvatarEl.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.style.display = profileMenu.style.display === 'none' ? 'block' : 'none';
    });
    
    document.addEventListener('click', (e) => {
      if (!profileMenu.contains(e.target) && e.target !== userAvatarEl) {
        profileMenu.style.display = 'none';
      }
    });
  }

  const passwordList = document.querySelector('.password-list');
  const addModalOverlay = document.getElementById('addModalOverlay');
  const listModalOverlay = document.getElementById('listModalOverlay');
  const addForm = document.getElementById('addPasswordForm');
  let passwordsCache = [];

  // Fetch and render passwords
  async function loadPasswords() {
    try {
      const response = await fetch('/api/passwords', {
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch passwords');
      
      const passwords = await response.json();
      passwordsCache = passwords;
      
      renderMainPasswordList(passwords);
      
      // Update counts
      const counts = { 'All Passwords': passwords.length, 'Personal': 0, 'Browsing': 0, 'Payments': 0 };
      passwords.forEach(pw => {
        if (counts[pw.category] !== undefined) counts[pw.category]++;
      });
      
      document.querySelectorAll('.category-card').forEach(card => {
        const title = card.querySelector('h3').innerText;
        const countEl = card.querySelector('p');
        if (counts[title] !== undefined && countEl) {
          countEl.innerText = `${counts[title]} items`;
        }
      });
      
    } catch (error) {
      console.error('Error loading passwords:', error);
    }
  }

  // Main Dashboard Search
  const mainSearchInput = document.getElementById('mainSearchInput');
  if (mainSearchInput) {
    mainSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = passwordsCache.filter(pw => 
        pw.service_name.toLowerCase().includes(query) || 
        pw.service_email.toLowerCase().includes(query)
      );
      renderMainPasswordList(filtered);
    });
  }

  function createPasswordItemHTML(pw) {
    const initial = (pw.service_name || 'U').charAt(0).toUpperCase();
    return `
      <div class="service-icon" style="background-color: var(--cat-blue-bg); color: var(--primary-blue); font-weight: bold; font-size: 20px;">
        ${initial}
      </div>
      <div class="service-info">
        <h3 class="service-name">${pw.service_name}</h3>
        <p class="service-email">${pw.service_email}</p>
      </div>
      <div class="service-meta">
        <span class="badge">${pw.category}</span>
      </div>
      <button class="copy-button" aria-label="Copy Password" data-password="${pw.service_password}">
        <i class="ph ph-copy"></i>
      </button>
    `;
  }

  function renderMainPasswordList(passwords) {
    if (!passwordList) return;
    passwordList.innerHTML = '';
    
    if (passwords.length === 0) {
      passwordList.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">No passwords saved yet. Add one!</p>';
      return;
    }
    
    passwords.forEach(pw => {
      const item = document.createElement('div');
      item.className = 'password-item';
      item.style.cursor = 'pointer';
      item.innerHTML = createPasswordItemHTML(pw);
      
      item.addEventListener('click', (e) => {
        if (e.target.closest('.copy-button')) return;
        openMasterPasswordModal(pw);
      });
      
      passwordList.appendChild(item);
    });
    
    attachCopyEvents(passwordList);
  }

  function renderListModal(passwords, title) {
    const modalList = document.getElementById('modalPasswordList');
    const modalTitle = document.getElementById('listModalTitle');
    const searchInput = document.getElementById('listModalSearch');
    
    if (modalTitle) modalTitle.innerText = title;
    if (searchInput) searchInput.value = '';
    
    function render(list) {
      modalList.innerHTML = '';
      if (list.length === 0) {
        modalList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No items found.</p>';
        return;
      }
      
      list.forEach(pw => {
        const item = document.createElement('div');
        item.className = 'password-item';
        item.style.cursor = 'pointer';
        item.innerHTML = createPasswordItemHTML(pw);
        
        item.addEventListener('click', (e) => {
          if (e.target.closest('.copy-button')) return;
          listModalOverlay.classList.remove('active');
          openMasterPasswordModal(pw);
        });
        
        modalList.appendChild(item);
      });
      attachCopyEvents(modalList);
    }
    
    render(passwords);
    
    // Setup search
    if (searchInput) {
      searchInput.oninput = (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = passwords.filter(pw => 
          pw.service_name.toLowerCase().includes(query) || 
          pw.service_email.toLowerCase().includes(query)
        );
        render(filtered);
      };
    }
    
    if (listModalOverlay) listModalOverlay.classList.add('active');
  }

  function attachCopyEvents(container) {
    const copyButtons = container.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const passwordToCopy = button.getAttribute('data-password');
        if (passwordToCopy && navigator.clipboard) {
           navigator.clipboard.writeText(passwordToCopy).catch(err => console.error(err));
        }

        const icon = button.querySelector('i');
        icon.classList.remove('ph-copy');
        icon.classList.add('ph-check');
        button.classList.add('copied');

        setTimeout(() => {
          icon.classList.remove('ph-check');
          icon.classList.add('ph-copy');
          button.classList.remove('copied');
        }, 2000);
      });
    });
  }

  // Handle nav active states
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Master Password Logic
  const masterPasswordModalOverlay = document.getElementById('masterPasswordModalOverlay');
  const masterPasswordForm = document.getElementById('masterPasswordForm');
  const masterPasswordInput = document.getElementById('masterPasswordInput');
  const masterPasswordError = document.getElementById('masterPasswordError');
  let pendingPasswordData = null;

  function openMasterPasswordModal(data) {
    pendingPasswordData = data;
    if (masterPasswordInput) masterPasswordInput.value = '';
    if (masterPasswordError) masterPasswordError.style.display = 'none';
    if (masterPasswordModalOverlay) masterPasswordModalOverlay.classList.add('active');
  }

  if (masterPasswordForm) {
    masterPasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPassword = masterPasswordInput.value;
      if (enteredPassword === 'Sayudh1505') {
        masterPasswordModalOverlay.classList.remove('active');
        if (pendingPasswordData) {
          openAddModalWithData(pendingPasswordData);
          pendingPasswordData = null;
        }
      } else {
        if (masterPasswordError) masterPasswordError.style.display = 'block';
      }
    });
  }

  document.getElementById('closeMasterModalBtn')?.addEventListener('click', () => {
    masterPasswordModalOverlay.classList.remove('active');
    pendingPasswordData = null;
  });

  const toggleMasterPasswordBtn = document.getElementById('toggleMasterPasswordBtn');
  if (toggleMasterPasswordBtn && masterPasswordInput) {
    toggleMasterPasswordBtn.addEventListener('click', () => {
      const type = masterPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      masterPasswordInput.setAttribute('type', type);
      const icon = toggleMasterPasswordBtn.querySelector('i');
      if (type === 'text') {
        icon.classList.remove('ph-eye');
        icon.classList.add('ph-eye-slash');
      } else {
        icon.classList.remove('ph-eye-slash');
        icon.classList.add('ph-eye');
      }
    });
  }

  // Add/Edit Modal Logic
  function openAddModalWithData(data = null) {
    const siteNameInput = document.getElementById('addSiteName');
    const usernameInput = document.getElementById('addUsername');
    const emailInput = document.getElementById('addEmail');
    const passwordInput = document.getElementById('addPassword');
    const categoryInput = document.getElementById('addCategory');
    const submitBtn = document.querySelector('#addPasswordForm button[type="submit"]');
    const deleteBtn = document.getElementById('deletePasswordBtn');

    if (data) {
      // Editing/Viewing existing password
      if (siteNameInput) siteNameInput.value = data.service_name;
      if (usernameInput) usernameInput.value = data.service_email; 
      if (emailInput) emailInput.value = data.service_email;
      if (passwordInput) passwordInput.value = data.service_password;
      if (categoryInput) categoryInput.value = data.category || 'Personal';
      
      if (submitBtn) submitBtn.innerText = 'Update Password';
      if (deleteBtn) deleteBtn.style.display = 'block';
      if (addForm) addForm.dataset.editingId = data.id;
    } else {
      // Adding new password
      if (siteNameInput) siteNameInput.value = '';
      if (categoryInput) categoryInput.value = 'Personal';
      if (addForm) {
        addForm.reset();
        delete addForm.dataset.editingId;
      }
      if (submitBtn) submitBtn.innerText = 'Ok Done';
      if (deleteBtn) deleteBtn.style.display = 'none';
    }

    if (addModalOverlay) addModalOverlay.classList.add('active');
  }

  // Bind top buttons to open empty modal
  const openModalBtn = document.getElementById('openAddModalBtn');
  if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
      openModalBtn.style.transform = 'scale(0.95)';
      setTimeout(() => openModalBtn.style.transform = '', 150);
      openAddModalWithData(null);
    });
  }

  // Bind category cards to open List Modal
  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const title = card.querySelector('h3').innerText;
      let filtered = passwordsCache;
      if (title !== 'All Passwords') {
        filtered = passwordsCache.filter(pw => pw.category === title);
      }
      renderListModal(filtered, title);
    });
  });

  // Close modals logic
  document.getElementById('closeAddModalBtn')?.addEventListener('click', () => {
    addModalOverlay.classList.remove('active');
  });
  
  document.getElementById('closeListModalBtn')?.addEventListener('click', () => {
    listModalOverlay.classList.remove('active');
  });

  [addModalOverlay, listModalOverlay].forEach(overlay => {
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    }
  });
  
  // Handle form submission (POST new or PUT update)
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const siteNameInput = document.getElementById('addSiteName')?.value;
      const usernameInput = document.getElementById('addUsername')?.value;
      const emailInput = document.getElementById('addEmail')?.value;
      const categoryInput = document.getElementById('addCategory')?.value;
      const passwordInput = document.getElementById('addPassword')?.value;
      
      const payload = {
        service_name: siteNameInput || usernameInput || 'Unknown App',
        service_email: emailInput || usernameInput || 'N/A',
        service_password: passwordInput,
        category: categoryInput || 'Personal'
      };
      
      const submitBtn = addForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.innerText = 'Saving...';
      
      const editingId = addForm.dataset.editingId;
      const url = editingId ? `/api/passwords/${editingId}` : '/api/passwords';
      const method = editingId ? 'PUT' : 'POST';
      
      try {
        const response = await fetch(url, {
          method: method,
          headers: { 
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          submitBtn.innerText = 'Saved!';
          submitBtn.style.backgroundColor = '#10b981';
          
          await loadPasswords(); // Refresh main list and cache
          
          setTimeout(() => {
            addModalOverlay.classList.remove('active');
            setTimeout(() => {
              submitBtn.innerText = 'Ok Done';
              submitBtn.style.backgroundColor = '';
              addForm.reset();
              delete addForm.dataset.editingId;
            }, 300);
          }, 800);
        } else {
          throw new Error('Failed to save');
        }
      } catch (err) {
        console.error(err);
        submitBtn.innerText = 'Error!';
        submitBtn.style.backgroundColor = '#ef4444';
        setTimeout(() => {
          submitBtn.innerText = originalText;
          submitBtn.style.backgroundColor = '';
        }, 2000);
      }
    });
  }

  // Handle delete password
  const deleteBtn = document.getElementById('deletePasswordBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const editingId = addForm?.dataset.editingId;
      if (!editingId) return;
      
      const confirmDelete = confirm('Are you sure you want to delete this password?');
      if (!confirmDelete) return;
      
      try {
        const response = await fetch(`/api/passwords/${editingId}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        });
        
        if (response.ok) {
          await loadPasswords(); // Refresh main list and cache
          if (addModalOverlay) addModalOverlay.classList.remove('active');
          if (addForm) {
            addForm.reset();
            delete addForm.dataset.editingId;
          }
        } else {
          throw new Error('Failed to delete');
        }
      } catch (err) {
        console.error(err);
        alert('Error deleting password');
      }
    });
  }

  // Password visibility toggle
  const togglePasswordBtn = document.getElementById('addPasswordToggleBtn');
  const passwordInput = document.getElementById('addPassword');
  
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      const icon = togglePasswordBtn.querySelector('i');
      if (type === 'text') {
        icon.classList.remove('ph-eye');
        icon.classList.add('ph-eye-slash');
      } else {
        icon.classList.remove('ph-eye-slash');
        icon.classList.add('ph-eye');
      }
    });
  }

  // Initial load
  checkAuthState();
});
