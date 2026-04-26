// Navigation
function navigate(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });

    if (pageId === 'support') loadSupportStats();
    if (pageId === 'announcements') loadAnnouncements();
    if (pageId === 'action-board') loadActionBoard();
    
    window.scrollTo(0, 0);
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(e.target.getAttribute('data-page'));
    });
});

// Feedback Submission
document.getElementById('feedback-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-feedback-btn');
    const resultMsg = document.getElementById('feedback-result');
    
    btn.disabled = true;
    btn.textContent = "Submitting...";
    
    const payload = {
        category: document.getElementById('f-category').value,
        message: document.getElementById('f-message').value,
        urgency: document.getElementById('f-urgency').value,
        grade: document.getElementById('f-grade').value
    };

    if (window.runFilter) {
        const filterResult = window.runFilter(payload.message, "Feedback");
        if (!filterResult.passed) {
            resultMsg.innerHTML = `<span class="error-text">${filterResult.message}</span>`;
            btn.disabled = false;
            btn.textContent = "Submit Feedback";
            return;
        }
    }

    try {
        const res = await fetch('/api/feedback', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok) {
            resultMsg.innerHTML = `<span class="success-text">Success! Your secure Case ID is: <b>${data.case_id}</b>. Please save this to track your case.</span>`;
            document.getElementById('feedback-form').reset();
        } else {
            resultMsg.innerHTML = `<span class="error-text">Error: ${data.error}</span>`;
        }
    } catch (err) {
        resultMsg.innerHTML = `<span class="error-text">Network error occurred.</span>`;
    }
    
    btn.disabled = false;
    btn.textContent = "Submit Feedback";
});

// Track Case
async function trackCase() {
    const caseId = document.getElementById('t-caseid').value.trim();
    const box = document.getElementById('tracking-result');
    
    if (!caseId) return;
    
    box.style.display = 'block';
    box.innerHTML = 'Searching...';
    
    try {
        const res = await fetch(`/api/tracking/${caseId}`);
        const data = await res.json();
        
        if (res.ok) {
            let statusClass = 'status-Received';
            if (data.status.includes('Review')) statusClass = 'status-Review';
            if (data.status === 'Escalated') statusClass = 'status-Escalated';
            if (data.status === 'Resolved') statusClass = 'status-Resolved';
            
            box.innerHTML = `
                <p><strong>Category:</strong> ${data.category}</p>
                <p><strong>Urgency:</strong> ${data.urgency}</p>
                <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${data.status}</span></p>
            `;
        } else {
            box.innerHTML = `<span class="error-text">${data.error}</span>`;
        }
    } catch (err) {
        box.innerHTML = `<span class="error-text">Error fetching case.</span>`;
    }
}

// Support Counter
async function loadSupportStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        document.getElementById('support-counter').textContent = data.count || 0;
    } catch (err) {}
}

async function pledgeSupport() {
    const btn = document.getElementById('pledge-btn');
    const msg = document.getElementById('support-msg');
    
    if (localStorage.getItem('supported_fire_ice')) {
        msg.innerHTML = '<span class="success-text">You have already supported!</span>';
        return;
    }
    
    btn.disabled = true;
    try {
        const res = await fetch('/api/support', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('support-counter').textContent = data.count;
            localStorage.setItem('supported_fire_ice', 'true');
            msg.innerHTML = '<span class="success-text">Thank you for your support!</span>';
        }
    } catch (err) {
        msg.innerHTML = '<span class="error-text">Failed to register support.</span>';
        btn.disabled = false;
    }
}

// Load Announcements
async function loadAnnouncements() {
    const list = document.getElementById('announcements-list');
    try {
        const res = await fetch('/api/announcements');
        const data = await res.json();
        if (data.length === 0) {
            list.innerHTML = '<p>No announcements yet.</p>';
            return;
        }
        list.innerHTML = data.map(a => `
            <div class="card" style="margin-bottom:1rem; padding: 1.5rem;">
                <h4>${a.title}</h4>
                <small style="color: #6b7280;">${new Date(a.date).toLocaleDateString()}</small>
                <p style="margin-top: 0.5rem;">${a.description}</p>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = '<p class="error-text">Failed to load announcements.</p>';
    }
}

// Load Action Board
async function loadActionBoard() {
    const tbody = document.getElementById('action-table-body');
    try {
        const res = await fetch('/api/action_board');
        const data = await res.json();
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">No active cases to display right now.</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(item => {
            let statusClass = 'status-Received';
            if (item.status.includes('Review')) statusClass = 'status-Review';
            if (item.status === 'Escalated') statusClass = 'status-Escalated';
            if (item.status === 'Resolved') statusClass = 'status-Resolved';
            
            return `
            <tr>
                <td>${item.category} Case</td>
                <td><span class="status-badge ${statusClass}">${item.status}</span></td>
            </tr>
        `}).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="2" class="error-text">Failed to load action board.</td></tr>';
    }
}

// --- NEW FEATURES LOGIC ---

// Call these loaders when navigating
const originalNavigate = navigate;
navigate = function(pageId) {
    originalNavigate(pageId);
    if (pageId === 'pulse') loadPulse();
    if (pageId === 'idea-box') loadFeaturedIdeas();
    if (pageId === 'lost-found') { currentLFTab = 'Lost'; loadLF(); }
    if (pageId === 'study-groups') loadStudyGroups();
    if (pageId === 'home') loadPulseSnapshot();
    
    // Close mobile nav on navigate
    document.getElementById('nav-menu').classList.remove('nav-open');
    setTimeout(() => { if(window.lucide) lucide.createIcons(); }, 50);
}

// Mobile Menu
function toggleNav() {
    document.getElementById('nav-menu').classList.toggle('nav-open');
}

// Initial Home Load
document.addEventListener("DOMContentLoaded", () => {
    loadPulseSnapshot();
});

// Pulse
async function loadPulse() {
    const list = document.getElementById('pulse-list');
    try {
        const res = await fetch('/api/pulse');
        const data = await res.json();
        
        let totalVotes = data.reduce((sum, item) => sum + item.votes, 0) || 1; // avoid /0

        list.innerHTML = data.map((item, idx) => {
            const pct = Math.round((item.votes / totalVotes) * 100);
            const isTop3 = idx < 3;
            const hasVoted = localStorage.getItem('pulse_voted') === 'true';
            return `
            <div class="pulse-issue">
                <div class="pulse-info">
                    <strong>${item.issue_name}</strong> ${isTop3 ? '<span class="badge-priority">Priority</span>' : ''}
                    <div class="pulse-bar-bg"><div class="pulse-bar-fill animated-bar" data-width="${pct}%" style="width: 0%;"></div></div>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 0.8rem; color: var(--text-label); display:block;">${item.votes} votes</span>
                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" ${hasVoted ? 'disabled' : ''} onclick="votePulse('${item.id}')">Upvote</button>
                </div>
            </div>`;
        }).join('');
        
        observeAnimatedBars();
    } catch (e) {
        list.innerHTML = 'Error loading issues.';
    }
}

async function votePulse(id) {
    if (localStorage.getItem('pulse_voted')) return;
    try {
        const res = await fetch('/api/pulse/vote/' + id, {method: 'POST'});
        if (res.ok) {
            localStorage.setItem('pulse_voted', 'true');
            loadPulse();
            loadPulseSnapshot();
        }
    } catch (e) { alert("Failed to vote"); }
}

async function loadPulseSnapshot() {
    const list = document.getElementById('home-pulse-snapshot');
    if(!list) return;
    try {
        const res = await fetch('/api/pulse');
        const data = await res.json();
        const top3 = data.slice(0, 3);
        let totalVotes = data.reduce((sum, item) => sum + item.votes, 0) || 1;
        
        list.innerHTML = top3.map(item => {
            const pct = Math.round((item.votes / totalVotes) * 100);
            return `
            <div style="margin-bottom: 0.75rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
                    <span style="font-weight: 500;">${item.issue_name}</span><span style="color:var(--text-label);">${item.votes}</span>
                </div>
                <div class="pulse-bar-bg" style="height: 6px;"><div class="pulse-bar-fill animated-bar" data-width="${pct}%" style="width: 0%;"></div></div>
            </div>`;
        }).join('');
        
        observeAnimatedBars();
    } catch (e) {}
}

function observeAnimatedBars() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                const bar = entry.target;
                bar.style.width = bar.getAttribute('data-width');
                observer.unobserve(bar);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.animated-bar').forEach(bar => observer.observe(bar));
}

// Idea Box
document.getElementById('idea-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(localStorage.getItem('idea_submitted')) {
        document.getElementById('idea-result').innerHTML = '<span class="error-text">You already submitted an idea recently.</span>';
        return;
    }
    const payload = {
        title: document.getElementById('i-title').value,
        description: document.getElementById('i-desc').value,
        category: document.getElementById('i-category').value,
        impact: document.getElementById('i-impact').value
    };

    if (window.runFilter) {
        const filterResult = window.runFilter(payload.description, "Idea Box");
        if (!filterResult.passed) {
            document.getElementById('idea-result').innerHTML = `<span class="error-text">${filterResult.message}</span>`;
            return;
        }
    }
    try {
        const res = await fetch('/api/ideas', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('idea-result').innerHTML = `<span class="success-text">Idea Submitted! ID: ${data.idea_id}</span>`;
            localStorage.setItem('idea_submitted', 'true');
            document.getElementById('idea-form').reset();
        } else {
            document.getElementById('idea-result').innerHTML = `<span class="error-text">${data.error}</span>`;
        }
    } catch (err) {
        document.getElementById('idea-result').innerHTML = '<span class="error-text">Network error</span>';
    }
});

async function loadFeaturedIdeas() {
    const list = document.getElementById('featured-ideas-list');
    try {
        const res = await fetch('/api/ideas/featured');
        const data = await res.json();
        if (data.length === 0) { list.innerHTML = '<p>No featured ideas yet.</p>'; return; }
        list.innerHTML = data.map(i => `
            <div class="idea-card featured">
                <h4 style="margin-bottom: 0.5rem;">${i.title} <span class="impact-badge">${i.impact}</span></h4>
                <p style="font-size: 0.9rem;">${i.description}</p>
                <div class="idea-meta">Category: ${i.category} | Status: <strong style="color:var(--fire-color);">${i.status}</strong></div>
            </div>
        `).join('');
    } catch (e) { list.innerHTML = 'Error loading ideas.'; }
}

// Lost & Found
let currentLFTab = 'Lost';
function switchLFTab(tab) {
    currentLFTab = tab;
    document.querySelectorAll('#lost-found .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadLF();
}

document.getElementById('lf-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        type: document.getElementById('lf-type').value,
        item_name: document.getElementById('lf-item').value,
        location: document.getElementById('lf-loc').value,
        description: document.getElementById('lf-desc').value,
        contact: document.getElementById('lf-contact').value
    };
    try {
        const res = await fetch('/api/lost_found', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
        if (res.ok) {
            document.getElementById('lf-result').innerHTML = '<span class="success-text">Posted!</span>';
            document.getElementById('lf-form').reset();
            loadLF();
        }
    } catch (err) {}
});

async function loadLF() {
    const list = document.getElementById('lf-list');
    try {
        const res = await fetch('/api/lost_found');
        const data = await res.json();
        const filtered = data.filter(i => i.type === currentLFTab);
        if (filtered.length === 0) { list.innerHTML = `<p>No ${currentLFTab} items.</p>`; return; }
        list.innerHTML = filtered.map(i => `
            <div class="lf-card">
                <h4>${i.item_name}</h4>
                <p style="font-size:0.9rem;"><strong>Location:</strong> ${i.location}</p>
                <p style="font-size:0.9rem;"><strong>Desc:</strong> ${i.description}</p>
                ${i.contact ? `<p style="font-size:0.9rem;"><strong>Contact:</strong> ${i.contact}</p>` : ''}
                <div class="idea-meta">Posted: ${new Date(i.date_posted).toLocaleDateString()}</div>
            </div>
        `).join('');
    } catch (e) {}
}

// Study Groups
document.getElementById('sg-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        subject: document.getElementById('sg-subj').value,
        topic: document.getElementById('sg-topic').value,
        looking_for: document.getElementById('sg-look').value,
        grade: document.getElementById('sg-grade').value,
        preferred_time: document.getElementById('sg-time').value
    };
    try {
        const res = await fetch('/api/study_groups', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
        if (res.ok) {
            document.getElementById('sg-result').innerHTML = '<span class="success-text">Posted!</span>';
            document.getElementById('sg-form').reset();
            loadStudyGroups();
        }
    } catch (err) {}
});

async function loadStudyGroups() {
    const list = document.getElementById('sg-list');
    try {
        const res = await fetch('/api/study_groups');
        const data = await res.json();
        if (data.length === 0) { list.innerHTML = '<p>No study groups posted.</p>'; list.classList.remove('pinboard'); return; }
        list.classList.add('pinboard');
        list.innerHTML = data.map(i => `
            <div class="pin-card">
                <h4 style="color:var(--ice-color);">${i.subject}</h4>
                <p style="font-size:0.9rem; font-weight:bold;">${i.topic}</p>
                <p style="font-size:0.85rem; margin-top:0.5rem;"><strong>Grade:</strong> ${i.grade}</p>
                <p style="font-size:0.85rem;"><strong>Looking for:</strong> ${i.looking_for}</p>
                <p style="font-size:0.85rem;"><strong>Time:</strong> ${i.preferred_time}</p>
            </div>
        `).join('');
    } catch (e) {}
}
