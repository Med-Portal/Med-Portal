document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedUniId = localStorage.getItem('selectedUni');
    const path = urlParams.get('path') || `/${selectedUniId}`;
    
    console.log('=== DIAGNOSTIC INFO ===');
    console.log('Current path:', path);
    console.log('Selected Uni:', selectedUniId);

    const pageTitleEl = document.getElementById('page-title');
    const cardContainer = document.getElementById('card-container');
    const siteTitleEl = document.getElementById('site-title');
    const toolbarContainer = document.getElementById('toolbar-container');
    const navContainer = document.getElementById('nav-container');

    // Check if containers exist
    console.log('Toolbar container exists:', !!toolbarContainer);
    console.log('Card container exists:', !!cardContainer);

    navContainer.innerHTML = '<a href="javascript:history.back()" class="back-link">← Back</a>';

    if (!selectedUniId) {
        if (pageTitleEl) pageTitleEl.textContent = 'No University Selected.';
        return;
    }

    try {
        const response = await fetch('./database.json');
        if (!response.ok) throw new Error("Database file not found.");
        const data = await response.json();
        const university = data.tree[selectedUniId];
        siteTitleEl.textContent = `${university.name} Med Portal`;

        const pathSegments = path.split('/').filter(Boolean);
        let currentNode = university;
        for (const segment of pathSegments.slice(1)) {
            currentNode = currentNode.children[segment];
        }

        console.log('Current node:', currentNode.label || currentNode.name);
        console.log('Node has resources:', !!currentNode.resources);

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

        // Flashcards
        if (currentNode.resources && currentNode.resources.flashcardDecks) {
            console.log('Found flashcards:', currentNode.resources.flashcardDecks.length);
            currentNode.resources.flashcardDecks.forEach(deck => {
                toolbarContainer.appendChild(
                    createResourceButton(deck.title, `flashcards.html?collection=${deck.id}&path=${path}`, 'flashcards')
                );
            });
        }

        // QUIZZES - DIAGNOSTIC VERSION
        console.log('Attempting to load quizzes...');
        try {
            const quizIndexResp = await fetch('./quizzes/index.json');
            console.log('Quiz index response status:', quizIndexResp.status);
            
            if (quizIndexResp.ok) {
                const allQuizzes = await quizIndexResp.json();
                console.log('Total quizzes in index:', allQuizzes.length);
                console.log('First quiz:', allQuizzes[0]);
                
                // Show ALL quizzes for debugging (remove filter)
                console.log('Creating buttons for all quizzes...');
                allQuizzes.forEach((quiz, index) => {
                    console.log(`Quiz ${index}:`, quiz.title, quiz.id);
                    const button = createResourceButton(
                        quiz.title,
                        `quiz.html?collection=${quiz.id}&path=${path}`,
                        'quiz'
                    );
                    toolbarContainer.appendChild(button);
                    console.log('Button created and appended');
                });
                
                console.log('Total buttons created:', allQuizzes.length);
            } else {
                console.error('Quiz index not OK:', quizIndexResp.status);
            }
        } catch (quizErr) {
            console.error('Quiz loading error:', quizErr);
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
        
        console.log('=== END DIAGNOSTIC ===');
    } catch (error) {
        console.error('Main error:', error);
        if (pageTitleEl) pageTitleEl.textContent = `Error: ${error.message}`;
    }
});

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
