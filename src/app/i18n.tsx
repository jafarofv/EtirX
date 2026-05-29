import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Language = "az" | "en" | "ru";
type Dict = Record<string, Record<Language, string>>;

const dict: Dict = {
  "brand.name": { az: "ƏtirX", en: "EtirX", ru: "ЭтирX" },

  "nav.home": { az: "Ana Səhifə", en: "Home", ru: "Главная" },
  "nav.favorites": { az: "Seçilənlər", en: "Favorites", ru: "Избранное" },
  "nav.cart": { az: "Səbət", en: "Cart", ru: "Корзина" },
  "nav.profile": { az: "Profil", en: "Profile", ru: "Профиль" },

  "menu.title": { az: "Menyu", en: "Menu", ru: "Меню" },
  "menu.close": { az: "Bağla", en: "Close", ru: "Закрыть" },
  "menu.shop": { az: "Ətirlər", en: "Fragrances", ru: "Ароматы" },
  "menu.category": { az: "Kateqoriya", en: "Category", ru: "Категория" },
  "menu.search": { az: "Axtarış", en: "Search", ru: "Поиск" },
  "menu.campaigns": { az: "Kampaniyalar", en: "Campaigns", ru: "Кампании" },
  "menu.about": { az: "Haqqımızda", en: "About", ru: "О нас" },
  "menu.shipping": { az: "Çatdırılma", en: "Shipping", ru: "Доставка" },
  "menu.faq": { az: "Suallar", en: "FAQ", ru: "Вопросы" },
  "menu.contact": { az: "Əlaqə", en: "Contact", ru: "Контакты" },
  "menu.privacy": { az: "Gizlilik", en: "Privacy", ru: "Конфиденциальность" },
  "menu.terms": { az: "Şərtlər", en: "Terms", ru: "Условия" },
  "menu.tracking": { az: "Sifariş İzləmə", en: "Order Tracking", ru: "Отслеживание" },

  "theme.label": { az: "Tema", en: "Theme", ru: "Тема" },
  "theme.dark": { az: "Tünd", en: "Dark", ru: "Тёмная" },
  "theme.light": { az: "Açıq", en: "Light", ru: "Светлая" },

  "promo.line1": { az: "YENI30 promokodu ilə 30% endirim", en: "30% off with code YENI30", ru: "Скидка 30% по коду YENI30" },
  "promo.line2": { az: "Bu gün sifariş et", en: "Order today", ru: "Закажите сегодня" },
  "promo.line3": { az: "Pulsuz qapıda ödəniş", en: "Cash on delivery available", ru: "Оплата при получении" },

  "home.tagline": { az: "Lüks Ətirlər", en: "Luxury Fragrances", ru: "Люксовые ароматы" },
  "home.search": { az: "Ətir axtar...", en: "Search fragrances...", ru: "Поиск ароматов..." },
  "home.featured": { az: "Seçilmiş Kolleksiya", en: "Featured Collection", ru: "Избранная коллекция" },
  "home.viewAll": { az: "Hamısına bax", en: "View All", ru: "Смотреть все" },
  "home.all": { az: "Bütün Ətirlər", en: "All Fragrances", ru: "Все ароматы" },
  "home.tab.all": { az: "Hamısı", en: "All", ru: "Все" },
  "home.tab.new": { az: "Yeni gələnlər", en: "New Arrivals", ru: "Новинки" },
  "home.tab.women": { az: "Qadın", en: "Women", ru: "Женские" },
  "home.tab.men": { az: "Kişi", en: "Men", ru: "Мужские" },
  "home.tab.unisex": { az: "Uniseks", en: "Unisex", ru: "Унисекс" },
  "home.tab.sale": { az: "Endirim", en: "Sale", ru: "Скидки" },
  "home.offer.badge": { az: "Məhdud təklif", en: "Limited Offer", ru: "Ограниченное предложение" },
  "home.offer.title": { az: "İlk sifarişə 20% endirim", en: "Get 20% Off", ru: "Скидка 20%" },
  "home.offer.desc": { az: "İlk alış-verişiniz üçün", en: "On your first purchase", ru: "На первый заказ" },
  "home.offer.cta": { az: "İndi al", en: "Shop Now", ru: "Купить сейчас" },
  "common.sale": { az: "Endirim", en: "Sale", ru: "Скидка" },
  "shop.title": { az: "Ətirlər", en: "Fragrances", ru: "Ароматы" },
  "shop.search": { az: "Ətir axtar...", en: "Search fragrance...", ru: "Поиск аромата..." },
  "shop.sort": { az: "Sıralama", en: "Sort", ru: "Сортировка" },
  "shop.brand": { az: "Marka", en: "Brand", ru: "Бренд" },
  "shop.allBrands": { az: "Bütün markalar", en: "All brands", ru: "Все бренды" },
  "shop.sort.newest": { az: "Ən yeni", en: "Newest", ru: "Сначала новые" },
  "shop.sort.priceAsc": { az: "Qiymət artan", en: "Price low to high", ru: "Цена по возрастанию" },
  "shop.sort.priceDesc": { az: "Qiymət azalan", en: "Price high to low", ru: "Цена по убыванию" },
  "shop.sort.name": { az: "A-dan Z-yə", en: "Name A-Z", ru: "Название А-Я" },
  "shop.count": { az: "məhsul", en: "products", ru: "товаров" },
  "shop.loading": { az: "Yüklənir...", en: "Loading...", ru: "Загрузка..." },
  "shop.noProducts": { az: "Məhsul tapılmadı.", en: "No products found.", ru: "Товары не найдены." },
  "shop.fallback": { az: "API əlçatan deyil, lokal məlumatlar göstərilir.", en: "API unavailable, showing local data.", ru: "API недоступен, показаны локальные данные." },
  "categories.title": { az: "Kateqoriyalar", en: "Categories", ru: "Категории" },
  "categories.subtitle": { az: "Kateqoriya seçib məhsullara keçin", en: "Choose a category and browse products", ru: "Выберите категорию и просмотрите товары" },
  "category.title": { az: "Kateqoriya", en: "Category", ru: "Категория" },
  "search.title": { az: "Axtarış", en: "Search", ru: "Поиск" },
  "search.results": { az: "nəticə", en: "results", ru: "результатов" },
  "search.allCategories": { az: "Bütün kateqoriyalar", en: "All categories", ru: "Все категории" },

  "favorites.title": { az: "Seçilənlər", en: "Favorites", ru: "Избранное" },
  "favorites.empty": { az: "Hələ seçilən yoxdur", en: "No favorites yet", ru: "Пока нет избранного" },
  "favorites.explore": { az: "Ətirlərə bax", en: "Explore Fragrances", ru: "Смотреть ароматы" },

  "cart.title": { az: "Səbət", en: "Shopping Cart", ru: "Корзина" },
  "cart.empty": { az: "Səbət boşdur", en: "Your cart is empty", ru: "Корзина пуста" },
  "cart.emptySub": { az: "Kolleksiyan üçün premium ətirlər əlavə et", en: "Add some luxury fragrances to your collection", ru: "Добавьте премиальные ароматы" },
  "cart.start": { az: "Alışa Başla", en: "Start Shopping", ru: "Начать покупки" },
  "cart.items": { az: "məhsul", en: "items", ru: "товаров" },
  "cart.promo": { az: "Promokod daxil et", en: "Enter promo code", ru: "Введите промокод" },
  "cart.apply": { az: "Tətbiq et", en: "Apply", ru: "Применить" },
  "cart.summary": { az: "Sifariş xülasəsi", en: "Order Summary", ru: "Сводка заказа" },
  "cart.checkout": { az: "Sifarişi tamamla", en: "Proceed to Checkout", ru: "Перейти к оформлению" },
  "cart.subtotal": { az: "Məhsullar", en: "Subtotal", ru: "Подытог" },
  "cart.shipping": { az: "Çatdırılma", en: "Shipping", ru: "Доставка" },
  "cart.total": { az: "Cəmi", en: "Total", ru: "Итого" },

  "checkout.title": { az: "Rəsmiləşdirmə", en: "Checkout", ru: "Оформление" },
  "checkout.success": { az: "Sifariş təsdiqləndi!", en: "Order Confirmed!", ru: "Заказ подтверждён!" },
  "checkout.successSub": { az: "Sifarişiniz uğurla qəbul edildi", en: "Your order has been placed successfully", ru: "Ваш заказ успешно оформлен" },
  "checkout.continue": { az: "Alışa davam et", en: "Continue Shopping", ru: "Продолжить покупки" },
  "checkout.orderDetails": { az: "Sifariş detallarına bax", en: "View Order Details", ru: "Детали заказа" },
  "checkout.address": { az: "Çatdırılma ünvanı", en: "Shipping Address", ru: "Адрес доставки" },
  "checkout.delivery": { az: "Çatdırılma üsulu", en: "Delivery Method", ru: "Способ доставки" },
  "checkout.standard": { az: "Standart çatdırılma", en: "Standard Delivery", ru: "Стандартная доставка" },
  "checkout.cod": { az: "Qapıda ödəniş", en: "Cash on Delivery", ru: "Оплата при получении" },
  "checkout.place": { az: "Sifarişi tamamla", en: "Place Order", ru: "Оформить заказ" },
  "checkout.orderCode": { az: "Sifariş", en: "Order", ru: "Заказ" },
  "checkout.fullName": { az: "Ad və soyad", en: "Full name", ru: "Имя и фамилия" },
  "checkout.phone": { az: "Telefon", en: "Phone", ru: "Телефон" },
  "checkout.addrInput": { az: "Ünvan", en: "Address", ru: "Адрес" },
  "checkout.notes": { az: "Qeyd (istəyə bağlı)", en: "Notes (optional)", ru: "Комментарий (необязательно)" },
  "checkout.home": { az: "Ev", en: "Home", ru: "Дом" },
  "checkout.defaultAddress": { az: "Bakı şəhəri, Nizami küçəsi 45", en: "Baku city, Nizami street 45", ru: "г. Баку, ул. Низами 45" },
  "checkout.deliveryEta": { az: "1-2 iş günü", en: "1-2 business days", ru: "1-2 рабочих дня" },
  "checkout.codDesc": { az: "Ödəniş məhsul çatanda nağd və ya kartla", en: "Pay cash or card upon delivery", ru: "Оплата наличными или картой при получении" },
  "checkout.requiredError": { az: "Ad, telefon və ünvanı tam doldurun.", en: "Please fill full name, phone and address.", ru: "Пожалуйста, заполните имя, телефон и адрес." },
  "checkout.submitError": { az: "Sifariş göndərilmədi. Backend və məhsul məlumatlarını yoxlayın.", en: "Could not place order. Please check backend and product data.", ru: "Не удалось оформить заказ. Проверьте backend и данные товаров." },
  "checkout.submitting": { az: "Göndərilir...", en: "Submitting...", ru: "Отправка..." },

  "product.notFound": { az: "Məhsul tapılmadı", en: "Product not found", ru: "Товар не найден" },
  "product.addToCart": { az: "Səbətə əlavə et", en: "Add to Cart", ru: "Добавить в корзину" },
  "product.reviews": { az: "rəy", en: "reviews", ru: "отзывов" },
  "product.size": { az: "Həcm", en: "Size", ru: "Объём" },
  "product.stock": { az: "Stok", en: "Stock", ru: "Наличие" },
  "product.inStock": { az: "Stokda var", en: "In Stock", ru: "В наличии" },
  "product.description": { az: "Təsvir", en: "Description", ru: "Описание" },
  "product.notes": { az: "Qoxu notları", en: "Fragrance Notes", ru: "Ноты аромата" },
  "product.topNotes": { az: "Üst notlar", en: "Top Notes", ru: "Верхние ноты" },
  "product.heartNotes": { az: "Orta notlar", en: "Heart Notes", ru: "Средние ноты" },
  "product.baseNotes": { az: "Baza notlar", en: "Base Notes", ru: "Базовые ноты" },

  "campaigns.title": { az: "Kampaniyalar", en: "Campaigns", ru: "Кампании" },
  "campaigns.subtitle": { az: "Aktiv endirimlər", en: "Active promotions", ru: "Активные акции" },
  "campaigns.code1": { az: "Seçilmiş məhsullara 30% endirim.", en: "30% discount on selected products.", ru: "Скидка 30% на выбранные товары." },
  "campaigns.code2": { az: "100 ₼ üzəri sifarişlərdə pulsuz çatdırılma.", en: "Free delivery for orders over 100 ₼.", ru: "Бесплатная доставка при заказе от 100 ₼." },
  "about.title": { az: "Haqqımızda", en: "About Us", ru: "О нас" },
  "about.subtitle": { az: "Premium ətir mağazası", en: "Premium perfume store", ru: "Премиальный магазин парфюмерии" },
  "about.body": { az: "Biz orijinal və seçilmiş ətirləri sürətli çatdırılma və qapıda ödəniş imkanı ilə təqdim edirik.", en: "We offer curated original perfumes with fast delivery and cash on delivery.", ru: "Мы предлагаем оригинальные отобранные ароматы с быстрой доставкой и оплатой при получении." },
  "shipret.title": { az: "Çatdırılma və Qaytarma", en: "Shipping and Returns", ru: "Доставка и возврат" },
  "shipret.subtitle": { az: "Çatdırılma və qaytarma qaydaları", en: "Delivery and return policy", ru: "Правила доставки и возврата" },
  "shipret.item1": { az: "Bakı: 1-2 iş günü.", en: "Baku: 1-2 business days.", ru: "Баку: 1-2 рабочих дня." },
  "shipret.item2": { az: "Regionlar: 2-4 iş günü.", en: "Regions: 2-4 business days.", ru: "Регионы: 2-4 рабочих дня." },
  "shipret.item3": { az: "Qaytarma müddəti: 14 gün.", en: "Return period: 14 days.", ru: "Срок возврата: 14 дней." },
  "faq.title": { az: "Tez-tez verilən suallar", en: "FAQ", ru: "Часто задаваемые вопросы" },
  "faq.subtitle": { az: "Ən çox soruşulan suallar", en: "Frequently asked questions", ru: "Часто задаваемые вопросы" },
  "faq.q1": { az: "Qapıda ödəniş mövcuddur?", en: "Cash on delivery available?", ru: "Есть оплата при получении?" },
  "faq.a1": { az: "Bəli, qapıda ödəniş mövcuddur.", en: "Yes.", ru: "Да." },
  "faq.q2": { az: "Məhsullar orijinaldır?", en: "Are products original?", ru: "Товары оригинальные?" },
  "faq.a2": { az: "Bəli, yalnız orijinal məhsullar satılır.", en: "Yes, only original products.", ru: "Да, только оригинальная продукция." },
  "contact.title": { az: "Əlaqə", en: "Contact", ru: "Контакты" },
  "contact.subtitle": { az: "Bizə mesaj göndərin", en: "Send us your message", ru: "Отправьте нам сообщение" },
  "contact.name": { az: "Ad", en: "Name", ru: "Имя" },
  "contact.email": { az: "E-poçt", en: "Email", ru: "Эл. почта" },
  "contact.message": { az: "Mesaj", en: "Message", ru: "Сообщение" },
  "contact.send": { az: "Göndər", en: "Send", ru: "Отправить" },
  "contact.sending": { az: "Göndərilir...", en: "Sending...", ru: "Отправка..." },
  "contact.success": { az: "Mesaj uğurla göndərildi.", en: "Message sent successfully.", ru: "Сообщение успешно отправлено." },
  "contact.error": { az: "Mesaj göndərilmədi. Yenidən cəhd edin.", en: "Failed to send message. Please try again.", ru: "Не удалось отправить сообщение. Повторите попытку." },
  "privacy.title": { az: "Gizlilik Siyasəti", en: "Privacy Policy", ru: "Политика конфиденциальности" },
  "privacy.subtitle": { az: "Şəxsi məlumatların işlənməsi", en: "How we process personal data", ru: "Как мы обрабатываем персональные данные" },
  "privacy.body": { az: "Biz yalnız sifarişlə bağlı məlumatları saxlayırıq və qanuni əsas olmadan üçüncü tərəflərlə paylaşmırıq.", en: "We store and process only order-related information and never share personal data with third parties without legal basis.", ru: "Мы храним и обрабатываем только данные, связанные с заказом, и не передаем их третьим лицам без законных оснований." },
  "terms.title": { az: "İstifadə Şərtləri", en: "Terms of Use", ru: "Условия использования" },
  "terms.subtitle": { az: "Saytdan istifadə qaydaları", en: "Website usage rules", ru: "Правила использования сайта" },
  "terms.body": { az: "Bu saytdan istifadə etməklə sifariş, çatdırılma və qaytarma şərtlərimizi qəbul etmiş olursunuz.", en: "By using this site, you agree to our ordering, delivery and return terms.", ru: "Используя сайт, вы соглашаетесь с условиями заказа, доставки и возврата." },
  "tracking.title": { az: "Sifariş İzləmə", en: "Order Tracking", ru: "Отслеживание заказа" },
  "tracking.subtitle": { az: "Sifariş nömrəsi ilə statusu yoxlayın", en: "Check order status by order number", ru: "Проверьте статус по номеру заказа" },
  "tracking.input": { az: "Sifariş nömrəsini daxil edin", en: "Enter order number", ru: "Введите номер заказа" },
  "tracking.empty": { az: "Zəhmət olmasa sifariş nömrəsini daxil edin.", en: "Please enter order number.", ru: "Пожалуйста, введите номер заказа." },
  "tracking.check": { az: "Statusu yoxla", en: "Check status", ru: "Проверить статус" },
  "tracking.checking": { az: "Yoxlanılır...", en: "Checking...", ru: "Проверка..." },
  "tracking.notFound": { az: "Sifariş tapılmadı və ya server əlçatan deyil.", en: "Order not found or server unavailable.", ru: "Заказ не найден или сервер недоступен." },
  "tracking.order": { az: "Sifariş", en: "Order", ru: "Заказ" },
  "tracking.status": { az: "Status", en: "Status", ru: "Статус" },
  "notFound.text": { az: "Səhifə tapılmadı", en: "Page not found", ru: "Страница не найдена" },
  "notFound.home": { az: "Ana səhifə", en: "Home", ru: "Главная" },
  "profile.myAccount": { az: "Mənim hesabım", en: "My Account", ru: "Мой аккаунт" },
  "profile.loginRegister": { az: "Daxil ol / Qeydiyyat", en: "Login / Register", ru: "Вход / Регистрация" },
  "profile.codEnabled": { az: "Qapıda ödəniş: Aktivdir", en: "Cash on delivery: Enabled", ru: "Оплата при получении: Включена" },
  "profile.notificationsEnabled": { az: "Bildirişlər: Aktivdir", en: "Notifications: Enabled", ru: "Уведомления: Включены" },
  "profile.logout": { az: "Çıxış", en: "Logout", ru: "Выйти" },
  "profile.login": { az: "Daxil ol", en: "Login", ru: "Войти" },
  "profile.register": { az: "Qeydiyyat", en: "Register", ru: "Регистрация" },
  "profile.fullName": { az: "Ad və soyad", en: "Full name", ru: "Имя и фамилия" },
  "profile.email": { az: "E-poçt", en: "Email", ru: "Эл. почта" },
  "profile.phone": { az: "Telefon (+994...)", en: "Phone (+994...)", ru: "Телефон (+994...)" },
  "profile.password": { az: "Şifrə", en: "Password", ru: "Пароль" },
  "profile.createAccount": { az: "Hesab yarat", en: "Create account", ru: "Создать аккаунт" },
  "profile.nameErr": { az: "Ad 2-60 simvol olmalıdır.", en: "Name must be 2-60 chars.", ru: "Имя должно быть 2-60 символов." },
  "profile.emailErr": { az: "E-poçt düzgün deyil.", en: "Email is invalid.", ru: "Некорректный email." },
  "profile.phoneErr": { az: "Telefon 9-15 rəqəm olmalıdır.", en: "Phone must be 9-15 digits.", ru: "Телефон должен содержать 9-15 цифр." },
  "profile.passErr": { az: "Şifrə minimum 8 simvol, hərf və rəqəm olmalıdır.", en: "Password min 8 chars with letter+number.", ru: "Пароль минимум 8 символов, с буквой и цифрой." },
  "profile.fixErr": { az: "Xanaları düzəldin.", en: "Please fix highlighted fields.", ru: "Исправьте выделенные поля." },
  "profile.noUser": { az: "Qeydiyyatlı istifadəçi tapılmadı. Əvvəl qeydiyyatdan keçin.", en: "No registered user found. Please register first.", ru: "Зарегистрированный пользователь не найден. Сначала зарегистрируйтесь." },
  "profile.badLogin": { az: "E-poçt və ya şifrə yanlışdır.", en: "Email or password is incorrect.", ru: "Неверный email или пароль." },
  "profile.demoInfo": { az: "Demo giriş localStorage əsaslıdır. Növbəti addım backend auth-dur.", en: "Demo auth is localStorage-based. Backend auth is the next step.", ru: "Демо-авторизация работает через localStorage. Следующий шаг — backend auth." }
};

type I18nValue = { language: Language; setLanguage: (lang: Language) => void; t: (key: string) => string };
const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = "parfum-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    return saved === "az" || saved === "en" || saved === "ru" ? saved : "az";
  });

  const value = useMemo(
    () => ({
      language,
      setLanguage: (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem(STORAGE_KEY, lang);
      },
      t: (key: string) => dict[key]?.[language] ?? key,
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
