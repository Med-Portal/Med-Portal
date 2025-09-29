import fs from 'fs/promises';
import path from 'path';

function formatLabel(name) {
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function createIdFromPath(baseDir, filePath) {
    const relativePath = path.relative(baseDir, filePath);
    return relativePath
        .replace(/\\/g, '/')
        .replace(/\.json$/, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .toLowerCase();
}

async function generateQuizzes() {
    const universitiesPath = 'content/universities';
    const quizzesOutputDir = path.join('docs', 'quizzes');
    await fs.mkdir(quizzesOutputDir, { recursive: true });

    const quizzesIndex = [];

    async function scanForQuizzes(dirPath, currentPath = '') {
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

                        const quizId = createIdFromPath(universitiesPath, jsonFilePath);
                        const quizOutputFile = path.join(quizzesOutputDir, `${quizId}.json`);
                        await fs.writeFile(quizOutputFile, JSON.stringify(quizObject, null, 2));

                        quizzesIndex.push({
                            id: quizId,
                            title: quizObject.title || formatLabel(path.basename(file, '.json')),
                            path: `quizzes/${quizId}.json`,
                            questionsCount: Array.isArray(quizObject.questions) ? quizObject.questions.length : 0,
                            showAt: currentPath // This is the key addition
                        });
                    } catch (e) {
                        console.error(`Error processing collection quiz ${file}:`, e);
                    }
                }
            }
        } catch {}

        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
                const newPath = currentPath ? `${currentPath}/${entry.name}` : `/${entry.name}`;
                await scanForQuizzes(path.join(dirPath, entry.name), newPath);
            }
        }
    }

    await scanForQuizzes(universitiesPath);

    const indexPath = path.join(quizzesOutputDir, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(quizzesIndex, null, 2));
    console.log('All quizzes generated in docs/quizzes/');
    console.log('Quizzes index generated at docs/quizzes/index.json');
}

generateQuizzes();
