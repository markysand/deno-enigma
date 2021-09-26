export interface Advance {
  advance: () => void;
}

export interface AtNotch {
  atNotch: () => boolean;
}

export interface Encode {
  encode(char: number, direction: Direction): number;
}

export enum Direction {
  Forward,
  Reverse,
}

export type Mapping = number[];

enum ValidationLevel {
  Basic,
  Symmetric,
  Reflective,
}

export abstract class Base implements Encode {
  mapping: Mapping = [];

  abstract encode(n: number, direction?: Direction): number;

  static validate(m: Mapping, vl: ValidationLevel) {
    this.assertLength(m);
    this.assertValue(m);
    this.assertUnique(m);

    if (vl >= ValidationLevel.Symmetric) {
      this.assertSymmetric(m);
    }

    if (vl == ValidationLevel.Reflective) {
      this.assertReflective(m);
    }
  }

  private static assertLength(m: Mapping) {
    if (m.length != 26) {
      throw new Error(`mapping length ${m.length} - must be 26}`);
    }
  }

  private static assertValue(m: Mapping) {
    m.forEach((n) => {
      if (!Number.isFinite(n)) {
        throw new Error("n must be finite number");
      }

      if (n < 0 || n >= 26) {
        throw new Error("mapping value out of range");
      }
    });
  }

  private static assertUnique(m: Mapping) {
    const mapped: Record<string, boolean> = {};

    m.forEach((value) => {
      mapped[value] = true;
    });

    if (Object.keys(mapped).length !== 26) {
      throw new Error(`mapping must have unique values`);
    }
  }

  private static assertReflective(m: Mapping) {
    m.forEach((val, index) => {
      if (val === index) {
        throw new Error(`reflective error at ${index} of ${m}`);
      }
    });
  }

  private static assertSymmetric(m: Mapping) {
    m.forEach((val, index) => {
      if (m[val] !== index) {
        throw new Error(
          `mapping must be symmetric, failed at pair ${val}:${index}`,
        );
      }
    });
  }

  static mod(n: number): number {
    return ((n % 26) + 26) % 26;
  }

  static ALPHA = "A".charCodeAt(0);

  static charToNumber(s: string) {
    return s.toUpperCase().charCodeAt(0) - Base.ALPHA;
  }

  static stringToNumbers(s: string) {
    return s
      .toUpperCase()
      .replaceAll(/\s/g, "")
      .split("")
      .map(Base.charToNumber);
  }

  static numbersToString(nn: number[]): string {
    return nn.map((n) => String.fromCharCode(n + Base.ALPHA)).join("");
  }
}

enum ReflectorLabel {
  A = 1,
  B,
  C,
}

export class Reflector extends Base {
  constructor(config: string) {
    super();

    const mapping = Base.stringToNumbers(config);

    Base.validate(mapping, ValidationLevel.Reflective);

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

        const xN = Base.charToNumber(x);
        const yN = Base.charToNumber(y);

        mapping[xN] = yN;
        mapping[yN] = xN;
      });
    }

    Base.validate(mapping, ValidationLevel.Symmetric);

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

    this.notchesAt = Base.stringToNumbers(notchesAt);

    const mapping = Base.stringToNumbers(config);

    const reverseMapping: Mapping = [];

    for (let index = 0; index < 26; index++) {
      reverseMapping.push(0);
    }

    Base.validate(mapping, ValidationLevel.Basic);
    this.mapping = mapping;

    mapping.forEach((value, index) => {
      reverseMapping[value] = index;
    });

    Base.validate(reverseMapping, ValidationLevel.Basic);
    this.reverseMapping = reverseMapping;
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
    return direction === Direction.Reverse
      ? this.reverseMapping[n]
      : this.mapping[n];
  }
}

export class RotorState implements Advance, AtNotch, Encode {
  constructor(
    public rotor: Rotor,
    public ringSetting: number,
    public position: number,
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

export class RotorGroup implements Advance, Encode {
  constructor(public rotorStates: Array<RotorState>) {}

  static advanceRotorStates(rs: Array<Advance & AtNotch>) {
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
    if (d === Direction.Reverse) {
      return this.rotorStates.reduce(
        (acc, val) => val.encode(acc, Direction.Reverse),
        n,
      );
    }

    return this.rotorStates.reduceRight(
      (acc, val) => val.encode(acc, Direction.Forward),
      n,
    );
  }

  advance() {
    RotorGroup.advanceRotorStates(this.rotorStates);
  }
}

export class Enigma implements Encode {
  constructor(
    public plugboard: PlugBoard,
    public rotorGroup: RotorGroup,
    public reflector: Reflector,
  ) {}

  static create(
    rotorLabel: RotorLabel[],
    reflectorLabel: ReflectorLabel,
    plugboardConfig: string,
    ringSettings: string,
    positions: string,
  ) {
    [rotorLabel, ringSettings, positions]
      .map((item) => item.length)
      .reduce((prev, curr) => {
        if (prev !== curr) {
          throw new Error(`lengths must match ${prev}!==${curr}`);
        }

        return curr;
      });

    const ringSettingValues = Base.stringToNumbers(ringSettings);
    const positionValues = Base.stringToNumbers(positions);

    return new Enigma(
      new PlugBoard(plugboardConfig),
      new RotorGroup(
        rotorLabel.map(
          (name, index) =>
            new RotorState(
              Rotor.create(name),
              ringSettingValues[index],
              positionValues[index],
            ),
        ),
      ),
      Reflector.create(reflectorLabel),
    );
  }

  encode(n: number): number {
    this.rotorGroup.advance();

    const n1 = this.plugboard.encode(n);

    const n2 = this.rotorGroup.encode(n1, Direction.Forward);

    const n3 = this.reflector.encode(n2);

    const n4 = this.rotorGroup.encode(n3, Direction.Reverse);

    const n5 = this.plugboard.encode(n4);

    return n5;
  }

  encodeString(s: string): string {
    return Base.numbersToString(
      Base.stringToNumbers(s).map((n) => this.encode(n)),
    );
  }
}
