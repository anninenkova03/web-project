export const PRESENTATIONS = [
    {
        id: 1,
        title: "Модерен JavaScript: ES6+ Функции",
        type: "workshop",
        author: "Team Frontend",
        date: "2026-02-20",
        slides: [
            {
                id: 1,
                order: 1,
                type: "title",
                title: "ES6+ JavaScript Функции",
                previous: null,
                next: 2,
                data: {
                    subtitle: "Arrow функции, Destructuring, Spread/Rest"
                }
            },
            {
                id: 2,
                order: 2,
                type: "content",
                title: "Основни ES6+ Функции",
                previous: 1,
                next: 3,
                data: {
                    content: "<ul><li>Arrow функции</li><li>Template literals</li><li>Destructuring</li><li>Spread/rest оператори</li><li>Модули</li></ul>"
                }
            },
            {
                id: 3,
                order: 3,
                type: "code",
                title: "Пример: Arrow функции",
                previous: 2,
                next: 4,
                data: {
                    language: "javascript",
                    code: "// Традиционна функция\nconst sum = function(a, b) {\n    return a + b;\n};\n\n// Arrow функция\nconst sumArrow = (a, b) => a + b;\n\n// Извикване\nconsole.log(sum(5, 3)); // 8\nconsole.log(sumArrow(5, 3)); // 8"
                }
            },
            {
                id: 4,
                order: 4,
                type: "code",
                title: "Пример: Destructuring",
                previous: 3,
                next: 5,
                data: {
                    language: "javascript",
                    code: "// Destructuring на масив\nconst colors = ['red', 'green', 'blue'];\nconst [firstColor, secondColor] = colors;\nconsole.log(firstColor); // 'red'\n\n// Destructuring на обект\nconst user = {\n    name: 'Иван',\n    age: 30,\n    city: 'София'\n};\nconst { name, age } = user;\nconsole.log(name); // 'Иван'"
                }
            },
            {
                id: 5,
                order: 5,
                type: "content",
                title: "Предимства на ES6+",
                previous: 4,
                next: null,
                data: {
                    content: "<ul><li>По-четим код</li><li>По-малко boilerplate</li><li>Подобрена производителност</li><li>По-добра поддръжка за функционално програмиране</li><li>Съвместимост с модерни браузъри</li></ul>"
                }
            }
        ]
    },
];