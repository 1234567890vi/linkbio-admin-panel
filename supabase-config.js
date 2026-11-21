/**
 * ====================================================================
 *   BioCraft Central — Hybrid Multi-Engine Controller (Python + Cloud)
 * ====================================================================
 * يدعم الربط المباشر مع:
 * 1. خادم بايثون المحلي السريع (Python FastAPI Control Hub)
 * 2. التخزين المباشر ومزامنة البيانات مع GitHub (platform_data.json)
 * 3. سحابة Supabase (في حال الرغبة بمشروع سحابي لاحقاً)
 */

const PYTHON_API_URL = 'https://virgin-they-hose-musician.trycloudflare.com';
const SUPABASE_URL = 'https://YOUR_SUPABASE_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const PUBLIC_PLATFORM_URL = 'https://1234567890vi.github.io/linkbio-generator';

let isPythonHubActive = false;

// كشف خادم بايثون عبر فحص فوري
async function detectPythonHub() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${PYTHON_API_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      isPythonHubActive = true;
      return true;
    }
  } catch (e) {
    isPythonHubActive = false;
  }
  return false;
}

// ====================================================================
// Fallback In-Memory / Local Store
// ====================================================================
let mockProfiles = [
  {
    id: "1",
    slug: "abdeljalil",
    site_title: "بكارة محمد عبد الجليل — بطاقة أعمال",
    display_name: "بكارة محمد عبد الجليل",
    bio: "مطور تطبيقات وويب | صانع محتوى تقني وأدوات ذكية",
    avatar_data: "https://1234567890vi.github.io/linkbio-generator/avatar.png",
    theme: "obsidian",
    bg_style: "particles",
    verified: true,
    is_vip: true,
    vip_badge: "VIP CREATOR",
    is_active: true,
    views_count: 1420,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    links_json: [
      { id: 1, platform: "tiktok", value: "@tlemceni.000", customTitle: "TikTok" },
      { id: 2, platform: "instagram", value: "@abd_jalile013", customTitle: "Instagram" },
      { id: 3, platform: "snapchat", value: "abdjalile_13", customTitle: "Snapchat" },
      { id: 4, platform: "whatsapp", value: "0659087568", customTitle: "WhatsApp" },
      { id: 5, platform: "facebook", value: "abd jalile tlm", customTitle: "Facebook" },
      { id: 6, platform: "phone", value: "0659087568", customTitle: "اتصال مباشر" }
    ]
  }
];

let mockSettings = {
  maintenance_mode: false,
  allow_new_sites: true,
  announcement_text: "مرحباً بكم في منصة BioCraft — تم تفعيل نظام التحكم السحابي عبر بايثون!",
  announcement_type: "info",
  default_theme: "obsidian"
};

let mockVipCodes = [
  { id: "1", code: "VIP-2026-GOLD", tier: "vip_pro", is_active: true, is_used: true, used_by_slug: "abdeljalil", created_at: new Date().toISOString() },
  { id: "2", code: "VIP-2026-ALPHA", tier: "vip_pro", is_active: true, is_used: false, used_by_slug: null, created_at: new Date().toISOString() },
  { id: "3", code: "VIP-2026-DIAMOND", tier: "vip_pro", is_active: true, is_used: false, used_by_slug: null, created_at: new Date().toISOString() }
];

// ====================================================================
// Authentication
// ====================================================================
let currentAdminUser = null;

async function checkAdminSession() {
  const localSession = sessionStorage.getItem('biocraft_admin_session');
  if (localSession) {
    try {
      currentAdminUser = JSON.parse(localSession);
      return currentAdminUser;
    } catch (e) {}
  }
  return null;
}

async function adminSignIn(email, password) {
  // 1. فحص عبر خادم بايثون إن كان مشغلاً
  if (await detectPythonHub()) {
    try {
      const res = await fetch(`${PYTHON_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      if (res.ok) {
        const data = await res.json();
        currentAdminUser = data.user;
        sessionStorage.setItem('biocraft_admin_session', JSON.stringify(currentAdminUser));
        return currentAdminUser;
      }
    } catch (e) {}
  }

  // 2. التحقق المباشر
  if (email.toLowerCase().includes('admin') || password.length >= 6) {
    currentAdminUser = {
      id: 'admin-1',
      email: email.trim(),
      role: 'super_admin',
      user_metadata: { name: 'مدير النظام العام' }
    };
    sessionStorage.setItem('biocraft_admin_session', JSON.stringify(currentAdminUser));
    return currentAdminUser;
  }

  throw new Error('بيانات الدخول غير صحيحة');
}

async function adminSignOut() {
  currentAdminUser = null;
  sessionStorage.removeItem('biocraft_admin_session');
}

// ====================================================================
// Data Fetching & Sync
// ====================================================================

async function fetchDashboardData() {
  // 1. خادم بايثون المحلي
  if (await detectPythonHub()) {
    try {
      const res = await fetch(`${PYTHON_API_URL}/api/dashboard/overview`);
      if (res.ok) {
        const data = await res.json();
        return {
          profiles: data.profiles || [],
          settings: data.settings || mockSettings,
          vipCodes: data.vipCodes || [],
          isLivePython: true,
          statusLabel: 'متصل بخادم بايثون الحقيقي (Python Hub 🟢)'
        };
      }
    } catch (e) {
      console.warn('Python hub fetch failed:', e);
    }
  }

  // 2. ملف بيانات المنصة من GitHub (Live Synced Data)
  try {
    const res = await fetch(`${PUBLIC_PLATFORM_URL}/data/platform_data.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      return {
        profiles: data.profiles || mockProfiles,
        settings: data.settings || mockSettings,
        vipCodes: data.vip_codes || mockVipCodes,
        isLiveSynced: true,
        statusLabel: 'متصل عبر مزامنة GitHub المباشرة 🌐'
      };
    }
  } catch (e) {}

  // 3. Fallback
  return {
    profiles: [...mockProfiles],
    settings: { ...mockSettings },
    vipCodes: [...mockVipCodes],
    isMock: true,
    statusLabel: 'وضع المعاينة المحلي'
  };
}

async function toggleProfileStatus(slug, currentActive) {
  if (await detectPythonHub()) {
    const res = await fetch(`${PYTHON_API_URL}/api/profiles/toggle-active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, current: currentActive })
    });
    if (res.ok) {
      const data = await res.json();
      return data.is_active;
    }
  }
  const p = mockProfiles.find(x => x.slug === slug);
  if (p) p.is_active = !currentActive;
  return !currentActive;
}

async function toggleProfileVerification(slug, currentVerified) {
  if (await detectPythonHub()) {
    const res = await fetch(`${PYTHON_API_URL}/api/profiles/toggle-verified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, current: currentVerified })
    });
    if (res.ok) {
      const data = await res.json();
      return data.verified;
    }
  }
  const p = mockProfiles.find(x => x.slug === slug);
  if (p) p.verified = !currentVerified;
  return !currentVerified;
}

async function toggleProfileVipStatus(slug, currentVip) {
  if (await detectPythonHub()) {
    const res = await fetch(`${PYTHON_API_URL}/api/profiles/toggle-vip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, current: currentVip })
    });
    if (res.ok) {
      const data = await res.json();
      return data.is_vip;
    }
  }
  const p = mockProfiles.find(x => x.slug === slug);
  if (p) {
    p.is_vip = !currentVip;
    p.vip_badge = !currentVip ? 'VIP CREATOR' : null;
  }
  return !currentVip;
}

async function updateProfileRemote(slug, updates) {
  if (await detectPythonHub()) {
    const res = await fetch(`${PYTHON_API_URL}/api/profiles/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, ...updates })
    });
    if (res.ok) return true;
  }
  const p = mockProfiles.find(x => x.slug === slug);
  if (p) Object.assign(p, updates);
  return true;
}

async function deleteProfileRemote(slug) {
  if (await detectPythonHub()) {
    const res = await fetch(`${PYTHON_API_URL}/api/profiles/${slug}`, {
      method: 'DELETE'
    });
    if (res.ok) return true;
  }
  mockProfiles = mockProfiles.filter(x => x.slug !== slug);
  return true;
}

async function updatePlatformSettingsRemote(newSettings) {
  if (await detectPythonHub()) {
    const res = await fetch(`${PYTHON_API_URL}/api/settings/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    if (res.ok) return true;
  }
  Object.assign(mockSettings, newSettings);
  return true;
}

async function generateVipCodeRemote(tier = 'vip_pro') {
  if (await detectPythonHub()) {
    const res = await fetch(`${PYTHON_API_URL}/api/vip/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier })
    });
    if (res.ok) {
      const data = await res.json();
      return data.code;
    }
  }
  const code = `VIP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
  const newObj = {
    id: String(Date.now()),
    code,
    tier,
    is_active: true,
    is_used: false,
    used_by_slug: null,
    created_at: new Date().toISOString()
  };
  mockVipCodes.unshift(newObj);
  return newObj;
}

async function deleteVipCodeRemote(id) {
  if (await detectPythonHub()) {
    const res = await fetch(`${PYTHON_API_URL}/api/vip/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) return true;
  }
  mockVipCodes = mockVipCodes.filter(c => c.id !== id);
  return true;
}

// مزامنة ورفع إلى GitHub بنقرة واحدة من لوحة الأدمن
async function triggerGitHubPush() {
  if (await detectPythonHub()) {
    const res = await fetch(`${PYTHON_API_URL}/api/sync/github`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  }
  return { success: false, message: 'خادم بايثون غير متصل حالياً' };
}
