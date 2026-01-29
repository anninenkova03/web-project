export const PRESENTATIONS = [
    {
        id: 1,
        title: "Въведение в Web Technologies",
        type: "lecture",
        author: "Team 1",
        date: "2026-01-15",
        slides: [
            {
                id: 1,
                order: 1,
                type: "title",
                title: "Въведение в Web Technologies",
                previous: null,
                next: 2,
                data: {
                    subtitle: "HTML, CSS, JavaScript & PHP"
                }
            },
            {
                id: 2,
                order: 2,
                type: "content",
                title: "Какво ще научим?",
                previous: 1,
                next: 3,
                data: {
                    content: "<ul><li>HTML</li><li>CSS</li></ul>"
                }
            },
            {
                id: 3,
                order: 3,
                type: "code",
                title: "HTML пример",
                previous: 2,
                next: null,
                data: {
                    code: "<h1>Hello</h1>"
                }
            }
        ]
    }
];
