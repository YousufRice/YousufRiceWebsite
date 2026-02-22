import { Project, Node, SyntaxKind } from 'ts-morph';

const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
});

const methodParams: Record<string, string[]> = {
    listDocuments: ['databaseId', 'collectionId', 'queries', 'transactionId', 'total'],
    createDocument: ['databaseId', 'collectionId', 'documentId', 'data', 'permissions', 'transactionId'],
    getDocument: ['databaseId', 'collectionId', 'documentId', 'queries', 'transactionId'],
    updateDocument: ['databaseId', 'collectionId', 'documentId', 'data', 'permissions', 'transactionId'],
    deleteDocument: ['databaseId', 'collectionId', 'documentId', 'transactionId'],
    upsertDocument: ['databaseId', 'collectionId', 'documentId', 'data', 'permissions', 'transactionId'],

    listFiles: ['bucketId', 'queries', 'search', 'total'],
    createFile: ['bucketId', 'fileId', 'file', 'permissions', 'onProgress'],
    getFile: ['bucketId', 'fileId'],
    updateFile: ['bucketId', 'fileId', 'name', 'permissions'],
    deleteFile: ['bucketId', 'fileId'],
    getFileDownload: ['bucketId', 'fileId', 'token'],
    getFilePreview: ['bucketId', 'fileId', 'width', 'height', 'gravity', 'quality', 'borderWidth', 'borderColor', 'borderRadius', 'opacity', 'rotation', 'background', 'output', 'token'],
    getFileView: ['bucketId', 'fileId', 'token'],

    createEmailPasswordSession: ['email', 'password'],
    create: ['userId', 'email', 'password', 'name'],
    createRecovery: ['email', 'url'],
    createEmailToken: ['userId', 'email', 'phrase'],
    updateRecovery: ['userId', 'secret', 'password'],
    updatePassword: ['password', 'oldPassword'],
    createSession: ['userId', 'secret'],
    createAnonymousSession: [],
    deleteSession: ['sessionId'],
    deleteSessions: [],
};

const sourceFiles = project.getSourceFiles();

let changedCount = 0;

for (const sourceFile of sourceFiles) {
    let fileChanged = false;

    sourceFile.forEachDescendant((node) => {
        if (Node.isCallExpression(node)) {
            const expr = node.getExpression();

            if (Node.isPropertyAccessExpression(expr)) {
                const methodName = expr.getName();
                if (methodParams[methodName]) {
                    const expectedParams = methodParams[methodName];
                    if (expectedParams.length === 0) return;

                    const args = node.getArguments();

                    if (args.length === 1 && Node.isObjectLiteralExpression(args[0])) {
                        return;
                    }

                    if (args.length === 1 && expectedParams.length > 1) {
                        return;
                    }

                    if (args.length === 0) return;

                    console.log(`Converting ${methodName} at ${sourceFile.getFilePath()}:${node.getStartLineNumber()}`);

                    const properties: string[] = [];
                    for (let i = 0; i < args.length; i++) {
                        const argText = args[i].getText();
                        if (argText === 'undefined') continue;

                        if (i < expectedParams.length) {
                            properties.push(`${expectedParams[i]}: ${argText}`);
                        }
                    }

                    const replacement = `{ ${properties.join(', ')} }`;

                    // Replace arguments
                    for (let i = args.length - 1; i >= 0; i--) {
                        node.removeArgument(i);
                    }
                    node.addArgument(replacement);

                    fileChanged = true;
                }
            }
        }
    });

    if (fileChanged) {
        sourceFile.saveSync();
        changedCount++;
        console.log(`Saved ${sourceFile.getFilePath()}`);
    }
}

console.log(`Updated ${changedCount} files.`);
