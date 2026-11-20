/**
 * ====================================================================
 *   BioCraft Admin Dashboard — Supabase Master Configuration
 * ====================================================================
 * ضع إعدادات مشروع Supabase الخاص بك هنا للاتصال المباشر بقاعدة البيانات:
 */

const SUPABASE_URL = 'https://YOUR_SUPABASE_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const PUBLIC_PLATFORM_URL = 'https://1234567890vi.github.io/linkbio-generator';

// ====================================================================
// Mock / Fallback Store (للعمل التلقائي الفوري لحين حقن مفاتيح Supabase)
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
      { id: 4, platform: "whatsapp", value: "0659087568", customTitle: "WhatsApp" }
    ]
  },
  {
    id: "2",
    slug: "samir-tech",
    site_title: "سمير عثماني | مهندس برمجيات",
    display_name: "سمير عثماني",
    bio: "Full Stack Engineer & Cloud Architect",
    avatar_data: "",
    theme: "royal",
    bg_style: "mesh",
    verified: true,
    is_vip: false,
    vip_badge: null,
    is_active: true,
    views_count: 890,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    links_json: []
  },
  {
    id: "3",
    slug: "nour-design",
    site_title: "نور الدين مصمم جرافيك",
    display_name: "نور الدين بن سالم",
    bio: "UI/UX Designer & Brand Strategist",
    avatar_data: "",
    theme: "cyber",
    bg_style: "particles",
    verified: false,
    is_vip: true,
    vip_badge: "VIP DESIGNER",
    is_active: true,
    views_count: 654,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    links_json: []
  }
];

let mockSettings = {
  maintenance_mode: false,
  allow_new_sites: true,
  announcement_text: "مرحباً بكم في منصة BioCraft — أصدرنا قوالب جديدة وميزات VIP متقدمة!",
  announcement_type: "info",
  default_theme: "obsidian"
};

let mockVipCodes = [
  { id: "1", code: "VIP-2026-GOLD", tier: "vip_pro", is_active: true, is_used: true, used_by_slug: "abdeljalil", created_at: new Date().toISOString() },
  { id: "2", code: "VIP-9944-DIAMOND", tier: "vip_pro", is_active: true, is_used: false, used_by_slug: null, created_at: new Date().toISOString() },
  { id: "3", code: "VIP-7712-CREATOR", tier: "vip_pro", is_active: true, is_used: false, used_by_slug: null, created_at: new Date().toISOString() }
];

// ====================================================================
// Supabase Client Helper Functions
// ====================================================================

function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_URL && 
    SUPABASE_ANON_KEY && 
    !SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT') && 
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
  );
}

let _supabaseClient = null;

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  if (!isSupabaseConfigured()) return null;

  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return _supabaseClient;
    }
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
  return null;
}

// Global Auth State
let currentAdminUser = null;

async function checkAdminSession() {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data: { session }, error } = await client.auth.getSession();
      if (session && !error) {
        currentAdminUser = session.user;
        return currentAdminUser;
      }
    } catch (e) {
      console.warn('Session check error:', e);
    }
  }

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
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });
    if (error) throw error;
    currentAdminUser = data.user;
    return currentAdminUser;
  }

  // Fallback demo login
  if (email.toLowerCase().includes('admin') || password.length >= 6) {
    currentAdminUser = {
      id: 'admin-local-1',
      email: email.trim(),
      role: 'super_admin',
      user_metadata: { name: 'مدير المنصة العام' }
    };
    sessionStorage.setItem('biocraft_admin_session', JSON.stringify(currentAdminUser));
    return currentAdminUser;
  }

  throw new Error('بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور.');
}

async function adminSignOut() {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {}
  }
  currentAdminUser = null;
  sessionStorage.removeItem('biocraft_admin_session');
}

// Fetch Master Dashboard Data
async function fetchDashboardData() {
  const client = getSupabaseClient();

  if (client) {
    try {
      const [pRes, sRes, vRes] = await Promise.all([
        client.from('profiles').select('*').order('views_count', { ascending: false }),
        client.from('platform_settings').select('*').eq('id', 1).maybeSingle(),
        client.from('vip_codes').select('*').order('created_at', { ascending: false })
      ]);

      if (pRes.error) throw pRes.error;

      return {
        profiles: pRes.data || [],
        settings: sRes.data || mockSettings,
        vipCodes: vRes.data || [],
        isLiveSupabase: true
      };
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to mock store:', err);
    }
  }

  return {
    profiles: [...mockProfiles],
    settings: { ...mockSettings },
    vipCodes: [...mockVipCodes],
    isLiveSupabase: false
  };
}

async function toggleProfileStatus(slug, currentActive) {
  const client = getSupabaseClient();
  const nextActive = !currentActive;

  if (client) {
    const { error } = await client
      .from('profiles')
      .update({ is_active: nextActive })
      .eq('slug', slug);
    if (error) throw error;
    return nextActive;
  }

  const p = mockProfiles.find(x => x.slug === slug);
  if (p) p.is_active = nextActive;
  return nextActive;
}

async function toggleProfileVerification(slug, currentVerified) {
  const client = getSupabaseClient();
  const nextVerified = !currentVerified;

  if (client) {
    const { error } = await client
      .from('profiles')
      .update({ verified: nextVerified })
      .eq('slug', slug);
    if (error) throw error;
    return nextVerified;
  }

  const p = mockProfiles.find(x => x.slug === slug);
  if (p) p.verified = nextVerified;
  return nextVerified;
}

async function toggleProfileVipStatus(slug, currentVip) {
  const client = getSupabaseClient();
  const nextVip = !currentVip;

  if (client) {
    const { error } = await client
      .from('profiles')
      .update({ 
        is_vip: nextVip,
        vip_badge: nextVip ? 'VIP CREATOR' : null
      })
      .eq('slug', slug);
    if (error) throw error;
    return nextVip;
  }

  const p = mockProfiles.find(x => x.slug === slug);
  if (p) {
    p.is_vip = nextVip;
    p.vip_badge = nextVip ? 'VIP CREATOR' : null;
  }
  return nextVip;
}

async function updateProfileRemote(slug, updates) {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client
      .from('profiles')
      .update(updates)
      .eq('slug', slug);
    if (error) throw error;
    return true;
  }

  const p = mockProfiles.find(x => x.slug === slug);
  if (p) Object.assign(p, updates);
  return true;
}

async function deleteProfileRemote(slug) {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client
      .from('profiles')
      .delete()
      .eq('slug', slug);
    if (error) throw error;
    return true;
  }

  mockProfiles = mockProfiles.filter(x => x.slug !== slug);
  return true;
}

async function updatePlatformSettingsRemote(newSettings) {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client
      .from('platform_settings')
      .update(newSettings)
      .eq('id', 1);
    if (error) throw error;
    return true;
  }

  Object.assign(mockSettings, newSettings);
  return true;
}

// VIP Codes Generator
async function generateVipCodeRemote(tier = 'vip_pro') {
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const year = new Date().getFullYear();
  const code = `VIP-${year}-${randomChars}`;

  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('vip_codes')
      .insert({
        code: code,
        tier: tier,
        is_active: true,
        is_used: false
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const newCodeObj = {
    id: String(Date.now()),
    code: code,
    tier: tier,
    is_active: true,
    is_used: false,
    used_by_slug: null,
    created_at: new Date().toISOString()
  };
  mockVipCodes.unshift(newCodeObj);
  return newCodeObj;
}

async function deleteVipCodeRemote(id) {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client
      .from('vip_codes')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  mockVipCodes = mockVipCodes.filter(c => c.id !== id);
  return true;
}
