import path from "path";
import ts from "typescript";

// Helper class to store the program, context, and config
export class TransformContext {
    public program: ts.Program
    public context: ts.TransformationContext
    public factory: ts.NodeFactory
    constructor(program: ts.Program, context: ts.TransformationContext,) {
        this.program = program
        this.context = context
        this.factory = context.factory
    }
    transform<T extends ts.Node>(node: T): T {
        return ts.visitEachChild(node, (child) => visitNode(this, child), this.context)
    }
}
function getNodeInfo(node: ts.Node) {
    const sourceFile = node.getSourceFile()
    const formatedName = path.relative(process.cwd(), sourceFile.fileName).replace(/\\/g, "/")
    const formatedLine = sourceFile.getLineAndCharacterOfPosition(node.getStart())
    return `[${formatedName}:${formatedLine.line + 1}:${formatedLine.character + 1}] `
}
function formatMessage(context: TransformContext, node: ts.CallExpression, mode: string) {
    return context.factory.createCallExpression(
        context.factory.createIdentifier(mode),
        undefined,
        mode === "error" ? [context.factory.createStringLiteral(`${getNodeInfo(node)}${node.arguments[0]}`)] : [context.factory.createStringLiteral(getNodeInfo(node)), ...node.arguments]
    )
}
function visitNode(context: TransformContext, node: ts.Node): ts.Node {
    if (ts.isCallExpression(node)) {
        const expressionText = node.expression.getText()
        if (expressionText === "$print" || expressionText === "$warn") {
            return formatMessage(context, node, expressionText.substring(1))
        }
        // 处理 $debug 调用
        if (expressionText === "$debug" && node.arguments.length > 0) {
            const args = [...node.arguments]; // 获取原始参数
            args.unshift(ts.factory.createStringLiteral(`${getNodeInfo(node)}${args[0].getText()} = `));
            // 返回新的 print 调用
            return ts.factory.createCallExpression(
                context.factory.createIdentifier('print'),
                node.typeArguments,
                args
            );
        }
    }
    if (ts.isThrowStatement(node)) {
        if (node.expression) {
            const expression = node.expression;
            // 如果 throw 的表达式是字符串字面量 或者非动态模板字符串
            if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
                const updatedMessage = ts.factory.createStringLiteral(`${getNodeInfo(node)}${expression.text}`);
                ts.setEmitFlags(updatedMessage, ts.EmitFlags.NoAsciiEscaping);
                return ts.factory.updateThrowStatement(node, updatedMessage);
            }
            // 如果是模板字符串
            if (ts.isTemplateExpression(expression)) {
                const prefix = ts.factory.createTemplateHead(`${getNodeInfo(node)}${expression.head.text}`);
                ts.setEmitFlags(prefix, ts.EmitFlags.NoAsciiEscaping);
                const newTemplate = ts.factory.updateTemplateExpression(
                    expression,
                    prefix,
                    expression.templateSpans
                );
                return ts.factory.updateThrowStatement(node, newTemplate);
            }
            if (ts.isIdentifier(expression)) {
                const updatedExpression = ts.factory.createBinaryExpression(
                    ts.factory.createStringLiteral(getNodeInfo(node)),
                    ts.factory.createToken(ts.SyntaxKind.PlusToken),
                    expression
                );
                return ts.factory.updateThrowStatement(node, updatedExpression);
            }
        }
    }
    return context.transform(node)
}
