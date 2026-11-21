#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
  BioCraft Central — Python FastAPI Remote Control & Backend Hub
====================================================================
خادم تحكم خلفي مبني بلغة بايثون للربط المباشر بين لوحة الأدمن ومنصة
توليد المواقع عبر قاعدة بيانات SQLite ومزامنة حية مع مستودع GitHub.
"""

import os
import json
import sqlite3
import random
import subprocess
from datetime import datetime
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# مسارات المشروعين
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.sqlite")
GENERATOR_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "linkbio-generator"))
GENERATOR_DATA_FILE = os.path.join(GENERATOR_DIR, "data", "platform_data.json")

# تهيئة تطبيق FastAPI
app = FastAPI(title="BioCraft Python Control Hub", version="2.0.0")

# تفعيل CORS لجميع الواجهات المحلية والمنشورة
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================================================================
# 1. تهيئة قاعدة بيانات SQLite (Database Initialization)
# ====================================================================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # جدول المواقع والبطاقات (profiles)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        site_title TEXT,
        display_name TEXT NOT NULL,
        bio TEXT,
        avatar_data TEXT,
        avatar_zoom REAL DEFAULT 1.0,
        avatar_pos_y INTEGER DEFAULT 20,
        theme TEXT DEFAULT 'obsidian',
        bg_style TEXT DEFAULT 'particles',
        verified INTEGER DEFAULT 0,
        is_vip INTEGER DEFAULT 0,
        vip_badge TEXT,
        is_active INTEGER DEFAULT 1,
        links_json TEXT DEFAULT '[]',
        vcard_json TEXT DEFAULT '{}',
        views_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # جدول إعدادات المنصة (platform_settings)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS platform_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        maintenance_mode INTEGER DEFAULT 0,
        allow_new_sites INTEGER DEFAULT 1,
        announcement_text TEXT,
        announcement_type TEXT DEFAULT 'info',
        default_theme TEXT DEFAULT 'obsidian',
        updated_at TEXT NOT NULL
    )
    """)

    # جدول أكواد الـ VIP (vip_codes)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vip_codes (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        tier TEXT DEFAULT 'vip_pro',
        is_active INTEGER DEFAULT 1,
        is_used INTEGER DEFAULT 0,
        used_by_slug TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # إدخال الإعدادات الافتراضية إذا لم تكن موجودة
    cursor.execute("SELECT COUNT(*) FROM platform_settings WHERE id = 1")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO platform_settings (id, maintenance_mode, allow_new_sites, announcement_text, announcement_type, default_theme, updated_at)
        VALUES (1, 0, 1, 'مرحباً بكم في منصة BioCraft — تم تفعيل نظام التحكم السحابي عبر خادم بايثون!', 'info', 'obsidian', ?)
        """, (datetime.utcnow().isoformat(),))

    # إدخال بيانات أولية ونموذج للمستخدم بكارة محمد عبد الجليل
    cursor.execute("SELECT COUNT(*) FROM profiles WHERE slug = 'abdeljalil'")
    if cursor.fetchone()[0] == 0:
        sample_links = json.dumps([
            {"id": 1, "platform": "tiktok", "value": "@tlemceni.000", "customTitle": "TikTok"},
            {"id": 2, "platform": "instagram", "value": "@abd_jalile013", "customTitle": "Instagram"},
            {"id": 3, "platform: ": "snapchat", "value": "abdjalile_13", "customTitle": "Snapchat"},
            {"id": 4, "platform": "whatsapp", "value": "0659087568", "customTitle": "WhatsApp"},
            {"id": 5, "platform": "facebook", "value": "abd jalile tlm", "customTitle": "Facebook"},
            {"id": 6, "platform": "phone", "value": "0659087568", "customTitle": "اتصال مباشر"}
        ], ensure_ascii=False)
        sample_vcard = json.dumps({"enabled": True, "phone": "0659087568", "email": "", "city": "الجزائر"}, ensure_ascii=False)

        cursor.execute("""
        INSERT INTO profiles (id, slug, site_title, display_name, bio, avatar_data, avatar_zoom, avatar_pos_y, theme, bg_style, verified, is_vip, vip_badge, is_active, links_json, vcard_json, views_count, created_at, updated_at)
        VALUES ('1', 'abdeljalil', 'بكارة محمد عبد الجليل — بطاقة أعمال', 'بكارة محمد عبد الجليل', 'مطور تطبيقات وويب | صانع محتوى تقني وأدوات ذكية', './avatar.png', 1.0, 20, 'obsidian', 'particles', 1, 1, 'VIP CREATOR', 1, ?, ?, 1420, ?, ?)
        """, (sample_links, sample_vcard, datetime.utcnow().isoformat(), datetime.utcnow().isoformat()))

    # إضافة كود VIP أولي
    cursor.execute("SELECT COUNT(*) FROM vip_codes")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO vip_codes (id, code, tier, is_active, is_used, used_by_slug, created_at)
        VALUES ('1', 'VIP-2026-GOLD', 'vip_pro', 1, 1, 'abdeljalil', ?),
               ('2', 'VIP-2026-ALPHA', 'vip_pro', 1, 0, NULL, ?),
               ('3', 'VIP-2026-DIAMOND', 'vip_pro', 1, 0, NULL, ?)
        """, (datetime.utcnow().isoformat(), datetime.utcnow().isoformat(), datetime.utcnow().isoformat()))

    conn.commit()
    conn.close()

    # كتابة ملف البيانات الأولي لمنصة التوليد
    sync_to_generator_file()

# ====================================================================
# 2. المزامنة الآلية مع ملفات المنصة و GitHub (Sync Engine)
# ====================================================================

def sync_to_generator_file():
    """يكتب الحالة الكاملة للمنصة والمواقع في ملف JSON ثابت يقرأه موقع المنصة فورياً"""
    try:
        os.makedirs(os.path.dirname(GENERATOR_DATA_FILE), exist_ok=True)
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM platform_settings WHERE id = 1")
        settings_row = cursor.fetchone()
        settings = dict(settings_row) if settings_row else {}

        cursor.execute("SELECT * FROM profiles ORDER BY views_count DESC")
        profiles = []
        for row in cursor.fetchall():
            p = dict(row)
            p['verified'] = bool(p['verified'])
            p['is_vip'] = bool(p['is_vip'])
            p['is_active'] = bool(p['is_active'])
            p['links_json'] = json.loads(p.get('links_json') or '[]')
            p['vcard_json'] = json.loads(p.get('vcard_json') or '{}')
            profiles.append(p)

        cursor.execute("SELECT * FROM vip_codes ORDER BY created_at DESC")
        vip_codes = []
        for row in cursor.fetchall():
            v = dict(row)
            v['is_active'] = bool(v['is_active'])
            v['is_used'] = bool(v['is_used'])
            vip_codes.append(v)

        conn.close()

        payload = {
            "sync_engine": "python_fastapi_hub",
            "last_synced_at": datetime.utcnow().isoformat(),
            "settings": settings,
            "profiles": profiles,
            "vip_codes": vip_codes
        }

        with open(GENERATOR_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        return True
    except Exception as e:
        print(f"[Sync Error] {e}")
        return False

def push_to_github():
    """ينفذ git commit & push في مجلد linkbio-generator لتحديث الموقع المنشور على الإنترنت فوراً"""
    try:
        if not os.path.exists(GENERATOR_DIR):
            return False
        subprocess.run(["git", "add", "."], cwd=GENERATOR_DIR, check=True)
        subprocess.run(["git", "commit", "-m", "Auto-sync from Python Control Hub"], cwd=GENERATOR_DIR, check=False)
        subprocess.run(["git", "push", "origin", "main"], cwd=GENERATOR_DIR, check=True)
        return True
    except Exception as e:
        print(f"[GitHub Push Error] {e}")
        return False

# ====================================================================
# 3. واجهات برمجية للتحكم عن بُعد (REST API Endpoints)
# ====================================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "BioCraft Python Hub",
        "version": "2.0.0",
        "db": "sqlite3",
        "time": datetime.utcnow().isoformat()
    }

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
def login(req: LoginRequest):
    # تحقق أمني سريع للأدمن
    if req.email.lower() in ["admin@biocraft.pro", "bakar@abdjalile.com"] and req.password in ["admin123456", "bakar2026"]:
        return {
            "success": True,
            "user": {
                "id": "admin-py-1",
                "email": req.email,
                "role": "super_admin",
                "name": "مدير النظام العام"
            },
            "token": "py_token_" + str(random.randint(100000, 999999))
        }
    raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")

@app.get("/api/dashboard/overview")
def get_dashboard_overview():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM platform_settings WHERE id = 1")
    settings = dict(cursor.fetchone() or {})
    settings['maintenance_mode'] = bool(settings.get('maintenance_mode', 0))
    settings['allow_new_sites'] = bool(settings.get('allow_new_sites', 1))

    cursor.execute("SELECT * FROM profiles ORDER BY views_count DESC")
    profiles = []
    for r in cursor.fetchall():
        p = dict(r)
        p['verified'] = bool(p['verified'])
        p['is_vip'] = bool(p['is_vip'])
        p['is_active'] = bool(p['is_active'])
        p['links_json'] = json.loads(p.get('links_json') or '[]')
        p['vcard_json'] = json.loads(p.get('vcard_json') or '{}')
        profiles.append(p)

    cursor.execute("SELECT * FROM vip_codes ORDER BY created_at DESC")
    vip_codes = []
    for r in cursor.fetchall():
        v = dict(r)
        v['is_active'] = bool(v['is_active'])
        v['is_used'] = bool(v['is_used'])
        vip_codes.append(v)

    conn.close()

    return {
        "success": True,
        "isLivePython": True,
        "settings": settings,
        "profiles": profiles,
        "vipCodes": vip_codes
    }

class ToggleRequest(BaseModel):
    slug: str
    current: bool

@app.post("/api/profiles/toggle-active")
def toggle_profile_active(req: ToggleRequest):
    conn = get_db()
    cursor = conn.cursor()
    next_val = 0 if req.current else 1
    cursor.execute("UPDATE profiles SET is_active = ?, updated_at = ? WHERE slug = ?",
                   (next_val, datetime.utcnow().isoformat(), req.slug))
    conn.commit()
    conn.close()
    sync_to_generator_file()
    return {"success": True, "slug": req.slug, "is_active": bool(next_val)}

@app.post("/api/profiles/toggle-verified")
def toggle_profile_verified(req: ToggleRequest):
    conn = get_db()
    cursor = conn.cursor()
    next_val = 0 if req.current else 1
    cursor.execute("UPDATE profiles SET verified = ?, updated_at = ? WHERE slug = ?",
                   (next_val, datetime.utcnow().isoformat(), req.slug))
    conn.commit()
    conn.close()
    sync_to_generator_file()
    return {"success": True, "slug": req.slug, "verified": bool(next_val)}

@app.post("/api/profiles/toggle-vip")
def toggle_profile_vip(req: ToggleRequest):
    conn = get_db()
    cursor = conn.cursor()
    next_val = 0 if req.current else 1
    badge = "VIP CREATOR" if next_val else None
    cursor.execute("UPDATE profiles SET is_vip = ?, vip_badge = ?, updated_at = ? WHERE slug = ?",
                   (next_val, badge, datetime.utcnow().isoformat(), req.slug))
    conn.commit()
    conn.close()
    sync_to_generator_file()
    return {"success": True, "slug": req.slug, "is_vip": bool(next_val), "vip_badge": badge}

class UpdateProfileRequest(BaseModel):
    slug: str
    display_name: str
    site_title: Optional[str] = ""
    bio: Optional[str] = ""
    theme: Optional[str] = "obsidian"

@app.post("/api/profiles/update")
def update_profile(req: UpdateProfileRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE profiles
    SET display_name = ?, site_title = ?, bio = ?, theme = ?, updated_at = ?
    WHERE slug = ?
    """, (req.display_name, req.site_title, req.bio, req.theme, datetime.utcnow().isoformat(), req.slug))
    conn.commit()
    conn.close()
    sync_to_generator_file()
    return {"success": True, "slug": req.slug}

@app.delete("/api/profiles/{slug}")
def delete_profile(slug: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM profiles WHERE slug = ?", (slug,))
    conn.commit()
    conn.close()
    sync_to_generator_file()
    return {"success": True, "slug": slug}

class SettingsUpdateRequest(BaseModel):
    maintenance_mode: bool
    allow_new_sites: bool
    announcement_text: Optional[str] = None
    default_theme: Optional[str] = "obsidian"

@app.post("/api/settings/update")
def update_settings(req: SettingsUpdateRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE platform_settings
    SET maintenance_mode = ?, allow_new_sites = ?, announcement_text = ?, default_theme = ?, updated_at = ?
    WHERE id = 1
    """, (1 if req.maintenance_mode else 0, 1 if req.allow_new_sites else 0,
          req.announcement_text, req.default_theme, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    sync_to_generator_file()
    return {"success": True, "message": "تم تحديث إعدادات المنصة بنجاح"}

class GenerateVipRequest(BaseModel):
    tier: Optional[str] = "vip_pro"

@app.post("/api/vip/generate")
def generate_vip_code(req: GenerateVipRequest):
    chars = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", k=4))
    year = datetime.utcnow().year
    code = f"VIP-{year}-{chars}"
    new_id = f"vip_{random.randint(10000, 99999)}"

    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT INTO vip_codes (id, code, tier, is_active, is_used, used_by_slug, created_at)
    VALUES (?, ?, ?, 1, 0, NULL, ?)
    """, (new_id, code, req.tier, now))
    conn.commit()
    conn.close()
    sync_to_generator_file()

    return {
        "success": True,
        "code": {
            "id": new_id,
            "code": code,
            "tier": req.tier,
            "is_active": True,
            "is_used": False,
            "used_by_slug": None,
            "created_at": now
        }
    }

@app.delete("/api/vip/{code_id}")
def delete_vip_code(code_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vip_codes WHERE id = ?", (code_id,))
    conn.commit()
    conn.close()
    sync_to_generator_file()
    return {"success": True, "id": code_id}

class RedeemVipRequest(BaseModel):
    code: str
    slug: str

@app.post("/api/vip/redeem")
def redeem_vip_code(req: RedeemVipRequest):
    code_str = req.code.strip().upper()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM vip_codes WHERE upper(code) = ? AND is_active = 1 AND is_used = 0", (code_str,))
    vip = cursor.fetchone()

    if not vip:
        conn.close()
        return {"success": False, "message": "كود VIP غير صحيح أو تم استخدامه مسبقاً"}

    # وضع علامة مستخدم
    now = datetime.utcnow().isoformat()
    cursor.execute("UPDATE vip_codes SET is_used = 1, used_by_slug = ? WHERE id = ?", (req.slug, vip['id']))

    # ترقية الموقع إلى VIP
    cursor.execute("UPDATE profiles SET is_vip = 1, verified = 1, vip_badge = 'VIP CREATOR', updated_at = ? WHERE slug = ?",
                   (now, req.slug))
    conn.commit()
    conn.close()
    sync_to_generator_file()

    return {"success": True, "message": "تم تفعيل كود VIP وشارة التوثيق بنجاح!", "tier": vip['tier']}

@app.post("/api/sync/github")
def trigger_github_sync():
    sync_to_generator_file()
    success = push_to_github()
    return {
        "success": success,
        "message": "تم رفع وتحديث المنصة على GitHub Pages بنجاح" if success else "تم حفظ الملفات محلياً، تأكد من اتصال GitHub"
    }

# ====================================================================
# 4. تشغيل الخادم
# ====================================================================

if __name__ == "__main__":
    init_db()
    print("\n" + "=" * 60)
    print("  🚀 BioCraft Python Control Hub is starting...")
    print("  📍 API URL: http://127.0.0.1:8000")
    print("  📑 Docs:    http://127.0.0.1:8000/docs")
    print("=" * 60 + "\n")
    uvicorn.run("backend_server:app", host="127.0.0.1", port=8000, reload=False)
