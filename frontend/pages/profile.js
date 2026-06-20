/* ====================================================
   profile.js — User Profile page logic
   ==================================================== */

let userSkills = [];

function loadProfile() {
  const user = getSession();
  if (!user) return;

  // Sidebar
  const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase();
  document.getElementById('bigAvatar').textContent  = user.avatar || initials;
  document.getElementById('profileName').textContent  = `${user.firstName} ${user.lastName}`;
  document.getElementById('profileRole').textContent  = user.targetRole || 'PrepIQ Member';
  document.getElementById('profileJoined').textContent = `Joined ${user.joinedDate || ''}`;

  document.getElementById('ps-xp').textContent      = user.xp || 0;
  document.getElementById('ps-level').textContent   = user.level || 1;
  document.getElementById('ps-streak').textContent  = user.streak || 0;
  document.getElementById('ps-sessions').textContent = user.practiceCount || 0;

  // Level bar
  const currentXp   = user.xp || 0;
  const level       = user.level || 1;
  const xpForNext   = level * level * 100;
  const xpPrev      = (level - 1) * (level - 1) * 100;
  const pct         = Math.round(((currentXp - xpPrev) / (xpForNext - xpPrev)) * 100);
  document.getElementById('levelLabel').textContent = `Level ${level}`;
  document.getElementById('xpLabel').textContent    = `${currentXp} XP`;
  document.getElementById('levelFill').style.width  = `${Math.min(pct, 100)}%`;
  document.getElementById('levelNext').textContent  = `${xpForNext - currentXp} XP to Level ${level + 1}`;

  // Form defaults
  document.getElementById('pFirstName').value   = user.firstName || '';
  document.getElementById('pLastName').value    = user.lastName  || '';
  document.getElementById('pBio').value         = user.bio       || '';
  document.getElementById('pCollege').value     = user.college   || '';
  document.getElementById('pTargetRole').value  = user.targetRole || 'Software Engineer';

  // Skills chips
  userSkills = [...(user.skills || [])];
  initSkillsInput('skillInput', 'skillsChips', userSkills);
}

async function saveProfile() {
  const btn = document.getElementById('saveProfileBtn');
  btn.textContent = 'Saving…'; btn.disabled = true;
  document.getElementById('editError').textContent   = '';
  document.getElementById('editSuccess').textContent = '';

  const body = {
    firstName:  document.getElementById('pFirstName').value.trim(),
    lastName:   document.getElementById('pLastName').value.trim(),
    bio:        document.getElementById('pBio').value,
    college:    document.getElementById('pCollege').value,
    targetRole: document.getElementById('pTargetRole').value,
    skills:     userSkills,
  };

  if (!body.firstName || !body.lastName) {
    document.getElementById('editError').textContent = 'First and last name are required.';
    btn.textContent = 'Save Changes'; btn.disabled = false; return;
  }

  try {
    const res  = await authFetch(`${API}/api/user/profile`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    saveSession({ ...getSession(), ...data.user });
    document.getElementById('editSuccess').textContent = '✅ Profile updated successfully!';
    showToast('Profile saved!');
    loadProfile(); // refresh sidebar
  } catch (err) {
    document.getElementById('editError').textContent = err.message || 'Failed to save.';
  } finally {
    btn.textContent = 'Save Changes'; btn.disabled = false;
  }
}

async function changePassword() {
  const btn = document.getElementById('changePwBtn');
  btn.textContent = 'Saving…'; btn.disabled = true;
  document.getElementById('pwError').textContent   = '';
  document.getElementById('pwSuccess').textContent = '';

  const current = document.getElementById('pwCurrent').value;
  const newPw   = document.getElementById('pwNew').value;
  const confirm = document.getElementById('pwConfirm').value;

  if (!current || !newPw || !confirm) {
    document.getElementById('pwError').textContent = 'All fields are required.';
    btn.textContent = 'Change Password'; btn.disabled = false; return;
  }
  if (newPw.length < 8) {
    document.getElementById('pwError').textContent = 'New password must be at least 8 characters.';
    btn.textContent = 'Change Password'; btn.disabled = false; return;
  }
  if (newPw !== confirm) {
    document.getElementById('pwError').textContent = 'New passwords do not match.';
    btn.textContent = 'Change Password'; btn.disabled = false; return;
  }

  try {
    const res  = await authFetch(`${API}/api/user/change-password`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ currentPassword: current, newPassword: newPw }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    document.getElementById('pwSuccess').textContent = '✅ Password changed successfully!';
    document.getElementById('pwCurrent').value = '';
    document.getElementById('pwNew').value     = '';
    document.getElementById('pwConfirm').value = '';
    showToast('Password changed!');
  } catch (err) {
    document.getElementById('pwError').textContent = err.message || 'Failed to change password.';
  } finally {
    btn.textContent = 'Change Password'; btn.disabled = false;
  }
}

async function deleteAccount() {
  const pw = document.getElementById('deleteConfirmPw').value;
  if (!pw) { showToast('Enter your password to confirm.', 'error'); return; }

  if (!confirm('Are you absolutely sure? This cannot be undone.')) return;

  const btn = document.getElementById('deleteAccountBtn');
  btn.textContent = 'Deleting…'; btn.disabled = true;

  try {
    const res  = await authFetch(`${API}/api/user/delete-account`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: pw }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    clearSession();
    showToast('Account deleted.');
    setTimeout(() => { window.location.href = '../index.html'; }, 1000);
  } catch (err) {
    showToast(err.message || 'Failed to delete account.', 'error');
    btn.textContent = 'Delete My Account'; btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();

  // Tab switcher
  document.querySelectorAll('.p-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.p-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.p-tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active');
    });
  });

  document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);
  document.getElementById('changePwBtn')?.addEventListener('click', changePassword);
  document.getElementById('deleteAccountBtn')?.addEventListener('click', deleteAccount);
});

