document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedUniId = localStorage.getItem('selectedUni');
    const path = urlParams.get('path') || `/${selectedUniId}`;
    const pathSegments = path.split('/').filter(Boolean);

    const pageTitleEl = document.getElementById('page-title');
    const cardContainer = document.getElementById('card-container');
    const siteTitleEl = document.getElementById('site-title');
    const toolbarContainer = document.getElementById('toolbar-container');
    const navContainer = document.getElementById('nav-container');

    navContainer.innerHTML = '<a href="javascript:history.back()" class="back-link">← Back</a>';

    if (!selectedUniId) {
        if (pageTitleEl) pageTitleEl.textContent = 'No University Selected.';
        return;
    }

    try {
        // Load database.json for lessons + flashcards
        const response = await fetch('./database.json');
        if (!response.ok) throw new Error("Database file not found.");
        const data = await response.json();
        const university = data.tree[selectedUniId];
        siteTitleEl.textContent = `${university.name} Med Portal`;

        let currentNode = university;
        for (const segment of pathSegments.slice(1)) {
            currentNode = currentNode.children[segment];
        }

        if (pageTitleEl) {
            if (pathSegments.length <= 1) {
                pageTitleEl.style.display = 'none';
            } else {
                pageTitleEl.style.display = 'block';
                pageTitleEl.textContent = currentNode.label || currentNode.name;
            }
        }

        cardContainer.innerHTML = '';
        toolbarContainer.innerHTML = '';

        // Render flashcards from database.json
        if (currentNode.resources && currentNode.resources.flashcardDecks) {
            currentNode.resources.flashcardDecks.forEach(deck => {
                toolbarContainer.appendChild(
                    createResourceButton(deck.title, `flashcards.html?collection=${deck.id}&path=${path}`, 'flashcards')
                );
            });
        }

        // Render quizzes from external index.json (إصلاح هنا: استخدم objects مباشرة بدون fetch إضافي)
        try {
            const quizIndexResp = await fetch('./quizzes/index.json');
            if (quizIndexResp.ok) {
                const quizzesIndex = await quizIndexResp.json();
                quizzesIndex.forEach(quiz => {  // quiz هو object مثل {id, title, path}
                    toolbarContainer.appendChild(
                        createResourceButton(
                            quiz.title,  // استخدم title من index.json
                            `quiz.html?collection=${quiz.id}&file=${quiz.path}&path=${path}`,  // مرر path كـ file
                            'quiz'
                        )
                    );
                });
            }
        } catch (quizErr) {
            console.warn('Quizzes index not found:', quizErr);
        }

        // Render children lessons
        if (currentNode.children) {
            for (const id in currentNode.children) {
                const childNode = currentNode.children[id];
                const newPath = `${path}/${id}`.replace(/\/\//g, '/');

                const targetUrl = childNode.isBranch
                    ? `lessons-list.html?path=${newPath}`
                    : `lesson.html?path=${newPath}`;

                const card = createCard(childNode.label, targetUrl, childNode.summary);
                cardContainer.appendChild(card);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        if (pageTitleEl) pageTitleEl.textContent = `Error: ${error.message}`;
    }
});

// UI Helpers (كما هي)
function createCard(title, url, description) {
    const cardLink = document.createElement('a');
    cardLink.href = url;
    cardLink.className = 'card card--lesson';
    cardLink.innerHTML = `<div class="card-content"><h2>${title}</h2></div>`;
    return cardLink;
}

function createResourceButton(text, url, type) {
    const button = document.createElement('a');
    button.href = url;
    button.className = `card card--${type}`;
    button.innerHTML = `<h2>${text}</h2>`;
    return button;
}
