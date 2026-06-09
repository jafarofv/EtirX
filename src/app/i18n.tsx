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
  "menu.category": { az: "Kateqoriyalar", en: "Category", ru: "Категория" },
  "menu.search": { az: "Axtarış", en: "Search", ru: "Поиск" },
  "menu.campaigns": { az: "Kampaniyalar", en: "Campaigns", ru: "Кампании" },
  "menu.about": { az: "Haqqımızda", en: "About", ru: "О нас" },
  "menu.shipping": { az: "Çatdırılma", en: "Shipping", ru: "Доставка" },
  "menu.faq": { az: "Suallar", en: "FAQ", ru: "Вопросы" },
  "menu.contact": { az: "Əlaqə", en: "Contact", ru: "Контакты" },
  "menu.privacy": { az: "Gizlilik", en: "Privacy", ru: "Конфиденциальность" },
  "menu.terms": { az: "Şərtlər", en: "Terms", ru: "Условия" },
  "menu.tracking": { az: "Sifariş İzləmə", en: "Order Tracking", ru: "Отслеживание" },

  "a11y.menu": { az: "Menyu", en: "Menu", ru: "Меню" },
  "a11y.language": { az: "Dil seçimi", en: "Language", ru: "Язык" },
  "a11y.favorite": { az: "Seçilənlərə əlavə et", en: "Add to favorites", ru: "В избранное" },
  "a11y.addToCart": { az: "Səbətə at", en: "Add to cart", ru: "В корзину" },
  "a11y.increaseQty": { az: "Sayı artır", en: "Increase quantity", ru: "Увеличить количество" },
  "a11y.decreaseQty": { az: "Sayı azalt", en: "Decrease quantity", ru: "Уменьшить количество" },
  "a11y.removeItem": { az: "Səbətdən sil", en: "Remove from cart", ru: "Удалить из корзины" },
  "a11y.back": { az: "Geri", en: "Back", ru: "Назад" },

  "theme.label": { az: "Tema", en: "Theme", ru: "Тема" },
  "theme.dark": { az: "Tünd", en: "Dark", ru: "Тёмная" },
  "theme.light": { az: "Açıq", en: "Light", ru: "Светлая" },

  "promo.line1": { az: "ETIRX10 • -10%", en: "ETIRX10 • -10%", ru: "ETIRX10 • -10%" },
  "promo.line2": { az: "Qapıda ödəniş", en: "Cash on delivery", ru: "Оплата при получении" },
  "promo.line3": {
    az: "100% Premium ətirlər",
    en: "100% Premium perfumes",
    ru: "100% Премиальная парфюмерия",
  },

  "footer.about": {
    az: "Seçilmiş premium ətirlər, rahat sifariş və sürətli çatdırılma üçün EtirX.",
    en: "EtirX brings curated premium fragrances, easy ordering and fast delivery.",
    ru: "EtirX предлагает избранные премиальные ароматы, удобный заказ и быструю доставку.",
  },
  "footer.pages": { az: "Əsas səhifələr", en: "Main pages", ru: "Основные страницы" },
  "footer.follow": { az: "Bizi izləyin", en: "Follow us", ru: "Следите за нами" },
  "footer.rights": {
    az: "Bütün hüquqlar qorunur.",
    en: "All rights reserved.",
    ru: "Все права защищены.",
  },
  "footer.slogan": {
    az: "Qoxunu seç, xatirəni yarat.",
    en: "Choose the scent, create the memory.",
    ru: "Выберите аромат, создайте воспоминание.",
  },
  "reviews.title": { az: "Müştəri şərhləri", en: "Customer comments", ru: "Отзывы клиентов" },
  "reviews.subtitle": {
    az: "Sosial media tərzində son rəylər",
    en: "Latest reviews in a social-media style",
    ru: "Последние отзывы в стиле соцсетей",
  },
  "reviews.badge": { az: "İstifadəçi rəyləri", en: "User reviews", ru: "Отзывы пользователей" },

  "home.tagline": { az: "Lüks Ətirlər", en: "Luxury Fragrances", ru: "Люксовые ароматы" },
  "home.search": { az: "Ətir axtar...", en: "Search fragrances...", ru: "Поиск ароматов..." },
  "home.featured": {
    az: "Seçilmiş Kolleksiya",
    en: "Featured Collection",
    ru: "Избранная коллекция",
  },
  "home.viewAll": { az: "Hamısına bax", en: "View All", ru: "Смотреть все" },
  "home.all": { az: "Bütün Ətirlər", en: "All Fragrances", ru: "Все ароматы" },
  "home.tab.all": { az: "Hamısı", en: "All", ru: "Все" },
  "home.tab.new": { az: "Yeni gələnlər", en: "New Arrivals", ru: "Новинки" },
  "home.tab.women": { az: "Qadın", en: "Women", ru: "Женские" },
  "home.tab.men": { az: "Kişi", en: "Men", ru: "Мужские" },
  "home.tab.unisex": { az: "Uniseks", en: "Unisex", ru: "Унисекс" },
  "home.tab.sale": { az: "Endirim", en: "Sale", ru: "Скидки" },
  "home.offer.badge": { az: "Məhdud təklif", en: "Limited Offer", ru: "Ограниченное предложение" },
  "home.offer.title": {
    az: "ETIRX10 promokodu ilə 10% endirim",
    en: "10% off with ETIRX10",
    ru: "Скидка 10% по коду ETIRX10",
  },
  "home.offer.desc": {
    az: "İlk alış-verişiniz üçün",
    en: "For your first purchase",
    ru: "Для вашей первой покупки",
  },
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
  "shop.noProducts": {
    az: "Məhsul tapılmadı.",
    en: "No products found.",
    ru: "Товары не найдены.",
  },
  "shop.fallback": {
    az: "API əlçatan deyil, lokal məlumatlar göstərilir.",
    en: "API unavailable, showing local data.",
    ru: "API недоступен, показаны локальные данные.",
  },

  "categories.title": { az: "Kateqoriyalar", en: "Categories", ru: "Категории" },
  "categories.subtitle": {
    az: "Kateqoriya seçib məhsullara keçin",
    en: "Choose a category and browse products",
    ru: "Выберите категорию и просмотрите товары",
  },
  "category.title": { az: "Kateqoriya", en: "Category", ru: "Категория" },
  "search.title": { az: "Axtarış", en: "Search", ru: "Поиск" },
  "search.results": { az: "nəticə", en: "results", ru: "результатов" },
  "search.allCategories": { az: "Bütün kateqoriyalar", en: "All categories", ru: "Все категории" },

  "favorites.title": { az: "Seçilənlər", en: "Favorites", ru: "Избранное" },
  "favorites.empty": {
    az: "Hələ seçilən yoxdur",
    en: "No favorites yet",
    ru: "Пока нет избранного",
  },
  "favorites.explore": { az: "Ətirlərə bax", en: "Explore Fragrances", ru: "Смотреть ароматы" },

  "cart.title": { az: "Səbət", en: "Shopping Cart", ru: "Корзина" },
  "cart.empty": { az: "Səbət boşdur", en: "Your cart is empty", ru: "Корзина пуста" },
  "cart.emptySub": {
    az: "Kolleksiyan üçün premium ətirlər əlavə et",
    en: "Add some luxury fragrances to your collection",
    ru: "Добавьте премиальные ароматы",
  },
  "cart.start": { az: "Alışa Başla", en: "Start Shopping", ru: "Начать покупки" },
  "cart.items": { az: "məhsul", en: "items", ru: "товаров" },
  "cart.promo": { az: "Promokod daxil et", en: "Enter promo code", ru: "Введите промокод" },
  "cart.apply": { az: "Tətbiq et", en: "Apply", ru: "Применить" },
  "cart.promoApplied": {
    az: "Promokod checkout üçün yadda saxlanıldı.",
    en: "Promo code saved for checkout.",
    ru: "Промокод сохранён для оформления.",
  },
  "cart.repricedNotice": {
    az: "Səbətdəki bəzi məhsulların əvvəl seçdiyiniz variant artıq mövcud deyil — qiymət standart variant üzrə yeniləndi.",
    en: "Some cart items' previously selected variant is no longer available — priced using the default variant.",
    ru: "Выбранный ранее вариант некоторых товаров недоступен — цена пересчитана по варианту по умолчанию.",
  },
  "cart.promoCleared": {
    az: "Promokod silindi.",
    en: "Promo code cleared.",
    ru: "Промокод удалён.",
  },
  "cart.promoLoginRequired": {
    az: "Promokod tətbiqi üçün login tələb olunur.",
    en: "Login is required to apply a promo code.",
    ru: "Для применения промокода требуется вход.",
  },
  "cart.summary": { az: "Sifariş xülasəsi", en: "Order Summary", ru: "Сводка заказа" },
  "cart.checkout": {
    az: "Sifarişi tamamla",
    en: "Proceed to Checkout",
    ru: "Перейти к оформлению",
  },
  "cart.subtotal": { az: "Məhsullar", en: "Subtotal", ru: "Подытог" },
  "cart.shipping": { az: "Çatdırılma", en: "Shipping", ru: "Доставка" },
  "cart.shippingAtCheckout": {
    az: "Rəsmiləşdirmədə seçiləcək",
    en: "Selected during checkout",
    ru: "Выбирается при оформлении заказа",
  },
  "cart.total": { az: "Cəmi", en: "Total", ru: "Итого" },

  "checkout.title": { az: "Sifarişin rəsmiləşdirilməsi", en: "Checkout", ru: "Оформление заказа" },
  "checkout.success": {
    az: "Sifariş təsdiqləndi!",
    en: "Order Confirmed!",
    ru: "Заказ подтверждён!",
  },
  "checkout.successSub": {
    az: "Sifariş təsdiqləndi, sizinlə gün ərzində WhatsApp vasitəsilə əlaqə saxlanılacaq.",
    en: "Your order has been confirmed. We will contact you on WhatsApp during the day.",
    ru: "Заказ подтверждён. Мы свяжемся с вами в WhatsApp в течение дня.",
  },
  "checkout.continue": { az: "Alışa davam et", en: "Continue Shopping", ru: "Продолжить покупки" },
  "checkout.orderDetails": {
    az: "Sifariş detallarına bax",
    en: "View Order Details",
    ru: "Детали заказа",
  },
  "checkout.address": { az: "Çatdırılma ünvanı", en: "Shipping Address", ru: "Адрес доставки" },
  "checkout.delivery": { az: "Çatdırılma üsulu", en: "Delivery Method", ru: "Способ доставки" },
  "checkout.standard": {
    az: "Standart çatdırılma",
    en: "Standard Delivery",
    ru: "Стандартная доставка",
  },
  "checkout.delivery.cityCourier": {
    az: "Şəhər daxili çatdırılma",
    en: "City delivery",
    ru: "Доставка по городу",
  },
  "checkout.delivery.cityCourierEta": {
    az: "Yango, Bolt və s.",
    en: "Yango, Bolt, etc.",
    ru: "Yango, Bolt и др.",
  },
  "checkout.delivery.cityCourierFee": {
    az: "Ödənişi siz edirsiniz",
    en: "You cover the delivery fee",
    ru: "Доставку оплачиваете вы",
  },
  "checkout.delivery.metroDrop": {
    az: "N.Nərimanov və Gənclik metrosuna çatdırılma",
    en: "Delivery to N.Narimanov or Ganjlik metro",
    ru: "Доставка до м. Н.Нариманов и Гянджлик",
  },
  "checkout.delivery.metroDropEta": {
    az: "Çatdırılma haqqı: 2 \u20BC",
    en: "Delivery fee: 2 \u20BC",
    ru: "Стоимость: 2 \u20BC",
  },
  "checkout.delivery.azerpost": {
    az: "AzerPoçt ilə göndəriş",
    en: "Shipping via Azerpost",
    ru: "Отправка Azerpost",
  },
  "checkout.delivery.azerpostEta": {
    az: "Çatdırılma haqqı: 3 \u20BC",
    en: "Delivery fee: 3 \u20BC",
    ru: "Стоимость: 3 \u20BC",
  },
  "checkout.delivery.pickup": {
    az: "Depodan təhvil alma",
    en: "Warehouse pickup",
    ru: "Самовывоз со склада",
  },
  "checkout.delivery.pickupEta": { az: "Pulsuz", en: "Free", ru: "Бесплатно" },
  "checkout.delivery.free": { az: "Pulsuz", en: "Free", ru: "Бесплатно" },
  "checkout.cod": {
    az: "Bank kartı vasitəsilə ödəniş",
    en: "Pay by bank card",
    ru: "Оплата банковской картой",
  },
  "checkout.place": { az: "Sifarişi tamamla", en: "Place Order", ru: "Оформить заказ" },
  "checkout.orderCode": { az: "Sifariş", en: "Order", ru: "Заказ" },
  "checkout.fullName": { az: "Ad və soyad", en: "Full name", ru: "Имя и фамилия" },
  "checkout.phone": { az: "Telefon", en: "Phone", ru: "Телефон" },
  "checkout.addrInput": { az: "Ünvan", en: "Address", ru: "Адрес" },
  "checkout.notes": {
    az: "Qeyd (istəyə bağlı)",
    en: "Notes (optional)",
    ru: "Комментарий (необязательно)",
  },
  "checkout.promo": {
    az: "Promokod (istəyə bağlı)",
    en: "Promo code (optional)",
    ru: "Промокод (необязательно)",
  },
  "checkout.promoLoginHint": {
    az: "Promokod üçün hesaba daxil olun.",
    en: "Login is required to use a promo code.",
    ru: "Для промокода требуется вход в аккаунт.",
  },
  "checkout.savedAddress": {
    az: "Qeyd olunmuş ünvan",
    en: "Saved address",
    ru: "Сохранённый адрес",
  },
  "checkout.addressOptionalHint": {
    az: "Bu çatdırılma üsulu üçün ünvan tələb olunmur.",
    en: "Address is not required for this delivery method.",
    ru: "Для этого способа доставки адрес не требуется.",
  },
  "checkout.defaultAddress": {
    az: "Bakı şəhəri, Nizami küçəsi 45",
    en: "Baku city, Nizami street 45",
    ru: "г. Баку, ул. Низами 45",
  },
  "checkout.deliveryEta": { az: "1-2 iş günü", en: "1-2 business days", ru: "1-2 рабочих дня" },
  "checkout.codDesc": {
    az: "Ödəniş məhsul çatanda nağd və ya kartla",
    en: "Pay cash or card upon delivery",
    ru: "Оплата наличными или картой при получении",
  },
  "checkout.requiredError": {
    az: "Ad, telefon və ünvanı tam doldurun.",
    en: "Please fill full name, phone and address.",
    ru: "Пожалуйста, заполните имя, телефон и адрес.",
  },
  "checkout.basicRequiredError": {
    az: "Ad və telefonu tam doldurun.",
    en: "Please fill full name and phone.",
    ru: "Пожалуйста, заполните имя и телефон.",
  },
  "checkout.deliveryRequiredError": {
    az: "Çatdırılma üsulunu seçin.",
    en: "Please select a delivery method.",
    ru: "Выберите способ доставки.",
  },
  "checkout.promoLoginRequired": {
    az: "Promokod tətbiqi üçün əvvəlcə login edin.",
    en: "Please login first to apply a promo code.",
    ru: "Сначала войдите в аккаунт для применения промокода.",
  },
  "checkout.submitError": {
    az: "Sifariş göndərilmədi. Backend və məhsul məlumatlarını yoxlayın.",
    en: "Could not place order. Please check backend and product data.",
    ru: "Не удалось оформить заказ. Проверьте backend и данные товаров.",
  },
  "checkout.submitting": { az: "Göndərilir...", en: "Submitting...", ru: "Отправка..." },

  "product.notFound": { az: "Məhsul tapılmadı", en: "Product not found", ru: "Товар не найден" },
  "product.addToCart": { az: "Səbətə əlavə et", en: "Add to Cart", ru: "Добавить в корзину" },
  "product.reviews": { az: "rəy", en: "reviews", ru: "отзывов" },
  "product.size": { az: "Həcm", en: "Size", ru: "Объём" },
  "product.stock": { az: "Stok", en: "Stock", ru: "Наличие" },
  "product.inStock": { az: "Stokda var", en: "In Stock", ru: "В наличии" },
  "product.outOfStock": { az: "Stokda yoxdur", en: "Out of Stock", ru: "Нет в наличии" },
  "product.saleType": { az: "Satış növü", en: "Variant", ru: "Вариант" },
  "product.premiumPack": {
    az: "Premium orijinal qablaşdırma",
    en: "Premium original packaging",
    ru: "Премиальная оригинальная упаковка",
  },
  "product.gramSale": { az: "qram satış", en: "gram sale", ru: "продажа на розлив" },
  "product.originalPackaging": {
    az: "Orijinal qablaşdırma",
    en: "Original packaging",
    ru: "Оригинальная упаковка",
  },
  "product.description": { az: "Təsvir", en: "Description", ru: "Описание" },
  "product.notes": { az: "Qoxu notları", en: "Fragrance Notes", ru: "Ноты аромата" },
  "product.topNotes": { az: "Üst notlar", en: "Top Notes", ru: "Верхние ноты" },
  "product.heartNotes": { az: "Orta notlar", en: "Heart Notes", ru: "Средние ноты" },
  "product.baseNotes": { az: "Baza notlar", en: "Base Notes", ru: "Базовые ноты" },

  "campaigns.title": { az: "Kampaniyalar", en: "Campaigns", ru: "Кампании" },
  "campaigns.subtitle": { az: "Aktiv endirimlər", en: "Active promotions", ru: "Активные акции" },
  "campaigns.code1": {
    az: "Seçilmiş məhsullara 30% endirim.",
    en: "30% discount on selected products.",
    ru: "Скидка 30% на выбранные товары.",
  },
  "campaigns.code2": {
    az: "100 \u20BC üzəri sifarişlərdə pulsuz çatdırılma.",
    en: "Free delivery for orders over 100 \u20BC.",
    ru: "Бесплатная доставка при заказе от 100 \u20BC.",
  },

  "about.title": { az: "Haqqımızda", en: "About Us", ru: "О нас" },
  "about.subtitle": {
    az: "Premium ətir mağazası",
    en: "Premium perfume store",
    ru: "Премиальный магазин парфюмерии",
  },
  "about.body": {
    az: "Biz orijinal və seçilmiş ətirləri sürətli çatdırılma və qapıda ödəniş imkanı ilə təqdim edirik.",
    en: "We offer curated original perfumes with fast delivery and cash on delivery.",
    ru: "Мы предлагаем оригинальные отобранные ароматы с быстрой доставкой и оплатой при получении.",
  },
  "about.missionTitle": { az: "Missiyamız", en: "Our Mission", ru: "Наша миссия" },
  "about.visionTitle": { az: "Vizyonumuz", en: "Our Vision", ru: "Наше видение" },
  "about.valuesTitle": { az: "Dəyərlərimiz", en: "Our Values", ru: "Наши ценности" },

  "shipret.title": { az: "Çatdırılma", en: "Shipping", ru: "Доставка" },
  "shipret.subtitle": { az: "Çatdırılma qaydaları", en: "Shipping rules", ru: "Правила доставки" },
  "shipret.item1": {
    az: "Bakı: 1-2 iş günü.",
    en: "Baku: 1-2 business days.",
    ru: "Баку: 1-2 рабочих дня.",
  },
  "shipret.item2": {
    az: "Regionlar: 2-4 iş günü.",
    en: "Regions: 2-4 business days.",
    ru: "Регионы: 2-4 рабочих дня.",
  },
  "shipret.item3": {
    az: "Qaytarma müddəti: 14 gün.",
    en: "Return period: 14 days.",
    ru: "Срок возврата: 14 дней.",
  },

  "faq.title": { az: "Tez-tez verilən suallar", en: "FAQ", ru: "Часто задаваемые вопросы" },
  "faq.subtitle": {
    az: "Ən çox soruşulan suallar",
    en: "Frequently asked questions",
    ru: "Часто задаваемые вопросы",
  },
  "faq.q1": {
    az: "Qapıda ödəniş mövcuddur?",
    en: "Cash on delivery available?",
    ru: "Есть оплата при получении?",
  },
  "faq.a1": { az: "Bəli, qapıda ödəniş mövcuddur.", en: "Yes.", ru: "Да." },
  "faq.q2": {
    az: "Məhsullar orijinaldır?",
    en: "Are products original?",
    ru: "Товары оригинальные?",
  },
  "faq.a2": {
    az: "Bəli, yalnız orijinal məhsullar satılır.",
    en: "Yes, only original products.",
    ru: "Да, только оригинальная продукция.",
  },
  "faq.section.orders": { az: "Sifariş", en: "Orders", ru: "Заказы" },
  "faq.section.delivery": { az: "Çatdırılma", en: "Delivery", ru: "Доставка" },
  "faq.section.payment": { az: "Ödəniş", en: "Payment", ru: "Оплата" },
  "faq.section.products": { az: "Məhsullar", en: "Products", ru: "Товары" },
  "faq.section.promo": { az: "Promokod", en: "Promo code", ru: "Промокод" },
  "faq.order.q1": {
    az: "Sifarişi necə verə bilərəm?",
    en: "How can I place an order?",
    ru: "Как оформить заказ?",
  },
  "faq.order.a1": {
    az: "Bəyəndiyiniz məhsulu səbətə əlavə edib rəsmiləşdirmə mərhələsində əlaqə və çatdırılma məlumatlarını daxil etməklə sifariş verə bilərsiniz.",
    en: "Add your preferred product to the cart, then enter contact and delivery details during checkout.",
    ru: "Добавьте выбранный товар в корзину и укажите контактные данные и адрес доставки при оформлении.",
  },
  "faq.order.q2": {
    az: "Sifarişimi necə izləyə bilərəm?",
    en: "How can I track my order?",
    ru: "Как отследить заказ?",
  },
  "faq.order.a2": {
    az: "Sifariş kodunuz varsa, saytdakı sifariş izləmə bölməsindən statusu yoxlaya bilərsiniz.",
    en: "If you have an order code, you can check its status from the order tracking section.",
    ru: "Если у вас есть код заказа, проверьте статус в разделе отслеживания заказа.",
  },
  "faq.delivery.q1": {
    az: "Çatdırılma hansı bölgələrə edilir?",
    en: "Where do you deliver?",
    ru: "Куда осуществляется доставка?",
  },
  "faq.delivery.a1": {
    az: "Bakı şəhəri və Azərbaycanın bölgələrinə çatdırılma mümkündür. Çatdırılma üsulu sifariş zamanı seçilir.",
    en: "Delivery is available in Baku and to regions of Azerbaijan. The delivery method is selected during checkout.",
    ru: "Доставка доступна по Баку и регионам Азербайджана. Способ доставки выбирается при оформлении.",
  },
  "faq.delivery.q2": {
    az: "Çatdırılma qiyməti nə qədərdir?",
    en: "How much does delivery cost?",
    ru: "Сколько стоит доставка?",
  },
  "faq.delivery.a2": {
    az: "AzerPoçt ilə göndəriş 3 ₼, N.Nərimanov və Gənclik metrosuna çatdırılma 2 ₼, depodan təhvil alma isə pulsuzdur. Özünüz ödəniş edərək Bolt və ya Yango ilə çatdırılma da qəbul edə bilərsiniz.",
    en: "Azerpost shipping costs 3 ₼, delivery to N.Narimanov and Ganjlik metro costs 2 ₼, and warehouse pickup is free. You can also receive delivery by Bolt or Yango by paying the delivery fee yourself.",
    ru: "Отправка Azerpost стоит 3 ₼, доставка до метро Н.Нариманов и Гянджлик — 2 ₼, самовывоз со склада бесплатный. Также можно принять доставку через Bolt или Yango, оплатив доставку самостоятельно.",
  },
  "faq.payment.q1": {
    az: "Qapıda ödəniş mümkündür?",
    en: "Is cash on delivery available?",
    ru: "Есть оплата при получении?",
  },
  "faq.payment.a1": {
    az: "Bəli, ödənişi məhsul sizə çatdırıldıqda nağd və ya kartdan-karta edə bilərsiniz.",
    en: "Yes, you can pay by cash or card-to-card transfer when the product is delivered.",
    ru: "Да, вы можете оплатить наличными или переводом с карты на карту при получении.",
  },
  "faq.payment.q2": {
    az: "Kartla ödəniş edə bilərəm?",
    en: "Can I pay by card?",
    ru: "Можно оплатить картой?",
  },
  "faq.payment.a2": {
    az: "Hazırda kartdan-karta ödəniş mümkündür. Ödəniş detalları sifariş zamanı dəqiqləşdirilir.",
    en: "Card-to-card payment is currently available. Payment details are confirmed during the order process.",
    ru: "Сейчас доступен перевод с карты на карту. Детали оплаты уточняются при оформлении заказа.",
  },
  "faq.products.q1": {
    az: "Məhsullar orijinaldır?",
    en: "Are the products original?",
    ru: "Товары оригинальные?",
  },
  "faq.products.a1": {
    az: "Bəli, satışa təqdim olunan məhsullar orijinal və etibarlı təchizat mənbələrindən əldə olunur.",
    en: "Yes, the products offered for sale are original and sourced from trusted suppliers.",
    ru: "Да, товары оригинальные и получены из надежных источников поставки.",
  },
  "faq.products.q2": {
    az: "Ətri seçməkdə kömək edə bilərsiniz?",
    en: "Can you help me choose a fragrance?",
    ru: "Можете помочь выбрать аромат?",
  },
  "faq.products.a2": {
    az: "Bəli, WhatsApp vasitəsilə bizə yazaraq zövqünüzə və istifadə məqsədinizə uyğun ətir tövsiyəsi ala bilərsiniz.",
    en: "Yes, message us on WhatsApp and we can recommend a fragrance based on your taste and purpose.",
    ru: "Да, напишите нам в WhatsApp, и мы подберем аромат под ваш вкус и цель использования.",
  },
  "faq.products.q3": {
    az: "Məhsullar hansı formatda təqdim olunur?",
    en: "What format are the products sold in?",
    ru: "В каком формате представлены товары?",
  },
  "faq.products.a3": {
    az: "Məhsullar qram ətir deyil. Bəzi məhsullar orijinaldır, əksəriyyət isə premium klass, tam qablaşdırmalı və görünüş baxımından birə-bir təqdim olunan ətirlərdir.",
    en: "The products are not decanted perfumes. Some items are original, while most are premium class fragrances with full packaging and one-to-one presentation.",
    ru: "Это не разливные духи. Некоторые товары оригинальные, большинство — премиум-класс в полной упаковке и с максимально близким внешним видом.",
  },
  "faq.promo.q1": {
    az: "Promokoddan necə istifadə edə bilərəm?",
    en: "How can I use a promo code?",
    ru: "Как использовать промокод?",
  },
  "faq.promo.a1": {
    az: "Promokodu səbətdə və ya sifariş mərhələsində daxil edə bilərsiniz. Promokoddan istifadə üçün hesaba daxil olmaq tələb olunur.",
    en: "You can enter the promo code in the cart or during checkout. Login is required to use a promo code.",
    ru: "Промокод можно ввести в корзине или при оформлении заказа. Для использования промокода нужно войти в аккаунт.",
  },

  "contact.title": { az: "Əlaqə", en: "Contact", ru: "Контакты" },
  "contact.subtitle": {
    az: "Mağaza anbar ünvanımız və sosial səhifələrimiz",
    en: "Our warehouse address and social pages",
    ru: "Адрес нашего склада и социальные страницы",
  },
  "contact.storeWarehouse": {
    az: "Mağaza anbar ünvanı",
    en: "Store warehouse address",
    ru: "Адрес склада магазина",
  },
  "contact.addressHint": {
    az: "Sifariş və təhvil alma üçün əvvəlcədən WhatsApp vasitəsilə əlaqə saxlayın.",
    en: "Please contact us on WhatsApp before ordering or pickup.",
    ru: "Перед заказом или самовывозом свяжитесь с нами через WhatsApp.",
  },
  "contact.whatsapp": {
    az: "WhatsApp vasitəsilə əlaqə",
    en: "Contact via WhatsApp",
    ru: "Связаться через WhatsApp",
  },
  "contact.whatsappDesc": {
    az: "Sifariş və suallar üçün yazın",
    en: "Message us for orders and questions",
    ru: "Пишите по заказам и вопросам",
  },
  "contact.instagram": {
    az: "Instagram səhifəmiz",
    en: "Our Instagram page",
    ru: "Наша страница Instagram",
  },
  "contact.tiktok": { az: "TikTok səhifəmiz", en: "Our TikTok page", ru: "Наша страница TikTok" },
  "contact.openWhatsapp": { az: "Yaz", en: "Open", ru: "Открыть" },
  "contact.openInstagram": { az: "Bax", en: "Open", ru: "Открыть" },
  "contact.openTiktok": { az: "Bax", en: "Open", ru: "Открыть" },

  "privacy.title": {
    az: "Gizlilik Siyasəti",
    en: "Privacy Policy",
    ru: "Политика конфиденциальности",
  },
  "privacy.subtitle": {
    az: "Şəxsi məlumatların işlənməsi",
    en: "How we process personal data",
    ru: "Как мы обрабатываем персональные данные",
  },
  "privacy.body": {
    az: "Biz yalnız sifarişlə bağlı məlumatları saxlayırıq və qanuni əsas olmadan üçüncü tərəflərlə paylaşmırıq.",
    en: "We store and process only order-related information and never share personal data with third parties without legal basis.",
    ru: "Мы храним и обрабатываем только данные, связанные с заказом, и не передаем их третьим лицам без законных оснований.",
  },
  "privacy.section.general": { az: "Ümumi yanaşma", en: "General approach", ru: "Общий подход" },
  "privacy.section.generalBody": {
    az: "ƏtirX olaraq istifadəçilərimizin şəxsi məlumatlarının qorunmasına xüsusi önəm veririk. Bu səhifədə məlumatların hansı məqsədlə toplandığı, necə istifadə edildiyi və necə qorunduğu izah olunur.",
    en: "At EtirX, we place special importance on protecting our users' personal data. This page explains why data is collected, how it is used and how it is protected.",
    ru: "В EtirX мы уделяем особое внимание защите персональных данных пользователей. Эта страница объясняет, зачем собираются данные, как они используются и как защищаются.",
  },
  "privacy.section.data": {
    az: "Topladığımız məlumatlar",
    en: "Data we collect",
    ru: "Данные, которые мы собираем",
  },
  "privacy.section.dataBody": {
    az: "Sifarişin icrası və müştəri ilə əlaqə üçün ad, soyad, telefon nömrəsi, e-poçt ünvanı, çatdırılma ünvanı və sifariş məlumatları toplana bilər.",
    en: "To process orders and contact customers, we may collect name, surname, phone number, email address, delivery address and order details.",
    ru: "Для выполнения заказа и связи с клиентом мы можем собирать имя, фамилию, номер телефона, адрес электронной почты, адрес доставки и данные заказа.",
  },
  "privacy.section.use": {
    az: "Məlumatların istifadəsi",
    en: "How we use data",
    ru: "Как мы используем данные",
  },
  "privacy.section.useBody": {
    az: "Toplanan məlumatlar yalnız sifarişlərin hazırlanması və çatdırılması, müştəri ilə əlaqə, sifariş statusunun bildirilməsi və xidmət keyfiyyətinin yaxşılaşdırılması üçün istifadə olunur.",
    en: "Collected data is used only to prepare and deliver orders, contact customers, notify order status and improve service quality.",
    ru: "Собранные данные используются только для подготовки и доставки заказов, связи с клиентом, уведомления о статусе заказа и улучшения качества сервиса.",
  },
  "privacy.section.protect": {
    az: "Məlumatların qorunması",
    en: "Data protection",
    ru: "Защита данных",
  },
  "privacy.section.protectBody": {
    az: "Məlumatlar yalnız sifariş prosesinin icrası üçün saxlanılır və qanuni əsas olmadan üçüncü şəxslərlə paylaşılmır. İstifadəçi məlumatlarının təhlükəsizliyi üçün uyğun texniki və təşkilati tədbirlər tətbiq olunur.",
    en: "Data is stored only for order processing and is not shared with third parties without legal basis. Appropriate technical and organizational measures are applied to protect user data.",
    ru: "Данные хранятся только для выполнения заказа и не передаются третьим лицам без законных оснований. Для защиты данных пользователей применяются соответствующие технические и организационные меры.",
  },
  "privacy.section.thirdParty": {
    az: "Üçüncü tərəflər və əlaqə",
    en: "Third parties and contact",
    ru: "Третьи стороны и связь",
  },
  "privacy.section.thirdPartyBody": {
    az: "Zəruri hallarda çatdırılma və ödəniş prosesində tərəfdaş xidmətlərdən istifadə oluna bilər. Əlavə sual üçün WhatsApp, Instagram və ya TikTok vasitəsilə bizimlə əlaqə saxlaya bilərsiniz.",
    en: "When necessary, partner services may be used for delivery and payment processing. For additional questions, you can contact us via WhatsApp, Instagram or TikTok.",
    ru: "При необходимости для доставки и оплаты могут использоваться услуги партнеров. По дополнительным вопросам вы можете связаться с нами через WhatsApp, Instagram или TikTok.",
  },
  "privacy.section.contact": { az: "Yekun qeyd", en: "Final note", ru: "Заключение" },
  "privacy.section.contactBody": {
    az: "ƏtirX platformasından istifadə etməklə siz bu gizlilik siyasətini qəbul etmiş olursunuz.",
    en: "By using the EtirX platform, you accept this privacy policy.",
    ru: "Используя платформу EtirX, вы соглашаетесь с этой политикой конфиденциальности.",
  },
  "privacy.confirmation": {
    az: "ƏtirX platformasından istifadə etməklə siz yuxarıdakı şərtləri qəbul etdiyinizi təsdiqləyirsiniz.",
    en: "By using the EtirX platform, you confirm that you accept the terms above.",
    ru: "Используя платформу EtirX, вы подтверждаете, что принимаете условия выше.",
  },

  "terms.title": { az: "İstifadə Şərtləri", en: "Terms of Use", ru: "Условия использования" },
  "terms.subtitle": {
    az: "Saytdan istifadə qaydaları",
    en: "Website usage rules",
    ru: "Правила использования сайта",
  },
  "terms.body": {
    az: "Bu saytdan istifadə etməklə sifariş, çatdırılma və qaytarma şərtlərimizi qəbul etmiş olursunuz.",
    en: "By using this site, you agree to our ordering, delivery and return terms.",
    ru: "Используя сайт, вы соглашаетесь с условиями заказа, доставки и возврата.",
  },
  "terms.section.general": {
    az: "Ümumi müddəalar",
    en: "General provisions",
    ru: "Общие положения",
  },
  "terms.section.generalBody": {
    az: "Bu saytdan istifadə etməklə istifadəçi təqdim olunan şərtləri qəbul etmiş hesab olunur. ƏtirX bu şərtləri zərurət olduqda yeniləmək hüququnu saxlayır.",
    en: "By using this website, the user is considered to have accepted these terms. EtirX reserves the right to update these terms when necessary.",
    ru: "Используя этот сайт, пользователь считается принявшим данные условия. EtirX оставляет за собой право обновлять условия при необходимости.",
  },
  "terms.section.products": {
    az: "Məhsul məlumatları",
    en: "Product information",
    ru: "Информация о товарах",
  },
  "terms.section.productsBody": {
    az: "Saytda təqdim olunan məhsul şəkilləri, təsvirləri və qiymətləri məlumat xarakteri daşıyır. Məhsulların mövcudluğu və qiyməti sifariş təsdiqlənənədək dəyişə bilər.",
    en: "Product images, descriptions and prices on the website are informational. Product availability and prices may change until the order is confirmed.",
    ru: "Изображения, описания и цены товаров на сайте носят информационный характер. Наличие и цена могут измениться до подтверждения заказа.",
  },
  "terms.section.format": { az: "Məhsulların formatı", en: "Product format", ru: "Формат товаров" },
  "terms.section.formatBody": {
    az: "Məhsullar qram ətir deyil. Bəzi məhsullar orijinaldır, əksəriyyət isə premium klass, tam qablaşdırmalı və görünüş baxımından birə-bir təqdim olunan ətirlərdir. Məhsul haqqında əlavə məlumat almaq üçün sifarişdən əvvəl bizimlə əlaqə saxlaya bilərsiniz.",
    en: "The products are not decanted perfumes. Some items are original, while most are premium class fragrances with full packaging and one-to-one presentation. You may contact us before ordering for more details.",
    ru: "Это не разливные духи. Некоторые товары оригинальные, большинство — премиум-класс в полной упаковке и с максимально близким внешним видом. Для уточнения информации свяжитесь с нами до заказа.",
  },
  "terms.section.order": { az: "Sifariş qaydası", en: "Order process", ru: "Порядок заказа" },
  "terms.section.orderBody": {
    az: "İstifadəçi məhsulu səbətə əlavə edərək sifariş məlumatlarını düzgün daxil etməlidir. Yanlış və ya natamam məlumatlara görə çatdırılmada yaranan gecikmələrə görə ƏtirX məsuliyyət daşımır.",
    en: "The user must add the product to the cart and enter accurate order details. EtirX is not responsible for delivery delays caused by incorrect or incomplete information.",
    ru: "Пользователь должен добавить товар в корзину и корректно указать данные заказа. EtirX не несет ответственности за задержки доставки из-за неверной или неполной информации.",
  },
  "terms.section.delivery": { az: "Çatdırılma", en: "Delivery", ru: "Доставка" },
  "terms.section.deliveryBody": {
    az: "Çatdırılma üsulu sifariş zamanı seçilir. AzerPoçt ilə göndəriş, metroya çatdırılma, depodan təhvil alma və müştərinin öz ödənişi ilə Bolt/Yango vasitəsilə çatdırılma mümkündür.",
    en: "The delivery method is selected during checkout. Azerpost shipping, metro delivery, warehouse pickup and Bolt/Yango delivery paid by the customer are available.",
    ru: "Способ доставки выбирается при оформлении. Доступны отправка Azerpost, доставка к метро, самовывоз со склада и доставка Bolt/Yango за счет клиента.",
  },
  "terms.section.payment": { az: "Ödəniş", en: "Payment", ru: "Оплата" },
  "terms.section.paymentBody": {
    az: "Ödəniş məhsul təhvil verilərkən nağd və ya kartdan-karta edilə bilər. Ödəniş tamamlanmadan məhsul təhvil verilmir.",
    en: "Payment can be made in cash or by card-to-card transfer upon delivery. The product is not handed over until payment is completed.",
    ru: "Оплата возможна наличными или переводом с карты на карту при получении. Товар не передается до завершения оплаты.",
  },
  "terms.section.return": {
    az: "Qaytarma və dəyişdirmə",
    en: "Returns and exchanges",
    ru: "Возврат и обмен",
  },
  "terms.section.returnBody": {
    az: "Məhsul açılmamış, istifadə edilməmiş və qablaşdırması zədələnməmiş vəziyyətdə olduqda qaytarma və ya dəyişdirmə müraciəti dəyərləndirilə bilər. Açılmış və istifadə edilmiş ətirlər geri qəbul edilmir.",
    en: "Return or exchange requests may be reviewed if the product is unopened, unused and the packaging is undamaged. Opened or used fragrances are not accepted back.",
    ru: "Возврат или обмен может быть рассмотрен, если товар не открыт, не использован и упаковка не повреждена. Открытые или использованные ароматы не принимаются обратно.",
  },
  "terms.section.promo": {
    az: "Promokodlar və endirimlər",
    en: "Promo codes and discounts",
    ru: "Промокоды и скидки",
  },
  "terms.section.promoBody": {
    az: "Promokodlar yalnız aktiv olduğu müddətdə keçərlidir. Promokoddan istifadə üçün istifadəçinin hesaba daxil olması tələb oluna bilər. ƏtirX kampaniya və endirim şərtlərini dəyişmək hüququnu saxlayır.",
    en: "Promo codes are valid only while active. Login may be required to use a promo code. EtirX reserves the right to change campaign and discount terms.",
    ru: "Промокоды действуют только в период активности. Для использования промокода может потребоваться вход в аккаунт. EtirX оставляет за собой право изменять условия акций и скидок.",
  },
  "terms.section.privacy": { az: "Məxfilik", en: "Privacy", ru: "Конфиденциальность" },
  "terms.section.privacyBody": {
    az: "İstifadəçinin adı, əlaqə nömrəsi, ünvanı və sifariş məlumatları yalnız sifarişin icrası üçün istifadə olunur və qanuni əsas olmadan üçüncü şəxslərlə paylaşılmır.",
    en: "The user's name, phone number, address and order details are used only to process the order and are not shared with third parties without legal basis.",
    ru: "Имя, номер телефона, адрес и данные заказа используются только для выполнения заказа и не передаются третьим лицам без законных оснований.",
  },
  "terms.section.contact": { az: "Əlaqə", en: "Contact", ru: "Контакты" },
  "terms.section.contactBody": {
    az: "Sifariş, çatdırılma və məhsullarla bağlı suallar üçün istifadəçi WhatsApp, Instagram və ya TikTok vasitəsilə ƏtirX ilə əlaqə saxlaya bilər.",
    en: "For questions about orders, delivery and products, users can contact EtirX via WhatsApp, Instagram or TikTok.",
    ru: "По вопросам заказа, доставки и товаров пользователь может связаться с EtirX через WhatsApp, Instagram или TikTok.",
  },
  "terms.confirmation": {
    az: "ƏtirX saytından istifadə etməklə siz yuxarıdakı şərtlərlə tanış olduğunuzu və onları qəbul etdiyinizi təsdiqləyirsiniz.",
    en: "By using the EtirX website, you confirm that you have read and accepted the terms above.",
    ru: "Используя сайт EtirX, вы подтверждаете, что ознакомились с условиями выше и принимаете их.",
  },

  "tracking.title": { az: "Sifariş İzləmə", en: "Order Tracking", ru: "Отслеживание заказа" },
  "tracking.subtitle": {
    az: "Sifariş nömrəsi ilə statusu yoxlayın",
    en: "Check order status by order number",
    ru: "Проверьте статус по номеру заказа",
  },
  "tracking.input": {
    az: "Sifariş nömrəsini daxil edin",
    en: "Enter order number",
    ru: "Введите номер заказа",
  },
  "tracking.empty": {
    az: "Zəhmət olmasa sifariş nömrəsini daxil edin.",
    en: "Please enter order number.",
    ru: "Пожалуйста, введите номер заказа.",
  },
  "tracking.check": { az: "Statusu yoxla", en: "Check status", ru: "Проверить статус" },
  "tracking.checking": { az: "Yoxlanılır...", en: "Checking...", ru: "Проверка..." },
  "tracking.notFound": {
    az: "Sifariş tapılmadı və ya server əlçatan deyil.",
    en: "Order not found or server unavailable.",
    ru: "Заказ не найден или сервер недоступен.",
  },
  "tracking.order": { az: "Sifariş", en: "Order", ru: "Заказ" },
  "tracking.status": { az: "Status", en: "Status", ru: "Статус" },
  "tracking.heading": {
    az: "📦 Sifariş İzləmə",
    en: "📦 Order Tracking",
    ru: "📦 Отслеживание заказа",
  },
  "tracking.intro": {
    az: "Sifariş kodunuzu daxil edərək statusunu izləyə bilərsiniz.",
    en: "Enter your order code to track its status.",
    ru: "Введите код заказа, чтобы отслеживать его статус.",
  },
  "tracking.codePlaceholder": {
    az: "Sifariş kodu (məs: ETX-ABC123)",
    en: "Order code (e.g. ETX-ABC123)",
    ru: "Код заказа (напр. ETX-ABC123)",
  },
  "tracking.codeLabel": { az: "Sifariş kodu", en: "Order code", ru: "Код заказа" },
  "tracking.track": { az: "İzlə", en: "Track", ru: "Отследить" },
  "tracking.notFoundCheck": {
    az: "Sifariş tapılmadı. Kodu yoxlayın.",
    en: "Order not found. Please check the code.",
    ru: "Заказ не найден. Проверьте код.",
  },
  "tracking.genericError": {
    az: "Xəta baş verdi. Yenidən cəhd edin.",
    en: "Something went wrong. Please try again.",
    ru: "Произошла ошибка. Повторите попытку.",
  },
  "tracking.networkError": {
    az: "Şəbəkə xətası. İnternet bağlantınızı yoxlayın.",
    en: "Network error. Please check your connection.",
    ru: "Ошибка сети. Проверьте подключение к интернету.",
  },
  "tracking.live": { az: "Canlı", en: "Live", ru: "В сети" },
  "tracking.total": { az: "Ümumi məbləğ", en: "Total", ru: "Итого" },
  "tracking.date": { az: "Tarix", en: "Date", ru: "Дата" },
  "tracking.cancelledNotice": {
    az: "Bu sifariş ləğv edilib.",
    en: "This order has been cancelled.",
    ru: "Этот заказ был отменён.",
  },
  "status.new": { az: "Gözləmədə", en: "Pending", ru: "В ожидании" },
  "status.confirmed": { az: "Təsdiqləndi", en: "Confirmed", ru: "Подтверждён" },
  "status.shipped": { az: "Yolda", en: "Shipped", ru: "В пути" },
  "status.delivered": { az: "Çatdırıldı", en: "Delivered", ru: "Доставлен" },
  "status.cancelled": { az: "Ləğv edildi", en: "Cancelled", ru: "Отменён" },

  "notFound.text": { az: "Səhifə tapılmadı", en: "Page not found", ru: "Страница не найдена" },
  "notFound.home": { az: "Ana səhifə", en: "Home", ru: "Главная" },

  "profile.myAccount": { az: "Mənim hesabım", en: "My Account", ru: "Мой аккаунт" },
  "profile.loginRegister": {
    az: "Daxil ol / Qeydiyyat",
    en: "Login / Register",
    ru: "Вход / Регистрация",
  },
  "profile.codEnabled": {
    az: "Qapıda ödəniş: Aktivdir",
    en: "Cash on delivery: Enabled",
    ru: "Оплата при получении: Включена",
  },
  "profile.notificationsEnabled": {
    az: "Bildirişlər: Aktivdir",
    en: "Notifications: Enabled",
    ru: "Уведомления: Включены",
  },
  "profile.logout": { az: "Çıxış", en: "Logout", ru: "Выйти" },
  "profile.login": { az: "Daxil ol", en: "Login", ru: "Войти" },
  "profile.register": { az: "Qeydiyyat", en: "Register", ru: "Регистрация" },
  "profile.fullName": { az: "Ad və soyad", en: "Full name", ru: "Имя и фамилия" },
  "profile.email": { az: "E-poçt", en: "Email", ru: "Эл. почта" },
  "profile.phone": { az: "Telefon (+994...)", en: "Phone (+994...)", ru: "Телефон (+994...)" },
  "profile.password": { az: "Şifrə", en: "Password", ru: "Пароль" },
  "profile.createAccount": { az: "Hesab yarat", en: "Create account", ru: "Создать аккаунт" },
  "profile.nameErr": {
    az: "Ad 2-60 simvol olmalıdır.",
    en: "Name must be 2-60 chars.",
    ru: "Имя должно быть 2-60 символов.",
  },
  "profile.emailErr": {
    az: "E-poçt düzgün deyil.",
    en: "Email is invalid.",
    ru: "Некорректный email.",
  },
  "profile.phoneErr": {
    az: "Telefon 9-15 rəqəm olmalıdır.",
    en: "Phone must be 9-15 digits.",
    ru: "Телефон должен содержать 9-15 цифр.",
  },
  "profile.passErr": {
    az: "Şifrə minimum 8 simvol, hərf və rəqəm olmalıdır.",
    en: "Password min 8 chars with letter+number.",
    ru: "Пароль минимум 8 символов, с буквой и цифрой.",
  },
  "profile.fixErr": {
    az: "Xanaları düzəldin.",
    en: "Please fix highlighted fields.",
    ru: "Исправьте выделенные поля.",
  },
  "profile.noUser": {
    az: "Qeydiyyatlı istifadəçi tapılmadı. Əvvəl qeydiyyatdan keçin.",
    en: "No registered user found. Please register first.",
    ru: "Зарегистрированный пользователь не найден. Сначала зарегистрируйтесь.",
  },
  "profile.badLogin": {
    az: "E-poçt və ya şifrə yanlışdır.",
    en: "Email or password is incorrect.",
    ru: "Неверный email или пароль.",
  },
  "profile.demoInfo": {
    az: "Demo giriş localStorage əsaslıdır. Növbəti addım backend auth-dur.",
    en: "Demo auth is localStorage-based. Backend auth is the next step.",
    ru: "Демо-авторизация работает через localStorage. Следующий шаг — backend auth.",
  },
  "profile.accountCreated": {
    az: "Hesab uğurla yaradıldı.",
    en: "Account created successfully.",
    ru: "Аккаунт успешно создан.",
  },
  "profile.registerFailed": {
    az: "Qeydiyyat alınmadı.",
    en: "Registration failed.",
    ru: "Регистрация не удалась.",
  },
  "profile.loginSuccess": {
    az: "Giriş uğurludur.",
    en: "Login successful.",
    ru: "Вход выполнен успешно.",
  },
  "profile.addressNotSet": {
    az: "Ünvan qeyd edilməyib",
    en: "Address not set",
    ru: "Адрес не указан",
  },
  "profile.editProfile": {
    az: "Profili redaktə et",
    en: "Edit Profile",
    ru: "Редактировать профиль",
  },
  "profile.changePassword": { az: "Şifrəni dəyiş", en: "Change Password", ru: "Сменить пароль" },
  "profile.myOrders": { az: "Sifarişlərim", en: "My Orders", ru: "Мои заказы" },
  "profile.noOrders": { az: "Hələ sifariş yoxdur.", en: "No orders yet.", ru: "Заказов пока нет." },
  "profile.total": { az: "Cəmi", en: "Total", ru: "Итого" },
  "profile.address": { az: "Ünvan", en: "Address", ru: "Адрес" },
  "profile.editTitle": {
    az: "Profili redaktə et",
    en: "Edit Profile",
    ru: "Редактировать профиль",
  },
  "profile.save": { az: "Yadda saxla", en: "Save", ru: "Сохранить" },
  "profile.updated": { az: "Profil yeniləndi.", en: "Profile updated.", ru: "Профиль обновлён." },
  "profile.updateFailed": {
    az: "Profil yenilənmədi.",
    en: "Could not update profile.",
    ru: "Не удалось обновить профиль.",
  },
  "profile.loadFailed": {
    az: "Profil məlumatı yüklənmədi.",
    en: "Could not load your profile.",
    ru: "Не удалось загрузить профиль.",
  },
  "profile.passwordRequired": {
    az: "Şifrəni daxil edin.",
    en: "Enter your password.",
    ru: "Введите пароль.",
  },
  "profile.passwordTitle": { az: "Şifrəni dəyiş", en: "Change Password", ru: "Сменить пароль" },
  "profile.currentPassword": { az: "Cari şifrə", en: "Current password", ru: "Текущий пароль" },
  "profile.newPassword": { az: "Yeni şifrə", en: "New password", ru: "Новый пароль" },
  "profile.passwordUpdated": {
    az: "Şifrə yeniləndi.",
    en: "Password updated.",
    ru: "Пароль обновлён.",
  },
  "profile.passwordUpdateFailed": {
    az: "Şifrə yenilənmədi.",
    en: "Could not change password.",
    ru: "Не удалось сменить пароль.",
  },
  "profile.updatePasswordBtn": {
    az: "Şifrəni yenilə",
    en: "Update password",
    ru: "Обновить пароль",
  },
  "profile.authEnabled": {
    az: "Token əsaslı giriş aktivdir.",
    en: "Token-based auth enabled.",
    ru: "Токен-аутентификация включена.",
  },
};

type I18nValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};
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
