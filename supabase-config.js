/**
 * ====================================================================
 *   BioCraft Admin Dashboard — Supabase & Platform Remote Configuration
 * ====================================================================
 * ضع إعدادات مشروع Supabase الخاص بك هنا للاتصال المباشر بقاعدة البيانات:
 */

const SUPABASE_URL = 'https://YOUR_SUPABASE_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const PUBLIC_PLATFORM_URL = 'https://1234567890vi.github.io/linkbio-generator';

// ====================================================================
// Mock / Demo Data Store (لتجربة لوحة التحكم فوراً وبشكل تفاعلي كامل)
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
    is_active: true,
    views_count: 890,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    links_json: [
      { id: 1, platform: "github", value: "samir-dev", customTitle: "GitHub" },
      { id: 2, platform: "linkedin", value: "samir-othmani", customTitle: "LinkedIn" }
    ]
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
    is_active: true,
    views_count: 654,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    links_json: [
      { id: 1, platform: "behance", value: "nour_designs", customTitle: "Behance" },
      { id: 2, platform: "instagram", value: "nour.gfx", customTitle: "Instagram" }
    ]
  },
  {
    id: "4",
    slug: "yasmina-beauty",
    site_title: "صالون ياسمينة للتجميل",
    display_name: "ياسمينة بيوتي",
    bio: "عالم الأناقة والمكياج العصري",
    avatar_data: "",
    theme: "emerald",
    bg_style: "clean",
    verified: false,
    is_active: false,
    views_count: 320,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    links_json: [
      { id: 1, platform: "tiktok", value: "yasmina_beauty", customTitle: "TikTok" }
    ]
  },
  {
    id: "5",
    slug: "karim-fitness",
    site_title: "كوتش كريم | تدريب شخصي",
    display_name: "كريم بوزيد",
    bio: "مدرب لياقة بدنية وتغذية رياضية معتمد",
    avatar_data: "",
    theme: "obsidian",
    bg_style: "particles",
    verified: true,
    is_active: true,
    views_count: 1105,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    links_json: [
      { id: 1, platform: "youtube", value: "@karim_fit", customTitle: "YouTube" },
      { id: 2, platform: "instagram", value: "karim_fitness_dz", customTitle: "Instagram" }
    ]
  },
  {
    id: "6",
    slug: "amina-books",
    site_title: "أمينة | مراجعات كتب وروايات",
    display_name: "أمينة قدوري",
    bio: "شغوفة بالقراءة وتلخيص أحدث الروايات العالمية",
    avatar_data: "",
    theme: "minimal",
    bg_style: "clean",
    verified: false,
    is_active: true,
    views_count: 412,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    links_json: [
      { id: 1, platform: "twitter", value: "amina_reads", customTitle: "X (Twitter)" }
    ]
  }
];

let mockSettings = {
  maintenance_mode: false,
  allow_new_sites: true,
  announcement_text: "مرحباً بكم في منصة BioCraft — أصدرنا قوالب جديدة فائقة الفخامة!",
  default_theme: "obsidian"
};

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

  // Check Demo / Local session
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

  // Fallback / Demo Login Mode
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

// Data Fetchers & Controllers

async function fetchDashboardData() {
  const client = getSupabaseClient();

  if (client) {
    try {
      // 1. Fetch profiles
      const { data: profiles, error: pErr } = await client
        .from('profiles')
        .select('*')
        .order('views_count', { ascending: false });

      if (pErr) throw pErr;

      // 2. Fetch settings
      const { data: settings, error: sErr } = await client
        .from('platform_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (sErr) throw sErr;

      return {
        profiles: profiles || [],
        settings: settings || mockSettings,
        isLiveSupabase: true
      };
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to mock data:', err);
    }
  }

  // Return Mock Data
  return {
    profiles: [...mockProfiles],
    settings: { ...mockSettings },
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

  // Update mock
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

  // Update mock
  const p = mockProfiles.find(x => x.slug === slug);
  if (p) p.verified = nextVerified;
  return nextVerified;
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

  // Update mock
  const p = mockProfiles.find(x => x.slug === slug);
  if (p) {
    Object.assign(p, updates);
  }
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

  // Remove from mock
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

  // Update mock
  Object.assign(mockSettings, newSettings);
  return true;
}
