export interface IAdvance {
  advance: () => void;
}

export interface IAtNotch {
  atNotch: () => boolean;
}

export interface IEncode {
  encode(char: number, direction: Direction): number;
}

export enum Direction {
  FORWARD,
  REVERSE,
}

export type Mapping = Array<number>;
ReferenceError;

export abstract class Base implements IEncode {
  mapping: Mapping = [];

  static assertLength(m: Mapping) {
    if (m.length != 26) {
      throw new Error(`mapping length ${m.length} - must be 26}`);
    }

    m.forEach((n) => {
      if (!Number.isFinite(n)) {
        throw new Error("n must be finite number");
      }

      if (n < 0 || n >= 26) {
        throw new Error("mapping value out of range");
      }
    });
  }

  static assertReflective(m: Mapping) {
    m.forEach((val, index) => {
      if (val === index) {
        throw new Error(`reflective error at ${index} of ${m}`);
      }
    });
  }
  static assertSymmetric(m: Mapping) {
    m.forEach((val, index) => {
      if (m[val] !== index) {
        throw new Error(
          `mapping must be symmetric, failed at pair ${val}:${index}`
        );
      }
    });
  }
  static assertUnique(m: Mapping) {
    const mapped: Record<string, boolean> = {};

    m.forEach((value) => {
      mapped[value] = true;
    });

    if (Object.keys(mapped).length !== 26) {
      throw new Error(`mapping must have unique values`);
    }
  }

  abstract encode(n: number, direction?: Direction): number;

  static mod(n: number): number {
    return ((n % 26) + 26) % 26;
  }
}
// number, number[], string

const ALPHA = "A".charCodeAt(0);

export function charToNumber(s: string) {
  return s.toUpperCase().charCodeAt(0) - ALPHA;
}

export function stringToChars(s: string) {
  return s.toUpperCase().replace(/\s/, "").split("").map(charToNumber);
}

enum ReflectorLabel {
  A = 1,
  B,
  C,
}
export class Reflector extends Base {
  constructor(config: string) {
    super();

    const mapping = config.toUpperCase().split("").map(charToNumber);

    Base.assertLength(mapping);
    Base.assertUnique(mapping);
    Base.assertSymmetric(mapping);
    Base.assertReflective(mapping);

    this.mapping = mapping;
  }

  static label = ReflectorLabel;

  static create(label: ReflectorLabel) {
    switch (label) {
      case ReflectorLabel.A:
        return new Reflector("EJMZALYXVBWFCRQUONTSPIKHGD");
      case ReflectorLabel.B:
        return new Reflector("YRUHQSLDPXNGOKMIEBFZCWVJAT");
      case ReflectorLabel.C:
        return new Reflector("FVPJIAOYEDRZXWGCTKUQSBNMHL");
      default:
        throw new Error(`reflector ${label} does not exist`);
    }
  }

  encode(n: number): number {
    return this.mapping[n];
  }
}

export class PlugBoard extends Base {
  constructor(config: string) {
    super();

    const mapping: Mapping = [];

    for (let index = 0; index < 26; index++) {
      mapping.push(index);
    }

    const step1 = config.toUpperCase().replace(/\s/, "").match(/\w\w/g);

    if (step1 !== null) {
      step1.forEach((pair) => {
        const [x, y] = pair;

        const xN = charToNumber(x);
        const yN = charToNumber(y);

        mapping[xN] = yN;
        mapping[yN] = xN;
      });
    }

    Base.assertLength(mapping);
    Base.assertUnique(mapping);
    Base.assertSymmetric(mapping);

    this.mapping = mapping;
  }

  encode(n: number): number {
    return this.mapping[n];
  }
}

enum RotorLabel {
  I = 1,
  II,
  III,
  IV,
  V,
  VI,
  VII,
  VIII,
}

export class Rotor extends Base {
  reverseMapping: Mapping;
  notchesAt: number[];

  constructor(config: string, notchesAt: string) {
    super();

    this.notchesAt = stringToChars(notchesAt);

    const mapping = config
      .toUpperCase()
      .replace(/\s/, "")
      .split("")
      .map(charToNumber);

    const reverseMapping: Mapping = [];

    for (let index = 0; index < 26; index++) {
      reverseMapping.push(0);
    }

    Base.assertLength(mapping);
    Base.assertUnique(mapping);

    mapping.forEach((value, index) => {
      reverseMapping[value] = index;
    });

    this.reverseMapping = reverseMapping;

    Base.assertLength(mapping);
    Base.assertUnique(reverseMapping);

    this.mapping = mapping;
  }

  static label = RotorLabel;

  static create(label: RotorLabel): Rotor {
    switch (label) {
      case RotorLabel.I:
        return new Rotor("EKMFLGDQVZNTOWYHXUSPAIBRCJ", "Q");

      case RotorLabel.II:
        return new Rotor("AJDKSIRUXBLHWTMCQGZNPYFVOE", "E");

      case RotorLabel.III:
        return new Rotor("BDFHJLCPRTXVZNYEIWGAKMUSQO", "V");

      case RotorLabel.IV:
        return new Rotor("ESOVPZJAYQUIRHXLNFTGKDCMWB", "J");

      case RotorLabel.V:
        return new Rotor("VZBRGITYUPSDNHLXAWMJQOFECK", "Z");

      case RotorLabel.VI:
        return new Rotor("JPGVOUMFYQBENHZRDKASXLICTW", "MZ");

      case RotorLabel.VII:
        return new Rotor("NZJHGRCXMYSWBOUFAIVLPEKQDT", "MZ");

      case RotorLabel.VIII:
        return new Rotor("FKQHTLXOCBJSPDZRAMEWNIUYGV", "MZ");

      default:
        throw new Error(`invalid rotor label ${label}`);
    }
  }

  encode(n: number, direction: Direction): number {
    if (direction === Direction.REVERSE) {
      return this.reverseMapping[n];
    }
    return this.mapping[n];
  }
}

export class RotorState implements IAdvance, IAtNotch, IEncode {
  constructor(
    public rotor: Rotor,
    public ringSetting: number,
    public position: number
  ) {}

  encode(n: number, direction: Direction): number {
    const p1 = Base.mod(n - this.ringSetting + this.position);
    const p2 = this.rotor.encode(p1, direction);
    const p3 = Base.mod(p2 + this.ringSetting - this.position);

    return p3;
  }

  advance() {
    this.position = (this.position + 1) % 26;
  }

  atNotch(): boolean {
    return this.rotor.notchesAt.some((notch) => notch === this.position);
  }
}

export class RotorGroup implements IAdvance, IEncode {
  constructor(public rotorStates: Array<RotorState>) {}

  static advanceRotorStates(rs: Array<IAdvance & IAtNotch>) {
    const shouldAdvance: boolean[] = [];

    for (let index = 0; index < rs.length; index++) {
      if (index === rs.length - 1) {
        shouldAdvance.push(true);
      } else if (rs[index + 1].atNotch()) {
        shouldAdvance.push(true);
      } else if (index !== 0 && rs[index].atNotch()) {
        shouldAdvance.push(true);
      } else {
        shouldAdvance.push(false);
      }
    }

    rs.forEach((rotorState, index) => {
      if (shouldAdvance[index]) {
        rotorState.advance();
      }
    });
  }

  encode(n: number, d: Direction): number {
    if (d === Direction.REVERSE) {
      return this.rotorStates.reduce(
        (acc, val) => val.encode(acc, Direction.REVERSE),
        n
      );
    }

    return this.rotorStates
      .slice() // do not mutate!
      .reverse() // right to left
      .reduce((acc, val) => val.encode(acc, Direction.FORWARD), n);
  }

  advance() {
    RotorGroup.advanceRotorStates(this.rotorStates);
  }
}

export class Enigma implements IEncode {
  constructor(
    public plugboard: PlugBoard,
    public rotorGroup: RotorGroup,
    public reflector: Reflector
  ) {}

  static create(
    rotorLabel: RotorLabel[],
    reflectorLabel: ReflectorLabel,
    plugboardConfig: string,
    ringSettings: string,
    positions: string
  ) {
    // assert same length
    [rotorLabel, ringSettings, positions]
      .map((item) => item.length)
      .reduce((prev, curr) => {
        if (prev !== curr) {
          throw new Error(`lengths must match ${prev}!==${curr}`);
        }

        return curr;
      });

    // prepare strings to numbers
    const ringSettingValues = stringToChars(ringSettings);
    const positionValues = stringToChars(positions);

    return new Enigma(
      new PlugBoard(plugboardConfig),
      new RotorGroup(
        rotorLabel.map(
          (name, index) =>
            new RotorState(
              Rotor.create(name),
              ringSettingValues[index],
              positionValues[index]
            )
        )
      ),
      Reflector.create(reflectorLabel)
    );
  }

  encode(n: number): number {
    this.rotorGroup.advance();

    const n1 = this.plugboard.encode(n);

    const n2 = this.rotorGroup.encode(n1, Direction.FORWARD);

    const n3 = this.reflector.encode(n2);

    const n4 = this.rotorGroup.encode(n3, Direction.REVERSE);

    const n5 = this.plugboard.encode(n4);

    return n5;
  }

  encodeString(s: string): string {
    return s
      .toUpperCase()
      .replaceAll(/\s/g, "")
      .split("")
      .map(charToNumber)
      .map((c) => this.encode(c))
      .map((c) => String.fromCharCode(c + ALPHA))
      .join("");
  }
}
