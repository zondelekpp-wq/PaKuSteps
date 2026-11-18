/* PaKu family – shared by every PaKu app (same file in each repository).
   Each app works on its own; this file only lets apps know about each other.
   To add a new app to the family: add it to APPS here (and to family.json on the hub page). */
window.PaKuFamily = (() => {
  const BASE = 'https://zondelekpp-wq.github.io';
  const HUB = BASE + '/PaKuFamily/';
  const STORE = 'paku.family.v1';   // apps announced by the hub page (so older apps learn about new ones)

  const APPS = [
    { id: 'paku', name: 'PaKu', path: '/PaKu/', cache: 'drip-reader-pwa-', storage: null,
      desc: { en: 'Read e-books one chapter at a time.', pl: 'Czytaj e-booki rozdział po rozdziale.', de: 'Lies E-Books Kapitel für Kapitel.', es: 'Lee libros electrónicos capítulo a capítulo.', fr: 'Lis des livres numériques chapitre par chapitre.', zh: '一章一章地读电子书。', uk: 'Читай електронні книжки розділ за розділом.' } },
    { id: 'grounding', name: 'PaKuGrounding', path: '/PaKuGrounding/', cache: 'pakugrounding-', storage: 'pakugrounding.v1',
      desc: { en: 'Grounding and calm for hard moments.', pl: 'Uziemienie i spokój w trudnych chwilach.', de: 'Erdung und Ruhe für schwere Momente.', es: 'Anclaje y calma para los momentos difíciles.', fr: 'Ancrage et apaisement dans les moments difficiles.', zh: '在艰难时刻帮助你着陆、平静下来。', uk: 'Заземлення й спокій у важкі хвилини.' } },
    { id: 'steps', name: 'PaKuSteps', path: '/PaKuSteps/', cache: 'pakusteps-', storage: 'pakusteps.v1',
      desc: { en: 'Tasks broken into small steps, one at a time.', pl: 'Zadania podzielone na małe kroki, jeden naraz.', de: 'Aufgaben in kleinen Schritten, einer nach dem anderen.', es: 'Tareas en pasos pequeños, uno cada vez.', fr: 'Des tâches en petites étapes, une à la fois.', zh: '把任务拆成小步骤，一次一步。', uk: 'Завдання, поділені на маленькі кроки, по одному.' } }
  ];

  const T = {
    fam_title: { en: 'PaKu family', pl: 'Rodzina PaKu', de: 'PaKu-Familie', es: 'Familia PaKu', fr: 'Famille PaKu', zh: 'PaKu 家族', uk: 'Родина PaKu' },
    fam_d: { en: 'Each app works on its own. Use only the ones you need – together they work as a set.', pl: 'Każda aplikacja działa samodzielnie. Korzystaj tylko z tych, których potrzebujesz – razem tworzą zestaw.', de: 'Jede App funktioniert für sich. Nutze nur die, die du brauchst – zusammen bilden sie ein Set.', es: 'Cada app funciona por sí sola. Usa solo las que necesites: juntas forman un conjunto.', fr: 'Chaque app fonctionne seule. Utilise seulement celles dont tu as besoin – ensemble, elles se complètent.', zh: '每个应用都可以单独使用。只用你需要的那些——放在一起，它们就是一整套。', uk: 'Кожен застосунок працює окремо. Користуйся лише тими, що потрібні, — разом вони утворюють набір.' },
    fam_open: { en: 'Open', pl: 'Otwórz', de: 'Öffnen', es: 'Abrir', fr: 'Ouvrir', zh: '打开', uk: 'Відкрити' },
    fam_get: { en: 'Try it', pl: 'Wypróbuj', de: 'Ausprobieren', es: 'Probar', fr: 'Essayer', zh: '试试看', uk: 'Спробувати' },
    fam_used: { en: 'Used on this device', pl: 'Używana na tym urządzeniu', de: 'Auf diesem Gerät genutzt', es: 'Usada en este dispositivo', fr: 'Utilisée sur cet appareil', zh: '已在此设备上使用', uk: 'Використовується на цьому пристрої' },
    fam_this: { en: 'This app', pl: 'Ta aplikacja', de: 'Diese App', es: 'Esta app', fr: 'Cette app', zh: '当前应用', uk: 'Цей застосунок' },
    fam_link: { en: 'Shortcuts in this app', pl: 'Skróty w tej aplikacji', de: 'Verknüpfungen in dieser App', es: 'Accesos directos en esta app', fr: 'Raccourcis dans cette app', zh: '在本应用中显示快捷入口', uk: 'Ярлики в цьому застосунку' },
    fam_link_d: { en: "Turns on by itself once you've used that app on this device. You can also switch it yourself – e.g. on iPhone, where apps can't see each other.", pl: 'Włącza się samo, gdy tamta aplikacja była używana na tym urządzeniu. Możesz to też zmienić ręcznie – np. na iPhonie, gdzie aplikacje nie widzą się nawzajem.', de: 'Wird automatisch aktiviert, sobald du die andere App auf diesem Gerät genutzt hast. Du kannst es auch selbst ändern – z. B. auf dem iPhone, wo Apps einander nicht sehen.', es: 'Se activa sola cuando ya has usado esa app en este dispositivo. También puedes cambiarlo tú, por ejemplo en iPhone, donde las apps no se ven entre sí.', fr: "S'active tout seul dès que tu as utilisé cette app sur cet appareil. Tu peux aussi le changer toi-même – par ex. sur iPhone, où les apps ne se voient pas entre elles.", zh: '在此设备上用过那个应用后会自动开启。你也可以手动更改——例如在 iPhone 上，各应用之间无法互相识别。', uk: 'Вмикається автоматично, щойно ти скористаєшся тим застосунком на цьому пристрої. Можна змінити й вручну — напр. на iPhone, де застосунки не бачать один одного.' },
    fam_hub: { en: 'All PaKu apps', pl: 'Wszystkie aplikacje PaKu', de: 'Alle PaKu-Apps', es: 'Todas las apps PaKu', fr: 'Toutes les apps PaKu', zh: '所有 PaKu 应用', uk: 'Усі застосунки PaKu' }
  };

  let used = {};
  function remote() { try { const r = JSON.parse(localStorage.getItem(STORE) || 'null'); return r && Array.isArray(r.apps) ? r.apps : []; } catch (e) { return []; } }
  const valid = a => a && typeof a.id === 'string' && typeof a.name === 'string' && typeof a.path === 'string' && /^\/[\w-]+\/$/.test(a.path);
  function all() {
    const list = APPS.slice();
    for (const a of remote()) if (valid(a) && !list.some(x => x.id === a.id)) list.push({ id: a.id, name: a.name.slice(0, 40), path: a.path, cache: String(a.cache || ''), storage: a.storage || null, desc: a.desc || {} });
    return list;
  }
  /* Which apps have been opened on this device (in this browser)? They share one web address,
     so their offline caches and saved data are visible here. Installed iPhone apps are kept apart, so there it can say "no". */
  async function detect() {
    let keys = [];
    try { keys = await caches.keys(); } catch (e) { }
    for (const a of all()) {
      let s = false;
      try { s = !!(a.storage && localStorage.getItem(a.storage) != null); } catch (e) { }
      used[a.id] = (a.cache && keys.some(k => k.startsWith(a.cache))) || s;
    }
    return used;
  }
  /* When online, learn about newer family members from the hub page. Never needed for the app to work. */
  async function refresh() {
    if (!navigator.onLine) return;
    try {
      const ctl = new AbortController(); setTimeout(() => ctl.abort(), 5000);
      const r = await fetch(HUB + 'family.json', { cache: 'no-store', signal: ctl.signal });
      if (!r.ok) return;
      const d = await r.json();
      if (d && Array.isArray(d.apps)) localStorage.setItem(STORE, JSON.stringify({ apps: d.apps.filter(valid).slice(0, 30) }));
    } catch (e) { }
  }
  const pick = (o, lang) => (o && (o[lang] || o.en)) || '';
  return {
    all, detect, refresh, hub: HUB,
    used: id => !!used[id],
    url: a => BASE + a.path,
    icon: a => a.path + 'icon-192.png',   // same web address as every PaKu app
    t: (k, lang) => pick(T[k], lang),
    desc: (a, lang) => pick(a.desc, lang)
  };
})();
