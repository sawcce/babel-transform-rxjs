import babel, {  } from '@babel/core';
import { parse, parseExpression } from '@babel/parser';
import { Hub } from '@babel/traverse';

const code = `
  const { BehaviorSubject } = require("rxjs")

  let x = ffff
  $x(value => console.log(value))
  x = ff
`;

const b = `new BehaviorSubject("x")`
const c = `x.next(x)`

const BehaviorNode = parseExpression(b);
const NextNode = parseExpression(c);

function newBehaviorNode(init) {
  let d = Object.create(BehaviorNode)
  d.arguments[0] = init;
  return d;
}

function newNextNode(id, arg) {
  let d = Object.create(NextNode)
  d.callee.object.name = id;
  d.arguments[0] = arg;
  return d;
}

const output = babel.transformSync(code, {
  plugins: [
    // your first babel plugin 😎😎
    function myCustomPlugin() {
      let def = {}
      return {
        visitor: {
          VariableDeclaration(path) {
            path.node.declarations = path.node.declarations.map((node) => {
              console.log(Object.keys(node.init))
              if (node.init.callee){
                if(node.init.callee.name == "require")  return node
              }

              def[node.id.name] = true

              let bv = newBehaviorNode(node.init);
              node.init = bv;
              return node;
            })
          },
          AssignmentExpression(path) {

            switch (path.node.operator) {
              case '=':
                path.node.right = newNextNode(path.node.left.name,path.node.right);
                break;
            }
          },
          Identifier(path) {
            let nodeName = path.node.name;
            //console.log(Object.keys(propToCheck), propToCheck);
            // in this example change all the variable `n` to `x`
            if (path.isIdentifier() && nodeName[0] == ("$")) {
              path.node.name = path.node.name.replace("$", "");
              path.node.name += ".subscribe";
            }
          },
        },
      };
    },
  ],
});

var fn = Function(output.code);

console.log(output.code)