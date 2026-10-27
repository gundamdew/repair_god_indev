export type Language = "PL" | "EN" | "UA" | "RU"

export interface TranslationDictionary {
  common: {
    back: string
    search: string
    notifications: string
    send: string
    cancel: string
    confirm: string
    accept: string
    decline: string
    close: string
    save: string
    saved: string
    copied: string
    copyCode: string
    version: string
    all: string
    day: string
    days: string
    from: string
    free: string
    verified: string
    recommended: string
    active: string
    connected: string
    completed: string
    inProgress: string
  }
  tabs: {
    diag: string
    services: string
    orders: string
    knowledge: string
    profile: string
  }
  onboarding: {
    tagline: string
    subTagline: string
    createAccount: string
    haveAccount: string
    welcomeBack: string
    welcomeBackSub: string
    sendSmsCode: string
    regMethodTitle: string
    regMethodSub: string
    termsNote: string
    phoneMethod: string
    phoneMethodSub: string
    googleMethod: string
    googleMethodSub: string
    appleMethod: string
    appleMethodSub: string
    enterPhoneTitle: string
    enterPhoneSub: string
    enterSmsTitle: string
    enterSmsSub: (phone: string) => string
    resendIn: (seconds: number) => string
    resendCode: string
    aboutYouTitle: string
    aboutYouSub: string
    nameLabel: string
    namePlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    accountTypeLabel: string
    clientRole: string
    clientRoleDesc: string
    partnerRole: string
    partnerRoleDesc: string
    appLangLabel: string
    lastStepTitle: string
    lastStepSub: string
    termsConsent: string
    privacyConsent: string
    marketingConsent: string
    required: string
    checkAll: string
    createAccountBtn: string
    welcomeDoneTitle: (name: string) => string
    welcomeDoneClient: string
    welcomeDonePartner: string
    startDiagBtn: string
  }
  diagnosis: {
    greeting: (name: string) => string
    whatBroken: string
    brokenAccent: string
    aiStamp: string
    aiAssistant: string
    diagIn2Min: string
    initialAiMsg: string
    followupAiMsg: string
    resultAiMsg: string
    photoAttached: string
    screenCrackedChip: string
    notChargingChip: string
    fastDrainChip: string
    liquidDamageChip: string
    inputPlaceholder: string
    diagResultLabel: string
    confidenceBadge: string
    displayReplacement: string
    servicesCount: string
    priceFrom: string
    timeEst: string
    selectServiceBtn: string
  }
  services: {
    eyebrow: string
    nearTitle: string
    nearAccent: string
    listStamp: string
    mapStamp: string
    searchPlaceholder: string
    listView: string
    mapView: string
    sortNear: string
    sortCheap: string
    sortFast: string
    sortRating: string
    noResults: (q: string) => string
    reviewsCount: (count: number) => string
    monthsWarranty: string
    chatBtn: string
    callBtn: string
    priceListTitle: string
    timeExecution: (time: string) => string
    reviewsTitle: string
    reviewSampleText: string
    reviewSampleAuthor: string
    orderWithPrice: (price: string) => string
  }
  checkout: {
    title: string
    shippingToService: string
    returnDevice: string
    inpostLocker: string
    courier: string
    inPerson: string
    workshopPickup: string
    paymentTitle: string
    blikCodePlaceholder: string
    cashNotice: string
    repairCost: string
    logisticsFee: string
    total: string
    escrowNotice: string
    payBtn: (amount: number) => string
  }
  success: {
    title: string
    titleAccent: string
    orderCreatedDesc: string
    showLabelBtn: string
    goToOrderBtn: string
  }
  label: {
    title: string
    lockerCodeLabel: string
    howToPackTitle: string
    step1: string
    step2: string
    step3: string
    step4: string
    doneBtn: string
  }
  orders: {
    eyebrow: string
    title: string
    titleAccent: string
    inpostTrackingStamp: string
    amountLabel: string
    shippingLabel: string
    paymentLabel: string
    lockerCodeCardLabel: string
    extraRequestTitle: string
    extraRequestDesc: string
    acceptBtn: string
    declineBtn: string
    timelineTitle: string
    chatWithShopBtn: string
    simulateStatusBtn: string
    noOrdersDesc: string
    startDiagBtn: string
    historyTitle: string
    viewAllAction: string
    warrantyUntil: string
    claimWarrantyBtn: string
    reorderBtn: (shop: string) => string
  }
  knowledge: {
    eyebrow: string
    title: string
    titleAccent: string
    newPostStamp: string
    allCategory: string
    tipsCategory: string
    questionsCategory: string
    guidesCategory: string
    repliesCount: (n: number) => string
    newPostBtn: string
    postCategoryTitle: string
    postTitleLabel: string
    postTitlePlaceholder: string
    postBodyLabel: string
    postBodyPlaceholder: string
    publishBtn: string
    publishedSuccessTitle: string
    publishedSuccessSub: string
    backToKnowledgeBtn: string
    repliesTitle: (n: number) => string
    replyPlaceholder: string
    youAuthor: string
  }
  profile: {
    yourPackage: string
    manage: string
    carePlusSub: string
    repairsCount: string
    referralsCount: string
    settingsTitle: string
    languageRow: string
    notificationsAndTheme: string
    subAndPayments: string
    faq: string
    support: string
    switchAccount: string
    switchAccountSub: string
    logoutBtn: string
    prototypeLabel: string
  }
  subscription: {
    title: string
    savePlanBtn: string
    savedBtn: string
    paymentMethodsTitle: string
    defaultBadge: string
    connectedBadge: string
    basicName: string
    basicPrice: string
    basicDesc: string
    careName: string
    carePrice: string
    careDesc: string
    bizName: string
    bizPrice: string
    bizDesc: string
  }
  referral: {
    title: string
    yourCodeLabel: string
    codeDesc: string
    invitedLabel: string
    earnedLabel: string
    copyCodeBtn: string
  }
  settings: {
    title: string
    notificationsSection: string
    pushTitle: string
    pushSub: string
    smsTitle: string
    smsSub: string
    mailTitle: string
    mailSub: string
    appearanceSection: string
    darkThemeTitle: string
    darkThemeSub: string
  }
  faq: {
    title: string
    noAnswerBtn: string
    items: [string, string][]
  }
  chat: {
    inputPlaceholder: string
    autoReply: string
    supportTitle: string
    supportIntro: string
  }
  call: {
    title: string
    connecting: string
    hangupBtn: string
  }
  accounts: {
    title: string
    switchBtn: string
    addPartnerShopBtn: string
    clientName: string
    clientSub: string
    partnerName: string
    partnerSub: string
  }
  mock: {
    orderSteps: string[]
    priceList: { name: string; price: number; time: string }[]
    history: { id: string; title: string; date: string; price: number; shop: string }[]
    posts: { id: number; author: string; role: string; cat: string; title: string; body: string; likes: number; replies: number }[]
  }
}
