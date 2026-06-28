// Central Arabic translations for the whole app.
// Keeping all text here means future wording changes happen in one place.

export const T = {
  // App-wide
  appName: 'حرب الأقاليم',
  signIn: 'تسجيل الدخول',
  username: 'اسم المستخدم',
  password: 'كلمة المرور',
  wrongCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
  logout: 'تسجيل الخروج',

  // Admin
  adminDashboard: 'لوحة التحكم',
  releaseResources: 'إطلاق الموارد',
  releaseResourcesDesc: 'يطبّق تكلفة الصيانة والإنتاج على جميع الأقاليم لكل الفرق دفعة واحدة',
  releaseResourcesConfirmTitle: 'هل تريد إطلاق الموارد؟',
  releaseResourcesConfirmDesc: 'سيتم خصم الصيانة وإضافة الإنتاج لكل فريق حسب الأقاليم التي يملكها. الفرق التي لا تستطيع دفع الصيانة ستتجاوز هذه الجولة دون أي عقوبة.',
  cancel: 'إلغاء',
  confirmRelease: 'تأكيد الإطلاق',
  standings: 'الترتيب',
  recentActivity: 'آخر الأحداث',
  noActivity: 'لا توجد أحداث حتى الآن',
  territories: 'الأقاليم',
  units: 'الوحدات',
  goods: 'البضائع',

  // Helper
  helperConsole: 'لوحة المساعد',
  tabUnits: 'الوحدات',
  tabInventory: 'المخزون',
  tabTrade: 'التبادل',
  tabAttack: 'الهجوم',
  selectTeam: 'اختر الفريق',
  selectGood: 'اختر البضاعة',
  reason: 'السبب',
  quickAdjust: 'تعديل سريع',
  customAmount: 'مبلغ مخصص',
  apply: 'تطبيق',
  balance: 'الرصيد',
  has: 'يملك',
  adjustQuantity: 'تعديل الكمية',
  fromTeam: 'من فريق (يعطي)',
  toTeam: 'إلى فريق (يستقبل)',
  whatTransferred: 'ما الذي يتم تبادله',
  amount: 'الكمية',
  executeTransfer: 'تنفيذ التبادل',
  pickTwoTeams: 'اختر فريقين مختلفين',
  enterValidAmount: 'أدخل كمية صحيحة',
  notEnoughUnits: 'لا يملك وحدات كافية',
  notEnoughGoods: 'لا يملك كمية كافية',
  transferComplete: 'تم التبادل بنجاح',
  attackingTeam: 'الفريق المهاجم',
  targetTerritory: 'الإقليم المستهدف',
  weaponUsed: 'السلاح المستخدم',
  owner: 'المالك',
  unclaimed: 'غير مملوك',
  notAdjacentWarning: '⚠ الفريق المهاجم لا يملك إقليمًا مجاورًا',
  homeTerritoryWarning: '⚠ هذا هو الإقليم الرئيسي — لا يمكن الاستيلاء عليه',
  attackFailed: 'فشل الهجوم',
  attackSuccessful: 'نجح الهجوم',
  hpLeft: 'نقاط الصحة المتبقية',
  captured: 'تم الاستيلاء!',

  // Team view
  map: 'الخريطة',
  inventory: 'المخزون',
  prices: 'الأسعار',
  yourUnits: 'وحداتك',
  yourInventory: 'مخزونك',
  homeZone: 'المنطقة',
  away: 'خارج المنطقة',
  empty: 'فاضي',

  // Reasons (must match REASON_TAGS keys order in gameConfig)
  reasonChallengeWin: 'فوز بتحدي',
  reasonBazaarSale: 'بيع في السوق',
  reasonCrafting: 'تصنيع',
  reasonTrade: 'تبادل',
  reasonUpkeep: 'صيانة',
  reasonProduction: 'إنتاج',
  reasonTerritoryPurchase: 'شراء إقليم',
  reasonWeaponPurchase: 'شراء سلاح',
  reasonAttack: 'هجوم',
  reasonOther: 'أخرى',
};

export const REASON_TAGS_AR = [
  T.reasonChallengeWin,
  T.reasonBazaarSale,
  T.reasonCrafting,
  T.reasonTrade,
  T.reasonUpkeep,
  T.reasonProduction,
  T.reasonTerritoryPurchase,
  T.reasonWeaponPurchase,
  T.reasonAttack,
  T.reasonOther,
];

// Team and zone display names in Arabic
export const TEAM_NAMES_AR = {
  t1: 'الفريق الأول',
  t2: 'الفريق الثاني',
  t3: 'الفريق الثالث',
  t4: 'الفريق الرابع',
  t5: 'الفريق الخامس',
  t6: 'الفريق السادس',
};

export const ZONE_NAMES_AR = {
  cold: 'البارد',
  temperate: 'المعتدل',
  coastal: 'الساحلي',
  desert: 'الصحراوي',
};

export const GOOD_NAMES_AR = {
  timber: 'الخشب',
  pelts: 'الجلود',
  firewood: 'حزم الحطب',
  furcoats: 'معاطف الفرو',
  grain: 'الحبوب',
  livestock: 'المواشي',
  bread: 'الخبز',
  curedmeat: 'اللحم المقدد',
  fish: 'السمك',
  shells: 'المحار',
  smokedfish: 'السمك المدخن',
  pearls: 'اللؤلؤ',
  ore: 'الخام',
  herbs: 'الأعشاب النادرة',
  tools: 'الأدوات والأسلحة',
  medicine: 'الدواء',
};

export const WEAPON_NAMES_AR = {
  sling: 'المقلاع',
  spear: 'الرمح',
  bow: 'القوس',
};

export const TIER_NAMES_AR = {
  1: 'المستوى الأول',
  2: 'المستوى الثاني',
  3: 'المستوى الثالث',
};
