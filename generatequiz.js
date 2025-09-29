import fs from 'fs/promises';
import path from 'path';

// Helper to format names as a fallback
function formatLabel(name) {
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Main function to generate quizzes only
async function generateQuizzes() {
    const universitiesPath = 'content/universities';
    const quizzesOutputDir = path.join('docs', 'quizzes');
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
                    const baseName = path.basename(file, '.json');
                    const jsonFilePath = path.join(collectionQuizPath, file);
                    try {
                        const quizContent = await fs.readFile(jsonFilePath, 'utf8');
                        const quizObject = JSON.parse(quizContent);
                        const quizOutputFile = path.join(quizzesOutputDir, `${baseName}.json`);
                        await fs.writeFile(quizOutputFile, JSON.stringify(quizObject, null, 2));
                        // Add quiz metadata to index
                        quizzesIndex.push({
                            id: baseName,
                            title: quizObject.title || formatLabel(baseName),
                            path: `quizzes/${baseName}.json`,
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
