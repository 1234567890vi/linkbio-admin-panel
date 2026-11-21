#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
  BioCraft Central — Interactive Python Terminal CLI Tool
====================================================================
أداة سطر الأوامر التفاعلية لإدارة منصة البطاقات الرقمية ومواقع المستخدمين
مباشرة من الطرفية (Terminal) عبر قاعدة بيانات SQLite.
"""

import os
import sys
import json
import sqlite3
import random
import subprocess
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.sqlite")
GENERATOR_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "linkbio-generator"))
DATA_FILE = os.path.join(GENERATOR_DIR, "data", "platform_data.json")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def sync_data():
    try:
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT * FROM platform_settings WHERE id = 1")
        settings = dict(c.fetchone() or {})
        c.execute("SELECT * FROM profiles ORDER BY views_count DESC")
        profiles = []
        for r in c.fetchall():
            p = dict(r)
            p['verified'] = bool(p['verified'])
            p['is_vip'] = bool(p['is_vip'])
            p['is_active'] = bool(p['is_active'])
            p['links_json'] = json.loads(p.get('links_json') or '[]')
            p['vcard_json'] = json.loads(p.get('vcard_json') or '{}')
            profiles.append(p)
        c.execute("SELECT * FROM vip_codes ORDER BY created_at DESC")
        vip_codes = [dict(r) for r in c.fetchall()]
        conn.close()

        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "last_synced_at": datetime.utcnow().isoformat(),
                "settings": settings,
                "profiles": profiles,
                "vip_codes": vip_codes
            }, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error syncing data: {e}")
        return False

def push_github():
    print("\n[+] جاري الرفع والمزامنة مع مستودع GitHub Pages...")
    try:
        subprocess.run(["git", "add", "."], cwd=GENERATOR_DIR, check=True)
        subprocess.run(["git", "commit", "-m", "CLI Admin Update"], cwd=GENERATOR_DIR, check=False)
        subprocess.run(["git", "push", "origin", "main"], cwd=GENERATOR_DIR, check=True)
        print("✓ تم الرفع بنجاح! الموقع مباشر الآن على الإنترنت.")
    except Exception as e:
        print(f"[-] خطأ أثناء الرفع: {e}")

def list_profiles():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM profiles ORDER BY views_count DESC")
    rows = c.fetchall()
    conn.close()

    print("\n" + "=" * 70)
    print("  قائمة المواقع والبطاقات المسجلة (Profiles)")
    print("=" * 70)
    print(f"{'الرابط (Slug)':<16} | {'الاسم':<22} | {'الزيارات':<8} | {'موثق':<6} | {'VIP':<6} | {'الحالة':<8}")
    print("-" * 70)
    for r in rows:
        ver = "✓ نعم" if r['verified'] else "✗ لا"
        vip = "★ VIP" if r['is_vip'] else "— عادي"
        act = "نشط" if r['is_active'] else "موقوف"
        print(f"{r['slug']:<16} | {r['display_name'][:20]:<22} | {r['views_count']:<8} | {ver:<6} | {vip:<6} | {act:<8}")
    print("=" * 70)

def toggle_status():
    slug = input("\nأدخل اسم الرابط (Slug) للموقع المراد تفعيله/إيقافه: ").strip()
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT is_active FROM profiles WHERE slug = ?", (slug,))
    row = c.fetchone()
    if not row:
        print(f"[-] الموقع ({slug}) غير موجود!")
        conn.close()
        return
    next_val = 0 if row['is_active'] else 1
    c.execute("UPDATE profiles SET is_active = ?, updated_at = ? WHERE slug = ?",
              (next_val, datetime.utcnow().isoformat(), slug))
    conn.commit()
    conn.close()
    sync_data()
    status_str = "تفعيل" if next_val else "إيقاف"
    print(f"✓ تم {status_str} الموقع ({slug}) بنجاح!")

def toggle_verified():
    slug = input("\nأدخل اسم الرابط (Slug) للموقع المراد منحه/سحب التوثيق منه: ").strip()
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT verified FROM profiles WHERE slug = ?", (slug,))
    row = c.fetchone()
    if not row:
        print(f"[-] الموقع ({slug}) غير موجود!")
        conn.close()
        return
    next_val = 0 if row['verified'] else 1
    c.execute("UPDATE profiles SET verified = ?, updated_at = ? WHERE slug = ?",
              (next_val, datetime.utcnow().isoformat(), slug))
    conn.commit()
    conn.close()
    sync_data()
    v_str = "منح شارة التوثيق لـ" if next_val else "سحب شارة التوثيق من"
    print(f"✓ تم {v_str} الموقع ({slug}) بنجاح!")

def toggle_vip():
    slug = input("\nأدخل اسم الرابط (Slug) للموقع المراد ترقيته/إلغاء ميزات VIP له: ").strip()
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT is_vip FROM profiles WHERE slug = ?", (slug,))
    row = c.fetchone()
    if not row:
        print(f"[-] الموقع ({slug}) غير موجود!")
        conn.close()
        return
    next_val = 0 if row['is_vip'] else 1
    badge = "VIP CREATOR" if next_val else None
    c.execute("UPDATE profiles SET is_vip = ?, vip_badge = ?, updated_at = ? WHERE slug = ?",
              (next_val, badge, datetime.utcnow().isoformat(), slug))
    conn.commit()
    conn.close()
    sync_data()
    vip_str = "ترقية إلى VIP" if next_val else "إلغاء ميزات VIP عن"
    print(f"✓ تم {vip_str} الموقع ({slug}) بنجاح!")

def generate_vip():
    chars = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", k=4))
    year = datetime.utcnow().year
    code = f"VIP-{year}-{chars}"
    new_id = f"vip_{random.randint(10000, 99999)}"

    conn = get_db()
    c = conn.cursor()
    c.execute("""
    INSERT INTO vip_codes (id, code, tier, is_active, is_used, used_by_slug, created_at)
    VALUES (?, ?, 'vip_pro', 1, 0, NULL, ?)
    """, (new_id, code, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    sync_data()
    print(f"\n✓ تم توليد كود VIP جديد بنجاح: [{code}]")

def show_settings():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM platform_settings WHERE id = 1")
    s = dict(c.fetchone() or {})
    conn.close()

    print("\n" + "=" * 50)
    print("  إعدادات المنصة الحالية (Platform Settings)")
    print("=" * 50)
    print(f"وضع الصيانة (Maintenance Mode):  {'مفعل ⚠️' if s.get('maintenance_mode') else 'معطل (المنصة تعمل)'}")
    print(f"السماح بإنشاء مواقع جديدة:       {'نعم' if s.get('allow_new_sites') else 'معطل (ممنوع)'}")
    print(f"شريط الإعلان العلوي:            {s.get('announcement_text') or '(فارغ)'}")
    print(f"القالب الافتراضي:               {s.get('default_theme')}")
    print("=" * 50)

    choice = input("\nهل ترغب في تغيير وضع الصيانة؟ (y/n): ").strip().lower()
    if choice == 'y':
        conn = get_db()
        c = conn.cursor()
        new_m = 0 if s.get('maintenance_mode') else 1
        c.execute("UPDATE platform_settings SET maintenance_mode = ?, updated_at = ? WHERE id = 1",
                  (new_m, datetime.utcnow().isoformat()))
        conn.commit()
        conn.close()
        sync_data()
        print(f"✓ تم تغيير وضع الصيانة إلى: {'مفعل' if new_m else 'معطل'}")

def main():
    try:
        from backend_server import init_db
        init_db()
    except Exception:
        pass

    while True:
        print("\n" + "=" * 50)
        print("  👑 BioCraft Central — Python Control Hub (CLI)")
        print("=" * 50)
        print(" [1] عرض جميع المواقع والإحصائيات")
        print(" [2] تفعيل / إيقاف موقع (Active / Suspend)")
        print(" [3] منح / سحب شارة التوثيق (Verified Badge)")
        print(" [4] ترقية حساب إلى VIP (VIP Creator)")
        print(" [5] توليد كود VIP جديد")
        print(" [6] عرض وتعديل إعدادات المنصة (وضع الصيانة)")
        print(" [7] مزامنة ورفع فوري إلى GitHub Pages")
        print(" [8] تشغيل خادم FastAPI للوحة الأدمن")
        print(" [0] خروج")
        print("=" * 50)

        cmd = input("اختر رقم العملية: ").strip()

        if cmd == "1":
            list_profiles()
        elif cmd == "2":
            toggle_status()
        elif cmd == "3":
            toggle_verified()
        elif cmd == "4":
            toggle_vip()
        elif cmd == "5":
            generate_vip()
        elif cmd == "6":
            show_settings()
        elif cmd == "7":
            sync_data()
            push_github()
        elif cmd == "8":
            print("\n[+] جاري تشغيل خادم FastAPI على http://127.0.0.1:8000 ...")
            subprocess.run([sys.executable, os.path.join(BASE_DIR, "backend_server.py")])
        elif cmd == "0":
            print("\nإلى اللقاء!")
            break
        else:
            print("[-] خيار غير صحيح!")

if __name__ == "__main__":
    main()
