import fs from 'fs/promises';
import path from 'path';

// Helper to format names as a fallback
function formatLabel(name) {
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper to create a unique ID from relative path
function createIdFromPath(baseDir, filePath) {
    const relativePath = path.relative(baseDir, filePath); // e.g., cairo/medicine/_collection_quiz/quiz1.json
    return relativePath
        .replace(/\\/g, '/') // normalize slashes for Windows
        .replace(/\.json$/, '') // remove extension
        .replace(/[^a-zA-Z0-9]+/g, '_') // replace non-alphanumerics
        .toLowerCase();
}

// Main function to generate quizzes only
async function generateQuizzes() {
    const universitiesPath = 'content/universities';
    const quizzesOutputDir = path.join('docs', 'quizzes'); // <-- lowercase folder
    await fs.mkdir(quizzesOutputDir, { recursive: true });

    // Array to collect quiz metadata for the index
    const quizzesIndex = [];

    async function scanForQuizzes(dirPath) {
        const collectionQuizPath = path.join(dirPath, '_collection_quiz');
        try {
            await fs.access(collectionQuizPath);
            const files = await fs.readdir(collectionQuizPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const jsonFilePath = path.join(collectionQuizPath, file);
                    try {
                        const quizContent = await fs.readFile(jsonFilePath, 'utf8');
                        const quizObject = JSON.parse(quizContent);

                        // Generate ID from relative path
                        const quizId = createIdFromPath(universitiesPath, jsonFilePath);

                        const quizOutputFile = path.join(quizzesOutputDir, `${quizId}.json`);
                        await fs.writeFile(quizOutputFile, JSON.stringify(quizObject, null, 2));

                        // Add quiz metadata to index
                        quizzesIndex.push({
                            id: quizId,
                            title: quizObject.title || formatLabel(path.basename(file, '.json')),
                            path: `quizzes/${quizId}.json`, // <-- lowercase in path
                            questionsCount: Array.isArray(quizObject.questions) ? quizObject.questions.length : 0
                        });
                    } catch (e) {
                        console.error(`Error processing collection quiz ${file}:`, e);
                    }
                }
            }
        } catch {}
        // Recursively scan children
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
                await scanForQuizzes(path.join(dirPath, entry.name));
            }
        }
    }

    await scanForQuizzes(universitiesPath);

    // Write the quizzes index file
    const indexPath = path.join(quizzesOutputDir, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(quizzesIndex, null, 2));
    console.log('All quizzes generated in docs/quizzes/');
    console.log('Quizzes index generated at docs/quizzes/index.json');
}

generateQuizzes();
