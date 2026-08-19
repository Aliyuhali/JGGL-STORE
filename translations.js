// ===========================================
// JGGL-STORE TRANSLATIONS
// ENGLISH + HAUSA
// ===========================================

const JGGL_TRANSLATIONS = {

    English: {

        // Common
        back: "Back",
        home: "Home",
        products: "Products",

productTypes:
    "Product Types",

        cart: "Cart",
        wishlist: "Wishlist",
        account: "Account",
        save: "Save",
        delete: "Delete",
        edit: "Edit",
        view: "View",
        settings: "Settings",
        notifications: "Notifications",

        // Settings
        settingsTitle: "Settings",
        editProfile: "Edit Profile",
        language: "Language",
        darkMode: "Dark Mode",
        privacySecurity: "Privacy & Security",
        aboutStore: "About JGGL-STORE",

        // Language page
        languageTitle: "Language",
        chooseLanguage: "Choose Language",
        chooseLanguageText:
            "Select the language you want to use in JGGL-STORE.",
        useEnglish:
            "Use JGGL-STORE in English",
        useHausa:
            "Use JGGL-STORE in Hausa",

        // Account
        myAccount: "My Account",
        myCart: "My Cart",
        myWishlist: "My Wishlist",
        checkout: "Checkout",
        userProfile: "User Profile",
        myOrders: "My Orders",
        deliveryAddress: "Delivery Address",
        logout: "Logout",


        // Privacy and security
        privacySecurityTitle:
            "Privacy & Security",
        changePassword:
            "Change Password",
        loginDeviceSecurity:
            "Login & Device Security",
        privacyPolicy:
            "Privacy Policy",
        termsConditions:
            "Terms & Conditions",
        deleteAccount:
            "Delete Account",

        searchProducts:
            "Live Search Products...",

        noProductFound:
            "No product found",

        trendingProducts:
            "Trending Products",

        featuredProducts:
            "Featured Products",

        viewAll:
            "View All",

        me:
            "Me",


searchProducts: "Live Search Products...",
noProductFound: "No product found",
trendingProducts: "Trending Products",
featuredProducts: "Featured Products",
viewAll: "View All",
me: "Me",



welcomeStore:
    "Welcome to JGGL-STORE",

history:
    "History",

recent:
    "Recent",

allCategories:
    "All Categories",


    },

    Hausa: {

        // Common
        back: "Baya",
        home: "Gida",
        products: "Kayayyaki",
productTypes:
    "Nau'ikan Kayayyaki",       cart: "Keken Siyayya",
        wishlist: "Abubuwan So",
        account: "Asusu",
        save: "Ajiye",
        delete: "Goge",
        edit: "Gyara",
        view: "Duba",
        settings: "Saituna",
        notifications: "Sanarwa",

        // Settings
        settingsTitle: "Saituna",
        editProfile: "Gyara Bayanan Asusu",
        language: "Harshe",
        darkMode: "Yanayin Duhu",
        privacySecurity:
            "Sirri da Tsaro",
        aboutStore:
            "Game da JGGL-STORE",

        // Language page
        languageTitle: "Harshe",
        chooseLanguage:
            "Zaɓi Harshe",
        chooseLanguageText:
            "Zaɓi harshen da kake son amfani da shi a JGGL-STORE.",
        useEnglish:
            "Yi amfani da JGGL-STORE da Turanci",
        useHausa:
            "Yi amfani da JGGL-STORE da Hausa",

        // Account
        myAccount: "Asusuna",
        myCart: "Keken Siyayya Na",
        myWishlist: "Abubuwan So Na",
        checkout: "Kammala Siyayya",
        userProfile:
            "Bayanan Mai Amfani",
        myOrders: "Ododina",
        deliveryAddress:
            "Adireshin Isarwa",
        logout: "Fita",


        // Privacy and security
        privacySecurityTitle:
            "Sirri da Tsaro",
        changePassword:
            "Canja Kalmar Sirri",
        loginDeviceSecurity:
            "Tsaron Shiga da Na’ura",
        privacyPolicy:
            "Dokar Sirri",
        termsConditions:
            "Sharuɗɗa da Ka’idoji",
        deleteAccount:
            "Goge Asusu",

        searchProducts:
            "Nemi Kayayyaki...",

        noProductFound:
            "Ba a sami kaya ba",

        trendingProducts:
            "Shahararrun Kayayyaki",

        featuredProducts:
            "Fitattun Kayayyaki",

        viewAll:
            "Duba Duka",

        me:
            "Ni",



searchProducts: "Nemi Kayayyaki...",
noProductFound: "Ba a sami kaya ba",
trendingProducts: "Shahararrun Kayayyaki",
featuredProducts: "Fitattun Kayayyaki",
viewAll: "Duba Duka",
me: "Ni",


welcomeStore:
    "Barka da zuwa JGGL-STORE",

history:
    "Tarihi",

recent:
    "Na Kwanan Nan",

allCategories:
    "Dukkan Rukuni",


    }


};


// ===========================================
// GET TRANSLATION
// ===========================================

function t(key){

    const language =
        localStorage.getItem(
            "jgglLanguage"
        ) || "English";

    const selectedTranslations =
        JGGL_TRANSLATIONS[language] ||
        JGGL_TRANSLATIONS.English;

    return (
        selectedTranslations[key] ||
        JGGL_TRANSLATIONS.English[key] ||
        key
    );

}



function applyTranslations(){

    document
        .querySelectorAll("[data-i18n]")
        .forEach(function(element){

            const key =
                element.getAttribute(
                    "data-i18n"
                );

            element.textContent = t(key);

        });

    document
        .querySelectorAll(
            "[data-i18n-placeholder]"
        )
        .forEach(function(element){

            const key =
                element.getAttribute(
                    "data-i18n-placeholder"
                );

            element.placeholder = t(key);

        });

}



document.addEventListener(
    "DOMContentLoaded",
    function(){

        applyTranslations();

    }
);


