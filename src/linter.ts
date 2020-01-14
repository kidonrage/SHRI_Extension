import * as jsonToAst from "json-to-ast";

export type JsonAST = jsonToAst.AstJsonEntity | undefined;

export interface LinterProblem<TKey> {
    key: TKey;
    loc: jsonToAst.AstLocation;
}

export function makeLint<TProblemKey>(
    json: string, 
    validateProperty: (property: jsonToAst.AstProperty) => LinterProblem<TProblemKey>[],
    validateObject: (property: jsonToAst.AstObject) => LinterProblem<TProblemKey>[]
): LinterProblem<TProblemKey>[] {

    function walk(
        node: jsonToAst.AstJsonEntity, 
        cbProp: (property: jsonToAst.AstProperty) => void,
        cbObj: (property: jsonToAst.AstObject) => void
    ) {
        switch (node.type) {
            case 'Array':
              node.children.forEach((item: jsonToAst.AstJsonEntity) => {
                  walk(item, cbProp, cbObj);
              });
              break;
            case 'Object':
              cbObj(node);
  
              node.children.forEach((property: jsonToAst.AstProperty) => {
                  cbProp(property);
                  walk(property.value, cbProp, cbObj);
              });
              break;
            default:
              break;
        }
    }

    function parseJson(json: string):JsonAST  {return jsonToAst(json); }

    let errors: LinterProblem<TProblemKey>[] = [];
    const ast: JsonAST = parseJson(json);

    if (ast) {
      walk(
        ast, 
        (property: jsonToAst.AstProperty) => {
          // FIX: errors.concat(...objectErrors) изменено на errors = errors.concat(...objectErrors), потому что concat - не мутирующий метод
          const propertyErrors = validateProperty(property);
          errors = errors.concat(...propertyErrors)
        }, 
        (obj: jsonToAst.AstObject) => {
          // FIX: errors.concat(...objectErrors) изменено на errors = errors.concat(...objectErrors), потому что concat - не мутирующий метод
          const objectErrors = validateObject(obj);
          errors = errors.concat(...objectErrors);
        }
      );
    }

    return errors;
}
