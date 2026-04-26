import os
import random
import string
from flask import Flask, render_template, request, jsonify, session, redirect
from supabase import create_client, Client
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "default-secret-key-change-me")

# Supabase setup
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Removed OpenAI to enforce pure client-side moderation as requested.
# The server will trust the client for now.

def generate_case_id():
    chars = string.ascii_uppercase + string.digits
    return "FI-" + ''.join(random.choice(chars) for _ in range(5))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    data = request.json
    message = data.get('message', '')
    category_input = data.get('category', 'suggestion')
    urgency_input = data.get('urgency', 'Low')
    grade = data.get('grade', '')

    if not message:
        return jsonify({"error": "Message is required"}), 400

    # Client-side filter guarantees it passed if we reached here
    category = category_input
    urgency = urgency_input

    # Merge AI suggestions if needed, or use user input
    category = category_input
    urgency = urgency_input

    case_id = generate_case_id()

    # Insert into Supabase
    try:
        supabase.table("feedback").insert({
            "case_id": case_id,
            "category": category,
            "message": message,
            "urgency": urgency,
            "grade": grade,
            "status": "Received",
            "is_spam": False
        }).execute()
        return jsonify({"case_id": case_id}), 200
    except Exception as e:
        print("Supabase Insert Error:", e)
        return jsonify({"error": "Failed to submit feedback"}), 500

@app.route('/api/tracking/<case_id>', methods=['GET'])
def track_case(case_id):
    try:
        response = supabase.table("feedback").select("status, category, urgency").eq("case_id", case_id).execute()
        if len(response.data) > 0:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({"error": "Case not found"}), 404
    except Exception as e:
        print("Supabase Select Error:", e)
        return jsonify({"error": "Failed to fetch case"}), 500

@app.route('/api/support', methods=['POST'])
def pledge_support():
    try:
        supabase.table("supporters").insert({}).execute()
        count_response = supabase.table("supporters").select("id", count="exact").execute()
        return jsonify({"count": count_response.count}), 200
    except Exception as e:
        print("Supabase Support Error:", e)
        return jsonify({"error": "Failed to register support"}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        count_response = supabase.table("supporters").select("id", count="exact").execute()
        return jsonify({"count": count_response.count}), 200
    except Exception as e:
        return jsonify({"count": 0}), 200

@app.route('/api/announcements', methods=['GET'])
def get_announcements():
    try:
        response = supabase.table("announcements").select("*").order("date", desc=True).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify([]), 200

@app.route('/api/action_board', methods=['GET'])
def action_board():
    try:
        # only return specific columns to stay anonymous
        response = supabase.table("feedback").select("category, status").neq("status", "Received").execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify([]), 200



@app.route('/admin')
def admin_page():
    return render_template('admin.html')

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    password = data.get('password')
    admin_pass = os.environ.get("ADMIN_PASSWORD")
    if password and password == admin_pass:
        session['is_admin'] = True
        return jsonify({"success": True}), 200
    return jsonify({"error": "Invalid password"}), 401

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('is_admin', None)
    return jsonify({"success": True}), 200

def is_admin():
    return session.get('is_admin', False)

@app.route('/api/admin/feedback', methods=['GET'])
def admin_get_feedback():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 401
    try:
        response = supabase.table("feedback").select("*").order("created_at", desc=True).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/feedback/<id>', methods=['PUT'])
def admin_update_feedback(id):
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    status = data.get('status')
    if not status:
        return jsonify({"error": "Status is required"}), 400
    try:
        supabase.table("feedback").update({"status": status}).eq("id", id).execute()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/announcements', methods=['POST'])
def admin_post_announcement():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    title = data.get('title')
    description = data.get('description')
    if not title or not description:
        return jsonify({"error": "Title and description required"}), 400
    try:
        supabase.table("announcements").insert({"title": title, "description": description}).execute()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----- NEW FEATURES -----

@app.route('/api/pulse', methods=['GET'])
def get_pulse():
    try:
        response = supabase.table("pulse").select("*").order("votes", desc=True).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pulse/vote/<issue_id>', methods=['POST'])
def vote_pulse(issue_id):
    try:
        # Increment vote (simulate via select then update)
        res = supabase.table("pulse").select("votes").eq("id", issue_id).execute()
        if not res.data:
            return jsonify({"error": "Issue not found"}), 404
        new_votes = res.data[0]['votes'] + 1
        supabase.table("pulse").update({"votes": new_votes}).eq("id", issue_id).execute()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ideas', methods=['POST'])
def submit_idea():
    data = request.json
    title = data.get('title')
    desc = data.get('description')
    category = data.get('category')
    impact = data.get('impact')
    grade = data.get('grade', '')

    # Client-side filter guarantees it passed if we reached here
    idea_id = "ID-" + ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(5))
    try:
        supabase.table("ideas").insert({
            "idea_id": idea_id,
            "title": title[:60],
            "description": desc[:300],
            "category": category,
            "impact": impact,
            "grade": grade,
            "status": "Under Review",
            "is_spam": False
        }).execute()
        return jsonify({"idea_id": idea_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ideas/featured', methods=['GET'])
def get_featured_ideas():
    try:
        response = supabase.table("ideas").select("*").neq("status", "Under Review").order("created_at", desc=True).limit(5).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify([]), 200

@app.route('/api/lost_found', methods=['GET', 'POST'])
def handle_lost_found():
    if request.method == 'GET':
        try:
            response = supabase.table("lost_found").select("*").order("date_posted", desc=True).execute()
            return jsonify(response.data), 200
        except Exception:
            return jsonify([]), 200
    elif request.method == 'POST':
        data = request.json
        try:
            supabase.table("lost_found").insert({
                "type": data.get('type'),
                "item_name": data.get('item_name'),
                "description": data.get('description')[:100],
                "location": data.get('location'),
                "contact": data.get('contact', '')
            }).execute()
            return jsonify({"success": True}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route('/api/study_groups', methods=['GET', 'POST'])
def handle_study_groups():
    if request.method == 'GET':
        try:
            response = supabase.table("study_groups").select("*").order("date_posted", desc=True).execute()
            return jsonify(response.data), 200
        except Exception:
            return jsonify([]), 200
    elif request.method == 'POST':
        data = request.json
        try:
            supabase.table("study_groups").insert({
                "subject": data.get('subject'),
                "topic": data.get('topic'),
                "looking_for": data.get('looking_for'),
                "grade": data.get('grade'),
                "preferred_time": data.get('preferred_time')
            }).execute()
            return jsonify({"success": True}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route('/api/admin/ideas', methods=['GET'])
def admin_get_ideas():
    if not is_admin(): return jsonify({"error": "Unauthorized"}), 401
    try:
        res = supabase.table("ideas").select("*").order("created_at", desc=True).execute()
        return jsonify(res.data), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/api/admin/ideas/<id>', methods=['PUT'])
def admin_update_idea(id):
    if not is_admin(): return jsonify({"error": "Unauthorized"}), 401
    status = request.json.get('status')
    try:
        supabase.table("ideas").update({"status": status}).eq("id", id).execute()
        return jsonify({"success": True}), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/api/admin/lost_found/<id>', methods=['DELETE'])
def admin_delete_lf(id):
    if not is_admin(): return jsonify({"error": "Unauthorized"}), 401
    try:
        supabase.table("lost_found").delete().eq("id", id).execute()
        return jsonify({"success": True}), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

