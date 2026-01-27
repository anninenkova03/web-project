# 📝 Slim Presentation Editor - Frontend UI

**Модул:** Editor App  
**Статус:** ✅ Standalone Frontend (не е свързан с backend все още)

## Описание

Уеб-базиран редактор за създаване и редактиране на Slim презентации.

## Файлове

- `index.html` - Основен HTML layout
- `editor.css` - Основни стилове
- `themes.css` - Светла/тъмна тема
- `editor.js` - Главна логика на редактора
- `fileManager.js` - CRUD операции (localStorage)
- `slimValidator.js` - Клиентска валидация на Slim синтаксис
- `syntaxHighlight.js` - Syntax highlighting в textarea
- `templates.json` - Шаблони за различни типове презентации

## Функционалности

✅ Създаване на нова презентация  
✅ Редактиране на Slim текст  
✅ Валидация на синтаксис  
✅ Preview на слайдове  
✅ Запазване в localStorage  
✅ Import/Export на .slim файлове  
✅ Светла и тъмна тема  
✅ Auto-save на 30 сек  

## Как да го тествам

1. Отвори `index.html` в браузър
2. Редактирай презентация или създай нова
3. Натисни "Валидирай" за проверка
4. Натисни "Преглед" за preview

## Следващи стъпки !

🔄 Интеграция с Backend API (PresentationController)  
🔄 Замяна на localStorage с fetch() calls  
🔄 Error handling за API requests  

## Зависимости

Няма външни библиотеки - само Vanilla JS, HTML, CSS