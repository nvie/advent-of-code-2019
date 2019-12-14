// @flow strict

import fs from 'fs';
import invariant from 'invariant';
import run from './lib/runner';

type Element = string; // "FUEL", "ORE", etc

type Substance = {|
  name: Element,
  qty: number,
|};

type ProductionRules = Map<
  Element, // product
  { produces: number, reactants: Array<Substance> }
>;

class Lab {
  // Mapping of production rules for each Substance
  rules: ProductionRules;

  // Stock by element name. This is the amount of everything we have lying
  // around "on the shelf", ready for use. We’ll always use this before making
  // more of this material by triggering a reaction
  stock: Map<Element, number>;

  // Counter keeping how much ORE has been slurped from space
  slurped: number;

  constructor(rules: ProductionRules) {
    this.stock = new Map();
    this.rules = rules;
    this.slurped = 0;
  }

  /**
   * Adds quantity to stock.
   */
  add(element: Element, qty: number) {
    const curr = this.stock.get(element) || 0;
    this.stock.set(element, curr + qty);
  }

  /**
   * Remove quantity from stock.
   */
  remove(element: Element, qty: number) {
    const curr = this.stock.get(element) || 0;
    this.stock.set(element, curr - qty);
  }

  /**
   * We can slurp ORE from space indefinitely.
   * Will fill up our stock with ORE.
   */
  slurp(qty: number) {
    this.slurped += qty;
    this.add('ORE', qty);
  }

  /**
   * Tries to take the requested amount of this element from the stock.  If
   * there isn't enough in stock, returns the remaining amount.
   */
  useFromStock(element: Element, qty: number): number {
    const available = this.stock.get(element) || 0;
    if (available >= qty) {
      this.remove(element, qty);
      return 0;
    } else {
      this.remove(element, available);
      return qty - available;
    }
  }

  /**
   * Takes or makes the desired amount of an element.  Takes it from stock when
   * available, produces it otherwise.
   */
  useOrProduce(element: Element, qty: number) {
    const remainder = this.useFromStock(element, qty);
    if (remainder) {
      this.produce(element, remainder);
      const newRemainder = this.useFromStock(element, remainder);
      invariant(newRemainder >= 0, 'UNEXPECTED: ' + newRemainder);
    }
  }

  /**
   * Produces the minimum specified quantity (or more) and fills up the stock
   * with it.
   */
  produce(element: Element, minQty: number) {
    if (element === 'ORE') {
      // ORE is the only resource we can mine indefinitely by just slurping it
      // straight from space
      this.slurp(minQty);
      return;
    }

    const rule = this.rules.get(element);
    invariant(rule, `Weird. No production rule for ${element} found.`);

    let produced = 0;
    do {
      const { produces, reactants } = rule;
      for (const reactant of reactants) {
        this.useOrProduce(reactant.name, reactant.qty);
      }

      this.add(element, produces);
      produced += produces;
    } while (produced < minQty);
  }
}

const rere = /^([0-9]+)([A-Z]+)$/;

function parseReactant(text: string): Substance {
  const m = text.match(rere);
  invariant(m, 'Unexpected input format');
  const [, number, name] = m;
  return { name, qty: Number(number) };
}

function parse(ruleText: string): ProductionRules {
  const rules = new Map();
  for (const line of ruleText.trim().split('\n')) {
    let [input, output] = line.replace(/\s+/g, '').split('=>');
    const reactants = input.split(',').map(parseReactant);
    const product = parseReactant(output);
    rules.set(product.name, { produces: product.qty, reactants });
  }
  return rules;
}

async function main() {
  const input = fs.readFileSync('./data/14-reactions.txt', 'utf-8');
  const rules = parse(input);

  const lab = new Lab(rules);
  lab.produce('FUEL', 1);
  console.log(lab.slurped, 'ORE was slurped from space');
}

if (require.main === module) {
  run(main);
}
