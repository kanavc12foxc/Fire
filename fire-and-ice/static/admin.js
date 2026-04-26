document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = document.getElementById('admin-pass').value;
    const msg = document.getElementById('login-msg');
    
    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({password: pass})
        });
        
        if (res.ok) {
            showDashboard();
        } else {
            msg.innerHTML = '<span class="error-text">Incorrect Password</span>';
        }
    } catch (err) {
        msg.innerHTML = '<span class="error-text">Network error</span>';
    }
});

async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    document.getElementById('login-section').style.display = 'block';
    document.querySelectorAll('.admin-layout').forEach(el => el.style.display = 'none');
}

function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.querySelectorAll('.admin-layout').forEach(el => el.style.display = 'block');
    loadFeedback();
    loadAdminPulse();
    loadAdminIdeas();
    loadAdminLF();
    loadFilterLogs();
}

async function loadFeedback() {
    const tbody = document.getElementById('feedback-table-body');
    try {
        const res = await fetch('/api/admin/feedback');
        if (res.status === 401) { logout(); return; }
        
        const data = await res.json();
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No feedback received yet.</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(item => `
            <tr style="${item.is_spam ? 'opacity: 0.5; background: #fee2e2;' : ''}">
                <td><strong>${item.case_id}</strong></td>
                <td>${new Date(item.created_at).toLocaleDateString()}</td>
                <td>${item.category}</td>
                <td>${item.urgency}</td>
                <td style="max-width: 300px;">${item.message} ${item.is_spam ? '<br><span style="color:red; font-size:12px;">(FLAGGED SPAM)</span>' : ''}</td>
                <td>
                    <select onchange="updateStatus('${item.id}', this.value)" style="padding:0.25rem;">
                        <option value="Received" ${item.status === 'Received' ? 'selected' : ''}>Received</option>
                        <option value="Under Review" ${item.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                        <option value="Escalated" ${item.status === 'Escalated' ? 'selected' : ''}>Escalated</option>
                        <option value="Resolved" ${item.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="error-text">Failed to load feedback.</td></tr>';
    }
}

async function updateStatus(id, newStatus) {
    try {
        await fetch(`/api/admin/feedback/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status: newStatus})
        });
        // Optionally show a toast notification here
    } catch (err) {
        alert("Failed to update status");
    }
}

document.getElementById('announcement-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('a-title').value;
    const desc = document.getElementById('a-desc').value;
    const msg = document.getElementById('announcement-msg');
    
    try {
        const res = await fetch('/api/admin/announcements', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title, description: desc})
        });
        
        if (res.ok) {
            msg.innerHTML = '<span class="success-text">Announcement Posted!</span>';
            document.getElementById('announcement-form').reset();
            setTimeout(() => { msg.innerHTML = ''; }, 3000);
        } else {
            msg.innerHTML = '<span class="error-text">Failed to post</span>';
        }
    } catch (err) {
        msg.innerHTML = '<span class="error-text">Network error</span>';
    }
});

// --- NEW ADMIN FEATURES ---

async function loadAdminPulse() {
    const tbody = document.getElementById('pulse-table-body');
    try {
        const res = await fetch('/api/pulse');
        const data = await res.json();
        tbody.innerHTML = data.map(i => `<tr><td>${i.issue_name}</td><td>${i.votes}</td></tr>`).join('');
    } catch (e) { tbody.innerHTML = '<tr><td colspan="2">Error loading pulse results</td></tr>'; }
}

async function loadAdminIdeas() {
    const tbody = document.getElementById('ideas-table-body');
    try {
        const res = await fetch('/api/admin/ideas');
        const data = await res.json();
        if (data.length === 0) { tbody.innerHTML = '<tr><td colspan="4">No ideas submitted.</td></tr>'; return; }
        
        tbody.innerHTML = data.map(i => `
            <tr style="${i.is_spam ? 'opacity:0.5; background:#fee2e2;' : ''}">
                <td><strong>${i.idea_id}</strong></td>
                <td><strong>${i.title}</strong><br><span style="font-size:0.85rem;">${i.description}</span> ${i.is_spam ? '<span style="color:red; font-size:12px;">(FLAGGED SPAM)</span>' : ''}</td>
                <td>Cat: ${i.category}<br>Impact: ${i.impact}</td>
                <td>
                    <select onchange="updateIdeaStatus('${i.id}', this.value)" style="padding:0.25rem;">
                        <option value="Under Review" ${i.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                        <option value="Acknowledged" ${i.status === 'Acknowledged' ? 'selected' : ''}>Acknowledged</option>
                        <option value="Being explored" ${i.status === 'Being explored' ? 'selected' : ''}>Being explored</option>
                    </select>
                </td>
            </tr>
        `).join('');
    } catch (e) { tbody.innerHTML = '<tr><td colspan="4">Error loading ideas</td></tr>'; }
}

async function updateIdeaStatus(id, newStatus) {
    try {
        await fetch(`/api/admin/ideas/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status: newStatus})
        });
    } catch (err) { alert("Failed to update status"); }
}

async function loadAdminLF() {
    const tbody = document.getElementById('lf-table-body');
    try {
        const res = await fetch('/api/lost_found');
        const data = await res.json();
        if (data.length === 0) { tbody.innerHTML = '<tr><td colspan="4">No items posted.</td></tr>'; return; }
        
        tbody.innerHTML = data.map(i => `
            <tr>
                <td>${i.type}</td>
                <td><strong>${i.item_name}</strong><br><span style="font-size:0.85rem;">Loc: ${i.location} | Desc: ${i.description}</span></td>
                <td>${i.contact || 'N/A'}</td>
                <td><button onclick="deleteLF('${i.id}')" class="btn" style="background:#ef4444; color:white; padding:0.25rem 0.5rem; font-size:0.8rem;">Remove</button></td>
            </tr>
        `).join('');
    } catch (e) { tbody.innerHTML = '<tr><td colspan="4">Error loading L&F</td></tr>'; }
}

async function deleteLF(id) {
    if(!confirm("Are you sure you want to remove this item?")) return;
    try {
        await fetch(`/api/admin/lost_found/${id}`, { method: 'DELETE' });
        loadAdminLF();
    } catch (err) { alert("Failed to delete"); }
}

async function loadFilterLogs() {
    const tbody = document.getElementById('filter-logs-body');
    try {
        const res = await fetch('/api/admin/filter_logs');
        const data = await res.json();
        if (data.length === 0) { tbody.innerHTML = '<tr><td colspan="6">No rejected logs.</td></tr>'; return; }
        
        tbody.innerHTML = data.map(log => `
            <tr>
                <td>${new Date(log.created_at).toLocaleString()}</td>
                <td>${log.form_type}</td>
                <td><span style="color:var(--fire-color); font-weight:bold;">${log.reason}</span></td>
                <td>${log.flagged_tokens ? `<code>${log.flagged_tokens}</code>` : '-'}</td>
                <td><small>${log.truncated_text}</small></td>
                <td>
                    ${log.reason === 'Vernacular' ? 
                        `<button onclick="markFalsePositive('${log.flagged_tokens.split(',')[0].trim()}')" class="btn" style="padding:4px 8px; font-size:0.75rem;">False Positive</button>` 
                        : '-'}
                </td>
            </tr>
        `).join('');
    } catch (e) { tbody.innerHTML = '<tr><td colspan="6">Error loading filter logs.</td></tr>'; }
}

async function markFalsePositive(token) {
    if (!confirm(`Whitelist the token "${token}" so it won't be flagged as Vernacular again?`)) return;
    try {
        const res = await fetch('/api/admin/whitelist', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({token})
        });
        if (res.ok) {
            alert('Added to whitelist! It will take effect on next client load.');
            loadFilterLogs(); // Refresh
        } else {
            alert("Failed to whitelist.");
        }
    } catch(e) {
        alert("Network error.");
    }
}
