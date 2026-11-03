# YUKBOR Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Yuk egalari va buyurtmachilar: yuk e'lonlarini joylaydi, tashuvchilar takliflarini ko'radi va reyslarni boshqaradi.
- Haydovchilar va avtoparklar: mos yuklarni topadi, transport e'lonlarini yuritadi va yuklarga narx taklif qiladi.
- Dispetcherlar: yuk va tashuvchilar o'rtasidagi ish jarayonini muvofiqlashtiradi.

## Product Purpose

YUKBOR O'zbekistondagi yuk egalari va tashuvchilarni bog'laydigan logistika bozori. Mahsulotning dastlabki maqsadi — yuk va transport e'lonlari, qidiruv, narx takliflari va reys holatlarini yagona veb-ilovada boshqarish.

## Positioning

Mahsulot yuk egalari va tashuvchilar o'rtasida bevosita moslik topish, takliflarni solishtirish va reys jarayonini kuzatishga xizmat qiladi. Prototipdagi real vaqtli xarita, huquqiy kafolat yoki integratsiya da'volari ishlab turgan imkoniyat sifatida ko'rsatilmaydi, toki ular haqiqiy servislar bilan tasdiqlanmaguncha.

## Operating Context

Foydalanuvchilar logistika ishlarini veb-brauzerda, kompyuter yoki telefondan bajaradi. Yuk e'loni, transport, taklif va reys holati asosiy ish obyektlaridir. Interfeys va atamalar o'zbek tilida bo'ladi.

## Capabilities and Constraints

- MVP: telefon raqami va parol bilan ro'yxatdan o'tish/kirish; yuk va transport e'lonlari; qidiruv va filtrlar; auktsion takliflari; taklifni tanlash va reys holatini ko'rish.
- MVP rollari: yuk egasi (`shipper`), haydovchi (`driver`), avtopark (`fleet`) va dispetcher (`dispatcher`).
- Backend: Node.js/TypeScript, Express, PostgreSQL va Prisma; frontend React/TypeScript/Vite.
- Telegram OTP, OneID/Soliq/KYC, jonli GPS, chat, to'lov/Escrow, E-TTN/E-IMZO integratsiyalari MVP doirasidan tashqarida.
- Sinov uchun seed ma'lumotlar sintetik deb belgilanishi, ishlab chiqarish ma'lumoti yoki haqiqiy hamkorlar sifatida taqdim etilmasligi kerak.

## Brand Commitments

- Mahsulot nomi: YUKBOR.
- Mavjud vizual identifikatsiya saqlanadi: qora/oq neytral yuzalar va signal-to'q sariq aksent.

## Evidence on Hand

- Asosiy manba: `yukbor_magistral_yuk_tashish_va_logistika_tizimi.html`, mavjud UI va domen atamalarini ko'rsatuvchi demo prototip.
- Hozirgi repo'da ishlaydigan backend, ma'lumotlar bazasi yoki tashqi integratsiya yo'q.
- Prototipdagi narxlar, kompaniyalar, foydalanuvchilar, tekshiruvlar va jonli holatlar demo mazmuni bo'lib, tasdiqlangan real ko'rsatkichlar emas.

## Product Principles

- Avval yuk egasi va tashuvchi uchun asosiy ishni sodda bajarish.
- Ruxsatlarni va ma'lumot egasini backendda tekshirish.
- Demo va haqiqiy tashqi integratsiyani aniq ajratish.
- Ishonch va logistika holatlarini tekshirilmagan da'volarsiz ko'rsatish.
